import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../../services/api';

// Hook principal para o CRM
export const useCRM = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando métricas CRM...');
      
      const response = await crmService.getMetrics();
      setMetrics(response.data || {});
      setBackendConnected(true);
      console.log('✅ Métricas CRM carregadas do backend');
    } catch (err) {
      setError('Erro ao carregar métricas do CRM');
      console.error('Erro ao carregar métricas:', err);
      setBackendConnected(false);
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
    refetch: fetchMetrics,
    backendConnected
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
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchPacientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando pacientes CRM...');
      
      const params = {
        status: filters.status,
        segmento: filters.segmento,
        search: filters.search,
        orderBy: filters.orderBy,
        page: pagination.page,
        limit: pagination.limit
      };
      
      const response = await crmService.getPacientes(params);
      setPacientes(Array.isArray(response.data) ? response.data : []);
      
      if (response.pagination) {
        setPagination(response.pagination);
      }
      
      setBackendConnected(true);
      console.log('✅ Pacientes CRM carregados do backend');
    } catch (err) {
      setError('Erro ao carregar pacientes');
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const changePage = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return { 
    pacientes: Array.isArray(pacientes) ? pacientes : [],
    pagination, 
    loading, 
    error, 
    refetch: fetchPacientes,
    changePage,
    backendConnected
  };
};

// Hook para gerenciar mensagens
export const useMensagens = (filters = {}) => {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchMensagens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando mensagens CRM...');
      
      const params = {
        pacienteId: filters.paciente_id,
        tipo: filters.tipo,
        limit: filters.limit || 50
      };
      
      const response = await crmService.getMensagens(params);
      setMensagens(Array.isArray(response.data) ? response.data : []);
      setBackendConnected(true);
      console.log('✅ Mensagens CRM carregadas do backend');
      
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

  const enviarMensagem = async (dados) => {
    try {
      setLoading(true);
      const response = await crmService.enviarMensagem(dados);
      await fetchMensagens(); // Recarregar lista
      return response.data;
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    mensagens: Array.isArray(mensagens) ? mensagens : [],
    loading, 
    error, 
    refetch: fetchMensagens,
    enviarMensagem,
    backendConnected
  };
};

// Hook para templates
export const useTemplates = (tipo = '') => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando templates CRM...');
      
      const response = await crmService.getTemplates();
      let templatesList = Array.isArray(response.data) ? response.data : [];
      
      if (tipo) {
        templatesList = templatesList.filter(t => t.tipo === tipo);
      }
      
      setTemplates(templatesList);
      setBackendConnected(true);
      console.log('✅ Templates CRM carregados do backend');
      
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
      
      const response = await crmService.createTemplate(templateData);
      await fetchTemplates(); // Recarregar lista
      return response.data;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      throw new Error('Erro ao criar template');
    } finally {
      setLoading(false);
    }
  };

  return { 
    templates: Array.isArray(templates) ? templates : [],
    loading, 
    error, 
    refetch: fetchTemplates,
    createTemplate,
    backendConnected
  };
};

// Hook para segmentos
export const useSegmentos = () => {
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchSegmentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando segmentos CRM...');
      
      const response = await crmService.getSegmentos();
      setSegmentos(Array.isArray(response.data) ? response.data : []);
      setBackendConnected(true);
      console.log('✅ Segmentos CRM carregados do backend');
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
    segmentos: Array.isArray(segmentos) ? segmentos : [],
    loading, 
    error, 
    refetch: fetchSegmentos,
    backendConnected
  };
};

// Hook para automações
export const useAutomacoes = () => {
  const [automacoes, setAutomacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchAutomacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando automações CRM...');
      
      const response = await crmService.getAutomacoes();
      setAutomacoes(Array.isArray(response.data) ? response.data : []);
      setBackendConnected(true);
      console.log('✅ Automações CRM carregadas do backend');
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
    automacoes: Array.isArray(automacoes) ? automacoes : [],
    loading, 
    error, 
    refetch: fetchAutomacoes,
    toggleAutomacao,
    backendConnected
  };
};

// Hook para relatórios
export const useRelatorios = () => {
  const [relatorioInativos, setRelatorioInativos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchRelatorioInativos = useCallback(async (dias = 90) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando relatório de inativos...');
      
      const response = await crmService.getRelatorioInativos(dias);
      setRelatorioInativos(Array.isArray(response.data) ? response.data : []);
      setBackendConnected(true);
      console.log('✅ Relatório de inativos carregado do backend');
    } catch (err) {
      setError('Erro ao gerar relatório de inativos');
      console.error('Erro ao gerar relatório:', err);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarRelatorio = async (dados, tipo, formato = 'csv') => {
    try {
      setLoading(true);
      
      // Criar conteúdo do arquivo
      let content = '';
      
      if (formato === 'csv') {
        // Cabeçalho CSV
        const headers = Object.keys(dados[0] || {}).join(',');
        const rows = dados.map(row => Object.values(row).join(','));
        content = [headers, ...rows].join('\n');
      } else if (formato === 'json') {
        content = JSON.stringify(dados, null, 2);
      }
      
      // Criar e baixar arquivo
      const blob = new Blob([content], { type: formato === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${tipo}_${Date.now()}.${formato}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, arquivo: link.download };
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      throw new Error('Erro ao exportar relatório');
    } finally {
      setLoading(false);
    }
  };

  return { 
    relatorioInativos,
    loading, 
    error, 
    fetchRelatorioInativos,
    exportarRelatorio,
    backendConnected
  };
};
