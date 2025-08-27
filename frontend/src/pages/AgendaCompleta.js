import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Stack,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  CalendarMonth,
  Add,
  Search,
  FilterList,
  ViewWeek,
  ViewDay,
  ViewModule,
  Settings,
  Notifications,
  Analytics,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  MedicalServices,
  Room
} from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';

// Hooks e componentes personalizados
import { useAgenda } from '../hooks/useAgendaSimple';
import MetricCard from '../components/common/MetricCard';
import AgendamentoModal from '../components/agenda/AgendamentoModalNew';
import EquipamentosModal from '../components/agenda/EquipamentosModalNew';
import LembretesModal from '../components/agenda/LembretesModalNew';
import RelatoriosAgenda from '../components/agenda/RelatoriosAgendaNew';
import FiltrosAgenda from '../components/agenda/FiltrosAgendaNew';

// Configurar moment para português
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// Configurações de visualização do calendário
const views = {
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Lista'
};

const AgendaCompleta = () => {
  // Estados principais
  const [currentView, setCurrentView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Estados dos modais
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false);
  const [equipamentosModalOpen, setEquipamentosModalOpen] = useState(false);
  const [lembretesModalOpen, setLembretesModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Hook personalizado para dados da agenda
  const hookResult = useAgenda();
  console.log('Hook result no AgendaCompleta:', hookResult);
  
  const {
    agendamentos,
    equipamentos,
    lembretes,
    insights,
    filtros,
    loading,
    criarAgendamento,
    editarAgendamento,
    cancelarAgendamento,
    enviarLembrete,
    aplicarFiltros
  } = hookResult || {};

  // Manipuladores de eventos
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setAgendamentoModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedEvent({
      start,
      end,
      isNew: true
    });
    setAgendamentoModalOpen(true);
  }, []);

  const handleNavigate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Formatação de eventos para o calendário
  const eventStyleGetter = (event) => {
    let backgroundColor = '#1976d2';
    let borderColor = '#1976d2';
    
    switch (event.status) {
      case 'confirmado':
        backgroundColor = '#4caf50';
        borderColor = '#4caf50';
        break;
      case 'pendente':
        backgroundColor = '#ff9800';
        borderColor = '#ff9800';
        break;
      case 'cancelado':
        backgroundColor = '#f44336';
        borderColor = '#f44336';
        break;
      case 'realizado':
        backgroundColor = '#9c27b0';
        borderColor = '#9c27b0';
        break;
      default:
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Filtrar agendamentos baseado na busca
  const agendamentosFiltrados = agendamentos.filter(agendamento =>
    agendamento.paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agendamento.procedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agendamento.profissional.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Conteúdo das abas
  const renderTabContent = () => {
    switch (tabValue) {
      case 0: // Calendário
        return (
          <Card sx={{ height: 600 }}>
            <CardContent sx={{ height: '100%', p: 1 }}>
              {loading && <LinearProgress />}
              <Calendar
                localizer={localizer}
                events={agendamentosFiltrados}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                view={currentView}
                onView={handleViewChange}
                date={currentDate}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                popup
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
                step={30}
                showMultiDayTimes
                messages={{
                  allDay: 'Dia todo',
                  previous: 'Anterior',
                  next: 'Próximo',
                  today: 'Hoje',
                  month: 'Mês',
                  week: 'Semana',
                  day: 'Dia',
                  agenda: 'Lista',
                  date: 'Data',
                  time: 'Hora',
                  event: 'Evento',
                  noEventsInRange: 'Não há agendamentos neste período',
                  showMore: total => `+ Ver mais (${total})`
                }}
                formats={{
                  dayHeaderFormat: 'dddd DD/MM',
                  dayRangeHeaderFormat: ({ start, end }) =>
                    `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`,
                  monthHeaderFormat: 'MMMM YYYY',
                  agendaDateFormat: 'DD/MM dddd',
                  agendaTimeFormat: 'HH:mm',
                  agendaTimeRangeFormat: ({ start, end }) =>
                    `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
                }}
                style={{ height: '100%' }}
              />
            </CardContent>
          </Card>
        );
      
      case 1: // Equipamentos
        return (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Gestão de Equipamentos</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setEquipamentosModalOpen(true)}
                >
                  Novo Equipamento
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {equipamentos.map((equipamento) => (
                  <Grid item xs={12} md={6} lg={4} key={equipamento.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Room color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">{equipamento.nome}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {equipamento.tipo}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip
                            label={`Capacidade: ${equipamento.capacidade}`}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={equipamento.status}
                            size="small"
                            color={equipamento.status === 'disponivel' ? 'success' : 'warning'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        );
      
      case 2: // Lembretes
        return (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Sistema de Lembretes</Typography>
                <Button
                  variant="contained"
                  startIcon={<Notifications />}
                  onClick={() => setLembretesModalOpen(true)}
                >
                  Configurar Lembretes
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {lembretes.map((lembrete) => (
                  <Grid item xs={12} key={lembrete.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {lembrete.paciente}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {lembrete.procedimento} - {moment(lembrete.dataAgendamento).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={lembrete.tipo}
                              size="small"
                              color={lembrete.enviado ? 'success' : 'warning'}
                            />
                            <Chip
                              label={lembrete.status}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        );
      
      case 3: // Relatórios
        return <RelatoriosAgenda insights={insights} />;
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            ALTclinic - Agenda Inteligente
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sistema completo de agendamentos com IA
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedEvent({ isNew: true });
              setAgendamentoModalOpen(true);
            }}
          >
            Novo Agendamento
          </Button>
          
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            color="primary"
          >
            <Badge badgeContent={insights.noShowsAlto} color="error">
              <Analytics />
            </Badge>
          </IconButton>
        </Stack>
      </Box>

      {/* Métricas principais */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Agendamentos Hoje"
            value={insights.agendamentosHoje}
            variation={insights.variacao.agendamentos}
            icon={<CalendarMonth />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Taxa de Ocupação"
            value={`${insights.taxaOcupacao}%`}
            variation={insights.variacao.ocupacao}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="No-Shows"
            value={insights.noShows}
            variation={insights.variacao.noShows}
            icon={<Warning />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Confirmados"
            value={insights.confirmados}
            variation={insights.variacao.confirmados}
            icon={<CheckCircle />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Insights de IA */}
      {insights.alertasIA && insights.alertasIA.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            💡 Insights de IA:
          </Typography>
          {insights.alertasIA.map((alerta, index) => (
            <Typography key={index} variant="body2">
              • {alerta}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Barra de ferramentas */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <TextField
              placeholder="Buscar por paciente, procedimento ou profissional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FiltrosAgenda filtros={filtros} onAplicarFiltros={aplicarFiltros} />
            
            <Box display="flex" gap={1}>
              <IconButton
                color={currentView === 'day' ? 'primary' : 'default'}
                onClick={() => handleViewChange('day')}
              >
                <ViewDay />
              </IconButton>
              <IconButton
                color={currentView === 'week' ? 'primary' : 'default'}
                onClick={() => handleViewChange('week')}
              >
                <ViewWeek />
              </IconButton>
              <IconButton
                color={currentView === 'month' ? 'primary' : 'default'}
                onClick={() => handleViewChange('month')}
              >
                <ViewModule />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Abas principais */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label="Calendário" 
              icon={<CalendarMonth />} 
              iconPosition="start"
            />
            <Tab 
              label="Equipamentos" 
              icon={<Room />} 
              iconPosition="start"
            />
            <Tab 
              label="Lembretes" 
              icon={<Notifications />} 
              iconPosition="start"
            />
            <Tab 
              label="Relatórios" 
              icon={<Analytics />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {renderTabContent()}
        </Box>
      </Card>

      {/* Modais */}
      <AgendamentoModal
        open={agendamentoModalOpen}
        onClose={() => {
          setAgendamentoModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSave={selectedEvent?.isNew ? criarAgendamento : editarAgendamento}
        onCancel={cancelarAgendamento}
        equipamentos={equipamentos}
      />

      <EquipamentosModal
        open={equipamentosModalOpen}
        onClose={() => setEquipamentosModalOpen(false)}
        equipamentos={equipamentos}
      />

      <LembretesModal
        open={lembretesModalOpen}
        onClose={() => setLembretesModalOpen(false)}
        lembretes={lembretes}
        onEnviarLembrete={enviarLembrete}
      />

      {/* Menu de insights */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Box>
            <Typography variant="subtitle2">Próximos picos de demanda</Typography>
            <Typography variant="body2" color="text.secondary">
              Amanhã 14h-16h (85% capacidade)
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Box>
            <Typography variant="subtitle2">Recomendação de overbooking</Typography>
            <Typography variant="body2" color="text.secondary">
              +2 slots quinta-feira
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AgendaCompleta;
