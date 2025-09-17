import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Hook para gerenciar atendimentos
export const useAtendimento = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Iniciar atendimento
  const iniciarAtendimento = useCallback(async (dadosAtendimento) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Iniciando atendimento:', dadosAtendimento);

      // Simulação da API - em produção seria uma chamada real
      const response = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dadosAtendimento)
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar atendimento');
      }

      const resultado = await response.json();

      toast.success('Atendimento iniciado com sucesso!');
      return resultado;

    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err);
      setError(err.message);
      toast.error('Erro ao iniciar atendimento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Finalizar atendimento
  const finalizarAtendimento = useCallback(async (atendimentoId, dadosFinalizacao) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/atendimentos/${atendimentoId}/finalizar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dadosFinalizacao)
      });

      if (!response.ok) {
        throw new Error('Erro ao finalizar atendimento');
      }

      const resultado = await response.json();

      toast.success('Atendimento finalizado com sucesso!');
      return resultado;

    } catch (err) {
      console.error('Erro ao finalizar atendimento:', err);
      setError(err.message);
      toast.error('Erro ao finalizar atendimento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar atendimento por ID
  const buscarAtendimento = useCallback(async (atendimentoId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/atendimentos/${atendimentoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar atendimento');
      }

      const atendimento = await response.json();
      return atendimento;

    } catch (err) {
      console.error('Erro ao buscar atendimento:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar atendimento
  const atualizarAtendimento = useCallback(async (atendimentoId, dadosAtualizacao) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/atendimentos/${atendimentoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dadosAtualizacao)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar atendimento');
      }

      const resultado = await response.json();

      toast.success('Atendimento atualizado com sucesso!');
      return resultado;

    } catch (err) {
      console.error('Erro ao atualizar atendimento:', err);
      setError(err.message);
      toast.error('Erro ao atualizar atendimento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar atendimentos do profissional
  const buscarAtendimentosProfissional = useCallback(async (profissionalId, filtros = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        profissional_id: profissionalId,
        ...filtros
      });

      const response = await fetch(`/api/atendimentos/profissional?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar atendimentos');
      }

      const atendimentos = await response.json();
      return atendimentos;

    } catch (err) {
      console.error('Erro ao buscar atendimentos:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar atendimentos do paciente
  const buscarAtendimentosPaciente = useCallback(async (pacienteId, filtros = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        paciente_id: pacienteId,
        ...filtros
      });

      const response = await fetch(`/api/atendimentos/paciente?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar atendimentos');
      }

      const atendimentos = await response.json();
      return atendimentos;

    } catch (err) {
      console.error('Erro ao buscar atendimentos:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Adicionar evolução ao atendimento
  const adicionarEvolucao = useCallback(async (atendimentoId, dadosEvolucao) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/atendimentos/${atendimentoId}/evolucao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dadosEvolucao)
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar evolução');
      }

      const resultado = await response.json();

      toast.success('Evolução adicionada com sucesso!');
      return resultado;

    } catch (err) {
      console.error('Erro ao adicionar evolução:', err);
      setError(err.message);
      toast.error('Erro ao adicionar evolução');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pausar atendimento
  const pausarAtendimento = useCallback(async (dadosPausa) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/atendimentos/${dadosPausa.atendimentoId}/pausar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          motivo: dadosPausa.motivo,
          observacoes: dadosPausa.observacoes,
          timestamp: dadosPausa.timestamp
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao pausar atendimento');
      }

      const resultado = await response.json();

      toast.success('Atendimento pausado com sucesso!');
      return resultado;

    } catch (err) {
      console.error('Erro ao pausar atendimento:', err);
      setError(err.message);
      toast.error('Erro ao pausar atendimento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancelar atendimento
  const cancelarAtendimento = useCallback(async (dadosCancelamento) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/atendimentos/${dadosCancelamento.atendimentoId}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          motivo: dadosCancelamento.motivo,
          observacoes: dadosCancelamento.observacoes,
          timestamp: dadosCancelamento.timestamp
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar atendimento');
      }

      const resultado = await response.json();

      toast.success('Atendimento cancelado com sucesso!');
      return resultado;

    } catch (err) {
      console.error('Erro ao cancelar atendimento:', err);
      setError(err.message);
      toast.error('Erro ao cancelar atendimento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    iniciarAtendimento,
    finalizarAtendimento,
    pausarAtendimento,
    cancelarAtendimento,
    buscarAtendimento,
    atualizarAtendimento,
    buscarAtendimentosProfissional,
    buscarAtendimentosPaciente,
    adicionarEvolucao,
    clearError
  };
};
