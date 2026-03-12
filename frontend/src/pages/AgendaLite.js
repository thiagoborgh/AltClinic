import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  Paper,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  ButtonGroup,
  InputAdornment,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add,
  Block,
  Notes,
  CheckCircle,
  AccessTime,
  Warning,
  Search,
  ArrowBackIos,
  ArrowForwardIos,
  ViewDay,
  ViewWeek,
  ViewModule,
  Refresh,
  HourglassEmpty,
  Event,
  Menu,
  MenuOpen,
  Settings,
  Edit
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/pt-br';

// Hooks
import { useProfessionalSchedules } from '../hooks/useProfessionalSchedules';
import { useToast } from '../hooks/useToast';
import { useAgendaCache } from '../stores/agendaCache';
import { usePacienteSearch } from '../hooks/useDebounce';

// Serviços
import agendamentoService from '../services/agendamentoService';

// Componentes
import ConfiguracaoGrade from '../components/ConfiguracaoGrade';
import LoadingButton from '../components/common/LoadingButton';
import VirtualizedAgendaList from '../components/common/VirtualizedAgendaList';
import { LazyModalAgendamento, LazyModalListaEspera, LazyConfiguracaoGrade } from '../components/common/LazyModal';

// Estilos
import '../styles/agenda-lite.css';

// Configuração do moment
moment.locale('pt-br');

