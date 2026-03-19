// Padrão Observer: qualquer módulo chama HistoricoService.registrar()
// sem precisar importar a rota de histórico diretamente.

const CATEGORIAS_POR_TIPO = {
  agendamento_criado:     'agendamento',
  agendamento_confirmado: 'agendamento',
  agendamento_cancelado:  'agendamento',
  atendimento_realizado:  'clinico',
  no_show:                'agendamento',
  prontuario_assinado:    'clinico',
  prescricao_registrada:  'clinico',
  cobranca_gerada:        'financeiro',
  pagamento_recebido:     'financeiro',
  mensagem_whatsapp:      'whatsapp',
  confirmacao_whatsapp:   'whatsapp',
  documento_anexado:      'geral',
  observacao_manual:      'geral',
  crm_tag_adicionada:     'crm',
  crm_estagio_alterado:   'crm',
};

/**
 * Registra um evento no histórico do paciente.
 *
 * @param {object} opts
 * @param {object}  opts.db
 * @param {string}  opts.tenantId
 * @param {string|number} opts.pacienteId
 * @param {string}  opts.tipoEvento
 * @param {string}  [opts.referenciaId]
 * @param {string}  [opts.referenciaTabela]
 * @param {string}  opts.descricao
 * @param {string|number} [opts.usuarioId]
 */
async function registrar({ db, tenantId, pacienteId, tipoEvento, referenciaId,
                           referenciaTabela, descricao, usuarioId }) {
  const categoria = CATEGORIAS_POR_TIPO[tipoEvento] ?? 'geral';

  try {
    await db.run(
      `INSERT INTO historico_eventos
         (tenant_id, paciente_id, tipo_evento, referencia_id, referencia_tabela,
          descricao, categoria, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        pacienteId,
        tipoEvento,
        referenciaId   ?? null,
        referenciaTabela ?? null,
        descricao,
        categoria,
        usuarioId ?? null,
      ]
    );
  } catch (err) {
    // Histórico nunca deve bloquear o fluxo principal
    console.error('[HistoricoService] falha ao registrar evento:', tipoEvento, err.message);
  }
}

module.exports = { registrar, CATEGORIAS_POR_TIPO };
