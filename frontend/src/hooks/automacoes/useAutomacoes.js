import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../../services/api';
import useAutomationStatus from '../useAutomationStatus';

// Hook para gerenciar automações e workflows via API
const useAutomacoes = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // Usar o hook de status das automações
  const { automationStatus, loading: automationStatusLoading } = useAutomationStatus();

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await crmService.getAutomacoes();
      setWorkflows(Array.isArray(resp.data) ? resp.data : []);
      setBackendConnected(true);
    } catch (err) {
      console.error('Erro ao carregar automações:', err);
      setError('Erro ao carregar automações');
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const adicionarWorkflow = async (novoWorkflow) => {
    try {
      setLoading(true);
      const resp = await crmService.createAutomacao(novoWorkflow);
      const created = resp.data || { id: Date.now(), ...novoWorkflow };
      setWorkflows(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Erro ao criar workflow:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const atualizarWorkflow = async (id, dadosAtualizados) => {
    try {
      setLoading(true);
      if (crmService.updateAutomacao) {
        await crmService.updateAutomacao(id, dadosAtualizados);
      }
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...dadosAtualizados } : w));
    } catch (err) {
      console.error('Erro ao atualizar workflow:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (id) => {
    try {
      setLoading(true);
      const target = workflows.find(w => w.id === id);
      if (!target) return;
      
      const novoStatus = target.status === 'ativo' ? 'pausado' : 'ativo';
      
      // Verificar se está tentando ativar e se as automações estão bloqueadas
      if (novoStatus === 'ativo' && automationStatus?.blocked) {
        throw new Error('Não é possível ativar automações: WhatsApp desconectado. Conecte o WhatsApp primeiro.');
      }
      
      if (crmService.updateAutomacao) {
        await crmService.updateAutomacao(id, { status: novoStatus });
      }
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: novoStatus } : w));
    } catch (err) {
      console.error('Erro ao alternar workflow:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const excluirWorkflow = async (id) => {
    try {
      setLoading(true);
      if (crmService.deleteAutomacao) {
        await crmService.deleteAutomacao(id);
      }
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Erro ao excluir workflow:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    workflows,
    loading,
    error,
    backendConnected,
    automationStatus,
    automationStatusLoading,
    fetchWorkflows,
    adicionarWorkflow,
    atualizarWorkflow,
    toggleWorkflow,
    excluirWorkflow
  };
};

export default useAutomacoes;
