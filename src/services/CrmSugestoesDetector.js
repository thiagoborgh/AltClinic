/**
 * CrmSugestoesDetector — 6 queries de detecção de oportunidades comerciais
 * Adaptado de SQLite síncrono para PostgreSQL async (pool.query)
 */

/**
 * QUERY 1 — Retorno programado
 * Paciente realizou procedimento X há >= janela_retorno_dias
 * e não tem agendamento futuro para o mesmo procedimento.
 */
async function detectarRetornoProgramado(pool, schema, config) {
  try {
    const excluidos = JSON.parse(config.procedimentos_excluidos || '[]');
    const { rows } = await pool.query(`
      WITH stats AS (
        SELECT
          a.paciente_id,
          a.procedimento_id,
          p.nome                                                          AS procedimento_nome,
          p.valor                                                         AS valor_estimado,
          MAX(a.data_realizacao)                                          AS ultima_realizacao,
          EXTRACT(DAY FROM (NOW() - MAX(a.data_realizacao)))::INTEGER     AS dias_desde_retorno,
          COALESCE(p.janela_retorno_dias, 180)                            AS janela_retorno_dias
        FROM "${schema}".atendimentos a
        JOIN "${schema}".procedimentos p ON p.id = a.procedimento_id
        WHERE a.status = 'realizado'
          AND COALESCE(p.janela_retorno_dias, 180) > 0
          AND NOT (p.id = ANY($1::BIGINT[]))
        GROUP BY a.paciente_id, a.procedimento_id, p.nome, p.valor, p.janela_retorno_dias
      )
      SELECT * FROM stats
      WHERE dias_desde_retorno >= janela_retorno_dias
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".agendamentos_lite ag
          WHERE ag.paciente_id = stats.paciente_id
            AND ag.procedimento_id = stats.procedimento_id
            AND ag.data_hora >= CURRENT_DATE
            AND ag.status NOT IN ('cancelado')
        )
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".crm_sugestoes_ia s
          WHERE s.paciente_id = stats.paciente_id
            AND s.tipo = 'retorno_programado'
            AND s.procedimento_id = stats.procedimento_id
            AND s.status IN ('pendente', 'adiada')
        )
      ORDER BY dias_desde_retorno DESC
      LIMIT 200
    `, [excluidos]);
    return rows;
  } catch (err) {
    console.error('[CrmSugestoesDetector] detectarRetornoProgramado:', err.message);
    return [];
  }
}

/**
 * QUERY 2 — Procedimento indicado no prontuário sem agendamento
 * Profissional registrou procedimento_indicado_id no prontuário,
 * mas não há agendamento aberto para este paciente + procedimento.
 */
async function detectarIndicadoNaoRealizado(pool, schema, config) {
  try {
    const excluidos = JSON.parse(config.procedimentos_excluidos || '[]');
    const { rows } = await pool.query(`
      SELECT
        pn.paciente_id,
        pn.procedimento_indicado_id                   AS procedimento_id,
        pr.nome                                       AS procedimento_nome,
        pr.valor                                      AS valor_estimado,
        pn.criado_em                                  AS data_indicacao,
        pn.profissional_id,
        u.nome                                        AS profissional_nome,
        EXTRACT(DAY FROM (NOW() - pn.criado_em))::INTEGER AS dias_desde_indicacao
      FROM "${schema}".prontuarios pn
      JOIN "${schema}".procedimentos pr ON pr.id = pn.procedimento_indicado_id
      JOIN "${schema}".usuarios u        ON u.id  = pn.profissional_id
      WHERE pn.procedimento_indicado_id IS NOT NULL
        AND pn.criado_em >= NOW() - INTERVAL '365 days'
        AND NOT (pr.id = ANY($1::BIGINT[]))
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".agendamentos_lite ag
          WHERE ag.paciente_id = pn.paciente_id
            AND ag.procedimento_id = pn.procedimento_indicado_id
            AND ag.data_hora >= CURRENT_DATE
            AND ag.status NOT IN ('cancelado')
        )
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".atendimentos at
          WHERE at.paciente_id = pn.paciente_id
            AND at.procedimento_id = pn.procedimento_indicado_id
            AND at.data_realizacao > pn.criado_em
        )
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".crm_sugestoes_ia s
          WHERE s.paciente_id = pn.paciente_id
            AND s.tipo = 'indicado_nao_realizado'
            AND s.procedimento_id = pn.procedimento_indicado_id
            AND s.status IN ('pendente', 'adiada')
        )
      GROUP BY pn.paciente_id, pn.procedimento_indicado_id, pr.nome, pr.valor,
               pn.criado_em, pn.profissional_id, u.nome
      ORDER BY dias_desde_indicacao DESC
      LIMIT 200
    `, [excluidos]);
    return rows;
  } catch (err) {
    console.error('[CrmSugestoesDetector] detectarIndicadoNaoRealizado:', err.message);
    return [];
  }
}

