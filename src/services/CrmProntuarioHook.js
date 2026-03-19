const pool = require('../database/postgres');
const { schemaFromSlug } = require('./CrmScoreService');

async function sugerirOportunidadeCRM(tenantSlug, prontuarioId, pacienteId, procedimentoId, profissionalId) {
  const schema = schemaFromSlug(tenantSlug);

  try {
    // Verificar se já existe oportunidade ativa para paciente + procedimento
    const { rows: existenteRows } = await pool.query(`
      SELECT id FROM "${schema}".crm_oportunidades
      WHERE paciente_id = $1
        AND ($2::BIGINT IS NULL OR procedimento_id = $2)
        AND ativo = 1
        AND etapa_id NOT IN (
          SELECT id FROM "${schema}".crm_etapas_config WHERE nome IN ('Convertido', 'Perdido')
        )
    `, [pacienteId, procedimentoId || null]);

    if (existenteRows.length > 0) {
      return { sugestao: false, motivo: 'oportunidade_ativa_existente' };
    }

    const [procRows, profRows] = await Promise.all([
      procedimentoId ? pool.query(
        `SELECT id, nome, valor FROM "${schema}".procedimentos WHERE id = $1`,
        [procedimentoId]
      ).catch(() => ({ rows: [] })) : { rows: [] },

      profissionalId ? pool.query(
        `SELECT id, nome FROM "${schema}".usuarios WHERE id = $1`,
        [profissionalId]
      ).catch(() => ({ rows: [] })) : { rows: [] },
    ]);

    const procedimento = procRows.rows[0];
    const profissional = profRows.rows[0];

    return {
      sugestao: true,
      dados: {
        paciente_id:        pacienteId,
        procedimento_id:    procedimentoId,
        procedimento_nome:  procedimento?.nome,
        valor_estimado:     procedimento?.valor,
        origem:             'profissional_indicou',
        prontuario_id:      prontuarioId,
        profissional_nome:  profissional?.nome,
      },
    };
  } catch (err) {
    console.error('[CrmProntuarioHook] falha:', err.message);
    return { sugestao: false, motivo: 'erro_interno' };
  }
}

module.exports = { sugerirOportunidadeCRM };
