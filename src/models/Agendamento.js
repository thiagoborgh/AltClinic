const dbManager = require('./database');

class AgendamentoModel {
  constructor() {
    this.db = dbManager.getDb();
  }

  /**
   * Cria um novo agendamento
   * @param {Object} agendamentoData - Dados do agendamento
   * @returns {Object} - Agendamento criado
   */
  create(agendamentoData) {
    const { 
      paciente_id, 
      procedimento_id, 
      equipamento_id, 
      data_hora, 
      sessao_numero = 1, 
      observacoes 
    } = agendamentoData;
    
    try {
      const result = this.db.prepare(`
        INSERT INTO agendamento (paciente_id, procedimento_id, equipamento_id, data_hora, sessao_numero, observacoes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(paciente_id, procedimento_id, equipamento_id, data_hora, sessao_numero, observacoes);
      
      return this.findById(result.lastInsertRowid);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca agendamento por ID
   * @param {number} id - ID do agendamento
   * @returns {Object|null} - Agendamento encontrado
   */
  findById(id) {
    return this.db.prepare(`
      SELECT a.*, 
             p.nome as paciente_nome, p.telefone as paciente_telefone,
             proc.nome as procedimento_nome, proc.duracao_minutos, proc.preco, proc.preparo_texto,
             e.nome as equipamento_nome, e.capacidade
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
      LEFT JOIN equipamento e ON a.equipamento_id = e.id
      WHERE a.id = ?
    `).get(id);
  }

  /**
   * Lista agendamentos por data
   * @param {number} clinicaId - ID da clínica
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Array} - Lista de agendamentos
   */
  findByData(clinicaId, data) {
    return this.db.prepare(`
      SELECT a.*, 
             p.nome as paciente_nome, p.telefone as paciente_telefone,
             proc.nome as procedimento_nome, proc.duracao_minutos,
             e.nome as equipamento_nome
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
      LEFT JOIN equipamento e ON a.equipamento_id = e.id
      WHERE p.clinica_id = ?
        AND DATE(a.data_hora) = ?
        AND a.status != 'cancelado'
      ORDER BY a.data_hora
    `).all(clinicaId, data);
  }

  /**
   * Lista agendamentos por período
   * @param {number} clinicaId - ID da clínica
   * @param {string} dataInicio - Data inicial
   * @param {string} dataFim - Data final
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} - Lista de agendamentos
   */
  findByPeriodo(clinicaId, dataInicio, dataFim, filters = {}) {
    let query = `
      SELECT a.*, 
             p.nome as paciente_nome, p.telefone as paciente_telefone,
             proc.nome as procedimento_nome, proc.duracao_minutos,
             e.nome as equipamento_nome
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
      LEFT JOIN equipamento e ON a.equipamento_id = e.id
      WHERE p.clinica_id = ?
        AND a.data_hora >= ?
        AND a.data_hora <= ?
    `;
    
    const params = [clinicaId, dataInicio, dataFim];
    
    // Filtro por status
    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }
    
    // Filtro por equipamento
    if (filters.equipamento_id) {
      query += ' AND a.equipamento_id = ?';
      params.push(filters.equipamento_id);
    }
    
    // Filtro por procedimento
    if (filters.procedimento_id) {
      query += ' AND a.procedimento_id = ?';
      params.push(filters.procedimento_id);
    }
    
    query += ' ORDER BY a.data_hora';
    
    return this.db.prepare(query).all(...params);
  }

  /**
   * Verifica disponibilidade de horário e equipamento
   * @param {number} equipamento_id - ID do equipamento
   * @param {string} data_hora - Data e hora desejada
   * @param {number} duracao_minutos - Duração do procedimento
   * @param {number} agendamento_id - ID do agendamento (para edição)
   * @returns {Object} - Resultado da verificação
   */
  verificarDisponibilidade(equipamento_id, data_hora, duracao_minutos, agendamento_id = null) {
    // Buscar capacidade do equipamento
    const equipamento = this.db.prepare('SELECT capacidade FROM equipamento WHERE id = ?').get(equipamento_id);
    
    if (!equipamento) {
      return { disponivel: false, motivo: 'Equipamento não encontrado' };
    }
    
    const dataHoraObj = new Date(data_hora);
    const dataHoraFim = new Date(dataHoraObj.getTime() + (duracao_minutos * 60000));
    
    // Verificar agendamentos conflitantes
    let query = `
      SELECT COUNT(*) as conflitos
      FROM agendamento a
      LEFT JOIN procedimento p ON a.procedimento_id = p.id
      WHERE a.equipamento_id = ?
        AND a.status IN ('agendado', 'confirmado')
        AND (
          (a.data_hora < ? AND datetime(a.data_hora, '+' || p.duracao_minutos || ' minutes') > ?)
          OR (a.data_hora >= ? AND a.data_hora < ?)
        )
    `;
    
    const params = [equipamento_id, dataHoraFim.toISOString(), data_hora, data_hora, dataHoraFim.toISOString()];
    
    // Excluir o próprio agendamento se estiver editando
    if (agendamento_id) {
      query += ' AND a.id != ?';
      params.push(agendamento_id);
    }
    
    const conflitos = this.db.prepare(query).get(...params).conflitos;
    
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
  updateStatus(id, status, observacoes = null) {
    const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    
    if (observacoes) {
      updates.push('observacoes = ?');
      params.push(observacoes);
    }
    
    params.push(id);
    
    this.db.prepare(`
      UPDATE agendamento
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);
    
    return this.findById(id);
  }

  /**
   * Atualiza dados do agendamento
   * @param {number} id - ID do agendamento
   * @param {Object} agendamentoData - Dados para atualizar
   * @returns {Object} - Agendamento atualizado
   */
  update(id, agendamentoData) {
    const { data_hora, procedimento_id, equipamento_id, observacoes } = agendamentoData;
    const updates = [];
    const values = [];
    
    if (data_hora) {
      updates.push('data_hora = ?');
      values.push(data_hora);
    }
    
    if (procedimento_id) {
      updates.push('procedimento_id = ?');
      values.push(procedimento_id);
    }
    
    if (equipamento_id) {
      updates.push('equipamento_id = ?');
      values.push(equipamento_id);
    }
    
    if (observacoes !== undefined) {
      updates.push('observacoes = ?');
      values.push(observacoes);
    }
    
    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    this.db.prepare(`
      UPDATE agendamento
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.findById(id);
  }

  /**
   * Remove agendamento
   * @param {number} id - ID do agendamento
   * @returns {boolean} - True se removido
   */
  delete(id) {
    const result = this.db.prepare('DELETE FROM agendamento WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Busca agendamentos para confirmação (próximas 24h)
   * @param {number} clinicaId - ID da clínica
   * @returns {Array} - Agendamentos para confirmar
   */
  findParaConfirmacao(clinicaId) {
    return this.db.prepare(`
      SELECT a.*, 
             p.nome as paciente_nome, p.telefone as paciente_telefone,
             proc.nome as procedimento_nome
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
      WHERE p.clinica_id = ?
        AND a.status = 'agendado'
        AND a.data_hora BETWEEN datetime('now') AND datetime('now', '+24 hours')
      ORDER BY a.data_hora
    `).all(clinicaId);
  }

  /**
   * Busca agendamentos para lembrete (próximas 2-4h)
   * @param {number} clinicaId - ID da clínica
   * @returns {Array} - Agendamentos para lembrete
   */
  findParaLembrete(clinicaId) {
    return this.db.prepare(`
      SELECT a.*, 
             p.nome as paciente_nome, p.telefone as paciente_telefone,
             proc.nome as procedimento_nome, proc.preparo_texto
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
      WHERE p.clinica_id = ?
        AND a.status IN ('agendado', 'confirmado')
        AND a.data_hora BETWEEN datetime('now', '+2 hours') AND datetime('now', '+4 hours')
      ORDER BY a.data_hora
    `).all(clinicaId);
  }

  /**
   * Estatísticas de agendamentos
   * @param {number} clinicaId - ID da clínica
   * @param {string} periodo - Período de análise ('hoje', 'semana', 'mes')
   * @returns {Object} - Estatísticas
   */
  getEstatisticas(clinicaId, periodo = 'mes') {
    let dataInicio;
    
    switch (periodo) {
      case 'hoje':
        dataInicio = "date('now')";
        break;
      case 'semana':
        dataInicio = "date('now', '-7 days')";
        break;
      case 'mes':
        dataInicio = "date('now', '-30 days')";
        break;
      default:
        dataInicio = "date('now', '-30 days')";
    }
    
    const total = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      WHERE p.clinica_id = ? AND DATE(a.data_hora) >= ${dataInicio}
    `).get(clinicaId).count;
    
    const realizados = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      WHERE p.clinica_id = ? AND a.status = 'realizado' AND DATE(a.data_hora) >= ${dataInicio}
    `).get(clinicaId).count;
    
    const cancelados = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      WHERE p.clinica_id = ? AND a.status = 'cancelado' AND DATE(a.data_hora) >= ${dataInicio}
    `).get(clinicaId).count;
    
    const confirmados = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      WHERE p.clinica_id = ? AND a.status = 'confirmado' AND DATE(a.data_hora) >= ${dataInicio}
    `).get(clinicaId).count;
    
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

module.exports = new AgendamentoModel();
