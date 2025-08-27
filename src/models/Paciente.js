const dbManager = require('./database');

class PacienteModel {
  constructor() {
    this.db = dbManager.getDb();
  }

  /**
   * Cria um novo paciente
   * @param {Object} pacienteData - Dados do paciente
   * @returns {Object} - Paciente criado
   */
  create(pacienteData) {
    const { clinica_id, nome, telefone, email } = pacienteData;
    
    try {
      const result = this.db.prepare(`
        INSERT INTO paciente (clinica_id, nome, telefone, email)
        VALUES (?, ?, ?, ?)
      `).run(clinica_id, nome, telefone, email);
      
      return this.findById(result.lastInsertRowid);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca paciente por ID
   * @param {number} id - ID do paciente
   * @returns {Object|null} - Paciente encontrado
   */
  findById(id) {
    return this.db.prepare(`
      SELECT p.*, c.nome as clinica_nome,
             (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id) as total_agendamentos,
             (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id AND status = 'realizado') as agendamentos_realizados
      FROM paciente p
      LEFT JOIN clinica c ON p.clinica_id = c.id
      WHERE p.id = ?
    `).get(id);
  }

  /**
   * Busca paciente por telefone
   * @param {string} telefone - Telefone do paciente
   * @param {number} clinicaId - ID da clínica
   * @returns {Object|null} - Paciente encontrado
   */
  findByTelefone(telefone, clinicaId) {
    return this.db.prepare(`
      SELECT * FROM paciente
      WHERE telefone = ? AND clinica_id = ?
    `).get(telefone, clinicaId);
  }

  /**
   * Lista pacientes de uma clínica
   * @param {number} clinicaId - ID da clínica
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} - Lista de pacientes
   */
  findByClinica(clinicaId, filters = {}) {
    let query = `
      SELECT p.*,
             (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id) as total_agendamentos,
             (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id AND status = 'realizado') as agendamentos_realizados
      FROM paciente p
      WHERE p.clinica_id = ?
    `;
    
    const params = [clinicaId];
    
    // Filtro por nome
    if (filters.nome) {
      query += ' AND p.nome LIKE ?';
      params.push(`%${filters.nome}%`);
    }
    
    // Filtro por telefone
    if (filters.telefone) {
      query += ' AND p.telefone LIKE ?';
      params.push(`%${filters.telefone}%`);
    }
    
    // Filtro por pacientes inativos
    if (filters.inativos) {
      const diasInativo = filters.diasInativo || 90;
      query += ` AND (p.ultimo_atendimento IS NULL OR p.ultimo_atendimento < datetime('now', '-${diasInativo} days'))`;
    }
    
    query += ' ORDER BY p.nome';
    
    // Paginação
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    return this.db.prepare(query).all(...params);
  }

  /**
   * Busca pacientes inativos
   * @param {number} clinicaId - ID da clínica
   * @param {number} diasInativo - Dias para considerar inativo
   * @returns {Array} - Lista de pacientes inativos
   */
  findInativos(clinicaId, diasInativo = 90) {
    return this.db.prepare(`
      SELECT p.*, 
             julianday('now') - julianday(p.ultimo_atendimento) as dias_sem_atendimento,
             (SELECT data_envio FROM mensagem_crm 
              WHERE paciente_id = p.id AND tipo = 'inativo' 
              ORDER BY data_envio DESC LIMIT 1) as ultima_mensagem_inativo
      FROM paciente p
      WHERE p.clinica_id = ?
        AND (p.ultimo_atendimento IS NULL OR p.ultimo_atendimento < datetime('now', '-${diasInativo} days'))
        AND p.id NOT IN (
          SELECT paciente_id FROM mensagem_crm 
          WHERE tipo = 'inativo' 
            AND data_envio > datetime('now', '-30 days')
        )
      ORDER BY p.ultimo_atendimento ASC
    `).all(clinicaId);
  }

  /**
   * Atualiza dados do paciente
   * @param {number} id - ID do paciente
   * @param {Object} pacienteData - Dados para atualizar
   * @returns {Object} - Paciente atualizado
   */
  update(id, pacienteData) {
    const { nome, telefone, email, ultimo_atendimento } = pacienteData;
    const updates = [];
    const values = [];
    
    if (nome) {
      updates.push('nome = ?');
      values.push(nome);
    }
    
    if (telefone) {
      updates.push('telefone = ?');
      values.push(telefone);
    }
    
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (ultimo_atendimento) {
      updates.push('ultimo_atendimento = ?');
      values.push(ultimo_atendimento);
    }
    
    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    this.db.prepare(`
      UPDATE paciente
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.findById(id);
  }

  /**
   * Atualiza data do último atendimento
   * @param {number} id - ID do paciente
   * @param {string} dataAtendimento - Data do atendimento
   * @returns {boolean} - True se atualizado
   */
  updateUltimoAtendimento(id, dataAtendimento = null) {
    const data = dataAtendimento || new Date().toISOString();
    
    const result = this.db.prepare(`
      UPDATE paciente
      SET ultimo_atendimento = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data, id);
    
    return result.changes > 0;
  }

  /**
   * Remove paciente
   * @param {number} id - ID do paciente
   * @returns {boolean} - True se removido
   */
  delete(id) {
    const result = this.db.prepare('DELETE FROM paciente WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Conta pacientes por status de atividade
   * @param {number} clinicaId - ID da clínica
   * @param {number} diasInativo - Dias para considerar inativo
   * @returns {Object} - Contadores
   */
  getStatusCounts(clinicaId, diasInativo = 90) {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM paciente WHERE clinica_id = ?').get(clinicaId).count;
    
    const ativos = this.db.prepare(`
      SELECT COUNT(*) as count FROM paciente 
      WHERE clinica_id = ? 
        AND ultimo_atendimento > datetime('now', '-${diasInativo} days')
    `).get(clinicaId).count;
    
    const inativos = total - ativos;
    
    const novos = this.db.prepare(`
      SELECT COUNT(*) as count FROM paciente 
      WHERE clinica_id = ? 
        AND created_at > datetime('now', '-30 days')
    `).get(clinicaId).count;
    
    return {
      total,
      ativos,
      inativos,
      novos
    };
  }

  /**
   * Busca histórico de agendamentos do paciente
   * @param {number} pacienteId - ID do paciente
   * @param {number} limit - Limite de resultados
   * @returns {Array} - Histórico de agendamentos
   */
  getHistoricoAgendamentos(pacienteId, limit = 10) {
    return this.db.prepare(`
      SELECT a.*, p.nome as procedimento_nome, e.nome as equipamento_nome
      FROM agendamento a
      LEFT JOIN procedimento p ON a.procedimento_id = p.id
      LEFT JOIN equipamento e ON a.equipamento_id = e.id
      WHERE a.paciente_id = ?
      ORDER BY a.data_hora DESC
      LIMIT ?
    `).all(pacienteId, limit);
  }

  /**
   * Verifica se paciente pertence à clínica
   * @param {number} pacienteId - ID do paciente
   * @param {number} clinicaId - ID da clínica
   * @returns {boolean} - True se pertence
   */
  belongsToClinica(pacienteId, clinicaId) {
    const result = this.db.prepare(`
      SELECT 1 FROM paciente
      WHERE id = ? AND clinica_id = ?
    `).get(pacienteId, clinicaId);
    
    return !!result;
  }
}

module.exports = new PacienteModel();
