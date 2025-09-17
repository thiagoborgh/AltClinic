import api from './api';

/**
 * Serviço para gerenciar a Sala de Espera
 * Fornece operações para visualizar, filtrar e gerenciar pacientes aguardando atendimento
 */
class SalaEsperaService {

  /**
   * Buscar pacientes em espera com filtros
   * @param {Object} filtros - Filtros de busca
   * @param {string} filtros.profissionalId - ID do profissional (opcional)
   * @param {string} filtros.busca - Termo de busca (nome, procedimento)
   * @param {string} filtros.ordenacao - Campo de ordenação ('tempoEspera', 'horario', 'paciente')
   * @param {number} filtros.page - Página atual
   * @param {number} filtros.limit - Itens por página
   * @returns {Promise<Object>} Lista de pacientes em espera com paginação
   */
  async buscarPacientesEspera(filtros = {}) {
    try {
      const params = new URLSearchParams();

      if (filtros.profissionalId) params.append('profissionalId', filtros.profissionalId);
      if (filtros.busca) params.append('busca', filtros.busca);
      if (filtros.ordenacao) params.append('ordenacao', filtros.ordenacao);
      if (filtros.page) params.append('page', filtros.page);
      if (filtros.limit) params.append('limit', filtros.limit);

      const response = await api.get(`/sala-espera?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pacientes em espera:', error);
      throw new Error('Falha ao carregar sala de espera');
    }
  }

  /**
   * Iniciar atendimento de um paciente
   * @param {number} pacienteEsperaId - ID do paciente em espera
   * @param {Object} dadosAtendimento - Dados adicionais do atendimento
   * @returns {Promise<Object>} Dados do atendimento iniciado
   */
  async iniciarAtendimento(pacienteEsperaId, dadosAtendimento = {}) {
    try {
      const response = await api.post(`/sala-espera/${pacienteEsperaId}/iniciar`, dadosAtendimento);
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
      if (error.response?.status === 409) {
        throw new Error('Paciente já está em atendimento');
      }
      throw new Error('Falha ao iniciar atendimento');
    }
  }

  /**
   * Atualizar status de um paciente em espera
   * @param {number} pacienteEsperaId - ID do paciente em espera
   * @param {string} novoStatus - Novo status ('aguardando', 'em-atendimento', 'realizado', 'cancelado')
   * @param {string} observacoes - Observações sobre a mudança
   * @returns {Promise<Object>} Dados atualizados
   */
  async atualizarStatus(pacienteEsperaId, novoStatus, observacoes = '') {
    try {
      const response = await api.patch(`/sala-espera/${pacienteEsperaId}/status`, {
        status: novoStatus,
        observacoes
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw new Error('Falha ao atualizar status do paciente');
    }
  }

  /**
   * Buscar estatísticas da sala de espera
   * @param {string} profissionalId - ID do profissional (opcional)
   * @returns {Promise<Object>} Estatísticas da sala de espera
   */
  async buscarEstatisticas(profissionalId = null) {
    try {
      const params = profissionalId ? `?profissionalId=${profissionalId}` : '';
      const response = await api.get(`/sala-espera/estatisticas${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Falha ao carregar estatísticas');
    }
  }

  /**
   * Buscar alertas de espera prolongada
   * @param {number} limiteMinutos - Limite em minutos para considerar espera longa (padrão: 30)
   * @returns {Promise<Array>} Lista de alertas
   */
  async buscarAlertasEsperaLonga(limiteMinutos = 30) {
    try {
      const response = await api.get(`/sala-espera/alertas?limite=${limiteMinutos}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      throw new Error('Falha ao carregar alertas de espera');
    }
  }

  /**
   * Buscar pacientes por prioridade
   * @param {string} prioridade - Prioridade ('alta', 'normal', 'baixa')
   * @param {string} profissionalId - ID do profissional (opcional)
   * @returns {Promise<Array>} Lista de pacientes por prioridade
   */
  async buscarPorPrioridade(prioridade, profissionalId = null) {
    try {
      const params = new URLSearchParams({ prioridade });
      if (profissionalId) params.append('profissionalId', profissionalId);

      const response = await api.get(`/sala-espera/prioridade?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar por prioridade:', error);
      throw new Error('Falha ao filtrar por prioridade');
    }
  }

  /**
   * Registrar chegada de paciente
   * @param {number} agendamentoId - ID do agendamento
   * @param {Object} dadosChegada - Dados da chegada
   * @returns {Promise<Object>} Dados da chegada registrada
   */
  async registrarChegada(agendamentoId, dadosChegada = {}) {
    try {
      const response = await api.post(`/sala-espera/chegada/${agendamentoId}`, {
        horarioChegada: new Date().toISOString(),
        ...dadosChegada
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar chegada:', error);
      throw new Error('Falha ao registrar chegada do paciente');
    }
  }

  /**
   * Buscar histórico de espera de um paciente
   * @param {number} pacienteId - ID do paciente
   * @param {Object} periodo - Período para busca
   * @returns {Promise<Array>} Histórico de esperas
   */
  async buscarHistoricoEspera(pacienteId, periodo = {}) {
    try {
      const params = new URLSearchParams({ pacienteId });
      if (periodo.dataInicio) params.append('dataInicio', periodo.dataInicio);
      if (periodo.dataFim) params.append('dataFim', periodo.dataFim);

      const response = await api.get(`/sala-espera/historico?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw new Error('Falha ao carregar histórico de espera');
    }
  }

  /**
   * Calcular tempo médio de espera
   * @param {string} profissionalId - ID do profissional (opcional)
   * @param {string} periodo - Período ('hoje', 'semana', 'mes')
   * @returns {Promise<Object>} Estatísticas de tempo de espera
   */
  async calcularTempoMedioEspera(profissionalId = null, periodo = 'hoje') {
    try {
      const params = new URLSearchParams({ periodo });
      if (profissionalId) params.append('profissionalId', profissionalId);

      const response = await api.get(`/sala-espera/tempo-medio?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao calcular tempo médio:', error);
      throw new Error('Falha ao calcular tempo médio de espera');
    }
  }

  /**
   * Buscar profissionais disponíveis para filtro
   * @returns {Promise<Array>} Lista de profissionais
   */
  async buscarProfissionaisDisponiveis() {
    try {
      const response = await api.get('/sala-espera/profissionais');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      throw new Error('Falha ao carregar lista de profissionais');
    }
  }

  /**
   * Validar dados de paciente em espera
   * @param {Object} dados - Dados a serem validados
   */
  validarDadosEspera(dados) {
    const erros = [];

    if (!dados.pacienteId) {
      erros.push('ID do paciente é obrigatório');
    }

    if (!dados.profissionalId) {
      erros.push('ID do profissional é obrigatório');
    }

    if (!dados.procedimento) {
      erros.push('Procedimento é obrigatório');
    }

    if (!dados.horarioAgendado) {
      erros.push('Horário agendado é obrigatório');
    }

    // Validar status
    const statusValidos = ['aguardando', 'em-atendimento', 'realizado', 'cancelado'];
    if (dados.status && !statusValidos.includes(dados.status)) {
      erros.push('Status inválido');
    }

    // Validar prioridade
    const prioridadesValidas = ['baixa', 'normal', 'alta'];
    if (dados.prioridade && !prioridadesValidas.includes(dados.prioridade)) {
      erros.push('Prioridade inválida');
    }

    if (erros.length > 0) {
      throw new Error(erros.join(', '));
    }
  }

  /**
   * Formatar dados para exibição
   * @param {Object} dados - Dados brutos
   * @returns {Object} Dados formatados
   */
  formatarDadosExibicao(dados) {
    return {
      ...dados,
      tempoEsperaFormatado: this.formatarTempoEspera(dados.tempoEsperaMinutos),
      horarioAgendadoFormatado: this.formatarHorario(dados.horarioAgendado),
      horarioChegadaFormatado: this.formatarHorario(dados.horarioChegada),
      isEsperaLonga: dados.tempoEsperaMinutos > 30,
      prioridadeLabel: this.getPrioridadeLabel(dados.prioridade)
    };
  }

  /**
   * Formatar tempo de espera em minutos para string legível
   * @param {number} minutos - Tempo em minutos
   * @returns {string} Tempo formatado
   */
  formatarTempoEspera(minutos) {
    if (!minutos || minutos < 0) return '0min';

    if (minutos < 60) {
      return `${minutos}min`;
    }

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (mins === 0) {
      return `${horas}h`;
    }

    return `${horas}h ${mins}min`;
  }

  /**
   * Formatar horário para exibição
   * @param {string} horario - Horário ISO string
   * @returns {string} Horário formatado
   */
  formatarHorario(horario) {
    if (!horario) return '--:--';

    try {
      return new Date(horario).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '--:--';
    }
  }

  /**
   * Obter label da prioridade
   * @param {string} prioridade - Prioridade
   * @returns {string} Label formatado
   */
  getPrioridadeLabel(prioridade) {
    const labels = {
      'baixa': 'Baixa',
      'normal': 'Normal',
      'alta': 'Alta'
    };
    return labels[prioridade] || 'Normal';
  }

  /**
   * Calcular tempo de espera em minutos
   * @param {string} horarioChegada - Horário de chegada
   * @param {string} horarioAtual - Horário atual (opcional)
   * @returns {number} Tempo em minutos
   */
  calcularTempoEspera(horarioChegada, horarioAtual = null) {
    if (!horarioChegada) return 0;

    const chegada = new Date(horarioChegada);
    const atual = horarioAtual ? new Date(horarioAtual) : new Date();

    const diferencaMs = atual - chegada;
    const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));

    return Math.max(0, diferencaMinutos);
  }

  /**
   * Verificar se tempo de espera é considerado longo
   * @param {number} minutos - Tempo em minutos
   * @param {number} limite - Limite em minutos (padrão: 30)
   * @returns {boolean} True se espera longa
   */
  isEsperaLonga(minutos, limite = 30) {
    return minutos > limite;
  }

  /**
   * Obter configurações de alertas
   * @returns {Object} Configurações de alertas
   */
  getConfigAlertas() {
    return {
      esperaLongaMinutos: 30,
      notificacaoBot: true,
      emailAutomatico: false,
      intervaloVerificacao: 60000, // 1 minuto
      maxAlertasSimultaneos: 5
    };
  }

  /**
   * Obter configurações de priorização
   * @returns {Object} Configurações de priorização
   */
  getConfigPriorizacao() {
    return {
      criterios: ['tempoEspera', 'prioridade', 'historico', 'urgencia'],
      pesoTempoEspera: 0.4,
      pesoPrioridade: 0.3,
      pesoHistorico: 0.2,
      pesoUrgencia: 0.1,
      usarIA: true
    };
  }
}

// Instância do serviço
const salaEsperaService = new SalaEsperaService();

export default salaEsperaService;