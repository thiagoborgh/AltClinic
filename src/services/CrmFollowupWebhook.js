/**
 * CrmFollowupWebhook — processa respostas WhatsApp do paciente
 * Chamado pelo processador global de webhook ao receber mensagem
 */
const pool = require('../database/postgres');
const { schemaFromSlug } = require('./CrmScoreService');

const PALAVRAS_OPTOUT    = ['SAIR', 'PARAR', 'STOP', 'CANCELAR', 'NAO QUERO', 'NÃO QUERO', 'REMOVER'];
const PALAVRAS_AFIRMATIVO = ['SIM', 'S', 'YES', 'QUERO', 'PODE', 'CONFIRMO', 'OK', 'CLARO', 'VAMOS'];
const PALAVRAS_NEGATIVO   = ['NAO', 'NÃO', 'N', 'NO', 'DESISTO', 'CANCELEI'];

async function processarRespostaFollowup(tenantSlug, pacienteTelefone, textoResposta) {
  const schema = schemaFromSlug(tenantSlug);

  // Encontrar oportunidade ativa vinculada ao telefone
  const { rows: opRows } = await pool.query(`
    SELECT o.id AS oportunidade_id, o.paciente_id, p.telefone
    FROM "${schema}".crm_oportunidades o
    JOIN "${schema}".pacientes p ON p.id = o.paciente_id
    WHERE p.telefone = $1
      AND o.ativo = 1
      AND o.etapa_id NOT IN (
        SELECT id FROM "${schema}".crm_etapas_config WHERE nome IN ('Convertido','Perdido')
      )
    ORDER BY o.atualizado_em DESC
    LIMIT 1
  `, [pacienteTelefone]);

  if (!opRows.length) return { processado: false, motivo: 'oportunidade_nao_encontrada' };
  const op = opRows[0];

  const texto = textoResposta.trim().toUpperCase();
  const isOptout = PALAVRAS_OPTOUT.some(p => texto.includes(p));

  if (isOptout) {
    await pool.query(`
      INSERT INTO "${schema}".crm_optouts (paciente_id, motivo)
      VALUES ($1, 'resposta_stop')
      ON CONFLICT (paciente_id) DO NOTHING
    `, [op.paciente_id]);

    await pool.query(`
      UPDATE "${schema}".crm_followup_fila
      SET status = 'cancelado', atualizado_em = NOW()
      WHERE oportunidade_id = $1 AND status IN ('pendente','aprovado')
    `, [op.oportunidade_id]);

    await pool.query(`
      INSERT INTO "${schema}".crm_atividades (oportunidade_id, tipo, descricao)
      VALUES ($1, 'observacao', 'Paciente solicitou opt-out via WhatsApp. Fila cancelada.')
    `, [op.oportunidade_id]);

    return { processado: true, acao: 'optout', oportunidade_id: op.oportunidade_id };
  }

  const isAfirmativo = PALAVRAS_AFIRMATIVO.some(p => texto === p || texto.startsWith(p + ' '));
  const isNegativo   = PALAVRAS_NEGATIVO.some(p   => texto === p || texto.startsWith(p + ' '));

  await pool.query(`
    INSERT INTO "${schema}".crm_atividades (oportunidade_id, tipo, descricao, metadata)
    VALUES ($1, 'mensagem_whatsapp', $2, $3)
  `, [
    op.oportunidade_id,
    'Resposta recebida: ' + textoResposta.substring(0, 100),
    JSON.stringify({ texto: textoResposta, classificacao: isAfirmativo ? 'afirmativo' : isNegativo ? 'negativo' : 'neutro' }),
  ]);

  // Cancelar próximas mensagens pois paciente respondeu
  await pool.query(`
    UPDATE "${schema}".crm_followup_fila
    SET status = 'cancelado', atualizado_em = NOW()
    WHERE oportunidade_id = $1 AND status IN ('pendente','aprovado')
  `, [op.oportunidade_id]);

  const acao = isAfirmativo ? 'alerta_avancar_etapa' : isNegativo ? 'alerta_marcar_perdido' : 'resposta_neutra';

  return {
    processado:     true,
    acao,
    oportunidade_id: op.oportunidade_id,
    sugestao:        isAfirmativo ? 'Mova a oportunidade para a próxima etapa'
                   : isNegativo   ? 'Registre como Perdido'
                   : null,
  };
}

module.exports = { processarRespostaFollowup };
