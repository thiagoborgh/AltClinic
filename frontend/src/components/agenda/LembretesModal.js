import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Send,
  Schedule,
  WhatsApp,
  Email,
  Sms,
  Close,
  Notifications,
  CheckCircle,
  Warning,
  Refresh
} from '@mui/icons-material';
import { mockAgendamentos } from '../../data/mockAgenda';

const LembretesModal = ({ open, onClose }) => {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [enviandoLembrete, setEnviandoLembrete] = useState(null);

  // Simular dados de lembretes
  const lembretesData = useMemo(() => {
    const agora = new Date();
    const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    const em48h = new Date(agora.getTime() + 48 * 60 * 60 * 1000);

    return mockAgendamentos
      .filter(agendamento => {
        const dataAgendamento = new Date(agendamento.dataHora);
        return dataAgendamento > agora && agendamento.status !== 'cancelado';
      })
      .map(agendamento => {
        const dataAgendamento = new Date(agendamento.dataHora);
        const diffHoras = (dataAgendamento.getTime() - agora.getTime()) / (1000 * 60 * 60);
        
        let statusLembrete = 'pendente';
        let tipoLembrete = '';
        let proximoEnvio = null;

        if (diffHoras <= 24 && diffHoras > 2) {
          tipoLembrete = '24h';
          proximoEnvio = new Date(dataAgendamento.getTime() - 24 * 60 * 60 * 1000);
          statusLembrete = agendamento.lembreteEnviado ? 'enviado' : 'pendente';
        } else if (diffHoras <= 48 && diffHoras > 24) {
          tipoLembrete = '48h';
          proximoEnvio = new Date(dataAgendamento.getTime() - 48 * 60 * 60 * 1000);
          statusLembrete = 'programado';
        } else if (diffHoras <= 2) {
          tipoLembrete = 'urgente';
          proximoEnvio = agora;
          statusLembrete = 'urgente';
        } else {
          tipoLembrete = '48h';
          proximoEnvio = new Date(dataAgendamento.getTime() - 48 * 60 * 60 * 1000);
          statusLembrete = 'programado';
        }

        return {
          ...agendamento,
          statusLembrete,
          tipoLembrete,
          proximoEnvio,
          diffHoras: Math.round(diffHoras)
        };
      });
  }, []);

  const lembretesFiltrados = lembretesData.filter(lembrete => {
    if (filtroStatus !== 'todos' && lembrete.statusLembrete !== filtroStatus) return false;
    if (filtroTipo !== 'todos' && lembrete.tipoLembrete !== filtroTipo) return false;
    return true;
  });

  const estatisticas = useMemo(() => {
    return {
      total: lembretesData.length,
      pendentes: lembretesData.filter(l => l.statusLembrete === 'pendente').length,
      enviados: lembretesData.filter(l => l.statusLembrete === 'enviado').length,
      urgentes: lembretesData.filter(l => l.statusLembrete === 'urgente').length,
      programados: lembretesData.filter(l => l.statusLembrete === 'programado').length
    };
  }, [lembretesData]);

  const handleEnviarLembrete = async (agendamento, canal = 'whatsapp') => {
    setEnviandoLembrete(agendamento.id);
    
    try {
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Lembrete enviado via ${canal} para ${agendamento.paciente}`);
      
      // Aqui você faria a chamada real para a API
      // await enviarLembrete(agendamento.id, canal);
      
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
    } finally {
      setEnviandoLembrete(null);
    }
  };

  const handleEnviarTodosLembretes = async () => {
    const pendentes = lembretesFiltrados.filter(l => l.statusLembrete === 'pendente');
    
    for (const lembrete of pendentes) {
      await handleEnviarLembrete(lembrete);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enviado': return 'success';
      case 'pendente': return 'warning';
      case 'urgente': return 'error';
      case 'programado': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'enviado': return <CheckCircle />;
      case 'urgente': return <Warning />;
      case 'programado': return <Schedule />;
      default: return <Notifications />;
    }
  };

  const templateLembrete = (agendamento) => {
    return `Olá ${agendamento.paciente}! 

Lembramos que você tem um agendamento marcado:

📅 Data: ${new Date(agendamento.dataHora).toLocaleDateString('pt-BR')}
🕐 Horário: ${new Date(agendamento.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
👨‍⚕️ Profissional: ${agendamento.profissional}
🏥 Procedimento: ${agendamento.procedimento}

${agendamento.observacoes ? `📝 Observações: ${agendamento.observacoes}` : ''}

Para confirmar ou reagendar, responda esta mensagem.

ALTclinic - Sua saúde em primeiro lugar! 💙`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications />
          <Typography variant="h6">
            Gestão de Lembretes Automatizados
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Estatísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {estatisticas.total}
              </Typography>
              <Typography variant="caption">
                Total
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {estatisticas.pendentes}
              </Typography>
              <Typography variant="caption">
                Pendentes
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {estatisticas.enviados}
              </Typography>
              <Typography variant="caption">
                Enviados
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {estatisticas.urgentes}
              </Typography>
              <Typography variant="caption">
                Urgentes
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filtroStatus}
                label="Status"
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pendente">Pendentes</MenuItem>
                <MenuItem value="enviado">Enviados</MenuItem>
                <MenuItem value="urgente">Urgentes</MenuItem>
                <MenuItem value="programado">Programados</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filtroTipo}
                label="Tipo"
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="48h">48 horas</MenuItem>
                <MenuItem value="24h">24 horas</MenuItem>
                <MenuItem value="urgente">Urgente</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Send />}
              onClick={handleEnviarTodosLembretes}
              disabled={estatisticas.pendentes === 0}
            >
              Enviar Todos Pendentes
            </Button>
          </Grid>
        </Grid>

        {estatisticas.urgentes > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              Atenção! {estatisticas.urgentes} agendamento(s) com lembrete urgente.
            </Typography>
          </Alert>
        )}

        {/* Lista de lembretes */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Agendamento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Próximo Envio</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lembretesFiltrados.map((lembrete) => (
                <TableRow key={lembrete.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {lembrete.paciente}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lembrete.telefone}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {lembrete.procedimento}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(lembrete.dataHora).toLocaleString('pt-BR')}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="primary">
                      Em {lembrete.diffHoras}h
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={getStatusIcon(lembrete.statusLembrete)}
                      label={lembrete.statusLembrete}
                      color={getStatusColor(lembrete.statusLembrete)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={lembrete.tipoLembrete}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption">
                      {lembrete.proximoEnvio?.toLocaleString('pt-BR')}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleEnviarLembrete(lembrete, 'whatsapp')}
                      disabled={enviandoLembrete === lembrete.id}
                      title="Enviar via WhatsApp"
                    >
                      <WhatsApp />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEnviarLembrete(lembrete, 'email')}
                      disabled={enviandoLembrete === lembrete.id}
                      title="Enviar via E-mail"
                    >
                      <Email />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleEnviarLembrete(lembrete, 'sms')}
                      disabled={enviandoLembrete === lembrete.id}
                      title="Enviar via SMS"
                    >
                      <Sms />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {lembretesFiltrados.length === 0 && (
          <Box textAlign="center" py={4}>
            <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum lembrete encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Não há lembretes para os filtros selecionados
            </Typography>
          </Box>
        )}

        {/* Preview do template */}
        {lembretesFiltrados.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview do Lembrete:
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {templateLembrete(lembretesFiltrados[0])}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button startIcon={<Refresh />} onClick={() => window.location.reload()}>
          Atualizar
        </Button>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LembretesModal;
