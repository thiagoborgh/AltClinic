import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

// Dados de exemplo
const agendamentos = [
  {
    id: 1,
    paciente: { nome: 'Maria Silva', telefone: '(11) 99999-9999', avatar: 'M' },
    procedimento: 'Limpeza de Pele',
    medico: 'Dr. João',
    data: '2025-08-27',
    horario: '09:00',
    status: 'confirmado',
    valor: 150,
    observacoes: 'Primeira consulta',
  },
  {
    id: 2,
    paciente: { nome: 'Ana Costa', telefone: '(11) 88888-8888', avatar: 'A' },
    procedimento: 'Botox',
    medico: 'Dra. Maria',
    data: '2025-08-27',
    horario: '10:30',
    status: 'pendente',
    valor: 800,
    observacoes: 'Retorno - aplicação testa',
  },
  {
    id: 3,
    paciente: { nome: 'João Santos', telefone: '(11) 77777-7777', avatar: 'J' },
    procedimento: 'Preenchimento',
    medico: 'Dr. Carlos',
    data: '2025-08-27',
    horario: '14:00',
    status: 'confirmado',
    valor: 1200,
    observacoes: '',
  },
  {
    id: 4,
    paciente: { nome: 'Pedro Lima', telefone: '(11) 66666-6666', avatar: 'P' },
    procedimento: 'Peeling',
    medico: 'Dra. Ana',
    data: '2025-08-28',
    horario: '15:30',
    status: 'cancelado',
    valor: 300,
    observacoes: 'Cancelado pelo paciente',
  },
];

const statusConfig = {
  confirmado: { color: 'success', label: 'Confirmado' },
  pendente: { color: 'warning', label: 'Pendente' },
  cancelado: { color: 'error', label: 'Cancelado' },
  realizado: { color: 'info', label: 'Realizado' },
};

const Agendamentos = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event, agendamento) => {
    setAnchorEl(event.currentTarget);
    setSelectedAgendamento(agendamento);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAgendamento(null);
  };

  const handleNewAgendamento = () => {
    setOpenDialog(true);
  };

  const filteredAgendamentos = agendamentos.filter(agendamento => {
    const matchesSearch = agendamento.paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agendamento.procedimento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dayjs(agendamento.data).isSame(selectedDate, 'day');
    
    return matchesSearch && matchesDate;
  });

  const agendamentosPorStatus = {
    todos: filteredAgendamentos,
    confirmado: filteredAgendamentos.filter(a => a.status === 'confirmado'),
    pendente: filteredAgendamentos.filter(a => a.status === 'pendente'),
    cancelado: filteredAgendamentos.filter(a => a.status === 'cancelado'),
  };

  const getAgendamentosParaTab = () => {
    const statusMap = ['todos', 'confirmado', 'pendente', 'cancelado'];
    return agendamentosPorStatus[statusMap[tabValue]] || [];
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Agendamentos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewAgendamento}
          sx={{ borderRadius: 2 }}
        >
          Novo Agendamento
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar paciente ou procedimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Data"
                value={selectedDate}
                onChange={setSelectedDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                fullWidth
              >
                Filtros Avançados
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {filteredAgendamentos.length} agendamentos
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={agendamentosPorStatus.todos.length} color="primary">
                  Todos
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={agendamentosPorStatus.confirmado.length} color="success">
                  Confirmados
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={agendamentosPorStatus.pendente.length} color="warning">
                  Pendentes
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={agendamentosPorStatus.cancelado.length} color="error">
                  Cancelados
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            {getAgendamentosParaTab().map((agendamento, index) => (
              <React.Fragment key={agendamento.id}>
                <ListItem
                  sx={{
                    py: 2,
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {agendamento.paciente.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {agendamento.paciente.nome}
                        </Typography>
                        <Chip
                          label={statusConfig[agendamento.status].label}
                          color={statusConfig[agendamento.status].color}
                          size="small"
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5} mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          📅 {dayjs(agendamento.data).format('DD/MM/YYYY')} às {agendamento.horario}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          💉 {agendamento.procedimento} • {agendamento.medico}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          💰 R$ {agendamento.valor.toFixed(2)}
                        </Typography>
                        {agendamento.observacoes && (
                          <Typography variant="body2" color="text.secondary">
                            📝 {agendamento.observacoes}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      color="success"
                      title="WhatsApp"
                    >
                      <WhatsApp />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      title="Ligar"
                    >
                      <Phone />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, agendamento)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Stack>
                </ListItem>
                {index < getAgendamentosParaTab().length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {getAgendamentosParaTab().length === 0 && (
            <Box textAlign="center" py={8}>
              <CalendarMonth sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum agendamento encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tente alterar os filtros ou criar um novo agendamento
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <CheckCircle sx={{ mr: 1 }} />
          Confirmar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Schedule sx={{ mr: 1 }} />
          Reagendar
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Cancel sx={{ mr: 1 }} />
          Cancelar
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de novo agendamento */}
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
              <TextField
                fullWidth
                label="Paciente"
                placeholder="Selecione ou cadastre um paciente"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Procedimento"
                placeholder="Selecione o procedimento"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Data"
                value={dayjs()}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horário"
                type="time"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Médico/Profissional"
                placeholder="Selecione o profissional"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor"
                type="number"
                InputProps={{
                  startAdornment: 'R$',
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                placeholder="Observações sobre o agendamento..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Agendar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Agendamentos;