/**
 * QUERY 3 — Paciente inativo > N dias (configurável, padrão 90)
 * Sem atendimento há mais de N dias, mas teve >= 2 atendimentos no passado.
 */
async function detectarPacienteInativo(pool, schema, config) {
  try {
    const { rows } = await pool.query(`
      WITH stats AS (
        SELECT
          pa.id                                                                  AS paciente_id,
          MAX(a.data_realizacao)                                                 AS ultimo_atendimento,
          COUNT(a.id)                                                            AS total_atendimentos,
          EXTRACT(DAY FROM (NOW() - MAX(a.data_realizacao)))::INTEGER            AS dias_inativo,
          SUM(a.valor_cobrado)                                                   AS valor_total_historico
        FROM "${schema}".pacientes pa
        JOIN "${schema}".atendimentos a ON a.paciente_id = pa.id AND a.status = 'realizado'
        WHERE pa.ativo = 1
        GROUP BY pa.id
      )
      SELECT * FROM stats
      WHERE dias_inativo > $1
        AND total_atendimentos >= 2
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".agendamentos_lite ag
          WHERE ag.paciente_id = stats.paciente_id
            AND ag.data_hora >= CURRENT_DATE
            AND ag.status NOT IN ('cancelado')
        )
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".crm_sugestoes_ia s
          WHERE s.paciente_id = stats.paciente_id
            AND s.tipo = 'paciente_inativo'
            AND s.status IN ('pendente', 'adiada')
        )
      ORDER BY valor_total_historico DESC NULLS LAST
      LIMIT 200
    `, [config.dias_inatividade]);
    return rows;
  } catch (err) {
    console.error('[CrmSugestoesDetector] detectarPacienteInativo:', err.message);
    return [];
  }
}

/**
 * QUERY 4 — Upgrade de procedimento
 * Paciente com ticket médio alto e procedimento premium disponível que nunca fez.
 */
async function detectarUpgrade(pool, schema, config) {
  try {
    const { rows } = await pool.query(`
      WITH ticket_paciente AS (
        SELECT
          a.paciente_id,
          AVG(a.valor_cobrado)              AS ticket_medio_paciente,
          COUNT(DISTINCT a.procedimento_id) AS variedade_procedimentos
        FROM "${schema}".atendimentos a
        JOIN "${schema}".pacientes pa ON pa.id = a.paciente_id AND pa.ativo = 1
        WHERE a.status = 'realizado'
        GROUP BY a.paciente_id
        HAVING AVG(a.valor_cobrado) >= $1
      )
      SELECT
        tp.paciente_id,
        tp.ticket_medio_paciente,
        tp.variedade_procedimentos,
        pr.id        AS procedimento_id,
        pr.nome      AS procedimento_nome,
        pr.valor     AS valor_estimado
      FROM ticket_paciente tp
      JOIN "${schema}".procedimentos pr ON pr.ativo = 1
                                       AND pr.valor > $1
                                       AND pr.categoria = 'premium'
      WHERE NOT EXISTS (
        SELECT 1 FROM "${schema}".atendimentos at2
        WHERE at2.paciente_id = tp.paciente_id
          AND at2.procedimento_id = pr.id
      )
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".crm_sugestoes_ia s
          WHERE s.paciente_id = tp.paciente_id
            AND s.tipo = 'upgrade_procedimento'
            AND s.procedimento_id = pr.id
            AND s.status IN ('pendente', 'adiada')
        )
      ORDER BY tp.ticket_medio_paciente DESC
      LIMIT 100
    `, [config.ticket_minimo_upgrade]);
    return rows;
  } catch (err) {
    console.error('[CrmSugestoesDetector] detectarUpgrade:', err.message);
    return [];
  }
}

