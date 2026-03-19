const cron = require('node-cron');
const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');
const detector = require('../services/CrmSugestoesDetector');

const anthropic = new Anthropic();

// Roda às 7h todos os dias
cron.schedule('0 7 * * *', async () => {
  console.log('[CRM Sugestões] Job iniciado...');

  let tenants;
  try {
    const { rows } = await pool.query('SELECT slug FROM public.tenants WHERE ativo = true');
    tenants = rows;
  } catch (err) {
    console.error('[CRM Sugestões] Falha ao buscar tenants:', err.message);
    return;
  }

  for (const { slug } of tenants) {
    try {
      await processarSugestoesTenant(slug);
    } catch (err) {
      console.error(`[CRM Sugestões] Erro no tenant ${slug}:`, err.message);
    }
  }

  console.log('[CRM Sugestões] Job concluído');
});

async function processarSugestoesTenant(slug) {
  const schema = schemaFromSlug(slug);

  const configResult = await pool.query(`
    SELECT * FROM "${schema}".crm_sugestoes_config WHERE ativo = 1 LIMIT 1
  `).catch(() => ({ rows: [] }));

  const config = configResult.rows[0] || {
    dias_inatividade: 90,
    dias_recontato_perda: 60,
    ticket_minimo_upgrade: 500,
    procedimentos_excluidos: '[]',
  };

  const [r1, r2, r3, r4, r5, r6] = await Promise.all([
    detector.detectarRetornoProgramado(pool, schema, config),
    detector.detectarIndicadoNaoRealizado(pool, schema, config),
    detector.detectarPacienteInativo(pool, schema, config),
    detector.detectarUpgrade(pool, schema, config),
    detector.detectarSazonal(pool, schema),
    detector.detectarRecontatoPerdaPreco(pool, schema, config),
  ]);

  const candidatos = [
    ...r1.map(r => ({ ...r, tipo: 'retorno_programado' })),
    ...r2.map(r => ({ ...r, tipo: 'indicado_nao_realizado' })),
    ...r3.map(r => ({ ...r, tipo: 'paciente_inativo', procedimento_id: null })),
    ...r4.map(r => ({ ...r, tipo: 'upgrade_procedimento' })),
    ...r5.map(r => ({ ...r, tipo: 'sazonal' })),
    ...r6.map(r => ({ ...r, tipo: 'recontato_perda_preco' })),
  ];

  console.log(`[CRM Sugestões] ${slug}: ${candidatos.length} candidatos detectados`);

  for (const candidato of candidatos) {
    try {
      const descricao = await gerarDescricaoIA(candidato);
      const prioridade = calcularPrioridade(candidato);

      // Verificar se já existe sugestão ativa (manual upsert compatível com NULL)
      const { rows: existing } = await pool.query(`
        SELECT id, status FROM "${schema}".crm_sugestoes_ia
        WHERE paciente_id = $1 AND tipo = $2
          AND (($3::BIGINT IS NULL AND procedimento_id IS NULL) OR procedimento_id = $3)
        LIMIT 1
      `, [candidato.paciente_id, candidato.tipo, candidato.procedimento_id || null]);

      if (existing.length > 0) {
        if (existing[0].status !== 'ignorada') {
          await pool.query(`
            UPDATE "${schema}".crm_sugestoes_ia
            SET descricao = $1, valor_estimado = $2, prioridade = $3,
                metadata = $4, atualizado_em = NOW()
            WHERE id = $5
          `, [descricao, candidato.valor_estimado || null, prioridade,
              JSON.stringify(candidato), existing[0].id]);
        }
      } else {
        await pool.query(`
          INSERT INTO "${schema}".crm_sugestoes_ia
            (paciente_id, tipo, procedimento_id, descricao, valor_estimado, prioridade, status, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, 'pendente', $7)
        `, [
          candidato.paciente_id, candidato.tipo,
          candidato.procedimento_id || null, descricao,
          candidato.valor_estimado || null, prioridade,
          JSON.stringify(candidato),
        ]);
      }
    } catch (err) {
      console.error(`[CRM Sugestões] Erro candidato paciente ${candidato.paciente_id}:`, err.message);
    }
  }

  return candidatos.length;
}

/**
 * Prioridade determinística — sem IA
 * Alta: valor >= 1000 OU dias > 365
 * Baixa: valor < 200 E dias < 100
 * Média: demais casos
 */
function calcularPrioridade(candidato) {
  const valor = parseFloat(candidato.valor_estimado) || 0;
  const dias  = parseInt(candidato.dias_desde_retorno || candidato.dias_inativo || candidato.dias_desde_perda || 0);

  if (valor >= 1000 || dias > 365) return 'alta';
  if (valor < 200 && dias < 100)   return 'baixa';
  return 'media';
}

/**
 * Claude API gera descrição em pt-BR — apenas metadados não sensíveis (sem PII)
 */
async function gerarDescricaoIA(candidato) {
  const mapeamento = {
    retorno_programado:     `Paciente realizou '${candidato.procedimento_nome}' há ${candidato.dias_desde_retorno} dias (janela de retorno: ${candidato.janela_retorno_dias} dias).`,
    indicado_nao_realizado: `Profissional '${candidato.profissional_nome}' indicou '${candidato.procedimento_nome}' há ${candidato.dias_desde_indicacao} dias sem agendamento.`,
    paciente_inativo:       `Paciente com ${candidato.total_atendimentos} atendimentos e R$ ${parseFloat(candidato.valor_total_historico || 0).toFixed(2)} em histórico. Inativo há ${candidato.dias_inativo} dias.`,
    upgrade_procedimento:   `Ticket médio R$ ${parseFloat(candidato.ticket_medio_paciente || 0).toFixed(2)}. Procedimento premium '${candidato.procedimento_nome}' (R$ ${parseFloat(candidato.valor_estimado || 0).toFixed(2)}) ainda não realizado.`,
    sazonal:                `Paciente realizou '${candidato.procedimento_nome}' no mesmo período do ano passado (${candidato.repeticoes_historicas}x no histórico).`,
    recontato_perda_preco:  `Oportunidade perdida por preço há ${candidato.dias_desde_perda} dias para '${candidato.procedimento_nome}' (R$ ${parseFloat(candidato.valor_estimado || 0).toFixed(2)}).`,
  };

  const contexto = mapeamento[candidato.tipo] || 'Oportunidade identificada pelo sistema.';

  try {
    const response = await anthropic.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 150,
      messages:   [{
        role:    'user',
        content: `Escreva uma sugestão comercial em 1-2 frases em português brasileiro, clara e objetiva, para a equipe de recepção de uma clínica estética. Baseie-se nos dados abaixo. NÃO mencione IDs. Use linguagem profissional mas acessível.\n\nDados: ${contexto}\nTipo de oportunidade: ${candidato.tipo.replace(/_/g, ' ')}\n\nResponda apenas com o texto da sugestão, sem aspas ou formatação extra.`,
      }],
    });
    return response.content[0].text.trim();
  } catch (err) {
    // Fallback: usar descrição template se Claude falhar
    console.error('[CRM Sugestões] Claude API falhou, usando fallback:', err.message);
    return contexto;
  }
}

module.exports = { processarSugestoesTenant, calcularPrioridade };
