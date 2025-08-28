import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Send,
  Schedule,
  Person,
  Phone,
  AccessTime,
  Today,
  CalendarMonth
} from '@mui/icons-material';
import useWhatsAppAPI from '../../hooks/whatsapp/useWhatsAppAPI';

const WhatsAppAgendamentos = () => {
  const { 
    enviarMensagemInterativa, 
    loading,
    enviarTemplate 
  } = useWhatsAppAPI();

  const [agendamentos, setAgendamentos] = useState([]);
  const [novoAgendamento, setNovoAgendamento] = useState({
    pacienteId: '',
    telefone: '',
    nome: '',
    data: '',
    hora: '',
    servico: '',
    observacoes: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [servicosDisponiveis] = useState([
    'Consulta Médica',
    'Exame de Rotina',
    'Retorno',
    'Especialista',
    'Procedimento'
  ]);

  // Horários disponíveis (simulado - em produção viria da API)
  const [horariosDisponiveis] = useState([
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ]);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = () => {
    // Simulando dados de agendamento - em produção viria da API
    const agendamentosSimulados = [
      {
        id: 1,
        pacienteId: '123',
        nome: 'João Silva',
        telefone: '5511999999999',
        data: '2024-01-15',
        hora: '09:00',
        servico: 'Consulta Médica',
        status: 'confirmado',
        observacoes: 'Paciente com histórico de diabetes'
      },
      {
        id: 2,
        pacienteId: '124',
        nome: 'Maria Santos',
        telefone: '5511888888888',
        data: '2024-01-15',
        hora: '10:30',
        servico: 'Exame de Rotina',
        status: 'pendente',
        observacoes: ''
      }
    ];
    setAgendamentos(agendamentosSimulados);
  };

  const criarAgendamento = async () => {
    try {
      const agendamento = {
        ...novoAgendamento,
        id: Date.now(),
        status: 'pendente'
      };

      // Salvar agendamento (em produção seria API call)
      setAgendamentos(prev => [...prev, agendamento]);

      // Enviar confirmação via WhatsApp
      await enviarConfirmacaoAgendamento(agendamento);

      setDialogOpen(false);
      setNovoAgendamento({
        pacienteId: '',
        telefone: '',
        nome: '',
        data: '',
        hora: '',
        servico: '',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
  };

  const enviarConfirmacaoAgendamento = async (agendamento) => {
    const mensagem = {
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '📅 Agendamento Confirmado'
        },
        body: {
          text: `Olá ${agendamento.nome}!\n\nSeu agendamento foi confirmado:\n\n📅 Data: ${formatarData(agendamento.data)}\n⏰ Horário: ${agendamento.hora}\n🏥 Serviço: ${agendamento.servico}\n\nPor favor, confirme sua presença:`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: `confirmar_${agendamento.id}`,
                title: '✅ Confirmar'
              }
            },
            {
              type: 'reply',
              reply: {
                id: `remarcar_${agendamento.id}`,
                title: '📅 Remarcar'
              }
            },
            {
              type: 'reply',
              reply: {
                id: `cancelar_${agendamento.id}`,
                title: '❌ Cancelar'
              }
            }
          ]
        }
      }
    };

    await enviarMensagemInterativa(agendamento.telefone, mensagem);
  };

  const enviarLembreteAgendamento = async (agendamento) => {
    try {
      await enviarTemplate(agendamento.telefone, 'lembrete_consulta', [
        agendamento.nome,
        formatarData(agendamento.data),
        agendamento.hora,
        agendamento.servico
      ]);
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmado': return 'success';
      case 'pendente': return 'warning';
      case 'cancelado': return 'error';
      default: return 'default';
    }
  };

  const agendamentosHoje = agendamentos.filter(
    ag => ag.data === new Date().toISOString().split('T')[0]
  );

  const agendamentosSemana = agendamentos.filter(ag => {
    const hoje = new Date();
    const dataAgendamento = new Date(ag.data);
    const diffTime = dataAgendamento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Sistema de Agendamentos</Typography>
        <Button
          variant="contained"
          startIcon={<Schedule />}
          onClick={() => setDialogOpen(true)}
        >
          Novo Agendamento
        </Button>
      </Box>

      {/* Estatísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Today color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{agendamentosHoje.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hoje
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarMonth color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{agendamentosSemana.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Esta Semana
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {agendamentos.filter(ag => ag.status === 'confirmado').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirmados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">
                    {agendamentos.filter(ag => ag.status === 'pendente').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendentes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Todos os Agendamentos" />
        <Tab label={`Hoje (${agendamentosHoje.length})`} />
        <Tab label={`Esta Semana (${agendamentosSemana.length})`} />
      </Tabs>

      <Paper sx={{ p: 2 }}>
        <List>
          {(tabValue === 0 ? agendamentos : 
            tabValue === 1 ? agendamentosHoje : agendamentosSemana)
            .map((agendamento) => (
            <ListItem key={agendamento.id} divider>
              <Avatar sx={{ mr: 2 }}>
                <Person />
              </Avatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">{agendamento.nome}</Typography>
                    <Chip 
                      label={agendamento.status} 
                      size="small" 
                      color={getStatusColor(agendamento.status)}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2">
                      📅 {formatarData(agendamento.data)} às {agendamento.hora}
                    </Typography>
                    <Typography variant="body2">
                      🏥 {agendamento.servico}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📱 {agendamento.telefone}
                    </Typography>
                    {agendamento.observacoes && (
                      <Typography variant="body2" color="text.secondary">
                        📝 {agendamento.observacoes}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Send />}
                  onClick={() => enviarLembreteAgendamento(agendamento)}
                  disabled={loading}
                >
                  Lembrete
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Phone />}
                  onClick={() => enviarConfirmacaoAgendamento(agendamento)}
                  disabled={loading}
                >
                  Reagendar
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Dialog para novo agendamento */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Agendamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome do Paciente"
                fullWidth
                value={novoAgendamento.nome}
                onChange={(e) => setNovoAgendamento({...novoAgendamento, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Telefone (WhatsApp)"
                fullWidth
                value={novoAgendamento.telefone}
                onChange={(e) => setNovoAgendamento({...novoAgendamento, telefone: e.target.value})}
                placeholder="5511999999999"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Data"
                type="date"
                fullWidth
                value={novoAgendamento.data}
                onChange={(e) => setNovoAgendamento({...novoAgendamento, data: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Horário</InputLabel>
                <Select
                  value={novoAgendamento.hora}
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, hora: e.target.value})}
                  label="Horário"
                >
                  {horariosDisponiveis.map(hora => (
                    <MenuItem key={hora} value={hora}>{hora}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Serviço</InputLabel>
                <Select
                  value={novoAgendamento.servico}
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, servico: e.target.value})}
                  label="Serviço"
                >
                  {servicosDisponiveis.map(servico => (
                    <MenuItem key={servico} value={servico}>{servico}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observações"
                fullWidth
                multiline
                rows={3}
                value={novoAgendamento.observacoes}
                onChange={(e) => setNovoAgendamento({...novoAgendamento, observacoes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={criarAgendamento}
            variant="contained"
            disabled={!novoAgendamento.nome || !novoAgendamento.telefone || !novoAgendamento.data || !novoAgendamento.hora || !novoAgendamento.servico}
          >
            Criar e Notificar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppAgendamentos;
