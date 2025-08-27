import { useState, useEffect } from 'react';
import { mockAgendaData } from '../data/mockAgendaData';

export const useAgenda = () => {
  console.log('useAgenda hook inicializado');
  const [agendamentos, setAgendamentos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [insights, setInsights] = useState({});
  const [filtros, setFiltros] = useState({
    status: 'todos',
    profissional: 'todos',
    procedimento: 'todos',
    dataInicio: null,
    dataFim: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Carregando dados mock...');
      console.log('mockAgendaData:', mockAgendaData);
      
      setAgendamentos(mockAgendaData.agendamentos || []);
      setEquipamentos(mockAgendaData.equipamentos || []);
      setLembretes(mockAgendaData.lembretes || []);
      setInsights(mockAgendaData.insights || {});

    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo agendamento
  const criarAgendamento = async (dadosAgendamento) => {
    try {
      setLoading(true);
      const novoAgendamento = { ...dadosAgendamento, id: Date.now() };
      setAgendamentos(prev => [...prev, novoAgendamento]);
      console.log('Agendamento criado (modo demonstração)');
      return novoAgendamento;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Editar agendamento
  const editarAgendamento = async (id, dadosAtualizados) => {
    try {
      setLoading(true);
      setAgendamentos(prev => 
        prev.map(ag => ag.id === id ? { ...ag, ...dadosAtualizados } : ag)
      );
      console.log('Agendamento atualizado (modo demonstração)');
    } catch (error) {
      console.error('Erro ao editar agendamento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cancelar agendamento
  const cancelarAgendamento = async (id, motivo) => {
    try {
      setLoading(true);
      setAgendamentos(prev => 
        prev.map(ag => 
          ag.id === id 
            ? { ...ag, status: 'cancelado', motivoCancelamento: motivo }
            : ag
        )
      );
      console.log('Agendamento cancelado (modo demonstração)');
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar lembrete
  const enviarLembrete = async (agendamentoId, tipo = 'whatsapp') => {
    try {
      console.log(`Enviando lembrete ${tipo} para agendamento ${agendamentoId}`);
      console.log('Lembrete enviado (modo demonstração)');
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (novosFiltros) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  const hookData = {
    // Estados
    agendamentos,
    equipamentos,
    lembretes,
    insights,
    filtros,
    loading,
    error,
    
    // Ações
    criarAgendamento,
    editarAgendamento,
    cancelarAgendamento,
    enviarLembrete,
    aplicarFiltros,
    carregarDados
  };

  console.log('useAgenda retornando:', hookData);
  return hookData;
};
