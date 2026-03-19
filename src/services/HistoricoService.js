// Serviço de histórico do paciente — registra eventos após assinatura de prontuário
async function registrar({ db, tenantId, pacienteId, tipoEvento, referenciaId, referenciaTabela, descricao, usuarioId }) {
  try {
    await db.run(`
      INSERT INTO prontuario_registros
        (paciente_id, tipo_evento, referencia_id, referencia_tabela, descricao, criado_por, data_registro)
      VALUES ($1, $2, $3, $4, $5, $6, now())
    `, [pacienteId, tipoEvento, referenciaId, referenciaTabela, descricao, usuarioId]);
  } catch (err) {
    // Histórico é não-crítico — não interromper o fluxo
    console.error('[HistoricoService] falha ao registrar:', err.message);
  }
}

module.exports = { registrar };
