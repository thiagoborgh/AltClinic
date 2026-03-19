'use strict';

/**
 * cobrancasWhatsApp — job cron TDD 15
 * Processa cobranças e lembretes financeiros via WhatsApp
 * Executa a cada hora (0 * * * *), fuso horário São Paulo
 */
const cron = require('node-cron');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');
const { CobrancaWhatsAppService } = require('../services/CobrancaWhatsAppService');

// ─── helpers ─────────────────────────────────────────────────────────────────

function getDefaultConfig() {
  return {
    ativo: true,
    envio_auto_pos_atendimento: true,
    delay_pos_atendimento_min: 30,
    dias_lembrete_antes_venc: 3,
    sequencia_inadimplencia: '[1,7,15]',
    horario_inicio_envio: '08:00',
    horario_fim_envio: '20:00',
    max_cobrancas_por_fatura: 4,
    chave_pix: null,
    tom_mensagem: 'amigavel',
    ia_tom_adaptativo: false
  };
}

// ─── funções principais ───────────────────────────────────────────────────────

/**
 * Envia cobranças pendentes e cria novos escalonamentos para um tenant
 */
async function processarTenant(tenant, schema) {
  try {
    // 1. Buscar config
    const { rows: configRows } = await pool.query(
      `SELECT * FROM "${schema}".cobrancas_config WHERE tenant_id = $1`,
      [tenant.id]
    ).catch(() => ({ rows: [] }));

    const config = configRows[0] || getDefaultConfig();
    if (!config.ativo) return;

    const svc = new CobrancaWhatsAppService(pool, tenant.id, schema);

    // 2. Enviar cobranças pendentes cuja janela de envio chegou
    const agora = new Date().toISOString();
    const { rows: pendentes } = await pool.query(
      `SELECT * FROM "${schema}".cobrancas_whatsapp
       WHERE tenant_id = $1
         AND status = 'pendente'
         AND (agendado_para IS NULL OR agendado_para <= $2)
       ORDER BY criado_em
       LIMIT 50`,
      [tenant.id, agora]
    ).catch(() => ({ rows: [] }));

    for (const cobranca of pendentes) {
      if (svc.podeEnviarAgora(config)) {
        await svc.enviar(cobranca);
      }
    }

    // 3. Criar novos escalonamentos
    await criarEscalonamentos(config, tenant, schema);
    await criarLembretesVencimento(config, tenant, schema);
    await criarCobrancasPosAtendimento(config, tenant, schema);

  } catch (err) {
    console.error(`[cobrancasWhatsApp] Erro ao processar tenant ${tenant.slug}:`, err.message);
  }
}

/**
 * Cria cobranças de inadimplência D+1, D+7, D+15
 */
async function criarEscalonamentos(config, tenant, schema) {
  try {
    let sequencia = [1, 7, 15];
    try {
      sequencia = JSON.parse(config.sequencia_inadimplencia || '[1,7,15]');
    } catch { /* usar padrão */ }

    const svc = new CobrancaWhatsAppService(pool, tenant.id, schema);

    for (const dias of sequencia) {
      const tipo = `inadimplencia_d${dias}`;
      if (!['inadimplencia_d1', 'inadimplencia_d7', 'inadimplencia_d15'].includes(tipo)) continue;

      // Faturas vencidas há exatamente N dias sem cobrança deste tipo
      const { rows: faturas } = await pool.query(
        `SELECT f.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.id AS paciente_id
         FROM "${schema}".faturas f
         JOIN "${schema}".pacientes p ON p.id = f.paciente_id
         WHERE f.tenant_id = $1
           AND f.status IN ('pendente', 'vencida')
           AND f.data_vencimento::date = (CURRENT_DATE - $2 * INTERVAL '1 day')::date
           AND NOT EXISTS (
             SELECT 1 FROM "${schema}".cobrancas_whatsapp cw
             WHERE cw.fatura_id = f.id
               AND cw.tipo = $3
               AND cw.status NOT IN ('cancelado','expirado')
           )
           AND NOT EXISTS (
             SELECT 1 FROM "${schema}".cobrancas_optout co
             WHERE co.paciente_id = f.paciente_id AND co.tenant_id = $1
           )`,
        [tenant.id, dias, tipo]
      ).catch(() => ({ rows: [] }));

      for (const fatura of faturas) {
        // Verificar limite de cobranças por fatura
        const { rows: countRows } = await pool.query(
          `SELECT COUNT(*) as total FROM "${schema}".cobrancas_whatsapp
           WHERE fatura_id = $1 AND status NOT IN ('cancelado','expirado')`,
          [fatura.id]
        ).catch(() => ({ rows: [{ total: 0 }] }));

        const totalCobrancas = parseInt(countRows[0]?.total || 0);
        if (totalCobrancas >= (config.max_cobrancas_por_fatura || 4)) continue;

        // Determinar tom
        let tom = config.tom_mensagem || 'amigavel';
        if (config.ia_tom_adaptativo) {
          tom = await svc.determinarTomAdaptativo(fatura.paciente_id, tipo);
        }

        const paciente = { nome: fatura.paciente_nome, telefone: fatura.paciente_telefone };
        const mensagem = svc.montarMensagem(tipo, paciente, fatura, { ...config, tom_mensagem: tom });

        const agendadoPara = svc.podeEnviarAgora(config)
          ? null
          : svc.proximoHorarioValido(config);

        await pool.query(
          `INSERT INTO "${schema}".cobrancas_whatsapp
             (tenant_id, fatura_id, paciente_id, tipo, mensagem, status, agendado_para)
           VALUES ($1, $2, $3, $4, $5, 'pendente', $6)`,
          [tenant.id, fatura.id, fatura.paciente_id, tipo, mensagem, agendadoPara]
        ).catch(err => {
          console.error(`[criarEscalonamentos] Erro ao inserir cobrança:`, err.message);
        });
      }
    }
  } catch (err) {
    console.error(`[criarEscalonamentos] Erro:`, err.message);
  }
}

