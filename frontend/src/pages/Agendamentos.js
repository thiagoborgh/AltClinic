import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tab,
  Tabs,
  Badge,
  Drawer,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  CalendarMonth,
  Person,
  Schedule,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  WhatsApp,
  Phone,
  ViewDay,
  ViewWeek,
  ViewModule,
  Today,
  NavigateBefore,
  NavigateNext,
  FilterAlt,
  Refresh,
  Settings,
  PersonAdd,
  LocalHospital,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Services
import agendamentoService from '../services/agendamentoService';

// Dados de exemplo - posteriormente virão da API
const agendamentosMock = [
  {
    id: 1,
    title: 'Maria Silva - Limpeza de Pele',
    paciente: { nome: 'Maria Silva', telefone: '(11) 99999-9999', avatar: 'M' },
    procedimento: 'Limpeza de Pele',
    medico: 'Dr. João',
    start: '2025-09-16T09:00:00',
    end: '2025-09-16T10:00:00',
    status: 'confirmado',
    valor: 150,
    observacoes: 'Primeira consulta',
    backgroundColor: '#4caf50', // verde para confirmado
    borderColor: '#4caf50',
    textColor: '#ffffff',
  },
  {
    id: 2,
    title: 'Ana Costa - Botox',
    paciente: { nome: 'Ana Costa', telefone: '(11) 88888-8888', avatar: 'A' },
    procedimento: 'Botox',
    medico: 'Dra. Maria',
    start: '2025-09-16T10:30:00',
    end: '2025-09-16T11:30:00',
    status: 'pendente',
    valor: 800,
    observacoes: 'Retorno - aplicação testa',
    backgroundColor: '#ff9800', // laranja para pendente
    borderColor: '#ff9800',
    textColor: '#ffffff',
  },
  {
    id: 3,
    title: 'João Santos - Preenchimento',
    paciente: { nome: 'João Santos', telefone: '(11) 77777-7777', avatar: 'J' },
    procedimento: 'Preenchimento',
    medico: 'Dr. Carlos',
    start: '2025-09-16T14:00:00',
    end: '2025-09-16T15:30:00',
    status: 'confirmado',
    valor: 1200,
    observacoes: '',
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
    textColor: '#ffffff',
  },
  {
    id: 4,
    title: 'Pedro Lima - Peeling',
    paciente: { nome: 'Pedro Lima', telefone: '(11) 66666-6666', avatar: 'P' },
    procedimento: 'Peeling',
    medico: 'Dra. Ana',
    start: '2025-09-17T15:30:00',
    end: '2025-09-17T16:30:00',
    status: 'cancelado',
    valor: 300,
    observacoes: 'Cancelado pelo paciente',
    backgroundColor: '#f44336', // vermelho para cancelado
    borderColor: '#f44336',
    textColor: '#ffffff',
  },
];

const statusConfig = {
  confirmado: { color: 'success', label: 'Confirmado', bgColor: '#4caf50' },
  pendente: { color: 'warning', label: 'Pendente', bgColor: '#ff9800' },
  cancelado: { color: 'error', label: 'Cancelado', bgColor: '#f44336' },
  realizado: { color: 'info', label: 'Realizado', bgColor: '#2196f3' },
  'em-atendimento': { color: 'secondary', label: 'Em Atendimento', bgColor: '#9c27b0' },
};

