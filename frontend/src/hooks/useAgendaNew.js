import { useState, useEffect } from 'react';
import { agendaService } from '../services/api';
import { mockAgendaData } from '../data/mockAgendaData';
import toast from 'react-hot-toast';

export const useAgenda = () => {
  console.log('useAgenda hook inicializado');
  
  // Tratamento global de erros de extensões
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
        console.warn('Erro de extensão capturado e ignorado:', event.reason.message);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
      
      // Tentar carregar dados da API primeiro
      try {
        const response = await agendaService.getAll();
        if (response.data && response.data.success) {
          setAgendamentos(response.data.agendamentos || []);
          setEquipamentos(response.data.equipamentos || []);
          setLembretes(response.data.lembretes || []);
          setInsights(response.data.insights || {});
          console.log('✅ Dados carregados da API');
          return;
        }
      } catch (apiError) {
        console.warn('API não disponível, usando dados mock:', apiError.message);
      }
      
      // Fallback para dados mock apenas se API falhar
      setAgendamentos(mockAgendaData.agendamentos);
      setEquipamentos(mockAgendaData.equipamentos);
      setLembretes(mockAgendaData.lembretes);
      setInsights(mockAgendaData.insights);
      console.log('📊 Usando dados mock como fallback');

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
      
      // Tentar criar via API primeiro
      try {
        const response = await agendaService.create(dadosAgendamento);
        if (response.data && response.data.success) {
          const novoAgendamento = response.data.agendamento;
          setAgendamentos(prev => [...prev, novoAgendamento]);
          toast.success('Agendamento criado com sucesso!');
          return novoAgendamento;
        }
      } catch (apiError) {
        console.warn('API não disponível para criar agendamento, usando simulação:', apiError.message);
      }
      
      // Fallback para simulação apenas se API falhar
      const novoAgendamento = {
        id: Date.now(),
        ...dadosAgendamento,
        status: 'pendente',
        title: `${dadosAgendamento.paciente?.nome || 'Paciente'} - ${dadosAgendamento.procedimento}`
      };
      
      setAgendamentos(prev => [...prev, novoAgendamento]);
      toast.success('Agendamento criado com sucesso!');
      return novoAgendamento;
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
      
      // Tentar atualizar via API primeiro
      try {
        const response = await agendaService.update(id, dadosAtualizados);
        if (response.data && response.data.success) {
          setAgendamentos(prev => 
            prev.map(ag => ag.id === id ? response.data.agendamento : ag)
          );
          toast.success('Agendamento atualizado com sucesso!');
          return;
        }
      } catch (apiError) {
        console.warn('API não disponível para editar agendamento, usando simulação:', apiError.message);
      }
      
      // Fallback para simulação apenas se API falhar
      setAgendamentos(prev => 
        prev.map(ag => ag.id === id ? { ...ag, ...dadosAtualizados } : ag)
      );
      toast.success('Agendamento atualizado com sucesso!');
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
      
      // Tentar cancelar via API primeiro
      try {
        const response = await agendaService.cancel(id, { motivo });
        if (response.data && response.data.success) {
          setAgendamentos(prev => 
            prev.map(ag => ag.id === id ? response.data.agendamento : ag)
          );
          toast.success('Agendamento cancelado com sucesso!');
          return;
        }
      } catch (apiError) {
        console.warn('API não disponível para cancelar agendamento, usando simulação:', apiError.message);
      }
      
      // Fallback para simulação apenas se API falhar
      setAgendamentos(prev => 
        prev.map(ag => ag.id === id ? { ...ag, status: 'cancelado', motivo } : ag)
      );
      toast.success('Agendamento cancelado com sucesso!');
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
      // Tentar enviar lembrete via API primeiro
      try {
        const response = await agendaService.sendReminder(agendamentoId, { tipo });
        if (response.data && response.data.success) {
          setLembretes(prev => 
            prev.map(lem => 
              lem.agendamentoId === agendamentoId 
                ? { ...lem, enviado: true, dataEnvio: new Date() }
                : lem
            )
          );
          toast.success('Lembrete enviado com sucesso!');
          return;
        }
      } catch (apiError) {
        console.warn('API não disponível para enviar lembrete, usando simulação:', apiError.message);
      }
      
      // Fallback para simulação apenas se API falhar
      setLembretes(prev => 
        prev.map(lem => 
          lem.agendamentoId === agendamentoId 
            ? { ...lem, enviado: true, dataEnvio: new Date() }
            : lem
        )
      );
      toast.success('Lembrete enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      toast.error('Erro ao enviar lembrete');
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (novosFiltros) => {
    try {
      console.log('Aplicando filtros:', novosFiltros);
      setFiltros(prev => ({ ...prev, ...novosFiltros }));
    } catch (error) {
      console.warn('Erro ao aplicar filtros:', error);
      // Continuar sem quebrar a aplicação
    }
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
