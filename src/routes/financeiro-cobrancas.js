'use strict';

/**
 * financeiro-cobrancas — rotas TDD 15
 * Cobranças e Lembretes Financeiros via WhatsApp
 */
const express = require('express');
const router = express.Router();
const pool = require('../database/postgres');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant } = require('../middleware/tenant');
const { schemaFromSlug } = require('../services/CrmScoreService');
const { CobrancaWhatsAppService } = require('../services/CobrancaWhatsAppService');
const { PixService } = require('../services/PixService');

const auth = [extractTenant, authenticateToken];

// ─── helpers ─────────────────────────────────────────────────────────────────

function getSchema(req) {
  return schemaFromSlug(req.tenant?.slug || req.usuario?.tenant_slug);
}

function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}

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
    tipo_chave_pix: null,
    telefone_clinica: null,
    tom_mensagem: 'amigavel',
    ia_tom_adaptativo: false
  };
}

// ─── endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /faturas/:id/cobrar-whatsapp
 * Disparo manual de cobrança para uma fatura
 */
router.post('/faturas/:id/cobrar-whatsapp', auth, async (req, res) => {
  try {
    const schema = getSchema(req);
    const tenantId = getTenantId(req);
    const faturaId = parseInt(req.params.id, 10);
    const { tipo = 'manual', gerar_pix = false } = req.body;

    // Buscar fatura e paciente
    const { rows: faturaRows } = await pool.query(
      `SELECT f.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone
       FROM "${schema}".faturas f
       JOIN "${schema}".pacientes p ON p.id = f.paciente_id
       WHERE f.id = $1 AND f.tenant_id = $2`,
      [faturaId, tenantId]
    );

    if (!faturaRows.length) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada' });
    }

    const fatura = faturaRows[0];

    // Verificar opt-out
    const { rows: optoutRows } = await pool.query(
      `SELECT 1 FROM "${schema}".cobrancas_optout
       WHERE tenant_id = $1 AND paciente_id = $2`,
      [tenantId, fatura.paciente_id]
    );

    if (optoutRows.length) {
      return res.status(400).json({ success: false, message: 'Paciente optou por não receber cobranças' });
    }

    // Buscar config
    const { rows: configRows } = await pool.query(
      `SELECT * FROM "${schema}".cobrancas_config WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [] }));

    const config = configRows[0] || getDefaultConfig();
    const svc = new CobrancaWhatsAppService(pool, tenantId, schema);

    // Gerar Pix se solicitado
    let pixData = {};
    if (gerar_pix) {
      try {
        const pixSvc = new PixService(tenantId, config);
        pixData = await pixSvc.gerarQRCode(fatura.valor, fatura.id, fatura.descricao);
      } catch (err) {
        console.warn('[cobrar-whatsapp] Falha ao gerar PIX:', err.message);
      }
    }

    const paciente = { nome: fatura.paciente_nome, telefone: fatura.paciente_telefone };
    const faturaComPix = { ...fatura, ...pixData };

    let tom = config.tom_mensagem || 'amigavel';
    if (config.ia_tom_adaptativo) {
      tom = await svc.determinarTomAdaptativo(fatura.paciente_id, tipo);
    }

    const mensagem = svc.montarMensagem(tipo, paciente, faturaComPix, { ...config, tom_mensagem: tom });

    // Inserir registro
    const agendadoPara = svc.podeEnviarAgora(config) ? null : svc.proximoHorarioValido(config);

    const { rows: inserted } = await pool.query(
      `INSERT INTO "${schema}".cobrancas_whatsapp
         (tenant_id, fatura_id, paciente_id, tipo, mensagem, status,
          qr_code_url, qr_code_payload, qr_code_expira_em, gateway_charge_id,
          agendado_para, disparado_por)
       VALUES ($1, $2, $3, $4, $5, 'pendente', $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        tenantId, fatura.id, fatura.paciente_id, tipo, mensagem,
        pixData.qr_code_url || null,
        pixData.qr_code_payload || null,
        pixData.expira_em || null,
        pixData.gateway_charge_id || null,
        agendadoPara,
        req.usuario?.id || null
      ]
    );

    const cobranca = inserted[0];

    // Enviar imediatamente se dentro da janela
    if (svc.podeEnviarAgora(config)) {
      const resultado = await svc.enviar(cobranca);
      return res.json({ success: true, data: { ...cobranca, ...resultado } });
    }

    return res.json({
      success: true,
      data: cobranca,
      message: `Cobrança agendada para ${agendadoPara}`
    });

  } catch (err) {
    console.error('[cobrar-whatsapp]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /cobrancas/historico
 * Lista cobranças com filtros
 */
router.get('/cobrancas/historico', auth, async (req, res) => {
  try {
    const schema = getSchema(req);
    const tenantId = getTenantId(req);
    const { status, tipo, paciente_id, page = 1, limit = 20 } = req.query;

    const conditions = ['cw.tenant_id = $1'];
    const params = [tenantId];
    let idx = 2;

    if (status) {
      conditions.push(`cw.status = $${idx++}`);
      params.push(status);
    }
    if (tipo) {
      conditions.push(`cw.tipo = $${idx++}`);
      params.push(tipo);
    }
    if (paciente_id) {
      conditions.push(`cw.paciente_id = $${idx++}`);
      params.push(parseInt(paciente_id, 10));
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);

    const { rows } = await pool.query(
      `SELECT cw.*, p.nome AS paciente_nome
       FROM "${schema}".cobrancas_whatsapp cw
       LEFT JOIN "${schema}".pacientes p ON p.id = cw.paciente_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY cw.criado_em DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limitNum, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM "${schema}".cobrancas_whatsapp cw
       WHERE ${conditions.join(' AND ')}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      total: parseInt(countRows[0].total, 10),
      page: parseInt(page, 10),
      limit: limitNum
    });

  } catch (err) {
    console.error('[cobrancas/historico]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /cobrancas/config
 * Retorna configuração ou padrões
 */
router.get('/cobrancas/config', auth, async (req, res) => {
  try {
    const schema = getSchema(req);
    const tenantId = getTenantId(req);

    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".cobrancas_config WHERE tenant_id = $1`,
      [tenantId]
    ).catch(() => ({ rows: [] }));

    res.json({ success: true, data: rows[0] || getDefaultConfig() });

  } catch (err) {
    console.error('[cobrancas/config GET]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /cobrancas/config
 * Upsert configuração
 */
router.put('/cobrancas/config', auth, async (req, res) => {
  try {
    const schema = getSchema(req);
    const tenantId = getTenantId(req);

    const {
      ativo,
      envio_auto_pos_atendimento,
      delay_pos_atendimento_min,
      dias_lembrete_antes_venc,
      sequencia_inadimplencia,
      horario_inicio_envio,
      horario_fim_envio,
      max_cobrancas_por_fatura,
      chave_pix,
      tipo_chave_pix,
      telefone_clinica,
      tom_mensagem,
      ia_tom_adaptativo
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO "${schema}".cobrancas_config
         (tenant_id, ativo, envio_auto_pos_atendimento, delay_pos_atendimento_min,
          dias_lembrete_antes_venc, sequencia_inadimplencia, horario_inicio_envio,
          horario_fim_envio, max_cobrancas_por_fatura, chave_pix, tipo_chave_pix,
          telefone_clinica, tom_mensagem, ia_tom_adaptativo, atualizado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         ativo                       = EXCLUDED.ativo,
         envio_auto_pos_atendimento  = EXCLUDED.envio_auto_pos_atendimento,
         delay_pos_atendimento_min   = EXCLUDED.delay_pos_atendimento_min,
         dias_lembrete_antes_venc    = EXCLUDED.dias_lembrete_antes_venc,
         sequencia_inadimplencia     = EXCLUDED.sequencia_inadimplencia,
         horario_inicio_envio        = EXCLUDED.horario_inicio_envio,
         horario_fim_envio           = EXCLUDED.horario_fim_envio,
         max_cobrancas_por_fatura    = EXCLUDED.max_cobrancas_por_fatura,
         chave_pix                   = EXCLUDED.chave_pix,
         tipo_chave_pix              = EXCLUDED.tipo_chave_pix,
         telefone_clinica            = EXCLUDED.telefone_clinica,
         tom_mensagem                = EXCLUDED.tom_mensagem,
         ia_tom_adaptativo           = EXCLUDED.ia_tom_adaptativo,
         atualizado_em               = NOW()
       RETURNING *`,
      [
        tenantId,
        ativo !== undefined ? ativo : true,
        envio_auto_pos_atendimento !== undefined ? envio_auto_pos_atendimento : true,
        delay_pos_atendimento_min || 30,
        dias_lembrete_antes_venc || 3,
        sequencia_inadimplencia || '[1,7,15]',
        horario_inicio_envio || '08:00',
        horario_fim_envio || '20:00',
        max_cobrancas_por_fatura || 4,
        chave_pix || null,
        tipo_chave_pix || null,
        telefone_clinica || null,
        tom_mensagem || 'amigavel',
        ia_tom_adaptativo !== undefined ? ia_tom_adaptativo : false
      ]
    );

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('[cobrancas/config PUT]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /cobrancas/:id
 * Retorna uma cobrança específica
 */
router.get('/cobrancas/:id', auth, async (req, res) => {
  try {
    const schema = getSchema(req);
    const tenantId = getTenantId(req);
    const id = parseInt(req.params.id, 10);

    const { rows } = await pool.query(
      `SELECT cw.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone
       FROM "${schema}".cobrancas_whatsapp cw
       LEFT JOIN "${schema}".pacientes p ON p.id = cw.paciente_id
       WHERE cw.id = $1 AND cw.tenant_id = $2`,
      [id, tenantId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Cobrança não encontrada' });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('[cobrancas/:id GET]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /cobrancas/:id
 * Cancela cobrança pendente
 */
router.delete('/cobrancas/:id', auth, async (req, res) => {
  try {
    const schema = getSchema(req);
    const tenantId = getTenantId(req);
    const id = parseInt(req.params.id, 10);

    const { rows } = await pool.query(
      `UPDATE "${schema}".cobrancas_whatsapp
       SET status = 'cancelado'
       WHERE id = $1 AND tenant_id = $2 AND status = 'pendente'
       RETURNING *`,
      [id, tenantId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Cobrança não encontrada ou não está pendente'
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('[cobrancas/:id DELETE]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /webhook/pagamento
 * Endpoint público — confirmação de pagamento do gateway (Asaas)
 * Responde 200 imediatamente e processa em background
 */
router.post('/webhook/pagamento', async (req, res) => {
  res.status(200).json({ ok: true });

  setImmediate(async () => {
    try {
      const asaasToken = process.env.ASAAS_WEBHOOK_TOKEN;
      const receivedToken = req.headers['asaas-access-token'];

      if (asaasToken && receivedToken !== asaasToken) {
        console.warn('[webhook/pagamento] Token inválido, ignorando');
        return;
      }

      const { event, payment } = req.body;

      if (!payment || !payment.externalReference) return;

      // externalReference format: fatura_{faturaId}_{tenantId}
      const parts = payment.externalReference.split('_');
      if (parts.length < 3 || parts[0] !== 'fatura') return;

      const faturaId = parseInt(parts[1], 10);
      const tenantId = parts.slice(2).join('_');

      if (!faturaId || !tenantId) return;

      // Buscar tenant pelo id
      const { rows: tenantRows } = await pool.query(
        "SELECT slug FROM public.tenants WHERE id = $1",
        [tenantId]
      ).catch(() => ({ rows: [] }));

      if (!tenantRows.length) return;

      const schema = schemaFromSlug(tenantRows[0].slug);

      // Atualizar cobrança com gateway_charge_id
      if (payment.id) {
        await pool.query(
          `UPDATE "${schema}".cobrancas_whatsapp
           SET gateway_charge_id = $1
           WHERE fatura_id = $2 AND tenant_id = $3 AND gateway_charge_id IS NULL`,
          [payment.id, faturaId, tenantId]
        ).catch(() => {});
      }

      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        // Buscar fatura e paciente para mensagem de confirmação
        const { rows: faturaRows } = await pool.query(
          `SELECT f.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone, p.id AS paciente_id
           FROM "${schema}".faturas f
           JOIN "${schema}".pacientes p ON p.id = f.paciente_id
           WHERE f.id = $1 AND f.tenant_id = $2`,
          [faturaId, tenantId]
        ).catch(() => ({ rows: [] }));

        if (!faturaRows.length) return;

        const fatura = { ...faturaRows[0], pago_em: payment.paymentDate || new Date().toISOString() };

        // Atualizar status da fatura
        await pool.query(
          `UPDATE "${schema}".faturas SET status = 'pago', pago_em = $1 WHERE id = $2`,
          [fatura.pago_em, faturaId]
        ).catch(() => {});

        // Cancelar cobranças pendentes
        await pool.query(
          `UPDATE "${schema}".cobrancas_whatsapp
           SET status = 'cancelado'
           WHERE fatura_id = $1 AND status = 'pendente'`,
          [faturaId]
        ).catch(() => {});

        // Verificar opt-out antes de enviar confirmação
        const { rows: optout } = await pool.query(
          `SELECT 1 FROM "${schema}".cobrancas_optout
           WHERE tenant_id = $1 AND paciente_id = $2`,
          [tenantId, fatura.paciente_id]
        ).catch(() => ({ rows: [] }));

        if (optout.length) return;

        // Buscar config
        const { rows: configRows } = await pool.query(
          `SELECT * FROM "${schema}".cobrancas_config WHERE tenant_id = $1`,
          [tenantId]
        ).catch(() => ({ rows: [] }));

        const config = configRows[0] || {
          tom_mensagem: 'amigavel',
          horario_inicio_envio: '08:00',
          horario_fim_envio: '20:00'
        };

        const svc = new CobrancaWhatsAppService(pool, tenantId, schema);
        const paciente = { nome: fatura.paciente_nome, telefone: fatura.paciente_telefone };
        const mensagem = svc.montarMensagem('confirmacao_pag', paciente, fatura, config);

        // Inserir e enviar confirmação
        const { rows: inserted } = await pool.query(
          `INSERT INTO "${schema}".cobrancas_whatsapp
             (tenant_id, fatura_id, paciente_id, tipo, mensagem, status)
           VALUES ($1, $2, $3, 'confirmacao_pag', $4, 'pendente')
           RETURNING *`,
          [tenantId, faturaId, fatura.paciente_id, mensagem]
        ).catch(() => ({ rows: [] }));

        if (inserted[0] && svc.podeEnviarAgora(config)) {
          await svc.enviar(inserted[0]);
        }
      }

    } catch (err) {
      console.error('[webhook/pagamento] Erro no processamento:', err.message);
    }
  });
});

module.exports = router;
