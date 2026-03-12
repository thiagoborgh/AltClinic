const { format, parseISO, differenceInYears, startOfMonth, endOfMonth } = require('date-fns');

class PacienteModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Cria um novo paciente
   * @param {Object} pacienteData - Dados do paciente
   * @returns {number} - ID do paciente criado
   */
  async create(pacienteData) {
    const { tenant_id, nome, telefone, email, cpf, dataNascimento, endereco, observacoes, status } = pacienteData;

    try {
      const r = await this.db.run(
        `INSERT INTO pacientes (tenant_id, nome, telefone, email, cpf, data_nascimento, endereco, observacoes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [tenant_id, nome, telefone, email, cpf, dataNascimento, endereco || null, observacoes || null, status || 'ativo']
      );

      return r.lastID;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca paciente por ID
   * @param {number} id - ID do paciente
   * @returns {Object|null} - Paciente encontrado
   */
  async findById(id) {
    return this.db.get(
      `SELECT p.*, c.nome as clinica_nome,
              (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id) as total_agendamentos,
              (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id AND status = 'realizado') as agendamentos_realizados
       FROM paciente p
       LEFT JOIN clinica c ON p.clinica_id = c.id
       WHERE p.id = $1`,
      [id]
    );
  }

  /**
   * Busca paciente por telefone
   * @param {string} telefone - Telefone do paciente
   * @param {number} clinicaId - ID da clínica
   * @returns {Object|null} - Paciente encontrado
   */
  async findByTelefone(telefone, clinicaId) {
    return this.db.get(
      `SELECT * FROM paciente WHERE telefone = $1 AND clinica_id = $2`,
      [telefone, clinicaId]
    );
  }

  /**
   * Lista pacientes de uma clínica
   * @param {number} clinicaId - ID da clínica
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} - Lista de pacientes
   */
  async findByClinica(clinicaId, filters = {}) {
    let query = `
      SELECT p.*,
             (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id) as total_agendamentos,
             (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id AND status = 'realizado') as agendamentos_realizados
      FROM paciente p
      WHERE p.clinica_id = $1
    `;

    const params = [clinicaId];
    let idx = 2;

    if (filters.nome) {
      query += ` AND p.nome ILIKE $${idx++}`;
      params.push(`%${filters.nome}%`);
    }

    if (filters.telefone) {
      query += ` AND p.telefone ILIKE $${idx++}`;
      params.push(`%${filters.telefone}%`);
    }

    if (filters.inativos) {
      const diasInativo = filters.diasInativo || 90;
      query += ` AND (p.ultimo_atendimento IS NULL OR p.ultimo_atendimento < NOW() - INTERVAL '${diasInativo} days')`;
    }

    query += ' ORDER BY p.nome';

    if (filters.limit) {
      query += ` LIMIT $${idx++}`;
      params.push(filters.limit);

      if (filters.offset) {
        query += ` OFFSET $${idx++}`;
        params.push(filters.offset);
      }
    }

    return this.db.all(query, params);
  }

  /**
   * Busca pacientes inativos
   * @param {number} clinicaId - ID da clínica
   * @param {number} diasInativo - Dias para considerar inativo
   * @returns {Array} - Lista de pacientes inativos
   */
  async findInativos(clinicaId, diasInativo = 90) {
    return this.db.all(
      `SELECT p.*,
              EXTRACT(DAY FROM NOW() - p.ultimo_atendimento) as dias_sem_atendimento,
              (SELECT data_envio FROM mensagem_crm
               WHERE paciente_id = p.id AND tipo = 'inativo'
               ORDER BY data_envio DESC LIMIT 1) as ultima_mensagem_inativo
       FROM paciente p
       WHERE p.clinica_id = $1
         AND (p.ultimo_atendimento IS NULL OR p.ultimo_atendimento < NOW() - INTERVAL '${diasInativo} days')
         AND p.id NOT IN (
           SELECT paciente_id FROM mensagem_crm
           WHERE tipo = 'inativo'
             AND data_envio > NOW() - INTERVAL '30 days'
         )
       ORDER BY p.ultimo_atendimento ASC`,
      [clinicaId]
    );
  }

  /**
   * Atualiza dados do paciente
   * @param {number} id - ID do paciente
   * @param {Object} pacienteData - Dados para atualizar
   * @returns {Object} - Paciente atualizado
   */
  async update(id, pacienteData) {
    const { nome, telefone, email, ultimo_atendimento } = pacienteData;
    const updates = [];
    const values = [];
    let idx = 1;

    if (nome) {
      updates.push(`nome = $${idx++}`);
      values.push(nome);
    }

    if (telefone) {
      updates.push(`telefone = $${idx++}`);
      values.push(telefone);
    }

    if (email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(email);
    }

    if (ultimo_atendimento) {
      updates.push(`ultimo_atendimento = $${idx++}`);
      values.push(ultimo_atendimento);
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.db.run(
      `UPDATE paciente SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    return this.findById(id);
  }

  /**
   * Atualiza data do último atendimento
   * @param {number} id - ID do paciente
   * @param {string} dataAtendimento - Data do atendimento
   * @returns {boolean} - True se atualizado
   */
  async updateUltimoAtendimento(id, dataAtendimento = null) {
    const data = dataAtendimento || new Date().toISOString();

    const result = await this.db.run(
      `UPDATE paciente SET ultimo_atendimento = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [data, id]
    );

    return result.changes > 0;
  }

  /**
   * Remove paciente
   * @param {number} id - ID do paciente
   * @returns {boolean} - True se removido
   */
  async delete(id) {
    const result = await this.db.run(
      'DELETE FROM paciente WHERE id = $1',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Conta pacientes por status de atividade
   * @param {number} clinicaId - ID da clínica
   * @param {number} diasInativo - Dias para considerar inativo
   * @returns {Object} - Contadores
   */
  async getStatusCounts(clinicaId, diasInativo = 90) {
    const totalRow = await this.db.get(
      'SELECT COUNT(*) as count FROM paciente WHERE clinica_id = $1',
      [clinicaId]
    );
    const total = parseInt(totalRow.count, 10);

    const ativosRow = await this.db.get(
      `SELECT COUNT(*) as count FROM paciente
       WHERE clinica_id = $1 AND ultimo_atendimento > NOW() - INTERVAL '${diasInativo} days'`,
      [clinicaId]
    );
    const ativos = parseInt(ativosRow.count, 10);

    const inativos = total - ativos;

    const novosRow = await this.db.get(
      `SELECT COUNT(*) as count FROM paciente
       WHERE clinica_id = $1 AND created_at > DATE_TRUNC('month', NOW())`,
      [clinicaId]
    );
    const novos = parseInt(novosRow.count, 10);

    return { total, ativos, inativos, novos };
  }

  /**
   * Busca histórico de agendamentos do paciente
   * @param {number} pacienteId - ID do paciente
   * @param {number} limit - Limite de resultados
   * @returns {Array} - Histórico de agendamentos
   */
  async getHistoricoAgendamentos(pacienteId, limit = 10) {
    return this.db.all(
      `SELECT a.*, p.nome as procedimento_nome, e.nome as equipamento_nome
       FROM agendamento a
       LEFT JOIN procedimento p ON a.procedimento_id = p.id
       LEFT JOIN equipamento e ON a.equipamento_id = e.id
       WHERE a.paciente_id = $1
       ORDER BY a.data_hora DESC
       LIMIT $2`,
      [pacienteId, limit]
    );
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
        endereco as endereco,
        observacoes,
        created_at as criadoEm,
        status
      FROM pacientes
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (nome ILIKE $${idx} OR email ILIKE $${idx} OR telefone ILIKE $${idx} OR cpf ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    if (status !== 'todos') {
      query += ` AND status = $${idx++}`;
      params.push(status);
    }

    const validOrderBy = ['nome', 'email', 'created_at'];
    const validOrder = ['ASC', 'DESC'];

    if (validOrderBy.includes(orderBy) && validOrder.includes(order.toUpperCase())) {
      query += ` ORDER BY ${orderBy} ${order.toUpperCase()}`;
    } else {
      query += ` ORDER BY nome ASC`;
    }

    query += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    try {
      const pacientes = await this.db.all(query, params);

      // Contar total
      let countQuery = `SELECT COUNT(*) as total FROM pacientes WHERE 1=1`;
      const countParams = [];
      let cidx = 1;

      if (search) {
        countQuery += ` AND (nome ILIKE $${cidx} OR email ILIKE $${cidx} OR telefone ILIKE $${cidx} OR cpf ILIKE $${cidx})`;
        countParams.push(`%${search}%`);
        cidx++;
      }

      if (status !== 'todos') {
        countQuery += ` AND status = $${cidx++}`;
        countParams.push(status);
      }

      const countRow = await this.db.get(countQuery, countParams);
      const total = parseInt(countRow.total, 10);

      const pacientesProcessados = pacientes.map(p => ({
        ...p,
        idade: p.dataNascimento ? differenceInYears(new Date(), parseISO(p.dataNascimento)) : null,
        endereco: p.endereco ? (typeof p.endereco === 'string' ? JSON.parse(p.endereco) : p.endereco) : null,
        convenio: p.convenio ? (typeof p.convenio === 'string' ? JSON.parse(p.convenio) : p.convenio) : null
      }));

      return { pacientes: pacientesProcessados, total };
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
      const paciente = await this.db.get(
        `SELECT id, nome, email, telefone, cpf, data_nascimento, endereco,
                observacoes, status, created_at, updated_at
         FROM pacientes
         WHERE id = $1`,
        [id]
      );

      if (!paciente) return null;

      return {
        ...paciente,
        nomeCompleto: paciente.nome,
        idade: paciente.data_nascimento ? differenceInYears(new Date(), new Date(paciente.data_nascimento)) : null,
        endereco: paciente.endereco ? (typeof paciente.endereco === 'string' ? JSON.parse(paciente.endereco) : paciente.endereco) : null,
        convenio: paciente.convenio ? (typeof paciente.convenio === 'string' ? JSON.parse(paciente.convenio) : paciente.convenio) : null
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
      return await this.db.get(
        `SELECT id, nome, email, telefone, cpf, data_nascimento, endereco,
                observacoes, status, created_at, updated_at
         FROM pacientes
         WHERE cpf = $1`,
        [cpf]
      );
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
        observacoes,
        tenant_id
      } = dadosPaciente;

      const r = await this.db.run(
        `INSERT INTO pacientes (nome, email, telefone, cpf, data_nascimento, endereco, observacoes, tenant_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING id`,
        [
          nome,
          email,
          telefone,
          cpf,
          dataNascimento,
          endereco ? JSON.stringify(endereco) : null,
          observacoes,
          tenant_id,
          'ativo'
        ]
      );

      return await this.buscarPorId(r.lastID);
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
      const { nome, email, telefone, cpf, dataNascimento, endereco, observacoes } = dadosAtualizacao;

      await this.db.run(
        `UPDATE pacientes SET
           nome = $1,
           email = $2,
           telefone = $3,
           cpf = $4,
           data_nascimento = $5,
           endereco = $6,
           observacoes = $7,
           updated_at = NOW()
         WHERE id = $8`,
        [
          nome,
          email,
          telefone,
          cpf,
          dataNascimento,
          endereco ? JSON.stringify(endereco) : null,
          observacoes,
          id
        ]
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
      const result = await this.db.run(
        `UPDATE paciente SET ativo = FALSE, removido_por = $1, removido_em = NOW() WHERE id = $2`,
        [removido_por, id]
      );
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
      const totalRow = await this.db.get(
        `SELECT COUNT(*) as count FROM paciente WHERE ativo = TRUE`
      );
      const total = parseInt(totalRow.count, 10);

      const ativosRow = await this.db.get(
        `SELECT COUNT(*) as count FROM paciente
         WHERE ativo = TRUE AND ultimo_atendimento > NOW() - INTERVAL '90 days'`
      );
      const ativos = parseInt(ativosRow.count, 10);

      const inativos = total - ativos;

      const comProntuarioRow = await this.db.get(
        `SELECT COUNT(DISTINCT p.id) as count
         FROM paciente p
         INNER JOIN prontuario pr ON p.id = pr.paciente_id
         WHERE p.ativo = TRUE`
      );
      const comProntuario = parseInt(comProntuarioRow.count, 10);

      const novosRow = await this.db.get(
        `SELECT COUNT(*) as count FROM paciente
         WHERE ativo = TRUE AND created_at >= DATE_TRUNC('month', NOW())`
      );
      const novosEsseMes = parseInt(novosRow.count, 10);

      const atendimentosRow = await this.db.get(
        `SELECT COUNT(*) as count FROM agendamento
         WHERE DATE(data_hora) = CURRENT_DATE AND status = 'agendado'`
      );
      const atendimentosHoje = parseInt(atendimentosRow.count, 10);

      return { total, ativos, inativos, comProntuario, novosEsseMes, atendimentosHoje };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total: 0, ativos: 0, inativos: 0, comProntuario: 0, novosEsseMes: 0, atendimentosHoje: 0 };
    }
  }

  /**
   * Obtém prontuário do paciente
   * @param {string} pacienteId - ID do paciente
   * @returns {Object} - Prontuário
   */
  async obterProntuario(pacienteId) {
    try {
      return await this.db.get(
        `SELECT pr.*, p.nome as paciente_nome
         FROM prontuario pr
         INNER JOIN paciente p ON pr.paciente_id = p.id
         WHERE pr.paciente_id = $1
         ORDER BY pr.created_at DESC
         LIMIT 1`,
        [pacienteId]
      );
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
      const { paciente_id, tipo, descricao, observacoes, realizado_por } = dadosAtendimento;

      const r = await this.db.run(
        `INSERT INTO atendimento (paciente_id, tipo, descricao, observacoes, realizado_por, realizado_em)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [paciente_id, tipo, descricao, observacoes, realizado_por]
      );

      await this.db.run(
        `UPDATE paciente SET ultimo_atendimento = NOW() WHERE id = $1`,
        [paciente_id]
      );

      return { id: r.lastID, ...dadosAtendimento, realizado_em: new Date().toISOString() };
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
  async belongsToClinica(pacienteId, clinicaId) {
    const result = await this.db.get(
      `SELECT 1 FROM paciente WHERE id = $1 AND clinica_id = $2`,
      [pacienteId, clinicaId]
    );
    return !!result;
  }
}

module.exports = PacienteModel;
