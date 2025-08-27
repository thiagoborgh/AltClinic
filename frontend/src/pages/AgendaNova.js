import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  Grid,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Badge,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  CalendarMonth,
  Add,
  ViewWeek,
  ViewDay,
  Refresh,
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
import AgendamentoModal from '../components/agenda/AgendamentoModal';
import EquipamentosModal from '../components/agenda/EquipamentosModal';
import LembretesModal from '../components/agenda/LembretesModal';
import RelatoriosAgenda from '../components/agenda/RelatoriosAgenda';
import FiltrosAgenda from '../components/agenda/FiltrosAgenda';

// Hooks
import { useAgenda } from '../hooks/useAgenda';
import { useToast } from '../hooks/useToast';

// Mock data
import { mockAgendamentos, mockEquipamentos } from '../data/mockAgenda';

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
  const [selectedTab, setSelectedTab] = useState(0);
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
  const {
    agendamentos,
    loading,
    criarAgendamento,
    editarAgendamento,
    cancelarAgendamento,
    remarcerAgendamento,
    buscarHorariosSugeridos
  } = useAgenda();

  // Usar mock data se não houver dados da API
  const agendamentosData = agendamentos.length > 0 ? agendamentos : mockAgendamentos;

  // Converter agendamentos para eventos do calendário
  const events = useMemo(() => {
    return agendamentosData
      .filter(agendamento => {
        if (filtros.especialidade && agendamento.especialidade !== filtros.especialidade) return false;
        if (filtros.profissional && agendamento.profissional !== filtros.profissional) return false;
        if (filtros.equipamento && agendamento.equipamento !== filtros.equipamento) return false;
        if (filtros.status && agendamento.status !== filtros.status) return false;
        return true;
      })
      .map(agendamento => ({
        id: agendamento.id,
        title: `${agendamento.paciente} - ${agendamento.procedimento}`,
        start: new Date(agendamento.dataHora),
        end: new Date(new Date(agendamento.dataHora).getTime() + agendamento.duracao * 60000),
        resource: agendamento,
        allDay: false
      }));
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
      <FiltrosAgenda filtros={filtros} onFiltrosChange={setFiltros} />

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
        agendamento={selectedEvent}
        onSave={selectedEvent?.id ? editarAgendamento : criarAgendamento}
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