const Agendamentos = () => {
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState('timeGridWeek'); // timeGridDay, timeGridWeek, dayGridMonth
  const [events, setEvents] = useState(agendamentosMock);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    pacientes: [],
    procedimentos: [],
    medicos: [],
  });

  // Estados para o modal de novo agendamento
  const [novoAgendamento, setNovoAgendamento] = useState({
    paciente: '',
    pacienteId: '',
    procedimento: '',
    medico: '',
    medicoId: '',
    data: dayjs(),
    horario: '',
    duracao: 60, // minutos
    valor: '',
    observacoes: '',
    status: 'pendente',
  });

  // Estados para modais de cadastro
  const [openPacienteDialog, setOpenPacienteDialog] = useState(false);
  const [openMedicoDialog, setOpenMedicoDialog] = useState(false);

  // Estados para listas de pacientes e médicos
  const [pacientesDisponiveis, setPacientesDisponiveis] = useState([
    { id: 1, nome: 'Maria Silva', telefone: '(11) 99999-9999', email: 'maria@email.com' },
    { id: 2, nome: 'Ana Costa', telefone: '(11) 88888-8888', email: 'ana@email.com' },
    { id: 3, nome: 'João Santos', telefone: '(11) 77777-7777', email: 'joao@email.com' },
  ]);
  
  const [medicosDisponiveis, setMedicosDisponiveis] = useState([
    { id: 1, nome: 'Dr. João Silva', especialidade: 'Cardiologia', crm: 'CRM/SP 123456' },
    { id: 2, nome: 'Dra. Maria Santos', especialidade: 'Dermatologia', crm: 'CRM/SP 789012' },
    { id: 3, nome: 'Dr. Carlos Lima', especialidade: 'Ortopedia', crm: 'CRM/SP 345678' },
  ]);

  // Filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    status: [],
    pacientes: [],
    procedimentos: [],
    medicos: [],
  });

  // Função para obter eventos filtrados
  const getFilteredEvents = () => {
    return events.filter(event => {
      const matchesSearch = !searchTerm ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.procedimento?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = appliedFilters.status.length === 0 ||
        appliedFilters.status.includes(event.status);

      const matchesPaciente = appliedFilters.pacientes.length === 0 ||
        appliedFilters.pacientes.includes(event.paciente?.nome);

      const matchesProcedimento = appliedFilters.procedimentos.length === 0 ||
        appliedFilters.procedimentos.includes(event.procedimento);

      const matchesMedico = appliedFilters.medicos.length === 0 ||
        appliedFilters.medicos.includes(event.medico);

      return matchesSearch && matchesStatus && matchesPaciente &&
             matchesProcedimento && matchesMedico;
    });
  };

  // Handlers
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(date.toDate());
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setAnchorEl(clickInfo.el);
  };

  const handleEventDrop = (dropInfo) => {
    // Lógica para reagendar evento (drag and drop)
    const updatedEvent = {
      ...dropInfo.event.extendedProps,
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr,
    };

    // Aqui seria chamada a API para atualizar
    console.log('Evento reagendado:', updatedEvent);

    // Atualizar estado local
    setEvents(prev => prev.map(event =>
      event.id === dropInfo.event.id
        ? { ...event, start: dropInfo.event.startStr, end: dropInfo.event.endStr }
        : event
    ));
  };

  const handleDateSelect = (selectInfo) => {
    // Abrir modal para novo agendamento
    setNovoAgendamento({
      ...novoAgendamento,
      data: dayjs(selectInfo.start),
      horario: dayjs(selectInfo.start).format('HH:mm'),
    });
    setOpenDialog(true);
  };

  const handleNewAgendamento = () => {
    setOpenDialog(true);
  };

  const handleSaveAgendamento = () => {
    // Lógica para salvar novo agendamento
    const startDateTime = dayjs(novoAgendamento.data)
      .hour(parseInt(novoAgendamento.horario.split(':')[0]))
      .minute(parseInt(novoAgendamento.horario.split(':')[1]));

    const endDateTime = startDateTime.add(novoAgendamento.duracao, 'minute');

    const newEvent = {
      id: Date.now(),
      title: `${novoAgendamento.paciente} - ${novoAgendamento.procedimento}`,
      paciente: { nome: novoAgendamento.paciente, avatar: novoAgendamento.paciente.charAt(0) },
      procedimento: novoAgendamento.procedimento,
      medico: novoAgendamento.medico,
      start: startDateTime.format(),
      end: endDateTime.format(),
      status: novoAgendamento.status,
      valor: parseFloat(novoAgendamento.valor),
      observacoes: novoAgendamento.observacoes,
      backgroundColor: statusConfig[novoAgendamento.status].bgColor,
      borderColor: statusConfig[novoAgendamento.status].bgColor,
      textColor: '#ffffff',
    };

    setEvents(prev => [...prev, newEvent]);
    setOpenDialog(false);

    // Reset form
    setNovoAgendamento({
      paciente: '',
      procedimento: '',
      medico: '',
      data: dayjs(),
      horario: '',
      duracao: 60,
      valor: '',
      observacoes: '',
      status: 'pendente',
    });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleStatusChange = (newStatus) => {
    if (selectedEvent) {
      const updatedEvent = {
        ...selectedEvent.extendedProps,
        status: newStatus,
        backgroundColor: statusConfig[newStatus].bgColor,
        borderColor: statusConfig[newStatus].bgColor,
      };

      setEvents(prev => prev.map(event =>
        event.id === selectedEvent.id
          ? { ...event, ...updatedEvent }
          : event
      ));
    }
    handleMenuClose();
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setOpenFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      pacientes: [],
      procedimentos: [],
      medicos: [],
    });
    setAppliedFilters({
      status: [],
      pacientes: [],
      procedimentos: [],
      medicos: [],
    });
  };

  // Obter opções únicas para filtros
  const getFilterOptions = () => {
    const status = [...new Set(events.map(e => e.status))];
    const pacientes = [...new Set(events.map(e => e.paciente?.nome).filter(Boolean))];
    const procedimentos = [...new Set(events.map(e => e.procedimento).filter(Boolean))];
    const medicos = [...new Set(events.map(e => e.medico).filter(Boolean))];

    return { status, pacientes, procedimentos, medicos };
  };

  const filterOptions = getFilterOptions();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">
          Agenda
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterAlt />}
            onClick={() => setOpenFilters(true)}
            sx={{
              borderColor: appliedFilters.status.length > 0 ||
                          appliedFilters.pacientes.length > 0 ||
                          appliedFilters.procedimentos.length > 0 ||
                          appliedFilters.medicos.length > 0
                          ? 'primary.main' : 'grey.300'
            }}
          >
            Filtros
            {(appliedFilters.status.length +
              appliedFilters.pacientes.length +
              appliedFilters.procedimentos.length +
              appliedFilters.medicos.length) > 0 && (
              <Badge
                badgeContent={
                  appliedFilters.status.length +
                  appliedFilters.pacientes.length +
                  appliedFilters.procedimentos.length +
                  appliedFilters.medicos.length
                }
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewAgendamento}
            sx={{ borderRadius: 2 }}
          >
            Novo Agendamento
          </Button>
        </Stack>
      </Box>

      {/* Barra de ferramentas */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar agendamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Ir para data"
                value={selectedDate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Visualização Diária">
                  <IconButton
                    color={currentView === 'timeGridDay' ? 'primary' : 'default'}
                    onClick={() => handleViewChange('timeGridDay')}
                  >
                    <ViewDay />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Visualização Semanal">
                  <IconButton
                    color={currentView === 'timeGridWeek' ? 'primary' : 'default'}
                    onClick={() => handleViewChange('timeGridWeek')}
                  >
                    <ViewWeek />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Visualização Mensal">
                  <IconButton
                    color={currentView === 'dayGridMonth' ? 'primary' : 'default'}
                    onClick={() => handleViewChange('dayGridMonth')}
                  >
                    <ViewModule />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Hoje">
                  <IconButton onClick={() => handleDateChange(dayjs())}>
                    <Today />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Atualizar">
                  <IconButton>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary" textAlign="right">
                {getFilteredEvents().length} agendamentos encontrados
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, p: 0 }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            events={getFilteredEvents()}
            editable={true}
            droppable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            nowIndicator={true}
            height="100%"
            headerToolbar={false} // Removemos o header padrão pois temos controles customizados
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:15:00"
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6], // Segunda a sábado
              startTime: '08:00',
              endTime: '20:00',
            }}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            select={handleDateSelect}
            locale="pt-br"
            buttonText={{
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
            }}
          />
        </CardContent>
      </Card>

      {/* Menu de contexto do evento */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('confirmado')}>
          <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
          Confirmar
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('pendente')}>
          <Schedule sx={{ mr: 1, color: 'warning.main' }} />
          Marcar como Pendente
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('em-atendimento')}>
          <Person sx={{ mr: 1, color: 'secondary.main' }} />
          Em Atendimento
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('realizado')}>
          <CheckCircle sx={{ mr: 1, color: 'info.main' }} />
          Marcar como Realizado
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <WhatsApp sx={{ mr: 1, color: 'success.main' }} />
          Enviar Lembrete
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Phone sx={{ mr: 1, color: 'primary.main' }} />
          Ligar
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Cancel sx={{ mr: 1 }} />
          Cancelar
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Drawer de Filtros */}
      <Drawer
        anchor="right"
        open={openFilters}
        onClose={() => setOpenFilters(false)}
      >
        <Box sx={{ width: 350, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros de Agenda
          </Typography>

          <Stack spacing={3}>
            {/* Status */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Status
              </Typography>
              {filterOptions.status.map(status => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            status: [...prev.status, status]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            status: prev.status.filter(s => s !== status)
                          }));
                        }
                      }}
                    />
                  }
                  label={
                    <Chip
                      label={statusConfig[status]?.label || status}
                      color={statusConfig[status]?.color || 'default'}
                      size="small"
                    />
                  }
                />
              ))}
            </Box>

            {/* Pacientes */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Pacientes
              </Typography>
              {filterOptions.pacientes.map(paciente => (
                <FormControlLabel
                  key={paciente}
                  control={
                    <Checkbox
                      checked={filters.pacientes.includes(paciente)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            pacientes: [...prev.pacientes, paciente]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            pacientes: prev.pacientes.filter(p => p !== paciente)
                          }));
                        }
                      }}
                    />
                  }
                  label={paciente}
                />
              ))}
            </Box>

            {/* Procedimentos */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Procedimentos
              </Typography>
              {filterOptions.procedimentos.map(procedimento => (
                <FormControlLabel
                  key={procedimento}
                  control={
                    <Checkbox
                      checked={filters.procedimentos.includes(procedimento)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            procedimentos: [...prev.procedimentos, procedimento]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            procedimentos: prev.procedimentos.filter(p => p !== procedimento)
                          }));
                        }
                      }}
                    />
                  }
                  label={procedimento}
                />
              ))}
            </Box>

            {/* Médicos */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Profissionais
              </Typography>
              {filterOptions.medicos.map(medico => (
                <FormControlLabel
                  key={medico}
                  control={
                    <Checkbox
                      checked={filters.medicos.includes(medico)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            medicos: [...prev.medicos, medico]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            medicos: prev.medicos.filter(m => m !== medico)
                          }));
                        }
                      }}
                    />
                  }
                  label={medico}
                />
              ))}
            </Box>
          </Stack>

          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleClearFilters}
            >
              Limpar
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleApplyFilters}
            >
              Aplicar
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog de Novo Agendamento */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Novo Agendamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Paciente *</InputLabel>
                <Select
                  value={novoAgendamento.pacienteId || ''}
                  label="Paciente *"
                  onChange={(e) => {
                    if (e.target.value === 'novo') {
                      // Abrir modal de cadastro de paciente
                      setOpenPacienteDialog(true);
                    } else {
                      setNovoAgendamento(prev => ({ 
                        ...prev, 
                        pacienteId: e.target.value,
                        paciente: pacientesDisponiveis.find(p => p.id === e.target.value)?.nome || ''
                      }));
                    }
                  }}
                >
                  <MuiMenuItem value="novo">
                    <Box display="flex" alignItems="center">
                      <PersonAdd sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography color="primary">Cadastrar Novo Paciente</Typography>
                    </Box>
                  </MuiMenuItem>
                  <Divider />
                  {pacientesDisponiveis.map((paciente) => (
                    <MuiMenuItem key={paciente.id} value={paciente.id}>
                      <Box>
                        <Typography>{paciente.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {paciente.telefone} • {paciente.email}
                        </Typography>
                      </Box>
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Procedimento *"
                placeholder="Tipo de procedimento"
                value={novoAgendamento.procedimento}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, procedimento: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Profissional *</InputLabel>
                <Select
                  value={novoAgendamento.medicoId || ''}
                  label="Profissional *"
                  onChange={(e) => {
                    if (e.target.value === 'novo') {
                      // Abrir modal de cadastro de médico
                      setOpenMedicoDialog(true);
                    } else {
                      setNovoAgendamento(prev => ({ 
                        ...prev, 
                        medicoId: e.target.value,
                        medico: medicosDisponiveis.find(m => m.id === e.target.value)?.nome || ''
                      }));
                    }
                  }}
                >
                  <MuiMenuItem value="novo">
                    <Box display="flex" alignItems="center">
                      <LocalHospital sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography color="primary">Cadastrar Novo Médico</Typography>
                    </Box>
                  </MuiMenuItem>
                  <Divider />
                  {medicosDisponiveis.map((medico) => (
                    <MuiMenuItem key={medico.id} value={medico.id}>
                      <Box>
                        <Typography>{medico.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {medico.especialidade} • {medico.crm}
                        </Typography>
                      </Box>
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={novoAgendamento.status}
                  label="Status"
                  onChange={(e) => setNovoAgendamento(prev => ({ ...prev, status: e.target.value }))}
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <MuiMenuItem key={key} value={key}>
                      <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {config.label}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Data"
                value={novoAgendamento.data}
                onChange={(date) => setNovoAgendamento(prev => ({ ...prev, data: date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Horário"
                type="time"
                value={novoAgendamento.horario}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, horario: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duração (minutos)"
                type="number"
                value={novoAgendamento.duracao}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, duracao: parseInt(e.target.value) || 60 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor"
                type="number"
                value={novoAgendamento.valor}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, valor: e.target.value }))}
                InputProps={{
                  startAdornment: 'R$',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone (opcional)"
                placeholder="(11) 99999-9999"
                value={novoAgendamento.telefone || ''}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, telefone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                placeholder="Observações sobre o agendamento..."
                value={novoAgendamento.observacoes}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAgendamento}
            disabled={!novoAgendamento.pacienteId || !novoAgendamento.procedimento || !novoAgendamento.medicoId || !novoAgendamento.horario}
          >
            Agendar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Cadastro Rápido de Paciente */}
      <Dialog
        open={openPacienteDialog}
        onClose={() => setOpenPacienteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cadastro Rápido - Paciente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo *"
                placeholder="Nome do paciente"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telefone *"
                placeholder="(11) 99999-9999"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                placeholder="paciente@email.com"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPacienteDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Aqui implementaríamos o cadastro
              setOpenPacienteDialog(false);
            }}
          >
            Cadastrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Cadastro Rápido de Médico */}
      <Dialog
        open={openMedicoDialog}
        onClose={() => setOpenMedicoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cadastro Rápido - Médico</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo *"
                placeholder="Nome do médico"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CRM *"
                placeholder="CRM/SP 123456"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Especialidade *</InputLabel>
                <Select
                  value=""
                  label="Especialidade *"
                >
                  <MuiMenuItem value="cardiologia">Cardiologia</MuiMenuItem>
                  <MuiMenuItem value="dermatologia">Dermatologia</MuiMenuItem>
                  <MuiMenuItem value="ortopedia">Ortopedia</MuiMenuItem>
                  <MuiMenuItem value="pediatria">Pediatria</MuiMenuItem>
                  <MuiMenuItem value="ginecologia">Ginecologia</MuiMenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMedicoDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Aqui implementaríamos o cadastro
              setOpenMedicoDialog(false);
            }}
          >
            Cadastrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Agendamentos;
