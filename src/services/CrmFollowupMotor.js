/**
 * CrmFollowupMotor — motor de sequências de follow-up
 * Adaptado de SQLite síncrono para PostgreSQL async
 * Chamado dentro da transação de PATCH /api/crm/oportunidades/:id/mover
 */

/**
 * Insere passos de follow-up na fila ao mover oportunidade de etapa.
 * @param {import('pg').PoolClient} client  — client já em BEGIN
 * @param {string} schema
 * @param {number} oportunidadeId
 * @param {number} novaEtapaId
 */
async function inserirPassosNaFila(client, schema, oportunidadeId, novaEtapaId) {
  // Buscar oportunidade completa
  const { rows: opRows } = await client.query(`
    SELECT o.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone,
           pr.nome AS procedimento_nome, u.nome AS responsavel_nome,
           cfg.valor AS clinica_nome
    FROM "${schema}".crm_oportunidades o
    JOIN "${schema}".pacientes          p   ON p.id  = o.paciente_id
    LEFT JOIN "${schema}".procedimentos pr  ON pr.id = o.procedimento_id
    JOIN "${schema}".usuarios           u   ON u.id  = o.responsavel_id
    LEFT JOIN "${schema}".configuracoes cfg ON cfg.chave = 'clinica_nome'
    WHERE o.id = $1
  `, [oportunidadeId]);

  const op = opRows[0];
  if (!op) return { inserido: 0, motivo: 'oportunidade_nao_encontrada' };

  // Verificar opt-out
  const { rows: optoutRows } = await client.query(`
    SELECT id FROM "${schema}".crm_optouts WHERE paciente_id = $1
  `, [op.paciente_id]);
  if (optoutRows.length > 0) return { inserido: 0, motivo: 'optout' };

  // Buscar sequência ativa para a nova etapa
  const { rows: seqRows } = await client.query(`
    SELECT id, nome FROM "${schema}".crm_sequencias
    WHERE etapa_id = $1 AND ativo = 1
    LIMIT 1
  `, [novaEtapaId]);

  if (!seqRows.length) return { inserido: 0, motivo: 'sem_sequencia' };
  const sequencia = seqRows[0];

  const { rows: passos } = await client.query(`
    SELECT * FROM "${schema}".crm_sequencias_passos
    WHERE sequencia_id = $1 AND ativo = 1
    ORDER BY ordem ASC
  `, [sequencia.id]);

  if (!passos.length) return { inserido: 0, motivo: 'sem_passos' };

  // Cancelar mensagens pendentes anteriores desta oportunidade
  await client.query(`
    UPDATE "${schema}".crm_followup_fila
    SET status = 'cancelado', atualizado_em = NOW()
    WHERE oportunidade_id = $1 AND status IN ('pendente', 'aprovado')
  `, [oportunidadeId]);

  const agora = new Date();
  let inseridos = 0;

  for (const passo of passos) {
    const agendadoPara = calcularAgendamento(agora, passo);
    const mensagemRenderizada = renderizarTemplate(passo.mensagem_template, {
      nome:         (op.paciente_nome || '').split(' ')[0],
      procedimento: op.procedimento_nome || 'procedimento',
      valor:        op.valor_estimado ? `R$ ${parseFloat(op.valor_estimado).toFixed(2)}` : '',
      clinica:      op.clinica_nome || '',
      profissional: op.responsavel_nome || '',
    });

    const status = passo.modo === 'automatico' ? 'aprovado' : 'pendente';

    await client.query(`
      INSERT INTO "${schema}".crm_followup_fila
        (oportunidade_id, passo_id, mensagem_renderizada, status, agendado_para)
      VALUES ($1, $2, $3, $4, $5)
    `, [oportunidadeId, passo.id, mensagemRenderizada, status, agendadoPara]);

    inseridos++;
  }

  return { inserido: inseridos };
}

/**
 * Calcula data/hora de envio respeitando gatilho_dias e horário comercial.
 */
function calcularAgendamento(base, passo) {
  const data = new Date(base);

  if (passo.gatilho_dias > 0) {
    data.setDate(data.getDate() + passo.gatilho_dias);
  }

  const hora = data.getHours();

  if (hora < passo.horario_inicio) {
    data.setHours(passo.horario_inicio, 0, 0, 0);
  } else if (hora >= passo.horario_fim) {
    data.setDate(data.getDate() + 1);
    data.setHours(passo.horario_inicio, 0, 0, 0);
  }

  return data;
}

/**
 * Renderiza template substituindo variáveis [Variavel] (case-insensitive).
 */
function renderizarTemplate(template, vars) {
  return template
    .replace(/\[Nome\]/gi,         vars.nome || '')
    .replace(/\[Procedimento\]/gi, vars.procedimento || '')
    .replace(/\[Valor\]/gi,        vars.valor || '')
    .replace(/\[Clinica\]/gi,      vars.clinica || '')
    .replace(/\[Profissional\]/gi, vars.profissional || '');
}

module.exports = { inserirPassosNaFila, calcularAgendamento, renderizarTemplate };
