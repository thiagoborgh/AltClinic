import api from './api';

// Serviço para gerenciar pacientes
class PacienteService {
  
  // Buscar pacientes com filtros
  async getPacientes(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.medico) queryParams.append('medico', filters.medico);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.offset) queryParams.append('offset', filters.offset);

      const response = await api.get(`/pacientes-v2?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      throw error;
    }
  }

  // Buscar paciente por ID
  async getPacienteById(id) {
    try {
      const response = await api.get(`/pacientes-v2/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      throw error;
    }
  }

  // Buscar pacientes para autocomplete
  async searchPacientes(query) {
    try {
      const response = await api.get(`/pacientes-v2/buscar?termo=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      throw error;
    }
  }

  // Verificar duplicatas por CPF/telefone
  async checkDuplicates(cpf, telefone) {
    try {
      const params = new URLSearchParams();
      if (cpf) params.append('cpf', cpf);
      if (telefone) params.append('telefone', telefone);
      
      const response = await api.get(`/pacientes-v2/verificar-duplicatas?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      throw error;
    }
  }

  // Criar novo paciente
  async createPaciente(pacienteData) {
    try {
      const payload = {
        ...pacienteData,
        cpf: pacienteData.cpf?.replace(/\D/g, ''), // Remover formatação
        telefone: pacienteData.telefone?.replace(/\D/g, ''),
        created_at: new Date().toISOString()
      };

      const response = await api.post('/pacientes-v2', payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  }

  // Atualizar paciente
  async updatePaciente(id, pacienteData) {
    try {
      const payload = {
        ...pacienteData,
        cpf: pacienteData.cpf?.replace(/\D/g, ''),
        telefone: pacienteData.telefone?.replace(/\D/g, ''),
        updated_at: new Date().toISOString()
      };

      const response = await api.put(`/pacientes-v2/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  }

  // Deletar paciente
  async deletePaciente(id) {
    try {
      const response = await api.delete(`/pacientes-v2/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar paciente:', error);
      throw error;
    }
  }

  // Obter histórico de agendamentos do paciente
  async getPacienteAgendamentos(pacienteId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
      if (filters.dataFim) queryParams.append('dataFim', filters.dataFim);

      const response = await api.get(`/pacientes/${pacienteId}/agendamentos?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar agendamentos do paciente:', error);
      throw error;
    }
  }

  // Obter prontuários do paciente
  async getPacienteProntuarios(pacienteId) {
    try {
      const response = await api.get(`/pacientes/${pacienteId}/prontuarios`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar prontuários do paciente:', error);
      throw error;
    }
  }

  // Obter dados financeiros do paciente
  async getPacienteFinanceiro(pacienteId) {
    try {
      const response = await api.get(`/pacientes/${pacienteId}/financeiro`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados financeiros do paciente:', error);
      throw error;
    }
  }

  // Enviar mensagem para o paciente
  async enviarMensagem(pacienteId, mensagem) {
    try {
      const payload = {
        pacienteId,
        mensagem,
        tipo: 'whatsapp', // ou 'sms', 'email'
        timestamp: new Date().toISOString()
      };

      const response = await api.post('/pacientes/enviar-mensagem', payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Validar CPF
  validateCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Verificar sequência de números iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    return digit1 === parseInt(cleanCPF.charAt(9)) && 
           digit2 === parseInt(cleanCPF.charAt(10));
  }

  // Formatar CPF
  formatCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Formatar telefone
  formatPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length <= 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  // Calcular idade
  calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Gerar estatísticas dos pacientes
  async getEstatisticas() {
    try {
      const response = await api.get('/pacientes/estatisticas');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}

const pacienteService = new PacienteService();
export default pacienteService;