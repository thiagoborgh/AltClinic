import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  Paper,
  Tooltip,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  CalendarMonth,
  Add,
  ViewWeek,
  ViewDay,
  FilterList,
  AutoAwesome,
  Settings,
  Assessment,
  Notifications,
} from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/agenda.css';

// Components
import AgendamentoModal from '../components/agenda/AgendamentoModalNew';
import EquipamentosModal from '../components/agenda/EquipamentosModalNew';
import LembretesModal from '../components/agenda/LembretesModalNew';
import RelatoriosAgenda from '../components/agenda/RelatoriosAgendaNew';
import FiltrosAgenda from '../components/agenda/FiltrosAgendaNew';

// Hooks
import { useAgenda } from '../hooks/useAgendaNew';
import { useToast } from '../hooks/useToast';
import { useProfessionalSchedules } from '../hooks/useProfessionalSchedules';
import { useNavigate } from 'react-router-dom';

// Mock data
import { mockAgendamentos } from '../data/mockAgenda';

// Configuração do moment
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// Status colors
const statusColors = {
  confirmado: '#4caf50',
  pendente: '#ff9800',
  cancelado: '#f44336',
  reagendado: '#2196f3',
  'em-andamento': '#9c27b0',
  concluido: '#795548'
};

const AgendaNova = () => {
  const [view, setView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Modals
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false);
  const [equipamentosModalOpen, setEquipamentosModalOpen] = useState(false);
  const [lembretesModalOpen, setLembretesModalOpen] = useState(false);
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    especialidade: '',
    profissional: '',
    equipamento: '',
    status: ''
  });

  const { showToast } = useToast();
  const navigate = useNavigate();
  const {
    agendamentos,
    criarAgendamento,
    editarAgendamento,
    buscarHorariosSugeridos
  } = useAgenda();

  // Hook para horários dinâmicos dos profissionais
  const {
    getCalendarTimeSlots,
    isTimeSlotValid
  } = useProfessionalSchedules(filtros.profissional);

  // Configurar horários dinâmicos baseados no profissional selecionado
  const timeSlots = useMemo(() => {
    const slots = getCalendarTimeSlots();
    console.log('TimeSlots calculados:', slots);
    return slots;
  }, [getCalendarTimeSlots]);

  // Função segura para mudanças de filtros
  const handleFiltrosChange = (novosFiltros) => {
    try {
      console.log('Alterando filtros:', novosFiltros);
      setFiltros(novosFiltros);
    } catch (error) {
      console.warn('Erro ao alterar filtros:', error);
      // Não quebrar a aplicação, apenas logar o erro
    }
  };

  // Funções wrapper para converter dados do modal
  const handleCriarAgendamento = async (dadosModal) => {
    // Converter dados do modal para o formato esperado pelo hook
    const dadosConvertidos = {
      paciente: dadosModal.paciente,
      procedimento: dadosModal.procedimento,
      profissional: dadosModal.profissional,
      equipamento: dadosModal.equipamento,
      dataHora: dadosModal.start,
      duracao: dadosModal.end ? Math.round((new Date(dadosModal.end) - new Date(dadosModal.start)) / (1000 * 60)) : 60,
      observacoes: dadosModal.observacoes,
      valor: dadosModal.valor,
      status: 'pendente'
    };
    
    await criarAgendamento(dadosConvertidos);
  };

  const handleEditarAgendamento = async (id, dadosModal) => {
    // Para edição, incluir o ID
    const dadosConvertidos = {
      id,
      paciente: dadosModal.paciente,
      procedimento: dadosModal.procedimento,
      profissional: dadosModal.profissional,
      equipamento: dadosModal.equipamento,
      dataHora: dadosModal.start,
      duracao: dadosModal.end ? Math.round((new Date(dadosModal.end) - new Date(dadosModal.start)) / (1000 * 60)) : 60,
      observacoes: dadosModal.observacoes,
      valor: dadosModal.valor,
      status: dadosModal.status || 'pendente'
    };
    
    await editarAgendamento(id, dadosConvertidos);
  };

  // Usar mock data se não houver dados da API
  const agendamentosData = agendamentos.length > 0 ? agendamentos : mockAgendamentos;

  // Converter agendamentos para eventos do calendário
  const events = useMemo(() => {
    return agendamentosData
      .filter(agendamento => {
        // Filtro por especialidade
        if (filtros.especialidade && filtros.especialidade !== '' && agendamento.especialidade !== filtros.especialidade) {
          return false;
        }
        
        // Filtro por profissional
        if (filtros.profissional && filtros.profissional !== '' && agendamento.profissional !== filtros.profissional) {
          return false;
        }
        
        // Filtro por equipamento
        if (filtros.equipamento && filtros.equipamento !== '' && agendamento.equipamento !== filtros.equipamento) {
          return false;
        }
        
        // Filtro por status
        if (filtros.status && filtros.status !== '' && agendamento.status !== filtros.status) {
          return false;
        }
        
        return true;
      })
      .map(agendamento => {
        // Lidar com diferentes formatos de data
        let startDate, endDate;
        
        if (agendamento.start && agendamento.end) {
          // Formato dos dados mock
          startDate = new Date(agendamento.start);
          endDate = new Date(agendamento.end);
        } else if (agendamento.dataHora && agendamento.duracao) {
          // Formato do hook
          startDate = new Date(agendamento.dataHora);
          endDate = new Date(new Date(agendamento.dataHora).getTime() + agendamento.duracao * 60000);
        } else {
          // Fallback
          startDate = new Date();
          endDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        }
        
        return {
          id: agendamento.id,
          title: agendamento.title || `${agendamento.paciente?.nome || agendamento.paciente || 'Paciente'} - ${agendamento.procedimento}`,
          start: startDate,
          end: endDate,
          resource: agendamento,
          allDay: false
        };
      });
  }, [agendamentosData, filtros]);

  // Estatísticas rápidas
  const stats = useMemo(() => {
    const hoje = moment().startOf('day');
    const agendamentosHoje = agendamentosData.filter(a => 
      moment(a.dataHora).isSame(hoje, 'day')
    );
    
    return {
      hoje: agendamentosHoje.length,
      confirmados: agendamentosHoje.filter(a => a.status === 'confirmado').length,
      pendentes: agendamentosHoje.filter(a => a.status === 'pendente').length,
      cancelados: agendamentosHoje.filter(a => a.status === 'cancelado').length
    };
  }, [agendamentosData]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setAgendamentoModalOpen(true);
  };

  const handleSelectSlot = ({ start, end }) => {
    // Validar se o horário está dentro da configuração do profissional
    if (filtros.profissional && !isTimeSlotValid(start, filtros.profissional)) {
      showToast('Horário fora do período de atendimento do profissional', 'warning');
      return;
    }

    setSelectedEvent({
      dataHora: start,
      duracao: 60,
      status: 'pendente'
    });
    setAgendamentoModalOpen(true);
  };

  const handleSugerirHorario = async () => {
    try {
      const sugestoes = await buscarHorariosSugeridos({
        data: selectedDate,
        especialidade: filtros.especialidade,
        duracao: 60
      });
      
      showToast('Horários sugeridos pela IA carregados!', 'success');
      console.log('Sugestões de IA:', sugestoes);
    } catch (error) {
      showToast('Erro ao buscar sugestões de horários', 'error');
    }
  };

  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    return {
      style: {
        backgroundColor: statusColors[status] || '#2196f3',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button 
          onClick={() => onNavigate('PREV')} 
          variant="outlined" 
          size="small"
        >
          Anterior
        </Button>
        <Typography variant="h6" sx={{ mx: 2 }}>
          {label}
        </Typography>
        <Button 
          onClick={() => onNavigate('NEXT')} 
          variant="outlined" 
          size="small"
        >
          Próximo
        </Button>
        <Button 
          onClick={() => onNavigate('TODAY')} 
          variant="contained" 
          size="small"
          sx={{ ml: 1 }}
        >
          Hoje
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant={view === 'day' ? 'contained' : 'outlined'}
          size="small"
          startIcon={<ViewDay />}
          onClick={() => onView('day')}
        >
          Dia
        </Button>
        <Button
          variant={view === 'week' ? 'contained' : 'outlined'}
          size="small"
          startIcon={<ViewWeek />}
          onClick={() => onView('week')}
        >
          Semana
        </Button>
        <Button
          variant={view === 'month' ? 'contained' : 'outlined'}
          size="small"
          startIcon={<CalendarMonth />}
          onClick={() => onView('month')}
        >
          Mês
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Agenda - ALTclinic
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie agendamentos com automação e IA
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Sugerir horários com IA">
            <Button
              variant="outlined"
              startIcon={<AutoAwesome />}
              onClick={handleSugerirHorario}
              color="secondary"
            >
              IA
            </Button>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFiltros({ ...filtros })}
          >
            Filtros
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setEquipamentosModalOpen(true)}
          >
            Equipamentos
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Notifications />}
            onClick={() => setLembretesModalOpen(true)}
          >
            Lembretes
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => setRelatoriosOpen(true)}
          >
            Relatórios
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedEvent(null);
              setAgendamentoModalOpen(true);
            }}
          >
            Novo Agendamento
          </Button>
        </Stack>
      </Box>

      {/* Banner Nova Agenda */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>🎉 Nova Agenda Disponível!</AlertTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            Experimente nossa nova agenda lite com foco em receita e slots dinâmicos.
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/agenda-lite')}
            sx={{ ml: 2 }}
          >
            Testar Agenda Lite
          </Button>
        </Box>
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Agendamentos Hoje
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.hoje}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Confirmados
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.confirmados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pendentes
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pendentes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Cancelados
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.cancelados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <FiltrosAgenda filtros={filtros} onFiltrosChange={handleFiltrosChange} />

      {/* Calendar */}
      <Paper sx={{ p: 2, height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          views={['month', 'week', 'day']}
          view={view}
          onView={setView}
          date={selectedDate}
          onNavigate={setSelectedDate}
          eventPropGetter={eventStyleGetter}
          min={timeSlots.min}
          max={timeSlots.max}
          step={timeSlots.step}
          timeslots={timeSlots.timeslots}
          messages={{
            next: 'Próximo',
            previous: 'Anterior',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Não há agendamentos neste período.',
            showMore: total => `+ Ver mais (${total})`
          }}
          formats={{
            dayFormat: 'DD/MM',
            dateFormat: 'DD/MM',
            dayHeaderFormat: 'dddd, DD/MM',
            dayRangeHeaderFormat: ({ start, end }) =>
              `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`,
            monthHeaderFormat: 'MMMM YYYY',
            weekdayFormat: 'dddd'
          }}
          components={{
            toolbar: CustomToolbar
          }}
        />
      </Paper>

      {/* Modals */}
      <AgendamentoModal
        open={agendamentoModalOpen}
        onClose={() => setAgendamentoModalOpen(false)}
        event={selectedEvent}
        onSave={selectedEvent?.id ? handleEditarAgendamento : handleCriarAgendamento}
      />

      <EquipamentosModal
        open={equipamentosModalOpen}
        onClose={() => setEquipamentosModalOpen(false)}
      />

      <LembretesModal
        open={lembretesModalOpen}
        onClose={() => setLembretesModalOpen(false)}
      />

      <RelatoriosAgenda
        open={relatoriosOpen}
        onClose={() => setRelatoriosOpen(true)}
        agendamentos={agendamentosData}
      />
    </Box>
  );
};

export default AgendaNova;