/**
 * Cria lembretes N dias antes do vencimento
 */
async function criarLembretesVencimento(config, tenant, schema) {
  try {
    const diasAntes = config.dias_lembrete_antes_venc || 3;
    const svc = new CobrancaWhatsAppService(pool, tenant.id, schema);

    const { rows: faturas } = await pool.query(
      `SELECT f.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.id AS paciente_id
       FROM "${schema}".faturas f
       JOIN "${schema}".pacientes p ON p.id = f.paciente_id
       WHERE f.tenant_id = $1
         AND f.status = 'pendente'
         AND f.data_vencimento::date = (CURRENT_DATE + $2 * INTERVAL '1 day')::date
         AND NOT EXISTS (
           SELECT 1 FROM "${schema}".cobrancas_whatsapp cw
           WHERE cw.fatura_id = f.id
             AND cw.tipo = 'lembrete_venc'
             AND cw.status NOT IN ('cancelado','expirado')
         )
         AND NOT EXISTS (
           SELECT 1 FROM "${schema}".cobrancas_optout co
           WHERE co.paciente_id = f.paciente_id AND co.tenant_id = $1
         )`,
      [tenant.id, diasAntes]
    ).catch(() => ({ rows: [] }));

    for (const fatura of faturas) {
      let tom = config.tom_mensagem || 'amigavel';
      if (config.ia_tom_adaptativo) {
        tom = await svc.determinarTomAdaptativo(fatura.paciente_id, 'lembrete_venc');
      }

      const paciente = { nome: fatura.paciente_nome, telefone: fatura.paciente_telefone };
      const mensagem = svc.montarMensagem('lembrete_venc', paciente, fatura, { ...config, tom_mensagem: tom });

      const agendadoPara = svc.podeEnviarAgora(config)
        ? null
        : svc.proximoHorarioValido(config);

      await pool.query(
        `INSERT INTO "${schema}".cobrancas_whatsapp
           (tenant_id, fatura_id, paciente_id, tipo, mensagem, status, agendado_para)
         VALUES ($1, $2, $3, 'lembrete_venc', $4, 'pendente', $5)`,
        [tenant.id, fatura.id, fatura.paciente_id, mensagem, agendadoPara]
      ).catch(err => {
        console.error(`[criarLembretesVencimento] Erro ao inserir lembrete:`, err.message);
      });
    }
  } catch (err) {
    console.error(`[criarLembretesVencimento] Erro:`, err.message);
  }
}

/**
 * Cria cobranças pós-atendimento (após delay configurado)
 */
