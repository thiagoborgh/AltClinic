import axios from 'axios';
import toast from 'react-hot-toast';

// Função para detectar a URL da API baseada no ambiente
const getApiBaseURL = () => {
  // Se estiver definido explicitamente nas variáveis de ambiente
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Se estiver em produção (OnRender ou outro provedor)
  if (process.env.NODE_ENV === 'production') {
    // Usar a mesma URL do frontend, mas com /api
    return `${window.location.origin}/api`;
  }
  
  // Fallback para desenvolvimento
  return 'http://localhost:3000/api';
};

// Configuração base da API
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    console.log('🌐 API REQUEST:', config.method?.toUpperCase(), config.baseURL + config.url);
    console.log('🌐 API REQUEST DATA:', config.data);
    
    // Verificar se já existe Authorization header (definido pelo useAuth)
    if (!config.headers.Authorization) {
      // Adicionar token de autenticação se existir (fallback)
      const token = localStorage.getItem('saee-auth');
      if (token) {
        try {
          const authData = JSON.parse(token);
          if (authData.state?.token) {
            // Verificar se o token não é muito grande (limite aproximado de 4KB para headers)
            const tokenSize = `Bearer ${authData.state.token}`.length;
            if (tokenSize > 4000) {
              console.warn('Token muito grande detectado, limpando localStorage');
              localStorage.removeItem('saee-auth');
              return config;
            }
            config.headers.Authorization = `Bearer ${authData.state.token}`;
          }
        } catch (error) {
          console.error('Erro ao carregar token:', error);
          localStorage.removeItem('saee-auth');
        }
      }
    }

    // Adicionar header X-Tenant-Slug se existir no localStorage
    let tenantSlug = localStorage.getItem('tenantSlug');
    console.log('🌐 API: tenantSlug from localStorage:', tenantSlug);
    
    // Fallback para desenvolvimento - definir tenantSlug se não existir
    if (!tenantSlug) {
      console.warn('🌐 API: No tenantSlug found, setting fallback to "teste"');
      tenantSlug = 'teste';
      localStorage.setItem('tenantSlug', tenantSlug);
    }
    
    if (!config.headers['X-Tenant-Slug']) {
      config.headers['X-Tenant-Slug'] = tenantSlug;
      console.log('🌐 API: Added X-Tenant-Slug header:', tenantSlug);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    console.log('🌐 API RESPONSE:', response.status, response.config.method?.toUpperCase(), response.config.url);
    console.log('🌐 API RESPONSE DATA:', response.data);
    return response;
  },
  (error) => {
    console.log('🌐 API ERROR:', error.response?.status, error.config?.method?.toUpperCase(), error.config?.url);
    console.log('🌐 API ERROR DATA:', error.response?.data);
    const { response } = error;
    
    // Tratamento de erros globais
    if (response) {
      switch (response.status) {
        case 401:
          // Token inválido ou expirado
          localStorage.removeItem('saee-auth');
          window.location.href = '/login';
          toast.error('Sessão expirada. Faça login novamente.');
          break;
          
        case 403:
          toast.error('Você não tem permissão para esta ação.');
          break;
          
        case 404:
          toast.error('Recurso não encontrado.');
          break;
          
        case 422:
          // Erro de validação
          const errors = response.data.errors;
          if (errors && Array.isArray(errors)) {
            errors.forEach(err => toast.error(err));
          } else if (response.data.error) {
            toast.error(response.data.error);
          }
          break;
          
        case 500:
          toast.error('Erro interno do servidor. Tente novamente.');
          break;
          
        default:
          if (response.data?.error) {
            toast.error(response.data.error);
          } else {
            toast.error('Erro inesperado. Tente novamente.');
          }
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
    } else {
      toast.error('Erro de rede. Tente novamente.');
    }
    
    return Promise.reject(error);
  }
);

