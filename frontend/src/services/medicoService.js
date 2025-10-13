import api from './api';

/**
 * Serviço para gerenciar profissionais médicos
 * Fornece operações CRUD e utilitários para médicos
 */
class MedicoService {
  
  /**
   * Buscar todos os médicos com filtros opcionais
   * @param {Object} filtros - Filtros de busca
   * @param {string} filtros.nome - Filtrar por nome
   * @param {string} filtros.especialidade - Filtrar por especialidade
   * @param {string} filtros.crm - Filtrar por CRM
   * @param {string} filtros.status - Filtrar por status (ativo/inativo)
   * @param {number} filtros.page - Página atual (padrão: 1)
   * @param {number} filtros.limit - Itens por página (padrão: 10)
   * @returns {Promise<Object>} Lista de médicos com paginação
   */
  async buscarMedicos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.especialidade) params.append('especialidade', filtros.especialidade);
      if (filtros.crm) params.append('crm', filtros.crm);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.limit) params.append('limit', filtros.limit);

      const response = await api.get(`/medicos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      throw new Error('Falha ao carregar médicos');
    }
  }

  /**
   * Buscar médico por ID
   * @param {number} id - ID do médico
   * @returns {Promise<Object>} Dados do médico
   */
  async buscarMedicoPorId(id) {
    try {
      const response = await api.get(`/medicos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar médico:', error);
      throw new Error('Médico não encontrado');
    }
  }

  /**
   * Criar novo médico
   * @param {Object} dadosMedico - Dados do médico
   * @returns {Promise<Object>} Médico criado
   */
  async criarMedico(dadosMedico) {
    try {
      // Validar dados antes de enviar
      this.validarDadosMedico(dadosMedico);
      
      // Formatar dados
      const dadosFormatados = this.formatarDadosMedico(dadosMedico);
      
      const response = await api.post('/medicos', dadosFormatados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      if (error.response?.status === 409) {
        throw new Error('CRM já cadastrado no sistema');
      }
      throw new Error(error.message || 'Falha ao cadastrar médico');
    }
  }

  /**
   * Atualizar médico existente
   * @param {number} id - ID do médico
   * @param {Object} dadosMedico - Dados atualizados
   * @returns {Promise<Object>} Médico atualizado
   */
  async atualizarMedico(id, dadosMedico) {
    try {
      this.validarDadosMedico(dadosMedico);
      const dadosFormatados = this.formatarDadosMedico(dadosMedico);
      
      const response = await api.put(`/medicos/${id}`, dadosFormatados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      if (error.response?.status === 409) {
        throw new Error('CRM já cadastrado para outro médico');
      }
      throw new Error(error.message || 'Falha ao atualizar médico');
    }
  }

  /**
   * Excluir médico
   * @param {number} id - ID do médico
   * @returns {Promise<void>}
   */
  async excluirMedico(id) {
    try {
      await api.delete(`/medicos/${id}`);
    } catch (error) {
      console.error('Erro ao excluir médico:', error);
      if (error.response?.status === 409) {
        throw new Error('Não é possível excluir médico com agendamentos');
      }
      throw new Error('Falha ao excluir médico');
    }
  }

  /**
   * Ativar/Desativar médico
   * @param {number} id - ID do médico
   * @param {boolean} ativo - Status ativo/inativo
   * @returns {Promise<Object>} Médico atualizado
   */
  async alterarStatusMedico(id, ativo) {
    try {
      console.log('🩺 MedicoService: alterarStatusMedico called with id:', id, 'ativo:', ativo);
      const url = `/professional/medico/${id}/status`;  // Remover /api pois já está no baseURL
      console.log('🩺 MedicoService: URL:', url);
      const response = await api.patch(url, { ativo });
      return response.data;
    } catch (error) {
      console.error('🩺 MedicoService: Erro ao alterar status do médico:', error);
      console.error('🩺 MedicoService: Error response:', error.response?.data);
      throw new Error('Falha ao alterar status do médico');
    }
  }

  /**
   * Buscar médicos por especialidade
   * @param {string} especialidade - Nome da especialidade
   * @returns {Promise<Array>} Lista de médicos da especialidade
   */
  async buscarMedicosPorEspecialidade(especialidade) {
    try {
      const response = await api.get(`/medicos/especialidade/${encodeURIComponent(especialidade)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar médicos por especialidade:', error);
      throw new Error('Falha ao buscar médicos da especialidade');
    }
  }

  /**
   * Buscar agenda de um médico
   * @param {number} medicoId - ID do médico
   * @param {string} dataInicio - Data início (YYYY-MM-DD)
   * @param {string} dataFim - Data fim (YYYY-MM-DD)
   * @returns {Promise<Array>} Agendamentos do médico
   */
  async buscarAgendaMedico(medicoId, dataInicio, dataFim) {
    try {
      const params = new URLSearchParams({
        dataInicio,
        dataFim
      });
      
      const response = await api.get(`/medicos/${medicoId}/agenda?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar agenda do médico:', error);
      throw new Error('Falha ao carregar agenda do médico');
    }
  }

  /**
   * Validar dados do médico
   * @param {Object} dados - Dados a serem validados
   */
  validarDadosMedico(dados) {
    const erros = [];

    // Nome obrigatório
    if (!dados.nome?.trim()) {
      erros.push('Nome é obrigatório');
    } else if (dados.nome.trim().length < 2) {
      erros.push('Nome deve ter pelo menos 2 caracteres');
    }

    // CRM obrigatório e válido
    if (!dados.crm?.trim()) {
      erros.push('CRM é obrigatório');
    } else if (!this.validarCRM(dados.crm)) {
      erros.push('CRM inválido');
    }

    // Especialidade obrigatória
    if (!dados.especialidade?.trim()) {
      erros.push('Especialidade é obrigatória');
    }

    // Telefone obrigatório e válido
    if (!dados.telefone?.trim()) {
      erros.push('Telefone é obrigatório');
    } else if (!this.validarTelefone(dados.telefone)) {
      erros.push('Telefone inválido');
    }

    // Email válido se informado
    if (dados.email && !this.validarEmail(dados.email)) {
      erros.push('Email inválido');
    }

    if (erros.length > 0) {
      throw new Error(erros.join(', '));
    }
  }

  /**
   * Formatar dados do médico para envio
   * @param {Object} dados - Dados a serem formatados
   * @returns {Object} Dados formatados
   */
  formatarDadosMedico(dados) {
    return {
      nome: dados.nome?.trim(),
      crm: dados.crm?.trim().toUpperCase(),
      especialidade: dados.especialidade?.trim(),
      telefone: this.formatarTelefone(dados.telefone),
      email: dados.email?.trim().toLowerCase() || null,
      observacoes: dados.observacoes?.trim() || null
    };
  }

  /**
   * Validar formato do CRM
   * @param {string} crm - CRM a ser validado
   * @returns {boolean} True se válido
   */
  validarCRM(crm) {
    if (!crm) return false;
    
    // Remover espaços e normalizar
    const crmLimpo = crm.trim().toUpperCase();
    
    // Formato: CRM/UF NNNNNN ou CRM-UF NNNNNN
    const regexCRM = /^CRM[/-]?[A-Z]{2}\s?\d{4,6}$/;
    
    return regexCRM.test(crmLimpo);
  }

  /**
   * Validar telefone
   * @param {string} telefone - Telefone a ser validado
   * @returns {boolean} True se válido
   */
  validarTelefone(telefone) {
    if (!telefone) return false;
    
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Aceitar celular (11 dígitos) ou fixo (10 dígitos)
    return numeroLimpo.length === 10 || numeroLimpo.length === 11;
  }

  /**
   * Validar email
   * @param {string} email - Email a ser validado
   * @returns {boolean} True se válido
   */
  validarEmail(email) {
    if (!email) return true; // Email é opcional
    
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
  }

  /**
   * Formatar telefone para exibição
   * @param {string} telefone - Telefone a ser formatado
   * @returns {string} Telefone formatado
   */
  formatarTelefone(telefone) {
    if (!telefone) return '';
    
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    if (numeroLimpo.length === 10) {
      // Telefone fixo: (11) 1234-5678
      return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 6)}-${numeroLimpo.slice(6)}`;
    } else if (numeroLimpo.length === 11) {
      // Celular: (11) 91234-5678
      return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7)}`;
    }
    
    return telefone;
  }

  /**
   * Formatar CRM para exibição
   * @param {string} crm - CRM a ser formatado
   * @returns {string} CRM formatado
   */
  formatarCRM(crm) {
    if (!crm) return '';
    
    const crmLimpo = crm.trim().toUpperCase();
    
    // Se já estiver formatado, retornar como está
    if (crmLimpo.includes('/') || crmLimpo.includes('-')) {
      return crmLimpo;
    }
    
    // Tentar extrair UF e número do CRM
    const match = crmLimpo.match(/^CRM([A-Z]{2})(\d+)$/);
    if (match) {
      return `CRM/${match[1]} ${match[2]}`;
    }
    
    return crmLimpo;
  }

  /**
   * Obter iniciais do nome para avatar
   * @param {string} nome - Nome completo
   * @returns {string} Iniciais (máximo 2 caracteres)
   */
  obterIniciais(nome) {
    if (!nome) return '';
    
    return nome
      .trim()
      .split(' ')
      .filter(parte => parte.length > 0)
      .map(parte => parte.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Buscar estatísticas dos médicos
   * @returns {Promise<Object>} Estatísticas gerais
   */
  async buscarEstatisticas() {
    try {
      const response = await api.get('/medicos/estatisticas');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Falha ao carregar estatísticas');
    }
  }

  /**
   * Lista de especialidades disponíveis
   * @returns {Array<string>} Lista de especialidades
   */
  obterEspecialidades() {
    return [
      'Cardiologia',
      'Dermatologia',
      'Endocrinologia',
      'Gastroenterologia',
      'Ginecologia',
      'Neurologia',
      'Oftalmologia',
      'Ortopedia',
      'Otorrinolaringologia',
      'Pediatria',
      'Psiquiatria',
      'Radiologia',
      'Urologia',
      'Anestesiologia',
      'Cirurgia Geral',
      'Clínica Geral',
      'Fisioterapia',
      'Nutrição',
      'Psicologia'
    ];
  }
}

// Instância do serviço
const medicoService = new MedicoService();

export default medicoService;