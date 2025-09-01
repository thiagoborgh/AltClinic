const dbManager = require('./database');
const { format, parseISO, differenceInYears, startOfMonth, endOfMonth } = require('date-fns');

class PacienteModel {
  constructor(db = null) {
    this.db = db || dbManager.getDb();
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
   * Lista pacientes com filtros e paginação (Novo método para o frontend)
   * @param {Object} options - Opções de busca
   * @returns {Object} - Lista de pacientes e total
   */
  async listar(options = {}) {
    const {
      search,
      status = 'ativo',
      limit = 50,
      offset = 0,
      orderBy = 'nome',
      order = 'ASC'
    } = options;

    let query = `
      SELECT 
        id,
        nome as nomeCompleto,
        email,
        telefone,
        cpf,
        data_nascimento as dataNascimento,
        endereco_completo as endereco,
        estado_civil as estadoCivil,
        profissao,
        convenio_nome as convenio,
        observacoes,
        created_at as criadoEm,
        ultimo_atendimento as ultimoAtendimento,
        CASE 
          WHEN ultimo_atendimento > datetime('now', '-90 days') THEN 'ativo'
          ELSE 'inativo'
        END as status,
        CASE 
          WHEN EXISTS(SELECT 1 FROM prontuario WHERE paciente_id = paciente.id) THEN 1
          ELSE 0
        END as temProntuario
      FROM paciente
      WHERE 1=1
    `;

    const params = [];

    // Filtro de busca
    if (search) {
      query += ` AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ? OR cpf LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtro de status
    if (status !== 'todos') {
      if (status === 'ativo') {
        query += ` AND ultimo_atendimento > datetime('now', '-90 days')`;
      } else if (status === 'inativo') {
        query += ` AND (ultimo_atendimento IS NULL OR ultimo_atendimento <= datetime('now', '-90 days'))`;
      }
    }

    // Ordem
    const validOrderBy = ['nome', 'email', 'created_at', 'ultimo_atendimento'];
    const validOrder = ['ASC', 'DESC'];
    
    if (validOrderBy.includes(orderBy) && validOrder.includes(order.toUpperCase())) {
      query += ` ORDER BY ${orderBy} ${order.toUpperCase()}`;
    } else {
      query += ` ORDER BY nome ASC`;
    }

    // Paginação
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
      const pacientes = this.db.prepare(query).all(...params);
      
      // Contar total
      let countQuery = `
        SELECT COUNT(*) as total
        FROM paciente
        WHERE 1=1
      `;
      
      const countParams = [];
      
      if (search) {
        countQuery += ` AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ? OR cpf LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status !== 'todos') {
        if (status === 'ativo') {
          countQuery += ` AND ultimo_atendimento > datetime('now', '-90 days')`;
        } else if (status === 'inativo') {
          countQuery += ` AND (ultimo_atendimento IS NULL OR ultimo_atendimento <= datetime('now', '-90 days'))`;
        }
      }

      const total = this.db.prepare(countQuery).get(...countParams).total;

      // Processar dados dos pacientes
      const pacientesProcessados = pacientes.map(p => ({
        ...p,
        idade: p.dataNascimento ? differenceInYears(new Date(), parseISO(p.dataNascimento)) : null,
        endereco: p.endereco ? JSON.parse(p.endereco) : null,
        convenio: p.convenio ? JSON.parse(p.convenio) : null
      }));

      return {
        pacientes: pacientesProcessados,
        total
      };
    } catch (error) {
      console.error('Erro ao listar pacientes:', error);
      throw error;
    }
  }

  /**
   * Busca paciente por ID (Atualizado para o frontend)
   * @param {string} id - ID do paciente
   * @returns {Object|null} - Paciente encontrado
   */
  async buscarPorId(id) {
    try {
      const query = `
        SELECT 
          id,
          nome as nomeCompleto,
          email,
          telefone,
          cpf,
          data_nascimento as dataNascimento,
          endereco_completo as endereco,
          estado_civil as estadoCivil,
          profissao,
          convenio_nome as convenio,
          observacoes,
          created_at as criadoEm,
          ultimo_atendimento as ultimoAtendimento,
          CASE 
            WHEN ultimo_atendimento > datetime('now', '-90 days') THEN 'ativo'
            ELSE 'inativo'
          END as status
        FROM paciente
        WHERE id = ?
      `;

      const paciente = this.db.prepare(query).get(id);
      
      if (!paciente) return null;

      return {
        ...paciente,
        idade: paciente.dataNascimento ? differenceInYears(new Date(), parseISO(paciente.dataNascimento)) : null,
        endereco: paciente.endereco ? JSON.parse(paciente.endereco) : null,
        convenio: paciente.convenio ? JSON.parse(paciente.convenio) : null
      };
    } catch (error) {
      console.error('Erro ao buscar paciente por ID:', error);
      throw error;
    }
  }

  /**
   * Busca paciente por CPF
   * @param {string} cpf - CPF do paciente
   * @returns {Object|null} - Paciente encontrado
   */
  async buscarPorCpf(cpf) {
    try {
      const query = `
        SELECT id, nome, cpf, email
        FROM paciente
        WHERE cpf = ?
      `;

      return this.db.prepare(query).get(cpf);
    } catch (error) {
      console.error('Erro ao buscar paciente por CPF:', error);
      throw error;
    }
  }

