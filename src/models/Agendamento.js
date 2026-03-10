class AgendamentoModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Cria um novo agendamento
   * @param {Object} agendamentoData - Dados do agendamento
   * @returns {Object} - Agendamento criado
   */
  async create(agendamentoData) {
    const {
      paciente_id,
      procedimento_id,
      equipamento_id,
      data_hora,
      sessao_numero = 1,
      observacoes
    } = agendamentoData;

    try {
      const r = await this.db.run(
        `INSERT INTO agendamento (paciente_id, procedimento_id, equipamento_id, data_hora, sessao_numero, observacoes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [paciente_id, procedimento_id, equipamento_id, data_hora, sessao_numero, observacoes]
      );

      return this.findById(r.lastID);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca agendamento por ID
   * @param {number} id - ID do agendamento
   * @returns {Object|null} - Agendamento encontrado
   */
  async findById(id) {
    return this.db.get(
      `SELECT a.*,
              p.nome as paciente_nome, p.telefone as paciente_telefone,
              proc.nome as procedimento_nome, proc.duracao_minutos, proc.preco, proc.preparo_texto,
              e.nome as equipamento_nome, e.capacidade
       FROM agendamento a
       LEFT JOIN paciente p ON a.paciente_id = p.id
       LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
       LEFT JOIN equipamento e ON a.equipamento_id = e.id
       WHERE a.id = $1`,
      [id]
    );
  }

  /**
   * Lista agendamentos por data
   * @param {number} clinicaId - ID da clínica
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Array} - Lista de agendamentos
   */
  async findByData(clinicaId, data) {
    return this.db.all(
      `SELECT a.*,
              p.nome as paciente_nome, p.telefone as paciente_telefone,
              proc.nome as procedimento_nome, proc.duracao_minutos,
              e.nome as equipamento_nome
       FROM agendamento a
       LEFT JOIN paciente p ON a.paciente_id = p.id
       LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
       LEFT JOIN equipamento e ON a.equipamento_id = e.id
       WHERE p.clinica_id = $1
         AND DATE(a.data_hora) = $2
         AND a.status != 'cancelado'
       ORDER BY a.data_hora`,
      [clinicaId, data]
    );
  }

  /**
   * Lista agendamentos por período
   * @param {number} clinicaId - ID da clínica
   * @param {string} dataInicio - Data inicial
   * @param {string} dataFim - Data final
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} - Lista de agendamentos
   */
  async findByPeriodo(clinicaId, dataInicio, dataFim, filters = {}) {
    let query = `
      SELECT a.*,
             p.nome as paciente_nome, p.telefone as paciente_telefone,
             proc.nome as procedimento_nome, proc.duracao_minutos,
             e.nome as equipamento_nome
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
      LEFT JOIN equipamento e ON a.equipamento_id = e.id
      WHERE p.clinica_id = $1
        AND a.data_hora >= $2
        AND a.data_hora <= $3
    `;

    const params = [clinicaId, dataInicio, dataFim];
    let idx = 4;

    if (filters.status) {
      query += ` AND a.status = $${idx++}`;
      params.push(filters.status);
    }

    if (filters.equipamento_id) {
      query += ` AND a.equipamento_id = $${idx++}`;
      params.push(filters.equipamento_id);
    }

    if (filters.procedimento_id) {
      query += ` AND a.procedimento_id = $${idx++}`;
      params.push(filters.procedimento_id);
    }

    query += ' ORDER BY a.data_hora';

    return this.db.all(query, params);
  }

  /**
   * Verifica disponibilidade de horário e equipamento
   * @param {number} equipamento_id - ID do equipamento
   * @param {string} data_hora - Data e hora desejada
   * @param {number} duracao_minutos - Duração do procedimento
   * @param {number} agendamento_id - ID do agendamento (para edição)
   * @returns {Object} - Resultado da verificação
   */
  async verificarDisponibilidade(equipamento_id, data_hora, duracao_minutos, agendamento_id = null) {
    const equipamento = await this.db.get(
      'SELECT capacidade FROM equipamento WHERE id = $1',
      [equipamento_id]
    );

    if (!equipamento) {
      return { disponivel: false, motivo: 'Equipamento não encontrado' };
    }

    const dataHoraObj = new Date(data_hora);
    const dataHoraFim = new Date(dataHoraObj.getTime() + (duracao_minutos * 60000));

    let query = `
      SELECT COUNT(*) as conflitos
      FROM agendamento a
      LEFT JOIN procedimento p ON a.procedimento_id = p.id
      WHERE a.equipamento_id = $1
        AND a.status IN ('agendado', 'confirmado')
        AND (
          (a.data_hora < $2 AND a.data_hora + (p.duracao_minutos * INTERVAL '1 minute') > $3)
          OR (a.data_hora >= $3 AND a.data_hora < $2)
        )
    `;

    const params = [equipamento_id, dataHoraFim.toISOString(), data_hora];
    let idx = 4;

    if (agendamento_id) {
      query += ` AND a.id != $${idx++}`;
      params.push(agendamento_id);
    }

    const row = await this.db.get(query, params);
    const conflitos = parseInt(row.conflitos, 10);

    if (conflitos >= equipamento.capacidade) {
      return {
        disponivel: false,
        motivo: `Equipamento já possui ${conflitos} agendamento(s) no horário. Capacidade máxima: ${equipamento.capacidade}`
      };
    }

    return {
      disponivel: true,
      capacidadeUsada: conflitos,
      capacidadeTotal: equipamento.capacidade
    };
  }

  /**
   * Atualiza status do agendamento
   * @param {number} id - ID do agendamento
   * @param {string} status - Novo status
   * @param {string} observacoes - Observações opcionais
   * @returns {Object} - Agendamento atualizado
   */
  async updateStatus(id, status, observacoes = null) {
    const updates = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    let idx = 2;

    if (observacoes) {
      updates.push(`observacoes = $${idx++}`);
      params.push(observacoes);
    }

    params.push(id);

    await this.db.run(
      `UPDATE agendamento SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    );

    return this.findById(id);
  }

  /**
   * Atualiza dados do agendamento
   * @param {number} id - ID do agendamento
   * @param {Object} agendamentoData - Dados para atualizar
   * @returns {Object} - Agendamento atualizado
   */
  async update(id, agendamentoData) {
    const { data_hora, procedimento_id, equipamento_id, observacoes } = agendamentoData;
    const updates = [];
    const values = [];
    let idx = 1;

    if (data_hora) {
      updates.push(`data_hora = $${idx++}`);
      values.push(data_hora);
    }

    if (procedimento_id) {
      updates.push(`procedimento_id = $${idx++}`);
      values.push(procedimento_id);
    }

    if (equipamento_id) {
      updates.push(`equipamento_id = $${idx++}`);
      values.push(equipamento_id);
    }

    if (observacoes !== undefined) {
      updates.push(`observacoes = $${idx++}`);
      values.push(observacoes);
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.db.run(
      `UPDATE agendamento SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    return this.findById(id);
  }

  /**
   * Remove agendamento
   * @param {number} id - ID do agendamento
   * @returns {boolean} - True se removido
   */
  async delete(id) {
    const result = await this.db.run(
      'DELETE FROM agendamento WHERE id = $1',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Busca agendamentos para confirmação (próximas 24h)
   * @param {number} clinicaId - ID da clínica
   * @returns {Array} - Agendamentos para confirmar
   */
  async findParaConfirmacao(clinicaId) {
    return this.db.all(
      `SELECT a.*,
              p.nome as paciente_nome, p.telefone as paciente_telefone,
              proc.nome as procedimento_nome
       FROM agendamento a
       LEFT JOIN paciente p ON a.paciente_id = p.id
       LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
       WHERE p.clinica_id = $1
         AND a.status = 'agendado'
         AND a.data_hora BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
       ORDER BY a.data_hora`,
      [clinicaId]
    );
  }

  /**
   * Busca agendamentos para lembrete (próximas 2-4h)
   * @param {number} clinicaId - ID da clínica
   * @returns {Array} - Agendamentos para lembrete
   */
  async findParaLembrete(clinicaId) {
    return this.db.all(
      `SELECT a.*,
              p.nome as paciente_nome, p.telefone as paciente_telefone,
              proc.nome as procedimento_nome, proc.preparo_texto
       FROM agendamento a
       LEFT JOIN paciente p ON a.paciente_id = p.id
       LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
       WHERE p.clinica_id = $1
         AND a.status IN ('agendado', 'confirmado')
         AND a.data_hora BETWEEN NOW() + INTERVAL '2 hours' AND NOW() + INTERVAL '4 hours'
       ORDER BY a.data_hora`,
      [clinicaId]
    );
  }

  /**
   * Estatísticas de agendamentos
   * @param {number} clinicaId - ID da clínica
   * @param {string} periodo - Período de análise ('hoje', 'semana', 'mes')
   * @returns {Object} - Estatísticas
   */
  async getEstatisticas(clinicaId, periodo = 'mes') {
    let intervalo;

    switch (periodo) {
      case 'hoje':
        intervalo = "DATE(a.data_hora) = CURRENT_DATE";
        break;
      case 'semana':
        intervalo = "a.data_hora >= NOW() - INTERVAL '7 days'";
        break;
      case 'mes':
      default:
        intervalo = "a.data_hora >= NOW() - INTERVAL '30 days'";
    }

    const baseQuery = `
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      WHERE p.clinica_id = $1 AND ${intervalo}
    `;

    const totalRow = await this.db.get(
      `SELECT COUNT(*) as count ${baseQuery}`,
      [clinicaId]
    );
    const total = parseInt(totalRow.count, 10);

    const realizadosRow = await this.db.get(
      `SELECT COUNT(*) as count ${baseQuery} AND a.status = 'realizado'`,
      [clinicaId]
    );
    const realizados = parseInt(realizadosRow.count, 10);

    const canceladosRow = await this.db.get(
      `SELECT COUNT(*) as count ${baseQuery} AND a.status = 'cancelado'`,
      [clinicaId]
    );
    const cancelados = parseInt(canceladosRow.count, 10);

    const confirmadosRow = await this.db.get(
      `SELECT COUNT(*) as count ${baseQuery} AND a.status = 'confirmado'`,
      [clinicaId]
    );
    const confirmados = parseInt(confirmadosRow.count, 10);

    return {
      total,
      realizados,
      cancelados,
      confirmados,
      pendentes: total - realizados - cancelados - confirmados,
      taxaRealizacao: total > 0 ? ((realizados / total) * 100).toFixed(1) : 0,
      taxaCancelamento: total > 0 ? ((cancelados / total) * 100).toFixed(1) : 0
    };
  }
}

module.exports = AgendamentoModel;
