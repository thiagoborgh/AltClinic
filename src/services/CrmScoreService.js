const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../database/postgres');

const anthropic = new Anthropic();

function schemaFromSlug(slug) {
  return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function calcularFatoresScore(schema, oportunidadeId) {
  const [r1, r2, r3, r4, r5, r6] = await Promise.all([
    pool.query(`
      SELECT EXTRACT(DAY FROM (NOW() - MAX(criado_em)))::INTEGER AS dias_sem_contato
      FROM "${schema}".crm_atividades WHERE oportunidade_id = $1
    `, [oportunidadeId]).catch(() => ({ rows: [{}] })),

    pool.query(`
      SELECT
        COUNT(CASE WHEN etapa_id = (SELECT id FROM "${schema}".crm_etapas_config WHERE nome = 'Convertido' LIMIT 1) THEN 1 END) AS conversoes,
        COUNT(*) AS total_ops
      FROM "${schema}".crm_oportunidades
      WHERE paciente_id = (SELECT paciente_id FROM "${schema}".crm_oportunidades WHERE id = $1)
        AND id != $1
    `, [oportunidadeId]).catch(() => ({ rows: [{}] })),

    pool.query(`
      SELECT
        COUNT(CASE WHEN etapa_id = (SELECT id FROM "${schema}".crm_etapas_config WHERE nome = 'Convertido' LIMIT 1) THEN 1 END)::REAL
          / NULLIF(COUNT(*), 0) AS taxa_origem
      FROM "${schema}".crm_oportunidades
      WHERE origem = (SELECT origem FROM "${schema}".crm_oportunidades WHERE id = $1)
    `, [oportunidadeId]).catch(() => ({ rows: [{}] })),

    pool.query(`
      SELECT
        o.valor_estimado,
        (SELECT AVG(valor_estimado) FROM "${schema}".crm_oportunidades WHERE ativo = 1 AND valor_estimado IS NOT NULL) AS ticket_medio
      FROM "${schema}".crm_oportunidades o WHERE o.id = $1
    `, [oportunidadeId]).catch(() => ({ rows: [{}] })),

    pool.query(`
      SELECT
        EXTRACT(DAY FROM (NOW() - o.atualizado_em))::INTEGER AS dias_na_etapa,
        (SELECT AVG(EXTRACT(DAY FROM (atualizado_em - criado_em)))
         FROM "${schema}".crm_oportunidades WHERE etapa_id = o.etapa_id AND ativo = 1) AS media_dias_etapa
      FROM "${schema}".crm_oportunidades o WHERE o.id = $1
    `, [oportunidadeId]).catch(() => ({ rows: [{}] })),

    pool.query(`
      SELECT COUNT(*) AS total_atividades FROM "${schema}".crm_atividades WHERE oportunidade_id = $1
    `, [oportunidadeId]).catch(() => ({ rows: [{}] })),
  ]);

  return {
    dias_sem_contato:               r1.rows[0]?.dias_sem_contato ?? 0,
    conversoes_anteriores:          parseInt(r2.rows[0]?.conversoes ?? 0),
    total_oportunidades_anteriores: parseInt(r2.rows[0]?.total_ops ?? 0),
    taxa_conversao_origem:          parseFloat(r3.rows[0]?.taxa_origem ?? 0),
    valor_estimado:                 parseFloat(r4.rows[0]?.valor_estimado ?? 0),
    ticket_medio_clinica:           parseFloat(r4.rows[0]?.ticket_medio ?? 0),
    dias_na_etapa:                  r5.rows[0]?.dias_na_etapa ?? 0,
    media_dias_etapa:               parseFloat(r5.rows[0]?.media_dias_etapa ?? 5),
    total_atividades:               parseInt(r6.rows[0]?.total_atividades ?? 0),
  };
}

async function calcularScoreIA(schema, oportunidadeId) {
  const fatores = await calcularFatoresScore(schema, oportunidadeId);

  const { rows: opRows } = await pool.query(`
    SELECT o.*, e.nome AS etapa_nome, p.nome AS paciente_nome,
           pr.nome AS procedimento_nome
    FROM "${schema}".crm_oportunidades o
    JOIN  "${schema}".crm_etapas_config e  ON e.id  = o.etapa_id
    JOIN  "${schema}".pacientes          p  ON p.id  = o.paciente_id
    LEFT JOIN "${schema}".procedimentos  pr ON pr.id = o.procedimento_id
    WHERE o.id = $1
  `, [oportunidadeId]);
  const op = opRows[0];
  if (!op) throw new Error('Oportunidade não encontrada');

  const prompt = `Você é um assistente de CRM clínico. Calcule a probabilidade de conversão (0-100) desta oportunidade e sugira a próxima ação. Responda APENAS com JSON válido.

Dados:
- Etapa: ${op.etapa_nome}
- Procedimento: ${op.procedimento_nome || 'Não especificado'}
- Origem: ${op.origem}
- Dias sem contato: ${fatores.dias_sem_contato}
- Atividades registradas: ${fatores.total_atividades}
- Taxa de conversão histórica desta origem: ${(fatores.taxa_conversao_origem * 100).toFixed(1)}%
- Conversões anteriores deste paciente: ${fatores.conversoes_anteriores}/${fatores.total_oportunidades_anteriores}
- Dias na etapa atual: ${fatores.dias_na_etapa} (média histórica: ${Math.round(fatores.media_dias_etapa || 0)} dias)
- Valor: R$ ${(fatores.valor_estimado || 0).toFixed(2)} (ticket médio da clínica: R$ ${(fatores.ticket_medio_clinica || 0).toFixed(2)})

Responda:
{"score": <0-100>, "justificativa": "<2-3 frases em pt-BR>", "sugestao_proxima_acao": "<ação concreta>"}`;

  const response = await anthropic.messages.create({
    model:      'claude-opus-4-5',
    max_tokens: 300,
    messages:   [{ role: 'user', content: prompt }],
  });

  const resultado = JSON.parse(response.content[0].text);

  await pool.query(`
    UPDATE "${schema}".crm_oportunidades
    SET score_ia = $1, score_ia_em = NOW(), atualizado_em = NOW()
    WHERE id = $2
  `, [resultado.score, oportunidadeId]);

  await pool.query(`
    INSERT INTO "${schema}".crm_atividades (oportunidade_id, tipo, descricao, metadata, criado_em)
    VALUES ($1, 'score_ia', $2, $3, NOW())
  `, [
    oportunidadeId,
    `Score IA: ${resultado.score}/100 — ${resultado.justificativa}`,
    JSON.stringify(resultado),
  ]);

  return resultado;
}

module.exports = { calcularFatoresScore, calcularScoreIA, schemaFromSlug };