  /**
   * Cria novo paciente (Atualizado para o frontend)
   * @param {Object} dadosPaciente - Dados do paciente
   * @returns {Object} - Paciente criado
   */
  async criar(dadosPaciente) {
    try {
      const {
        nome,
        email,
        telefone,
        cpf,
        dataNascimento,
        endereco,
        estadoCivil,
        profissao,
        convenio,
        observacoes,
        tenant_id,
        criado_por
      } = dadosPaciente;

      const query = `
        INSERT INTO paciente (
          nome,
          email,
          telefone,
          cpf,
          data_nascimento,
          endereco_completo,
          estado_civil,
          profissao,
          convenio_nome,
          observacoes,
          tenant_id,
          criado_por,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;

      const result = this.db.prepare(query).run(
        nome,
        email,
        telefone,
        cpf,
        dataNascimento,
        endereco ? JSON.stringify(endereco) : null,
        estadoCivil,
        profissao,
        convenio ? JSON.stringify(convenio) : null,
        observacoes,
        tenant_id,
        criado_por
      );

      return await this.buscarPorId(result.lastInsertRowid);
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  }

  /**
   * Atualiza paciente
   * @param {string} id - ID do paciente
   * @param {Object} dadosAtualizacao - Dados para atualização
   * @returns {Object} - Paciente atualizado
   */
  async atualizar(id, dadosAtualizacao) {
    try {
      const {
        nome,
        email,
        telefone,
        cpf,
        dataNascimento,
        endereco,
        estadoCivil,
        profissao,
        convenio,
        observacoes,
        atualizado_por
      } = dadosAtualizacao;

      const query = `
        UPDATE paciente SET
          nome = ?,
          email = ?,
          telefone = ?,
          cpf = ?,
          data_nascimento = ?,
          endereco_completo = ?,
          estado_civil = ?,
          profissao = ?,
          convenio_nome = ?,
          observacoes = ?,
          atualizado_por = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `;

      this.db.prepare(query).run(
        nome,
        email,
        telefone,
        cpf,
        dataNascimento,
        endereco ? JSON.stringify(endereco) : null,
        estadoCivil,
        profissao,
        convenio ? JSON.stringify(convenio) : null,
        observacoes,
        atualizado_por,
        id
      );

      return await this.buscarPorId(id);
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  }

  /**
   * Remove paciente (soft delete)
   * @param {string} id - ID do paciente
   * @param {string} removido_por - ID do usuário que removeu
   * @returns {boolean} - True se removido
   */
  async remover(id, removido_por) {
    try {
      const query = `
        UPDATE paciente SET
          ativo = 0,
          removido_por = ?,
          removido_em = datetime('now')
        WHERE id = ?
      `;

      const result = this.db.prepare(query).run(removido_por, id);
      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao remover paciente:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos pacientes
   * @returns {Object} - Estatísticas
   */
  async obterEstatisticas() {
    try {
      const now = new Date();
      const inicioMes = startOfMonth(now);
      const fimMes = endOfMonth(now);

      // Total de pacientes ativos
      const total = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM paciente 
        WHERE ativo = 1
      `).get().count;

      // Pacientes ativos (com atendimento nos últimos 90 dias)
      const ativos = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM paciente 
        WHERE ativo = 1 
          AND ultimo_atendimento > datetime('now', '-90 days')
      `).get().count;

      // Pacientes inativos
      const inativos = total - ativos;

      // Pacientes com prontuário
      const comProntuario = this.db.prepare(`
        SELECT COUNT(DISTINCT p.id) as count 
        FROM paciente p
        INNER JOIN prontuario pr ON p.id = pr.paciente_id
        WHERE p.ativo = 1
      `).get().count;

      // Novos pacientes este mês
      const novosEsseMes = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM paciente 
        WHERE ativo = 1 
          AND created_at >= datetime('now', 'start of month')
      `).get().count;

      // Atendimentos hoje
      const atendimentosHoje = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM agendamento 
        WHERE DATE(data_hora) = DATE('now')
          AND status = 'agendado'
      `).get().count;

      return {
        total,
        ativos,
        inativos,
        comProntuario,
        novosEsseMes,
        atendimentosHoje
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        comProntuario: 0,
        novosEsseMes: 0,
        atendimentosHoje: 0
      };
    }
  }

  /**
   * Obtém prontuário do paciente
   * @param {string} pacienteId - ID do paciente
   * @returns {Object} - Prontuário
   */
  async obterProntuario(pacienteId) {
    try {
      const query = `
        SELECT 
          pr.*,
          p.nome as paciente_nome
        FROM prontuario pr
        INNER JOIN paciente p ON pr.paciente_id = p.id
        WHERE pr.paciente_id = ?
        ORDER BY pr.created_at DESC
        LIMIT 1
      `;

      return this.db.prepare(query).get(pacienteId);
    } catch (error) {
      console.error('Erro ao obter prontuário:', error);
      return null;
    }
  }

  /**
   * Cria novo atendimento
   * @param {Object} dadosAtendimento - Dados do atendimento
   * @returns {Object} - Atendimento criado
   */
  async criarAtendimento(dadosAtendimento) {
    try {
      const {
        paciente_id,
        tipo,
        descricao,
        observacoes,
        realizado_por
      } = dadosAtendimento;

      const query = `
        INSERT INTO atendimento (
          paciente_id,
          tipo,
          descricao,
          observacoes,
          realizado_por,
          realizado_em
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `;

      const result = this.db.prepare(query).run(
        paciente_id,
        tipo,
        descricao,
        observacoes,
        realizado_por
      );

      // Atualizar último atendimento do paciente
      this.db.prepare(`
        UPDATE paciente 
        SET ultimo_atendimento = datetime('now')
        WHERE id = ?
      `).run(paciente_id);

      return {
        id: result.lastInsertRowid,
        ...dadosAtendimento,
        realizado_em: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao criar atendimento:', error);
      throw error;
    }
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

module.exports = PacienteModel;
