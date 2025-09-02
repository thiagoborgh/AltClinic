import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useAtendimento = (pacienteId) => {
  const [atendimento, setAtendimento] = useState(null);
  const [logs, setLogs] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  
  const intervalRef = useRef(null);
  // const wsRef = useRef(null); // Para implementação futura do WebSocket

  // Configurar interceptors do axios
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        console.error('Erro na API:', error);
        setError(error.response?.data?.message || 'Erro de conexão');
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Timer para atualizar tempo decorrido
  useEffect(() => {
    if (atendimento?.status === 'em_atendimento' && atendimento?.iniciadoEm) {
      intervalRef.current = setInterval(() => {
        const inicio = new Date(atendimento.iniciadoEm);
        const agora = new Date();
        const segundos = Math.floor((agora - inicio) / 1000);
        setTempoDecorrido(segundos);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTempoDecorrido(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [atendimento]);

  // WebSocket para atualizações em tempo real (futuro)
  useEffect(() => {
    // TODO: Implementar WebSocket quando disponível
    // const ws = new WebSocket(`ws://localhost:5000/ws/atendimentos/${pacienteId}`);
    // wsRef.current = ws;
    
    return () => {
      // Cleanup será implementado quando WebSocket estiver ativo
    };
  }, [pacienteId]);

  // Buscar dados do atendimento atual
  const buscarAtendimento = useCallback(async () => {
    if (!pacienteId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE}/atendimentos/${pacienteId}`);
      
      if (response.data.success) {
        setAtendimento(response.data.data);
        setTempoDecorrido(response.data.data.tempoDecorrido || 0);
      }
    } catch (err) {
      setError('Erro ao buscar atendimento');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  // Buscar logs do paciente
  const buscarLogs = useCallback(async (filtros = {}) => {
    if (!pacienteId) return;
    
    try {
      const params = new URLSearchParams({
        limite: filtros.limite || 50,
        pagina: filtros.pagina || 1,
        ...(filtros.periodo && { periodo: filtros.periodo }),
        ...(filtros.acao && { acao: filtros.acao })
      });

      const response = await axios.get(`${API_BASE}/atendimentos/${pacienteId}/logs?${params}`);
      
      if (response.data.success) {
        setLogs(response.data.data.logs);
        return response.data.data;
      }
    } catch (err) {
      setError('Erro ao buscar logs');
      return null;
    }
  }, [pacienteId]);

  // Buscar métricas do paciente
  const buscarMetricas = useCallback(async (periodo = '30') => {
    if (!pacienteId) return;
    
    try {
      const response = await axios.get(`${API_BASE}/atendimentos/${pacienteId}/metricas?periodo=${periodo}`);
      
      if (response.data.success) {
        setMetricas(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      setError('Erro ao buscar métricas');
      return null;
    }
  }, [pacienteId]);

  // Atualizar status do atendimento
  const atualizarStatus = useCallback(async (status, dados = {}) => {
    if (!pacienteId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        status,
        motivo: dados.motivo || '',
        observacoes: dados.observacoes || '',
        usuario: dados.usuario || 'Sistema'
      };

      const response = await axios.put(`${API_BASE}/atendimentos/${pacienteId}/status`, payload);
      
      if (response.data.success) {
        setAtendimento(response.data.data.atendimento);
        
        // Adicionar novo log à lista
        if (response.data.data.log) {
          setLogs(logsAtuais => [response.data.data.log, ...logsAtuais]);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar status');
      return false;
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  // Adicionar log manual
  const adicionarLog = useCallback(async (dados) => {
    if (!pacienteId) return false;
    
    try {
      const payload = {
        acao: dados.acao,
        motivo: dados.motivo || '',
        observacoes: dados.observacoes || '',
        usuario: dados.usuario || 'Sistema',
        metadata: dados.metadata || {}
      };

      const response = await axios.post(`${API_BASE}/atendimentos/${pacienteId}/logs`, payload);
      
      if (response.data.success) {
        setLogs(logsAtuais => [response.data.data, ...logsAtuais]);
        return true;
      }
      
      return false;
    } catch (err) {
      setError('Erro ao adicionar log');
      return false;
    }
  }, [pacienteId]);

  // Ações específicas de atendimento
  const iniciarAtendimento = useCallback(async (dados = {}) => {
    return await atualizarStatus('em_atendimento', {
      ...dados,
      usuario: dados.usuario || 'Médico'
    });
  }, [atualizarStatus]);

  const pausarAtendimento = useCallback(async (dados = {}) => {
    return await atualizarStatus('em_espera', {
      ...dados,
      motivo: dados.motivo || 'Pausa solicitada',
      usuario: dados.usuario || 'Médico'
    });
  }, [atualizarStatus]);

  const retomarAtendimento = useCallback(async (dados = {}) => {
    return await atualizarStatus('em_atendimento', {
      ...dados,
      motivo: dados.motivo || 'Atendimento retomado',
      usuario: dados.usuario || 'Médico'
    });
  }, [atualizarStatus]);

  const concluirAtendimento = useCallback(async (dados = {}) => {
    return await atualizarStatus('concluido', {
      ...dados,
      motivo: dados.motivo || 'Atendimento finalizado',
      usuario: dados.usuario || 'Médico'
    });
  }, [atualizarStatus]);

  const cancelarAtendimento = useCallback(async (dados = {}) => {
    return await atualizarStatus('cancelado', {
      ...dados,
      motivo: dados.motivo || 'Atendimento cancelado',
      usuario: dados.usuario || 'Sistema'
    });
  }, [atualizarStatus]);

  // Exportar logs
  const exportarLogs = useCallback(async (formato = 'json') => {
    try {
      const todosLogs = await buscarLogs({ limite: 1000 });
      
      if (!todosLogs?.logs) return null;

      const dadosExport = {
        pacienteId,
        logs: todosLogs.logs,
        total: todosLogs.total,
        exportadoEm: new Date().toISOString(),
        formato
      };

      if (formato === 'csv') {
        return convertToCSV(dadosExport.logs);
      }

      return JSON.stringify(dadosExport, null, 2);
    } catch (err) {
      setError('Erro ao exportar logs');
      return null;
    }
  }, [pacienteId, buscarLogs]);

  // Limpar dados
  const limparDados = useCallback(() => {
    setAtendimento(null);
    setLogs([]);
    setMetricas(null);
    setError(null);
    setTempoDecorrido(0);
  }, []);

  // Inicializar dados ao montar o componente
  useEffect(() => {
    if (pacienteId) {
      buscarAtendimento();
      buscarLogs();
    } else {
      limparDados();
    }
  }, [pacienteId, buscarAtendimento, buscarLogs, limparDados]);

  return {
    // Estado
    atendimento,
    logs,
    metricas,
    loading,
    error,
    tempoDecorrido,
    
    // Funções principais
    buscarAtendimento,
    buscarLogs,
    buscarMetricas,
    atualizarStatus,
    adicionarLog,
    
    // Ações específicas
    iniciarAtendimento,
    pausarAtendimento,
    retomarAtendimento,
    concluirAtendimento,
    cancelarAtendimento,
    
    // Utilidades
    exportarLogs,
    limparDados,
    
    // Estado derivado
    isAtendimentoAtivo: atendimento?.status === 'em_atendimento',
    isAtendimentoPausado: atendimento?.status === 'em_espera',
    isAtendimentoConcluido: atendimento?.status === 'concluido',
    isAtendimentoCancelado: atendimento?.status === 'cancelado',
    podeIniciar: !atendimento || atendimento.status === 'pendente',
    podePausar: atendimento?.status === 'em_atendimento',
    podeRetomar: atendimento?.status === 'em_espera',
    podeConcluir: atendimento?.status === 'em_atendimento',
    podeCancelar: atendimento && !['concluido', 'cancelado'].includes(atendimento.status)
  };
};

// Função auxiliar para converter logs para CSV
function convertToCSV(logs) {
  if (!logs || logs.length === 0) return '';

  const headers = ['ID', 'Data/Hora', 'Ação', 'Status Anterior', 'Status Novo', 'Motivo', 'Usuário', 'Observações'];
  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      log.id,
      log.timestamp,
      log.acao,
      log.statusAnterior || '',
      log.statusNovo || '',
      `"${log.motivo || ''}"`,
      log.usuario || '',
      `"${log.observacoes || ''}"`
    ].join(','))
  ].join('\n');

  return csvContent;
}

export default useAtendimento;
