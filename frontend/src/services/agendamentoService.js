import api from './api';

class AgendamentoService {
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

export default new AgendamentoService();