// Agenda Service
export const agendaService = {
  // Agendamentos
  listar: (filtros = {}) => api.get('/agendamentos', { params: filtros }),
  listarAgendamentos: (filtros = {}) => api.get('/agendamentos', { params: filtros }),
  buscarPorId: (id) => api.get(`/agendamentos/${id}`),
  criar: (dados) => api.post('/agendamentos', dados),
  criarAgendamento: (dados) => api.post('/agendamentos', dados),
  atualizar: (id, dados) => api.put(`/agendamentos/${id}`, dados),
  atualizarAgendamento: (id, dados) => api.put(`/agendamentos/${id}`, dados),
  cancelar: (id, motivo) => api.patch(`/agendamentos/${id}/cancelar`, motivo),
  cancelarAgendamento: (id, motivo) => api.patch(`/agendamentos/${id}/cancelar`, motivo),
  remarcar: (id, novaDataHora) => api.patch(`/agendamentos/${id}/remarcar`, novaDataHora),
  remarcarAgendamento: (id, novaDataHora) => api.patch(`/agendamentos/${id}/remarcar`, novaDataHora),
  confirmar: (id) => api.patch(`/agendamentos/${id}/confirmar`),
  confirmarAgendamento: (id) => api.patch(`/agendamentos/${id}/confirmar`),
  
  // Equipamentos
  listarEquipamentos: () => api.get('/equipamentos'),
  criarEquipamento: (data) => api.post('/equipamentos', data),
  atualizarEquipamento: (id, data) => api.put(`/equipamentos/${id}`, data),
  
  // Lembretes
  listarLembretes: () => api.get('/lembretes'),
  enviarLembrete: (id, tipo) => api.post(`/agendamentos/${id}/lembrete`, tipo),
  configurarLembretes: (data) => api.put('/lembretes/configuracao', data),
  
  // Insights e IA
  obterInsights: () => api.get('/insights'),
  verificarDisponibilidade: (dados) => api.post('/agendamentos/disponibilidade', dados),
  sugerirHorarios: (parametros) => api.post('/agendamentos/sugerir-horarios', parametros),
  sugerirHorario: (parametros) => api.post('/agendamentos/sugerir-horarios', parametros),
  otimizarAgenda: (data) => api.post('/agenda/otimizar', data),
  
  // Notificações
  enviarConfirmacao: (agendamentoId) => api.post(`/agendamentos/${agendamentoId}/confirmar-envio`),
  notificarCancelamento: (agendamentoId) => api.post(`/agendamentos/${agendamentoId}/notificar-cancelamento`),
  
  // Relatórios
  gerarRelatorio: (parametros) => api.get('/agendamentos/relatorio', { params: parametros })
};

// Dashboard Service
export const dashboardService = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getActivities: () => api.get('/dashboard/activities'),
  getAppointments: () => api.get('/dashboard/appointments'),
  getChartData: () => api.get('/dashboard/charts'),
};

// Serviços de Agendamento
export const appointmentService = {
  getAll: (params) => api.get('/appointments', { params }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  confirm: (id) => api.patch(`/appointments/${id}/confirm`),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
};

// Serviços de Pacientes
export const patientService = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  uploadImage: (id, formData) => api.post(`/patients/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Serviços Financeiros
export const proposalService = {
  getAll: (params) => api.get('/proposals', { params }),
  create: (data) => api.post('/proposals', data),
  update: (id, data) => api.put(`/proposals/${id}`, data),
  approve: (id) => api.patch(`/proposals/${id}/approve`),
  reject: (id) => api.patch(`/proposals/${id}/reject`),
  generatePDF: (id) => api.get(`/proposals/${id}/pdf`, { responseType: 'blob' }),
};

// Serviços de CRM
export const crmService = {
  getMessages: (params) => api.get('/crm/messages', { params }),
  sendMessage: (data) => api.post('/crm/messages', data),
  getInactivePatients: (params) => api.get('/crm/inactive-patients', { params }),
  getConfigurations: () => api.get('/crm/configurations'),
  updateConfigurations: (data) => api.put('/crm/configurations', data),
};

// Serviços de Autenticação
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
};

// Serviços de Configurações
export const configService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  getEquipments: () => api.get('/settings/equipments'),
  updateEquipments: (data) => api.put('/settings/equipments', data),
  getProcedures: () => api.get('/settings/procedures'),
  updateProcedures: (data) => api.put('/settings/procedures', data),
};

// Serviços Financeiros
export const financeiroService = {
  // Resumo financeiro
  getResumo: () => api.get('/financeiro/resumo'),
  
  // Contas a receber
  getContasReceber: () => api.get('/financeiro/contas-receber'),
  registrarPagamentoReceber: (id, dados) => api.put(`/financeiro/conta-receber/${id}/pagar`, dados),
  
  // Contas a pagar
  getContasPagar: () => api.get('/financeiro/contas-pagar'),
  registrarPagamentoPagar: (id, dados) => api.put(`/financeiro/conta-pagar/${id}/pagar`, dados),
  
  // Propostas
  getPropostas: () => api.get('/financeiro/propostas'),
  criarProposta: (dados) => api.post('/financeiro/proposta', dados),
  
  // Fluxo de caixa
  getFluxoCaixa: () => api.get('/financeiro/fluxo-caixa'),
  
  // Insights da IA
  getIAInsights: () => api.get('/financeiro/ia-insights'),
  
  // PIX
  gerarPIX: (valor, descricao) => api.post('/financeiro/pix', { valor, descricao }),
  
  // Todos os dados
  getTodosDados: () => api.get('/financeiro/todos'),
};

// Professional Service
export const professionalService = {
  // Buscar horários de profissionais
  getSchedules: (professionalId) => {
    const params = professionalId ? { professionalId } : {};
    return api.get('/professional/schedule', { params });
  },
  
  // Buscar horários por profissional específico
  getSchedulesByProfessional: (professionalId) => 
    api.get('/professional/schedule', { params: { professionalId } }),
    
  // Buscar todos os profissionais
  getProfessionals: () => api.get('/professional'),
  
  // Debug de horários
  debugSchedules: () => api.get('/professional/schedule-debug'),
  
  // Bulk update de horários
  bulkUpdate: (schedules) => api.post('/professional/schedule/bulk-update', { schedules }),
  
  // Deletar todos os horários de um profissional
  deleteAllSchedules: (professionalId) => 
    api.delete('/professional/schedules/all', { params: { professionalId } }),
};

export default api;
