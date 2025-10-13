import api from './api';

class AgendamentoService {
  // ===== MÉTODOS ORIGINAIS =====
  
  // Buscar agendamentos
  async getAgendamentos(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.start) params.append('start', filters.start);
      if (filters.end) params.append('end', filters.end);
      if (filters.status) params.append('status', filters.status);
      if (filters.paciente_id) params.append('paciente_id', filters.paciente_id);
      if (filters.procedimento_id) params.append('procedimento_id', filters.procedimento_id);

      const response = await api.get(`/agendamentos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }

  // ===== MÉTODOS PARA AGENDA LITE =====

  /**
   * Buscar agendamentos da AgendaLite
   * @param {Object} filtros - Filtros opcionais (data_inicio, data_fim)
   * @returns {Promise<Array>} Lista de agendamentos
   */
  async buscarAgendamentosLite(filtros = {}) {
    try {
      console.log('🔍 API: Buscando agendamentos AgendaLite com filtros:', filtros);
      
      const params = new URLSearchParams();
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      
      const response = await api.get(`/agenda/agendamentos?${params.toString()}`);
      
      console.log('✅ API: Agendamentos AgendaLite recebidos:', response.data);
      
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos AgendaLite:', error);
      throw new Error('Erro ao carregar agendamentos');
    }
  }

  /**
   * Criar agendamento na AgendaLite
   * @param {Object} agendamentoData - Dados do agendamento
   * @returns {Promise<Object>} Agendamento criado
   */
  async criarAgendamentoLite(agendamentoData) {
    try {
      console.log('📝 API: Criando agendamento AgendaLite:', agendamentoData);
      
      const response = await api.post('/agenda/agendamentos', agendamentoData);
      
      console.log('✅ API: Agendamento AgendaLite criado:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('❌ Erro ao criar agendamento AgendaLite:', error);
      throw new Error(error.response?.data?.message || 'Erro ao salvar agendamento');
    }
  }

  /**
   * Atualizar agendamento na AgendaLite
   * @param {number} id - ID do agendamento
   * @param {Object} agendamentoData - Dados atualizados
   * @returns {Promise<Object>} Agendamento atualizado
   */
  async atualizarAgendamentoLite(id, agendamentoData) {
    try {
      console.log(`📝 API: Atualizando agendamento AgendaLite ${id}:`, agendamentoData);
      
      const response = await api.put(`/agenda/agendamentos/${id}`, agendamentoData);
      
      console.log('✅ API: Agendamento AgendaLite atualizado:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar agendamento');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento AgendaLite:', error);
      throw new Error(error.response?.data?.message || 'Erro ao atualizar agendamento');
    }
  }

  /**
   * Deletar agendamento na AgendaLite
   * @param {number} id - ID do agendamento
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deletarAgendamentoLite(id) {
    try {
      console.log(`🗑️ API: Deletando agendamento AgendaLite ${id}`);
      
      const response = await api.delete(`/agenda/agendamentos/${id}`);
      
      console.log('✅ API: Agendamento AgendaLite deletado:', response.data);
      
      return response.data.success;
    } catch (error) {
      console.error('❌ Erro ao deletar agendamento AgendaLite:', error);
      throw new Error(error.response?.data?.message || 'Erro ao deletar agendamento');
    }
  }

  /**
   * Migrar dados do localStorage para o banco
   * @param {Array} agendamentosLocalStorage - Agendamentos do localStorage
   * @returns {Promise<Array>} Agendamentos migrados
   */
  async migrarLocalStorageParaBanco(agendamentosLocalStorage) {
    try {
      console.log('🔄 API: Migrando dados do localStorage para banco:', agendamentosLocalStorage);
      
      const agendamentosMigrados = [];
      
      for (const agendamento of agendamentosLocalStorage) {
        try {
          // Adaptar estrutura do localStorage para API
          const agendamentoData = {
            horario: agendamento.horario,
            data: agendamento.data || new Date().toISOString().split('T')[0],
            paciente: agendamento.paciente || '',
            procedimento: agendamento.procedimento || 'Consulta',
            status: agendamento.status || 'não confirmado',
            valor: agendamento.valor || 0,
            observacoes: agendamento.observacoes || ''
          };
          
          const agendamentoCriado = await this.criarAgendamentoLite(agendamentoData);
          agendamentosMigrados.push(agendamentoCriado);
          
          console.log(`✅ Agendamento migrado: ${agendamento.paciente} - ${agendamento.horario}`);
        } catch (error) {
          console.error(`❌ Erro ao migrar agendamento:`, agendamento, error);
        }
      }
      
      console.log(`🎉 Migração concluída: ${agendamentosMigrados.length} agendamentos migrados`);
      
      return agendamentosMigrados;
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      throw new Error('Erro ao migrar dados do localStorage');
    }
  }

  // Buscar agendamento por ID
  async getAgendamentoById(id) {
    try {
      const response = await api.get(`/agendamentos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      throw error;
    }
  }

  // Criar novo agendamento
  async createAgendamento(agendamentoData) {
    try {
      const response = await api.post('/agendamentos', agendamentoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  // Atualizar agendamento
  async updateAgendamento(id, agendamentoData) {
    try {
      const response = await api.put(`/agendamentos/${id}`, agendamentoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  }

  // Atualizar status do agendamento
  async updateStatus(id, status) {
    try {
      const response = await api.put(`/agendamentos/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  // Excluir agendamento
  async deleteAgendamento(id) {
    try {
      const response = await api.delete(`/agendamentos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      throw error;
    }
  }

  // Buscar disponibilidade
  async getDisponibilidade(data, equipamento_id = null) {
    try {
      const params = new URLSearchParams();
      params.append('data', data);
      if (equipamento_id) params.append('equipamento_id', equipamento_id);

      const response = await api.get(`/agendamentos/disponibilidade?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      throw error;
    }
  }

  // Buscar estatísticas
  async getEstatisticas() {
    try {
      const response = await api.get('/agendamentos/estatisticas');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Enviar lembrete via WhatsApp
  async enviarLembrete(id) {
    try {
      // Esta funcionalidade pode ser implementada no backend
      // Por enquanto, vamos simular
      console.log('Enviando lembrete para agendamento:', id);
      return { success: true, message: 'Lembrete enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      throw error;
    }
  }

  // Formatar eventos para o FullCalendar
  formatEventsForCalendar(agendamentos) {
    return agendamentos.map(agendamento => {
      const statusConfig = {
        confirmado: { bgColor: '#4caf50', color: 'success' },
        pendente: { bgColor: '#ff9800', color: 'warning' },
        cancelado: { bgColor: '#f44336', color: 'error' },
        realizado: { bgColor: '#2196f3', color: 'info' },
        'em-atendimento': { bgColor: '#9c27b0', color: 'secondary' },
      };

      const status = statusConfig[agendamento.status] || statusConfig.pendente;

      return {
        id: agendamento.id,
        title: `${agendamento.paciente?.nome || 'Paciente'} - ${agendamento.procedimento?.nome || agendamento.procedimento_nome || 'Procedimento'}`,
        start: agendamento.data_hora,
        end: agendamento.data_hora_fim || this.calculateEndTime(agendamento.data_hora, agendamento.duracao_minutos || 60),
        backgroundColor: status.bgColor,
        borderColor: status.bgColor,
        textColor: '#ffffff',
        extendedProps: {
          ...agendamento,
          statusColor: status.color,
        },
      };
    });
  }

  // Calcular horário de fim baseado na duração
  calculateEndTime(startTime, durationMinutes) {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return end.toISOString();
  }

  // Validar dados do agendamento
  validateAgendamento(data) {
    const errors = [];

    if (!data.paciente_id) errors.push('Paciente é obrigatório');
    if (!data.procedimento_id) errors.push('Procedimento é obrigatório');
    if (!data.equipamento_id) errors.push('Equipamento é obrigatório');
    if (!data.data_hora) errors.push('Data e hora são obrigatórias');

    const dataHora = new Date(data.data_hora);
    if (dataHora <= new Date()) {
      errors.push('Data e hora devem ser futuras');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

const agendamentoService = new AgendamentoService();
export default agendamentoService;