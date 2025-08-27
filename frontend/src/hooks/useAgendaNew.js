import { useState, useEffect } from 'react';
import { agendaService } from '../services/api';
import { mockAgendaData } from '../data/mockAgendaData';
import toast from 'react-hot-toast';

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
      
      // Fallback para dados mock sempre para demonstração
      console.warn('Usando dados mock para demonstração');
      setAgendamentos(mockAgendaData.agendamentos);
      setEquipamentos(mockAgendaData.equipamentos);
      setLembretes(mockAgendaData.lembretes);
      setInsights(mockAgendaData.insights);

    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error);
      setError(error.message);
      // toast.error('Erro ao carregar dados');
      console.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Criar novo agendamento
  const criarAgendamento = async (dadosAgendamento) => {
    try {
      setLoading(true);
      
      // Simulação para demonstração
      const novoAgendamento = {
        id: Date.now(),
        ...dadosAgendamento,
        status: 'pendente',
        title: `${dadosAgendamento.paciente?.nome || 'Paciente'} - ${dadosAgendamento.procedimento}`
      };
      
      setAgendamentos(prev => [...prev, novoAgendamento]);
      toast.success('Agendamento criado (modo demonstração)');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setError(error.message);
      toast.error('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  // Editar agendamento existente
  const editarAgendamento = async (id, dadosAtualizados) => {
    try {
      setLoading(true);
      
      // Simulação para demonstração
      setAgendamentos(prev => 
        prev.map(ag => ag.id === id ? { ...ag, ...dadosAtualizados } : ag)
      );
      toast.success('Agendamento atualizado (modo demonstração)');
    } catch (error) {
      console.error('Erro ao editar agendamento:', error);
      setError(error.message);
      toast.error('Erro ao editar agendamento');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar agendamento
  const cancelarAgendamento = async (id, motivo) => {
    try {
      setLoading(true);
      
      // Simulação para demonstração
      setAgendamentos(prev => 
        prev.map(ag => ag.id === id ? { ...ag, status: 'cancelado', motivo } : ag)
      );
      toast.success('Agendamento cancelado (modo demonstração)');
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      setError(error.message);
      toast.error('Erro ao cancelar agendamento');
    } finally {
      setLoading(false);
    }
  };

  // Enviar lembrete
  const enviarLembrete = async (agendamentoId, tipo = 'automatico') => {
    try {
      // Simulação para demonstração
      setLembretes(prev => 
        prev.map(lem => 
          lem.agendamentoId === agendamentoId 
            ? { ...lem, enviado: true, dataEnvio: new Date() }
            : lem
        )
      );
      toast.success('Lembrete enviado (modo demonstração)');
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      toast.error('Erro ao enviar lembrete');
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