/**
 * QUERY 5 — Oportunidade sazonal
 * Pacientes que realizaram o mesmo procedimento no mesmo período do ano anterior
 * e ainda não agendaram para o período atual.
 */
async function detectarSazonal(pool, schema) {
  try {
    const { rows } = await pool.query(`
      SELECT
        a.paciente_id,
        a.procedimento_id,
        pr.nome                   AS procedimento_nome,
        pr.valor                  AS valor_estimado,
        a.data_realizacao         AS data_ano_anterior,
        COUNT(*)                  AS repeticoes_historicas
      FROM "${schema}".atendimentos a
      JOIN "${schema}".procedimentos pr ON pr.id = a.procedimento_id
      WHERE a.status = 'realizado'
        AND TO_CHAR(a.data_realizacao::DATE, 'MM-DD') BETWEEN
            TO_CHAR((CURRENT_DATE - INTERVAL '1 year 30 days')::DATE, 'MM-DD') AND
            TO_CHAR((CURRENT_DATE - INTERVAL '1 year' + INTERVAL '30 days')::DATE, 'MM-DD')
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".agendamentos_lite ag
          WHERE ag.paciente_id = a.paciente_id
            AND ag.procedimento_id = a.procedimento_id
            AND EXTRACT(YEAR FROM ag.data_hora) = EXTRACT(YEAR FROM NOW())
            AND ag.status NOT IN ('cancelado')
        )
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".crm_sugestoes_ia s
          WHERE s.paciente_id = a.paciente_id
            AND s.tipo = 'sazonal'
            AND s.procedimento_id = a.procedimento_id
            AND s.status IN ('pendente', 'adiada')
        )
      GROUP BY a.paciente_id, a.procedimento_id, pr.nome, pr.valor, a.data_realizacao
      ORDER BY repeticoes_historicas DESC
      LIMIT 200
    `);
    return rows;
  } catch (err) {
    console.error('[CrmSugestoesDetector] detectarSazonal:', err.message);
    return [];
  }
}

/**
 * QUERY 6 — Recontato após perda por preço
 * Oportunidade CRM fechada como Perdido com motivo='preco' há >= N dias.
 */
async function detectarRecontatoPerdaPreco(pool, schema, config) {
  try {
    const { rows } = await pool.query(`
      SELECT
        o.paciente_id,
        o.procedimento_id,
        pr.nome                                                              AS procedimento_nome,
        o.valor_estimado,
        o.atualizado_em                                                      AS data_perda,
        EXTRACT(DAY FROM (NOW() - o.atualizado_em))::INTEGER                 AS dias_desde_perda
      FROM "${schema}".crm_oportunidades o
      JOIN "${schema}".procedimentos pr ON pr.id = o.procedimento_id
      WHERE o.ativo = 1
        AND o.motivo_perda = 'preco'
        AND o.etapa_id = (SELECT id FROM "${schema}".crm_etapas_config WHERE nome = 'Perdido' LIMIT 1)
        AND EXTRACT(DAY FROM (NOW() - o.atualizado_em))::INTEGER >= $1
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".crm_oportunidades o2
          WHERE o2.paciente_id = o.paciente_id
            AND o2.procedimento_id = o.procedimento_id
            AND o2.ativo = 1
            AND o2.id != o.id
            AND o2.etapa_id NOT IN (SELECT id FROM "${schema}".crm_etapas_config WHERE nome = 'Perdido')
        )
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".crm_sugestoes_ia s
          WHERE s.paciente_id = o.paciente_id
            AND s.tipo = 'recontato_perda_preco'
            AND s.procedimento_id = o.procedimento_id
            AND s.status IN ('pendente', 'adiada')
        )
      ORDER BY dias_desde_perda DESC
      LIMIT 100
    `, [config.dias_recontato_perda]);
    return rows;
  } catch (err) {
    console.error('[CrmSugestoesDetector] detectarRecontatoPerdaPreco:', err.message);
    return [];
  }
}

module.exports = {
  detectarRetornoProgramado,
  detectarIndicadoNaoRealizado,
  detectarPacienteInativo,
  detectarUpgrade,
  detectarSazonal,
  detectarRecontatoPerdaPreco,
};
