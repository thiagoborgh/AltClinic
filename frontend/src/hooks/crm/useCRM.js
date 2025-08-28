import { useState, useEffect, useCallback } from 'react';
import { 
  mockCRMMetrics, 
  mockPacientes, 
  mockMensagens, 
  mockTemplates,
  mockSegmentos,
  mockRelatorioAtivacao,
  mockAutomacoes 
} from '../../data/crm/mockCRMData';

// Hook principal para o CRM
export const useCRM = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMetrics(mockCRMMetrics);
    } catch (err) {
      setError('Erro ao carregar métricas do CRM');
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { 
    metrics, 
    loading, 
    error, 
    refetch: fetchMetrics 
  };
};

// Hook para gerenciar pacientes
export const usePacientes = (filters = {}) => {
  const [pacientes, setPacientes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPacientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      let filteredPacientes = [...mockPacientes];
      
      // Aplicar filtros
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredPacientes = filteredPacientes.filter(p => 
          p.nome.toLowerCase().includes(searchTerm) ||
          p.email.toLowerCase().includes(searchTerm) ||
          p.telefone.includes(searchTerm)
        );
      }
      
      if (filters.status && filters.status !== 'todos') {
        filteredPacientes = filteredPacientes.filter(p => p.status === filters.status);
      }
      
      if (filters.segmento) {
        filteredPacientes = filteredPacientes.filter(p => 
          p.segmento?.id === parseInt(filters.segmento)
        );
      }
      
      // Ordenação
      if (filters.orderBy) {
        filteredPacientes.sort((a, b) => {
          let aValue = a[filters.orderBy];
          let bValue = b[filters.orderBy];
          
          if (filters.orderBy === 'nome') {
            return aValue.localeCompare(bValue);
          }
          
          if (filters.orderBy === 'ultima_consulta') {
            return new Date(bValue) - new Date(aValue);
          }
          
          if (filters.orderBy === 'valor_total_gasto') {
            return bValue - aValue;
          }
          
          return 0;
        });
      }
      
      // Paginação
      const limit = filters.limit || 10;
      const page = filters.page || 1;
      const total = filteredPacientes.length;
      const pages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      
      setPacientes(filteredPacientes.slice(start, end));
      setPagination({ page, limit, total, pages });
      
    } catch (err) {
      setError('Erro ao carregar pacientes');
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPacientes();
    
    // Configurar refresh automático a cada 20 segundos
    const refreshInterval = setInterval(() => {
      fetchPacientes();
    }, 20000); // 20 segundos
    
    // Cleanup do interval quando o componente for desmontado
    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchPacientes]);

  const sendMessage = async (pacienteId, mensagem) => {
    try {
      setLoading(true);
      
      // Simular envio de mensagem
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Mensagem enviada:', { pacienteId, mensagem });
      
      // Aqui seria a chamada real para a API
      // await crmAPI.sendMessage(pacienteId, mensagem);
      
      return { success: true, mensagem_id: Date.now() };
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      throw new Error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return { 
    pacientes, 
    pagination, 
    loading, 
    error,
    refetch: fetchPacientes,
    sendMessage 
  };
};

// Hook para gerenciar mensagens
export const useMensagens = (filters = {}) => {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMensagens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredMensagens = [...mockMensagens];
      
      // Aplicar filtros
      if (filters.paciente_id) {
        filteredMensagens = filteredMensagens.filter(m => m.paciente_id === filters.paciente_id);
      }
      
      if (filters.status) {
        filteredMensagens = filteredMensagens.filter(m => m.status === filters.status);
      }
      
      if (filters.tipo) {
        filteredMensagens = filteredMensagens.filter(m => m.tipo === filters.tipo);
      }
      
      // Ordenar por data de envio (mais recente primeiro)
      filteredMensagens.sort((a, b) => new Date(b.enviado_em) - new Date(a.enviado_em));
      
      setMensagens(filteredMensagens);
      
    } catch (err) {
      setError('Erro ao carregar mensagens');
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMensagens();
  }, [fetchMensagens]);

  return { 
    mensagens, 
    loading, 
    error, 
    refetch: fetchMensagens 
  };
};

// Hook para templates
export const useTemplates = (tipo = '') => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filteredTemplates = [...mockTemplates];
      
      if (tipo) {
        filteredTemplates = filteredTemplates.filter(t => t.tipo === tipo);
      }
      
      // Apenas templates ativos
      filteredTemplates = filteredTemplates.filter(t => t.ativo);
      
      setTemplates(filteredTemplates);
      
    } catch (err) {
      setError('Erro ao carregar templates');
      console.error('Erro ao carregar templates:', err);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (templateData) => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate = {
        id: Date.now(),
        ...templateData,
        ativo: true
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      
      return newTemplate;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      throw new Error('Erro ao criar template');
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (templateId, updates) => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTemplates(prev => 
        prev.map(t => t.id === templateId ? { ...t, ...updates } : t)
      );
      
    } catch (err) {
      console.error('Erro ao atualizar template:', err);
      throw new Error('Erro ao atualizar template');
    } finally {
      setLoading(false);
    }
  };

  return { 
    templates, 
    loading, 
    error, 
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate
  };
};

// Hook para segmentos
export const useSegmentos = () => {
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSegmentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setSegmentos(mockSegmentos);
      
    } catch (err) {
      setError('Erro ao carregar segmentos');
      console.error('Erro ao carregar segmentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegmentos();
  }, [fetchSegmentos]);

  return { 
    segmentos, 
    loading, 
    error, 
    refetch: fetchSegmentos 
  };
};

// Hook para relatórios
export const useRelatorios = () => {
  const [relatorioAtivacao, setRelatorioAtivacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRelatorioAtivacao = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRelatorioAtivacao(mockRelatorioAtivacao);
      
    } catch (err) {
      setError('Erro ao gerar relatório de ativação');
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarRelatorio = async (tipo, formato = 'csv') => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular download do arquivo
      console.log(`Exportando relatório ${tipo} em formato ${formato}`);
      
      return { success: true, arquivo: `relatorio_${tipo}_${Date.now()}.${formato}` };
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      throw new Error('Erro ao exportar relatório');
    } finally {
      setLoading(false);
    }
  };

  return { 
    relatorioAtivacao,
    loading, 
    error, 
    fetchRelatorioAtivacao,
    exportarRelatorio
  };
};

// Hook para automações
export const useAutomacoes = () => {
  const [automacoes, setAutomacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAutomacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setAutomacoes(mockAutomacoes);
      
    } catch (err) {
      setError('Erro ao carregar automações');
      console.error('Erro ao carregar automações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomacoes();
  }, [fetchAutomacoes]);

  const toggleAutomacao = async (automacaoId, ativo) => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAutomacoes(prev => 
        prev.map(a => a.id === automacaoId ? { ...a, ativo } : a)
      );
      
    } catch (err) {
      console.error('Erro ao alterar automação:', err);
      throw new Error('Erro ao alterar automação');
    } finally {
      setLoading(false);
    }
  };

  return { 
    automacoes, 
    loading, 
    error, 
    refetch: fetchAutomacoes,
    toggleAutomacao
  };
};