async function criarCobrancasPosAtendimento(config, tenant, schema) {
  try {
    if (!config.envio_auto_pos_atendimento) return;

    const delayMin = config.delay_pos_atendimento_min || 30;
    const svc = new CobrancaWhatsAppService(pool, tenant.id, schema);

    // Atendimentos finalizados há pelo menos N minutos com fatura não cobrada
    const { rows: faturas } = await pool.query(
      `SELECT f.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.id AS paciente_id
       FROM "${schema}".faturas f
       JOIN "${schema}".pacientes p ON p.id = f.paciente_id
       WHERE f.tenant_id = $1
         AND f.status = 'pendente'
         AND f.atendimento_id IS NOT NULL
         AND f.criado_em <= NOW() - ($2 * INTERVAL '1 minute')
         AND f.criado_em >= NOW() - INTERVAL '24 hours'
         AND NOT EXISTS (
           SELECT 1 FROM "${schema}".cobrancas_whatsapp cw
           WHERE cw.fatura_id = f.id
             AND cw.tipo = 'pos_atendimento'
             AND cw.status NOT IN ('cancelado','expirado')
         )
         AND NOT EXISTS (
           SELECT 1 FROM "${schema}".cobrancas_optout co
           WHERE co.paciente_id = f.paciente_id AND co.tenant_id = $1
         )`,
      [tenant.id, delayMin]
    ).catch(() => ({ rows: [] }));

    for (const fatura of faturas) {
      let tom = config.tom_mensagem || 'amigavel';
      if (config.ia_tom_adaptativo) {
        tom = await svc.determinarTomAdaptativo(fatura.paciente_id, 'pos_atendimento');
      }

      const paciente = { nome: fatura.paciente_nome, telefone: fatura.paciente_telefone };
      const mensagem = svc.montarMensagem('pos_atendimento', paciente, fatura, { ...config, tom_mensagem: tom });

      const agendadoPara = svc.podeEnviarAgora(config)
        ? null
        : svc.proximoHorarioValido(config);

      await pool.query(
        `INSERT INTO "${schema}".cobrancas_whatsapp
           (tenant_id, fatura_id, paciente_id, tipo, mensagem, status, agendado_para)
         VALUES ($1, $2, $3, 'pos_atendimento', $4, 'pendente', $5)`,
        [tenant.id, fatura.id, fatura.paciente_id, mensagem, agendadoPara]
      ).catch(err => {
        console.error(`[criarCobrancasPosAtendimento] Erro:`, err.message);
      });
    }
  } catch (err) {
    console.error(`[criarCobrancasPosAtendimento] Erro:`, err.message);
  }
}

/**
 * Processa respostas de pacientes — detecta opt-out
 */
async function processarRespostaCobranca(mensagem, pacienteId, tenantId, schema) {
  try {
    const texto = (mensagem || '').toLowerCase().trim();

    const palavrasOptOut = [
      'parar', 'pare', 'stop', 'cancelar', 'não quero', 'nao quero',
      'remover', 'descadastrar', 'sair', 'opt out', 'optout'
    ];

    const isOptOut = palavrasOptOut.some(p => texto.includes(p));

    if (isOptOut) {
      await pool.query(
        `INSERT INTO "${schema}".cobrancas_optout (tenant_id, paciente_id, motivo)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, paciente_id) DO NOTHING`,
        [tenantId, pacienteId, mensagem]
      );

      // Cancelar pendentes
      await pool.query(
        `UPDATE "${schema}".cobrancas_whatsapp
         SET status = 'cancelado'
         WHERE paciente_id = $1 AND tenant_id = $2 AND status = 'pendente'`,
        [pacienteId, tenantId]
      );

      return { optout: true };
    }

    return { optout: false };
  } catch (err) {
    console.error('[processarRespostaCobranca] Erro:', err.message);
    return { optout: false };
  }
}

/**
 * Itera todos os tenants ativos
 */
async function run() {
  try {
    const { rows: tenants } = await pool.query(
      "SELECT id, slug FROM public.tenants WHERE status IN ('active', 'trial')"
    ).catch(() => ({ rows: [] }));

    for (const tenant of tenants) {
      const schema = schemaFromSlug(tenant.slug);
      await processarTenant(tenant, schema);
    }
  } catch (err) {
    console.error('[cobrancasWhatsApp.run] Erro:', err.message);
  }
}

/**
 * Registra o cron job — a cada hora, timezone São Paulo
 */
function register() {
  cron.schedule('0 * * * *', async () => {
    console.log('[cobrancasWhatsApp] Executando job de cobranças WhatsApp...');
    await run();
  }, {
    timezone: 'America/Sao_Paulo'
  });

  console.log('[cobrancasWhatsApp] Job registrado — execução a cada hora (São Paulo)');
}

module.exports = {
  register,
  run,
  processarTenant,
  criarEscalonamentos,
  criarLembretesVencimento,
  criarCobrancasPosAtendimento,
  processarRespostaCobranca
};