const AgendaLite = () => {
  const navigate = useNavigate();

  // Hooks de cache e busca
  const {
    fetchProfissionais,
    fetchPacientes,
    setProfissionais,
    setPacientes,
    profissionais,
    pacientes,
    getPacienteById,
    getProfissionalById
  } = useAgendaCache();

  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [viewMode, setViewMode] = useState('semanal'); // diaria, semanal, mensal
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // Controle do menu lateral
  const [configGradeOpen, setConfigGradeOpen] = useState(false); // Modal de configuração de grade
  const [listaEsperaOpen, setListaEsperaOpen] = useState(false); // Modal de lista de espera
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false); // Modal de agendamento
  const [selectedSlotForAgendamento, setSelectedSlotForAgendamento] = useState(null); // Slot selecionado para agendamento
  const [addProfissionalModalOpen, setAddProfissionalModalOpen] = useState(false); // Modal aviso de cobrança ao adicionar profissional
  
  // Estados para bloqueio
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState(30);
  
  // Hook para busca de pacientes com debounce
  const {
    isSearching: pacientesSearching,
    results: pacientesFiltrados,
    clearResults
  } = usePacienteSearch(searchTerm);
  
  // Função para obter cores das campanhas sazonais
  const getCampanhaColor = () => {
    const mes = moment().month() + 1; // moment() retorna 0-11, ajustamos para 1-12
    
    const campanhas = {
      1: { cor: '#ffffff', gradiente: '#f8f9fa', nome: 'Janeiro Branco', campanha: 'Saúde Mental' },
      2: { cor: '#9c27b0', gradiente: '#e1bee7', nome: 'Fevereiro Roxo/Laranja', campanha: 'Alzheimer e Leucemia' },
      3: { cor: '#4fc3f7', gradiente: '#b3e5fc', nome: 'Março Azul', campanha: 'Câncer Colorretal' },
      4: { cor: '#4caf50', gradiente: '#c8e6c9', nome: 'Abril Verde', campanha: 'Segurança no Trabalho' },
      5: { cor: '#ffeb3b', gradiente: '#fff9c4', nome: 'Maio Amarelo', campanha: 'Trânsito Seguro' },
      6: { cor: '#ff9800', gradiente: '#ffe0b2', nome: 'Junho Laranja', campanha: 'Anemia e Leucemia' },
      7: { cor: '#795548', gradiente: '#d7ccc8', nome: 'Julho Amarelo', campanha: 'Hepatites Virais' },
      8: { cor: '#ff9800', gradiente: '#ffe0b2', nome: 'Agosto Dourado', campanha: 'Aleitamento Materno' },
      9: { cor: '#ffeb3b', gradiente: '#fff9c4', nome: 'Setembro Amarelo', campanha: 'Prevenção ao Suicídio' },
      10: { cor: '#e91e63', gradiente: '#f8bbd9', nome: 'Outubro Rosa', campanha: 'Câncer de Mama' },
      11: { cor: '#2196f3', gradiente: '#bbdefb', nome: 'Novembro Azul', campanha: 'Câncer de Próstata' },
      12: { cor: '#f44336', gradiente: '#ffcdd2', nome: 'Dezembro Vermelho', campanha: 'AIDS/HIV' }
    };
    
    return campanhas[mes] || campanhas[10]; // Default para Outubro Rosa se não encontrar
  };
  
  // Hook para horários dinâmicos
  const {
    getAvailableTimesForDay,
    refetch: refetchSchedules
  } = useProfessionalSchedules(selectedProfessional);

  // Profissionais vêm do cache do Zustand

  // Função para salvar agendamento (integrada com API)
  const handleSaveAgendamento = async (agendamentoData) => {
    console.log('💾 INÍCIO: Salvando agendamento:', agendamentoData);
    
    try {
      if (agendamentoData.isEdit) {
        // Atualizar agendamento existente via API
        console.log('📝 EDIÇÃO: Atualizando via API...');
        
        const agendamentoAtualizado = await agendamentoService.atualizarAgendamentoLite(
          agendamentoData.agendamentoId,
          {
            horario: agendamentoData.horario,
            data: agendamentoData.data,
            paciente: agendamentoData.paciente,
            procedimento: agendamentoData.procedimento || 'Consulta',
            profissional: agendamentoData.profissional || selectedProfessional,
            convenio: agendamentoData.convenio || 'particular',
            status: agendamentoData.status || 'não confirmado',
            valor: parseFloat(agendamentoData.valor) || 0,
            observacoes: agendamentoData.observacoes
          }
        );
        
        console.log('✅ API: Agendamento atualizado:', agendamentoAtualizado);
        
        // Atualizar estado local e recarregar para garantir sincronia
        setAgendamentos(prev => {
          const updated = prev.map(ag =>
            ag.id === agendamentoData.agendamentoId ? agendamentoAtualizado : ag
          );
          console.log('📋 EDIÇÃO: Lista após atualização:', updated);
          return updated;
        });
        await carregarAgendamentos();
        
        // Mostrar mensagem de sucesso
        const statusMsg = agendamentoData.status === 'não confirmado' ? 'Status: Não confirmado' : `Status: ${agendamentoData.status}`;
        setAlertMessage(`✅ Agendamento atualizado com sucesso para ${agendamentoData.paciente} às ${agendamentoData.horario}! ${statusMsg}`);
        setAlertModalOpen(true);
        
      } else {
        // Criar novo agendamento via API
        console.log('📝 CRIAÇÃO: Criando via API...');
        
        const novoAgendamento = await agendamentoService.criarAgendamentoLite({
          horario: agendamentoData.horario,
          data: agendamentoData.data,
          paciente: agendamentoData.paciente,
          procedimento: agendamentoData.procedimento || 'Consulta',
          profissional: agendamentoData.profissional || selectedProfessional,
          convenio: agendamentoData.convenio || 'particular',
          status: agendamentoData.status || 'não confirmado',
          valor: parseFloat(agendamentoData.valor) || 0,
          observacoes: agendamentoData.observacoes
        });
        
        console.log('✅ API: Agendamento criado:', novoAgendamento);
        
        // Atualizar estado local temporariamente
        setAgendamentos(prev => {
          console.log('📝 CRIAÇÃO: Estado anterior:', prev);
          const updatedAgendamentos = [...prev, novoAgendamento];
          console.log('📋 CRIAÇÃO: Lista após adição:', updatedAgendamentos);
          return updatedAgendamentos;
        });

        // Recarregar agendamentos da API para garantir sincronia
        console.log('🔄 SINCRONIZAÇÃO: Recarregando agendamentos da API...');
        await carregarAgendamentos();
        
        // Mostrar mensagem de sucesso
        const statusMsg = agendamentoData.status === 'não confirmado' ? 'Status: Não confirmado' : `Status: ${agendamentoData.status}`;
        setAlertMessage(`✅ Agendamento criado com sucesso para ${agendamentoData.paciente} às ${agendamentoData.horario}! ${statusMsg}`);
        setAlertModalOpen(true);
      }
      
      console.log('🔄 FINALIZANDO: Fechando modal...');
      setAgendamentoModalOpen(false);
      console.log('✅ CONCLUÍDO: Modal fechado');
      
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error);
      setAlertMessage(`❌ Erro ao salvar agendamento: ${error.message}`);
      setAlertModalOpen(true);
    }
  };

  // Procedimentos com duração (para uso futuro)
  /*
  const procedimentos = [
    { id: 1, nome: 'Consulta', duracao: 30, valor: 150 },
    { id: 2, nome: 'Procedimento Estético', duracao: 60, valor: 300 },
    { id: 3, nome: 'Laser', duracao: 45, valor: 250 },
    { id: 4, nome: 'Cirurgia Menor', duracao: 90, valor: 500 }
  ];
  */

  // Estado dos agendamentos - carregar da API
  const [agendamentos, setAgendamentos] = useState([]);

  // Carregar agendamentos da API
  const carregarAgendamentos = async () => {
    try {
      console.log('🔄 Carregando agendamentos da API...');

      // Carregar dados em paralelo para performance
      const [profissionaisData, pacientesData] = await Promise.all([
        fetchProfissionais().catch(err => {
          console.warn('Erro ao carregar profissionais:', err);
          return [];
        }),
        fetchPacientes().catch(err => {
          console.warn('Erro ao carregar pacientes:', err);
          return [];
        })
      ]);

      // Definir intervalo de datas (ex: últimos 30 dias e próximos 30 dias)
      const dataInicio = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const dataFim = moment().add(30, 'days').format('YYYY-MM-DD');

      const agendamentosAPI = await agendamentoService.buscarAgendamentosLite({
        data_inicio: dataInicio,
        data_fim: dataFim
      });
      
      console.log('✅ Agendamentos carregados da API:', agendamentosAPI);
      
      setAgendamentos(agendamentosAPI);
      
      // Tentar migrar dados do localStorage se existirem e a API estiver vazia (SEM notificação)
      if (agendamentosAPI.length === 0) {
        await tentarMigracaoLocalStorage(true); // Passar flag para silenciar
      }
      
    } catch (error) {
      console.log('ℹ️ Usando agendamentos locais');
      
      // Fallback para localStorage em caso de erro da API (sem notificação)
      await carregarFallbackLocalStorage();
    }
  };

  // Migração do localStorage para API
  const tentarMigracaoLocalStorage = async (silencioso = false) => {
    try {
      const savedAgendamentos = localStorage.getItem('agendamentos');
      if (savedAgendamentos) {
        const agendamentosLS = JSON.parse(savedAgendamentos);
        if (agendamentosLS.length > 0) {
          console.log('🔄 Migrando agendamentos do localStorage para API...');
          
          const agendamentosMigrados = await agendamentoService.migrarLocalStorageParaBanco(agendamentosLS);
          
          if (agendamentosMigrados.length > 0) {
            setAgendamentos(agendamentosMigrados);
            
            // Limpar localStorage após migração bem-sucedida
            localStorage.removeItem('agendamentos');
            
            // Apenas mostrar toast se não for silencioso
            if (!silencioso) {
              showToast(`${agendamentosMigrados.length} agendamentos migrados com sucesso!`, 'success');
            }
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Nenhuma migração necessária');
      // NÃO mostrar erro ao usuário
    }
  };

  // Fallback para localStorage em caso de erro da API
  const carregarFallbackLocalStorage = async () => {
    try {
      const savedAgendamentos = localStorage.getItem('agendamentos');
      if (savedAgendamentos) {
        const agendamentosLS = JSON.parse(savedAgendamentos);
        setAgendamentos(agendamentosLS);
        console.log('📱 Usando agendamentos do localStorage como fallback');
      } else {
        // Usar dados mock se não há nada nem na API nem no localStorage
        setAgendamentos([]);
      }
    } catch (error) {
      console.log('ℹ️ Iniciando com agenda vazia');
      setAgendamentos([]);
    }
  };

  // Carregar agendamentos na inicialização
  useEffect(() => {
    carregarAgendamentos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-selecionar primeiro profissional quando a lista carregar
  useEffect(() => {
    if (profissionais.length > 0 && !selectedProfessional) {
      setSelectedProfessional(String(profissionais[0].id));
    }
  }, [profissionais, selectedProfessional]);

  // Obter profissional atual
  const profissionalAtual = profissionais.find(p => p.id === selectedProfessional);

  // Obter cores da campanha atual
  const campanhaAtual = getCampanhaColor();

  // Navegação de datas
  const navigateDate = (direction) => {
    const newDate = moment(selectedDate);
    
    if (viewMode === 'diaria') {
      newDate.add(direction, 'day');
    } else if (viewMode === 'semanal') {
      newDate.add(direction, 'week');
    } else if (viewMode === 'mensal') {
      newDate.add(direction, 'month');
    }
    
    setSelectedDate(newDate.toDate());
  };

  // Obter título da visualização atual
  const getViewTitle = () => {
    const date = moment(selectedDate);
    
    switch (viewMode) {
      case 'diaria':
        return `Agenda diária / ${date.format('dddd, DD [de] MMMM [de] YYYY')}`;
      case 'semanal':
        const startWeek = moment(selectedDate).startOf('week');
        const endWeek = moment(selectedDate).endOf('week');
        return `Agenda semanal / ${startWeek.format('DD/MM')} - ${endWeek.format('DD/MM/YYYY')}`;
      case 'mensal':
        return `Agenda mensal / ${date.format('MMMM [de] YYYY')}`;
      default:
        return 'Agenda';
    }
  };

  // Gerar slots dinâmicos com base na visualização
  const slots = useMemo(() => {
    
    // Funções auxiliares para diferentes visualizações
    const getWeekDays = (date) => {
      const startOfWeek = moment(date).startOf('week');
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(moment(startOfWeek).add(i, 'days').toDate());
      }
      return days;
    };

    const getMonthDays = (date) => {
      const startOfMonth = moment(date).startOf('month');
      const endOfMonth = moment(date).endOf('month');
      const days = [];
      let current = moment(startOfMonth);
      
      while (current.isSameOrBefore(endOfMonth)) {
        days.push(current.toDate());
        current.add(1, 'day');
      }
      return days;
    };

    try {
      if (viewMode === 'diaria') {
        const scheduledTimes = new Set(
          getAvailableTimesForDay(selectedDate, selectedProfessional).map(t => t.time)
        );

        // Grade completa 08:00–17:30 (30 min), independente de grade configurada
        const fullGrid = [];
        for (let h = 8; h <= 17; h++) {
          fullGrid.push(`${String(h).padStart(2, '0')}:00`);
          fullGrid.push(`${String(h).padStart(2, '0')}:30`);
        }

        const diaFormatado = moment(selectedDate).format('YYYY-MM-DD');
        const agendamentosDoDia = agendamentos.filter(a =>
          moment(a.data).format('YYYY-MM-DD') === diaFormatado
        );

        return fullGrid.map(horario => {
          const agendamento = agendamentosDoDia.find(a => a.horario === horario);
          const isScheduled = scheduledTimes.has(horario);
          return {
            horario,
            dia: diaFormatado,
            agendamento,
            bloqueado: false,
            vago: !agendamento,
            tipo: isScheduled ? 'normal' : 'encaixe',
            potencialReceita: 200,
          };
        });
      } else if (viewMode === 'semanal') {
        const weekDays = getWeekDays(selectedDate);
        const weekSlots = [];

        // Grade completa 08:00–17:30 reutilizada para todos os dias da semana
        const fullGrid = [];
        for (let h = 8; h <= 17; h++) {
          fullGrid.push(`${String(h).padStart(2, '0')}:00`);
          fullGrid.push(`${String(h).padStart(2, '0')}:30`);
        }

        weekDays.forEach(day => {
          const scheduledTimes = new Set(
            getAvailableTimesForDay(day, selectedProfessional).map(t => t.time)
          );
          const dayKey = moment(day).format('YYYY-MM-DD');

          fullGrid.forEach(horario => {
            const agendamento = agendamentos.find(a =>
              a.horario === horario &&
              moment(a.data || day).format('YYYY-MM-DD') === dayKey
            );
            const isScheduled = scheduledTimes.has(horario);

            weekSlots.push({
              horario,
              dia: dayKey,
              diaFormatado: moment(day).format('ddd DD/MM'),
              agendamento,
              bloqueado: false,
              vago: !agendamento,
              tipo: isScheduled ? 'normal' : 'encaixe',
              potencialReceita: 200,
            });
          });
        });

        return weekSlots;
      } else {
        // Visualização mensal - resumo dos dias
        const monthDays = getMonthDays(selectedDate);
        const monthSlots = [];
        
        monthDays.forEach(day => {
          const dayKey = moment(day).format('YYYY-MM-DD');
          const dayAgendamentos = agendamentos.filter(a => 
            moment(a.data || day).format('YYYY-MM-DD') === dayKey
          );
          
          monthSlots.push({
            dia: dayKey,
            diaFormatado: moment(day).format('DD'),
            agendamentos: dayAgendamentos,
            totalAgendamentos: dayAgendamentos.length,
            receitaDia: dayAgendamentos.reduce((sum, a) => sum + (a.valor || 0), 0)
          });
        });
        
        return monthSlots;
      }
    } catch (error) {
      console.error('❌ Erro ao gerar slots:', error);
      return [];
    }
  }, [getAvailableTimesForDay, selectedDate, selectedProfessional, agendamentos, viewMode]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    // Filtrar slots com base na busca se houver termo de busca
    let filteredSlots = slots;
    if (searchTerm) {
      filteredSlots = slots.filter(slot => {
        if (slot.agendamento) {
          return slot.agendamento.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 slot.agendamento.procedimento.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }
    
    const totalSlots = slots.length;
    const slotsOcupados = slots.filter(s => s.agendamento).length;
    const slotsVagos = slots.filter(s => s.vago).length;
    const slotsBloqueados = slots.filter(s => s.bloqueado).length;
    const receitaConfirmada = agendamentos.filter(a => a.status === 'confirmado').reduce((sum, a) => sum + a.valor, 0);
    const potencialReceita = slotsVagos * 200; // Valor médio

    return {
      totalSlots,
      slotsOcupados,
      slotsVagos,
      slotsBloqueados,
      taxaOcupacao: totalSlots > 0 ? ((slotsOcupados / totalSlots) * 100).toFixed(1) : 0,
      receitaConfirmada,
      potencialReceita,
      filteredSlots,
      hasFilter: !!searchTerm
    };
  }, [slots, agendamentos, searchTerm]);

  // Manipular clique no slot
  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    if (slot.vago) {
      setSelectedSlotForAgendamento({
        ...slot,
        professionalId: selectedProfessional,
        isEncaixe: slot.tipo === 'encaixe',
      });
      setAgendamentoModalOpen(true);
    } else if (slot.agendamento) {
      setSelectedSlotForAgendamento({ ...slot, professionalId: selectedProfessional, isEdit: true });
      setAgendamentoModalOpen(true);
    }
  };

  // Validar procedimento e duração (disponível para uso futuro)
  // eslint-disable-next-line no-unused-vars
  /*
  const validateProcedimento = (procedimentoId, slotInicial) => {
    // Mock de procedimentos para demonstração
    const procedimentos = [
      { id: 1, nome: 'Consulta', duracao: 30, valor: 150 },
      { id: 2, nome: 'Procedimento Estético', duracao: 60, valor: 300 },
      { id: 3, nome: 'Laser', duracao: 45, valor: 250 },
      { id: 4, nome: 'Cirurgia Menor', duracao: 90, valor: 500 }
    ];

    const procedimento = procedimentos.find(p => p.id === procedimentoId);
    if (!procedimento) return false;

    const slotsNecessarios = Math.ceil(procedimento.duracao / 30);
    
    // Para visualização diária/semanal, verificar slots consecutivos
    if (viewMode === 'diaria' || viewMode === 'semanal') {
      const slotsDoMesmoDia = slots.filter(s => s.dia === slotInicial.dia);
      const indexInicial = slotsDoMesmoDia.findIndex(s => s.horario === slotInicial.horario);
      
      // Verificar se há slots suficientes consecutivos
      for (let i = 0; i < slotsNecessarios; i++) {
        const slotIndex = indexInicial + i;
        if (slotIndex >= slotsDoMesmoDia.length || !slotsDoMesmoDia[slotIndex].vago) {
          const proximoSlotLivre = findNextAvailableSlot(slotInicial, slotsNecessarios);
          setAlertMessage(
            `O procedimento "${procedimento.nome}" (${procedimento.duracao} min) requer ${slotsNecessarios} slots consecutivos livres. ` +
            (proximoSlotLivre ? `Sugestão: Use ${proximoSlotLivre}` : 'Não há horários suficientes disponíveis hoje.')
          );
          setAlertModalOpen(true);
          return false;
        }
      }
    }
    
    return true;
  };
  */

  // Encontrar próximo slot disponível
  /*
  const findNextAvailableSlot = (slotInicial, slotsNecessarios) => {
    const slotsDoMesmoDia = slots.filter(s => s.dia === slotInicial.dia);
    
    for (let i = 0; i < slotsDoMesmoDia.length - slotsNecessarios + 1; i++) {
      let consecutivos = true;
      
      for (let j = 0; j < slotsNecessarios; j++) {
        if (!slotsDoMesmoDia[i + j] || !slotsDoMesmoDia[i + j].vago) {
          consecutivos = false;
          break;
        }
      }
      
      if (consecutivos) {
        const inicio = slotsDoMesmoDia[i].horario;
        const fim = moment(inicio, 'HH:mm').add(slotsNecessarios * 30, 'minutes').format('HH:mm');
        return `${inicio}-${fim}`;
      }
    }
    
    return null;
  };
  */

  // Bloquear slot
  const handleBlockSlot = () => {
    if (!selectedSlot) return;
    
    // Temporariamente desabilitado - sistema de bloqueios
    // const novoBloquio = {
    //   horario: selectedSlot.horario,
    //   duracao: blockDuration,
    //   motivo: blockReason || 'Bloqueio manual'
    // };
    
    // setBloqueios(prev => [...prev, novoBloquio]);
    setBlockModalOpen(false);
    setBlockReason('');
    setBlockDuration(30);
    showToast('Horário bloqueado com sucesso', 'success');
  };

  // Função para validar procedimento (implementar futuramente)
  /*
  const validateProcedimento = (procedimentoId, slotInicial) => {
    const procedimento = procedimentos.find(p => p.id === procedimentoId);
    if (!procedimento) return false;

    const slotsNecessarios = Math.ceil(procedimento.duracao / 30);
    const indexInicial = slots.findIndex(s => s.horario === slotInicial.horario);
    
    // Verificar se há slots suficientes consecutivos
    for (let i = 0; i < slotsNecessarios; i++) {
      const slotIndex = indexInicial + i;
      if (slotIndex >= slots.length || !slots[slotIndex].vago) {
        setAlertMessage(`O procedimento "${procedimento.nome}" (${procedimento.duracao} min) requer ${slotsNecessarios} slots consecutivos livres. Encontre um horário com mais disponibilidade.`);
        setAlertModalOpen(true);
        return false;
      }
    }
    
    return true;
  };
  */

  return (
    <Box className="agenda-lite-container" sx={{ p: 3 }}>
      {/* Barra Superior estilo Feegow com cores da campanha */}
      <Tooltip title={`${campanhaAtual.nome} - ${campanhaAtual.campanha}`} arrow>
        <Paper 
          className="agenda-lite-header" 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            background: `linear-gradient(135deg, ${campanhaAtual.cor} 0%, ${campanhaAtual.gradiente} 100%)`,
            color: campanhaAtual.cor === '#ffffff' || campanhaAtual.cor === '#ffeb3b' ? '#333333' : '#ffffff',
            cursor: 'help'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={sidebarExpanded ? "Esconder menu lateral" : "Mostrar menu lateral"}>
                  <IconButton 
                    onClick={() => setSidebarExpanded(!sidebarExpanded)} 
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    {sidebarExpanded ? <MenuOpen /> : <Menu />}
                  </IconButton>
                </Tooltip>
                
                <IconButton onClick={() => navigateDate(-1)} size="small">
                  <ArrowBackIos />
                </IconButton>
              
              <Typography variant="h6" sx={{ minWidth: 250, textAlign: 'center' }}>
                {getViewTitle()}
              </Typography>
              
              <IconButton onClick={() => navigateDate(1)} size="small">
                <ArrowForwardIos />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <ButtonGroup variant="outlined" size="small" fullWidth>
              <Button
                startIcon={<ViewDay />}
                variant={viewMode === 'diaria' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('diaria')}
              >
                Diária
              </Button>
              <Button
                startIcon={<ViewWeek />}
                variant={viewMode === 'semanal' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('semanal')}
              >
                Semanal
              </Button>
              <Button
                startIcon={<ViewModule />}
                variant={viewMode === 'mensal' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('mensal')}
              >
                Mensal
              </Button>
            </ButtonGroup>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Tooltip title="Atualizar">
                <IconButton size="small" onClick={() => carregarAgendamentos()}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Notas">
                <IconButton size="small">
                  <Notes />
                </IconButton>
              </Tooltip>
              <Tooltip title="Lista de Espera">
                <IconButton 
                  size="small"
                  onClick={() => {
                    console.log('📋 Abrindo lista de espera');
                    setListaEsperaOpen(true);
                  }}
                >
                  <HourglassEmpty />
                </IconButton>
              </Tooltip>
              <Tooltip title={profissionais.length === 0 ? "Cadastre um profissional primeiro" : "Configurar Grade"}>
                <span>
                  <IconButton
                    size="small"
                    disabled={profissionais.length === 0}
                    onClick={() => {
                      setConfigGradeOpen(true);
                    }}
                  >
                    <Settings />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      </Tooltip>

      <Grid container spacing={3}>
        {/* Filtros Laterais - Condicionalmente visível */}
        {sidebarExpanded && (
          <Grid item xs={12} md={3} className="sidebar-toggle-animation">
            {/* Busca Rápida */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Busca Rápida
              </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar paciente, procedimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            {searchTerm && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Filtrando por: "{searchTerm}"
                </Typography>
                <Typography variant="caption" color="primary" display="block">
                  {stats.filteredSlots.length} resultado(s) encontrado(s)
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => setSearchTerm('')}
                  sx={{ mt: 0.5, fontSize: '0.7rem' }}
                >
                  Limpar filtro
                </Button>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filtros
            </Typography>

            {profissionais.length === 0 ? (
              <Box sx={{ mb: 2 }}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Nenhum profissional cadastrado. A agenda fica desabilitada até adicionar um profissional.
                </Alert>
                <Alert severity="info" icon={false} sx={{ mb: 2, py: 1 }}>
                  <Typography variant="caption" display="block" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Cada profissional: +consulte seu plano
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Veja os detalhes do seu plano. Confira em <strong>Assinatura</strong>.
                  </Typography>
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => { navigate('/profissionais'); }}
                >
                  Cadastrar Profissional
                </Button>
              </Box>
            ) : (
              <>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel>Profissional</InputLabel>
                  <Select
                    value={selectedProfessional}
                    label="Profissional"
                    onChange={(e) => setSelectedProfessional(e.target.value)}
                  >
                    {profissionais.map(prof => (
                      <MenuItem key={prof.id} value={String(prof.id)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: prof.cor || 'primary.main', fontSize: 12 }}>
                            {prof.nome.charAt(0)}
                          </Avatar>
                          {prof.nome}
                          {prof.especialidade && (
                            <Typography variant="caption" color="text.secondary">
                              · {prof.especialidade}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setAddProfissionalModalOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Adicionar Profissional
                </Button>
              </>
            )}

            {profissionalAtual && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {profissionalAtual.nome}
                </Typography>
                {profissionalAtual.especialidade && (
                  <Typography variant="caption">
                    {profissionalAtual.especialidade}
                  </Typography>
                )}
              </Alert>
            )}
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Estatísticas Rápidas
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Slots Livres:</Typography>
                <Chip size="small" color="success" label={stats.slotsVagos} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Ocupação:</Typography>
                <Chip size="small" color="primary" label={`${stats.taxaOcupacao}%`} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Potencial:</Typography>
                <Chip size="small" color="warning" label={`R$ ${stats.potencialReceita}`} />
              </Box>
            </Stack>
          </Paper>
          
          {/* Próximos Agendamentos */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Próximos Agendamentos
            </Typography>
            {(() => {
              const agora = moment();
              const proximos = agendamentos
                .filter(a => {
                  const dt = moment(`${a.data} ${a.horario}`, 'YYYY-MM-DD HH:mm');
                  return dt.isSameOrAfter(agora) && a.status !== 'cancelado';
                })
                .sort((a, b) => {
                  const da = moment(`${a.data} ${a.horario}`, 'YYYY-MM-DD HH:mm');
                  const db = moment(`${b.data} ${b.horario}`, 'YYYY-MM-DD HH:mm');
                  return da - db;
                })
                .slice(0, 5);

              if (proximos.length === 0) {
                return (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                    Nenhum agendamento futuro
                  </Typography>
                );
              }

              return (
                <List dense>
                  {proximos.map(agendamento => (
                    <ListItem key={agendamento.id} divider>
                      <ListItemIcon>
                        <Event color={agendamento.status === 'confirmado' ? 'success' : 'warning'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${agendamento.horario} – ${agendamento.paciente}`}
                        secondary={`${moment(agendamento.data).format('DD/MM')} · ${agendamento.procedimento}`}
                      />
                    </ListItem>
                  ))}
                </List>
              );
            })()}
          </Paper>
          </Grid>
        )}

        {/* Grade Central */}
        <Grid item xs={12} md={sidebarExpanded ? 9 : 12} className="main-content-expanded">
          {profissionais.length === 0 ? (
            // Empty state quando não há profissional cadastrado
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 2 }}>👨‍⚕️</Typography>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Nenhum profissional cadastrado
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 420, mx: 'auto' }}>
                Para usar a agenda você precisa cadastrar ao menos um profissional e configurar os horários de atendimento.
              </Typography>
              <Alert severity="info" icon={false} sx={{ mb: 3, maxWidth: 420, mx: 'auto', textAlign: 'left' }}>
                <Typography variant="caption" display="block" fontWeight="bold" sx={{ mb: 0.5 }}>
                  Impacto na assinatura: +consulte seu plano por profissional
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Veja os detalhes do seu plano. Cada adicional é +consulte seu plano. Veja detalhes em <strong>Assinatura</strong>.
                </Typography>
              </Alert>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => { navigate('/profissionais'); }}
                >
                  Cadastrar Profissional
                </Button>
              </Stack>
            </Paper>
          ) : viewMode === 'mensal' ? (
            // Visualização Mensal - Calendário
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Calendário Mensal - {profissionalAtual?.nome}
              </Typography>
              
              <Grid container spacing={1}>
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(dia => (
                  <Grid item xs key={dia}>
                    <Typography variant="caption" textAlign="center" display="block" fontWeight="bold">
                      {dia}
                    </Typography>
                  </Grid>
                ))}
                
                {slots.map((daySlot, index) => (
                  <Grid item xs key={index}>
                    <Card
                      sx={{
                        p: 1,
                        minHeight: 60,
                        cursor: 'pointer',
                        bgcolor: daySlot.totalAgendamentos > 0 ? 'primary.light' : 'grey.100',
                        '&:hover .add-day-btn': { opacity: 1 }
                      }}
                      onClick={() => {
                        setSelectedDate(new Date(daySlot.dia));
                        setViewMode('diaria');
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {daySlot.diaFormatado}
                        </Typography>
                        <Tooltip title="Novo agendamento">
                          <IconButton
                            className="add-day-btn"
                            size="small"
                            sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.2s' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSlotForAgendamento({
                                dia: daySlot.dia,
                                horario: null,
                                vago: true,
                                professionalId: selectedProfessional
                              });
                              setAgendamentoModalOpen(true);
                            }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {daySlot.totalAgendamentos > 0 && (
                        <>
                          <Badge badgeContent={daySlot.totalAgendamentos} color="primary" />
                          <Typography variant="caption" display="block">
                            R$ {daySlot.receitaDia}
                          </Typography>
                        </>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ) : (
            // Visualização Diária/Semanal - Grade de Horários
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {viewMode === 'semanal' ? 'Grade Semanal' : 'Grade Diária'} - {profissionalAtual?.nome}
              </Typography>
              
              {viewMode === 'semanal' && (
                // Cabeçalho dos dias da semana
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={1}>
                    <Typography variant="caption" fontWeight="bold">Horário</Typography>
                  </Grid>
                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((dia, index) => (
                    <Grid item xs key={dia}>
                      <Typography variant="caption" fontWeight="bold" textAlign="center" display="block">
                        {dia}
                      </Typography>
                      <Typography variant="caption" textAlign="center" display="block" color="primary">
                        {moment(selectedDate).startOf('week').add(index + 1, 'days').format('DD/MM')}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              <div className="agenda-grid-new">
                {stats.hasFilter && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Mostrando {stats.filteredSlots.length} resultado(s) para "{searchTerm}"
                    {stats.filteredSlots.length === 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Nenhum agendamento encontrado com esse termo.
                      </Typography>
                    )}
                  </Alert>
                )}
                
                {viewMode === 'diaria' ? (
                  // Grade diária - lista vertical
                  (() => {
                    const slotsToRender = stats.hasFilter ? stats.filteredSlots : slots;

                    if (slotsToRender.length === 0) {
                      return (
                        <Card sx={{ p: 4, textAlign: 'center' }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Nenhum horário configurado para este dia
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Configure a grade de horários do profissional para habilitar agendamentos.
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<Settings />}
                            onClick={() => setConfigGradeOpen(true)}
                            disabled={profissionais.length === 0}
                          >
                            Configurar grade de horários
                          </Button>
                        </Card>
                      );
                    }
                    
                    return slotsToRender.map((slot, index) => {
                      return (
                    <Card
                      key={index}
                      className={`slot-card-new ${slot.agendamento ? 'slot-ocupado-new' : slot.tipo === 'encaixe' ? 'slot-encaixe-new' : 'slot-vago-new'} ${selectedSlot?.horario === slot.horario ? 'selected' : ''}`}
                      sx={{ p: 2, mb: 1 }}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {slot.horario}
                          </Typography>
                          {slot.agendamento && (
                            <Box>
                              <Typography variant="body1" color="primary">
                                {slot.agendamento.paciente}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {slot.agendamento.procedimento}
                              </Typography>
                            </Box>
                          )}
                          {slot.bloqueado && (
                            <Typography variant="body2" color="error">
                              Bloqueado
                            </Typography>
                          )}
                          {slot.vago && slot.tipo === 'normal' && (
                            <Box>
                              <Typography variant="body1" color="success.main" fontWeight="bold">
                                Disponível – Potencial R$ {slot.potencialReceita}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Clique para agendar ou bloquear
                              </Typography>
                            </Box>
                          )}
                          {slot.vago && slot.tipo === 'encaixe' && (
                            <Typography variant="body2" color="text.disabled">
                              Vazio
                            </Typography>
                          )}
                        </Box>

                        <Box>
                          {slot.agendamento ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                icon={slot.agendamento.status === 'confirmado' ? <CheckCircle /> : <AccessTime />}
                                label={slot.agendamento.status}
                                size="small"
                                color={slot.agendamento.status === 'confirmado' ? 'success' : 'warning'}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Edit />}
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const slotWithAgendamento = {
                                    ...slot,
                                    professionalId: selectedProfessional,
                                    isEdit: true
                                  };
                                  setSelectedSlotForAgendamento(slotWithAgendamento);
                                  setAgendamentoModalOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                            </Stack>
                          ) : slot.vago && slot.tipo === 'normal' ? (
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Add />}
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSlotForAgendamento({ ...slot, professionalId: selectedProfessional });
                                  setAgendamentoModalOpen(true);
                                }}
                              >
                                Agendar
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Block />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSlot(slot);
                                  setBlockModalOpen(true);
                                }}
                              >
                                Bloquear
                              </Button>
                            </Stack>
                          ) : null}
                        </Box>
                      </Box>
                    </Card>
                    );
                    });
                  })()
                ) : (
                  // Grade semanal - matriz horário x dia
                  <div className="weekly-grid">
                    {/* Cabeçalho dos horários */}
                    <div></div>
                    {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((dia, index) => (
                      <Box key={dia} sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight="bold">
                          {dia}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {moment(selectedDate).startOf('week').add(index + 1, 'days').format('DD/MM')}
                        </Typography>
                      </Box>
                    ))}
                    
                    {/* Matriz de slots */}
                    {(() => {
                      // Agrupar slots por horário
                      const slotsByHour = {};
                      slots.forEach(slot => {
                        if (!slotsByHour[slot.horario]) {
                          slotsByHour[slot.horario] = new Array(7).fill(null);
                        }
                        const dayIndex = moment(slot.dia).day();
                        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Ajustar domingo
                        slotsByHour[slot.horario][adjustedIndex] = slot;
                      });
                      
                      return Object.keys(slotsByHour).sort().map(horario => [
                        <Box key={`hour-${horario}`} sx={{ p: 1, fontWeight: 'bold', bgcolor: 'grey.100', borderRadius: 1, textAlign: 'center' }}>
                          {horario}
                        </Box>,
                        ...slotsByHour[horario].map((slot, dayIndex) => (
                          <Card
                            key={`${horario}-${dayIndex}`}
                            className={`weekly-slot ${slot ? (slot.agendamento ? 'occupied' : slot.tipo === 'encaixe' ? 'encaixe' : 'available') : 'empty'}`}
                            sx={{
                              minHeight: 50,
                              p: 0.5,
                              cursor: slot ? 'pointer' : 'default',
                              opacity: slot ? 1 : 0.3,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              ...(slot?.tipo === 'encaixe' && slot?.vago && {
                                opacity: 0.5,
                              })
                            }}
                            onClick={() => slot && handleSlotClick(slot)}
                          >
                            {slot ? (
                              <>
                                {slot.agendamento && (
                                  <Typography variant="caption" fontWeight="bold" noWrap>
                                    {slot.agendamento.paciente}
                                  </Typography>
                                )}
                                {slot.vago && slot.tipo === 'normal' && (
                                  <Typography variant="caption" color="success.main" fontWeight="bold">
                                    Livre
                                  </Typography>
                                )}
                                {slot.vago && slot.tipo === 'encaixe' && (
                                  <Typography variant="caption" color="text.disabled">
                                    Vazio
                                  </Typography>
                                )}
                                {slot.bloqueado && (
                                  <Typography variant="caption" color="error.main" fontWeight="bold">
                                    Bloqueado
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                N/A
                              </Typography>
                            )}
                          </Card>
                        ))
                      ]).flat();
                    })()}
                  </div>
                )}
              </div>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Modal de Bloqueio */}
      <Dialog open={blockModalOpen} onClose={() => setBlockModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Block />
            Bloquear Horário
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Horário selecionado:</strong> {selectedSlot?.horario}
              </Typography>
              <Typography variant="caption">
                Este horário ficará indisponível para agendamentos.
              </Typography>
            </Alert>
            
            <TextField
              fullWidth
              label="Motivo do bloqueio"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: Pausa para almoço, Feriado, Manutenção, Reunião"
              multiline
              rows={2}
            />
            
            <FormControl fullWidth>
              <InputLabel>Duração</InputLabel>
              <Select
                value={blockDuration}
                label="Duração"
                onChange={(e) => setBlockDuration(e.target.value)}
              >
                <MenuItem value={30}>30 minutos</MenuItem>
                <MenuItem value={60}>1 hora</MenuItem>
                <MenuItem value={90}>1h 30min</MenuItem>
                <MenuItem value={120}>2 horas</MenuItem>
                <MenuItem value={180}>3 horas</MenuItem>
                <MenuItem value={240}>4 horas</MenuItem>
              </Select>
            </FormControl>
            
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Atenção:</strong> Este bloqueio consumirá {Math.ceil(blockDuration / 30)} slot(s) consecutivo(s).
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockModalOpen(false)}>
            Cancelar
          </Button>
          <LoadingButton 
            onClick={handleBlockSlot} 
            variant="contained" 
            startIcon={<Block />}
            disabled={!blockReason.trim()}
            loading={false} // Por enquanto sem loading, pode ser implementado depois
          >
            Confirmar Bloqueio
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Modal de Alerta para Duração */}
      <Dialog open={alertModalOpen} onClose={() => setAlertModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Incompatibilidade de Duração
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {alertMessage}
            </Typography>
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            <strong>Dicas para otimizar sua agenda:</strong>
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Verifique se há slots consecutivos livres em outros horários
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Considere dividir procedimentos longos em sessões menores
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Use a visualização semanal para encontrar melhores horários
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertModalOpen(false)} variant="contained">
            Entendi
          </Button>
          <Button onClick={() => setViewMode('semanal')} variant="outlined">
            Ver Agenda Semanal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Configuração de Grade */}
      <ConfiguracaoGrade
        open={configGradeOpen}
        onClose={() => setConfigGradeOpen(false)}
        professionalId={selectedProfessional}
        onSave={() => refetchSchedules()}
      />

      {/* Modal de Lista de Espera - Lazy Loaded */}
      <LazyModalListaEspera
        open={listaEsperaOpen}
        onClose={() => setListaEsperaOpen(false)}
        professionalId={selectedProfessional}
        onSave={(data) => {
          console.log('📋 Paciente adicionado à lista de espera:', data);
          // Aqui você pode adicionar lógica para atualizar a lista, se necessário
        }}
      />

      {/* Modal de Agendamento - Lazy Loaded */}
      <LazyModalAgendamento
        open={agendamentoModalOpen}
        onClose={() => {
          setAgendamentoModalOpen(false);
          setSelectedSlotForAgendamento(null);
        }}
        slotData={selectedSlotForAgendamento}
        onSave={handleSaveAgendamento}
        profissionais={profissionais}
        procedimentos={[]}
        convenios={[]}
        salas={[]}
      />

      {/* Modal de aviso de cobrança ao adicionar profissional */}
      <Dialog
        open={addProfissionalModalOpen}
        onClose={() => setAddProfissionalModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Adicionar Profissional
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Impacto na sua mensalidade
            </Typography>
            <Typography variant="body2">
              Ao cadastrar um novo profissional, sua assinatura será acrescida de{' '}
              <strong>consulte seu plano</strong> a partir da próxima fatura.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Você tem atualmente <strong>{profissionais.length} profissional{profissionais.length !== 1 ? 'is' : ''}</strong>.
            Com mais um, sua mensalidade passará para{' '}
            <strong>
              R$ {(79.90 + profissionais.length * 19.90).toFixed(2).replace('.', ',')}/mês
            </strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddProfissionalModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { navigate('/profissionais'); }}
          >
            Entendi, Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgendaLite;