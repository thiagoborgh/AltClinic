import React, { useState, useEffect } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Refresh, Replay } from '@mui/icons-material';
import { crmService } from '../../services/api';
import toast from 'react-hot-toast';

const tipoLabel = {
  confirmacao: 'Confirmação',
  lembrete: 'Lembrete',
  manual: 'Manual'
};

const statusLabel = {
  enviado: 'Enviado',
  falhou: 'Falhou',
  pendente: 'Pendente'
};

const HistoricoMensagensWhatsApp = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    status: '',
    tipo: '',
    pacienteId: '',
    profissionalId: '',
    limit: 50
  });
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);

  useEffect(() => {
    loadData();
  }, [filtros]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Carregar logs
      const logsResp = await crmService.getMensagensLog(filtros);
      setLogs(logsResp.data.logs || []);

      // Carregar pacientes e profissionais se não carregados
      if (pacientes.length === 0) {
        const pacientesResp = await crmService.getPacientes({ limit: 1000 });
        setPacientes(Array.isArray(pacientesResp.data) ? pacientesResp.data : []);
      }

      if (profissionais.length === 0) {
        // Assumindo que há um serviço para profissionais
        // Se não existir, pode ser necessário criar
        try {
          const profResp = await fetch('/api/profissionais', {
            headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('saee-auth') || '{}').state?.token}` }
          });
          if (profResp.ok) {
            const profData = await profResp.json();
            setProfissionais(Array.isArray(profData) ? profData : []);
          }
        } catch (err) {
          console.warn('Não foi possível carregar profissionais:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar histórico WhatsApp:', err);
      setError('Erro ao carregar histórico de mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleReenviar = async (log) => {
    if (!log) return;

    try {
      // Aqui você pode implementar a lógica de reenvio
      // Por enquanto, apenas mostra um toast
      toast.success('Funcionalidade de reenvio em desenvolvimento');

      // Futuramente:
      // await whatsappService.sendMessage({
      //   phone: log.telefone,
      //   message: log.mensagem,
      //   pacienteId: log.pacienteId,
      //   profissionalId: log.profissionalId,
      //   tipo: 'reenvio'
      // });

    } catch (err) {
      console.error('Erro ao reenviar mensagem:', err);
      toast.error('Erro ao reenviar mensagem');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enviado': return 'success';
      case 'falhou': return 'error';
      case 'pendente': return 'warning';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadData} startIcon={<Refresh />}>
          Tentar Novamente
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Histórico de Mensagens WhatsApp</Typography>
        <IconButton onClick={loadData} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filtros.status}
              label="Status"
              onChange={(e) => handleFiltroChange('status', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="enviado">Enviado</MenuItem>
              <MenuItem value="falhou">Falhou</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filtros.tipo}
              label="Tipo"
              onChange={(e) => handleFiltroChange('tipo', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="confirmacao">Confirmação</MenuItem>
              <MenuItem value="lembrete">Lembrete</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Paciente</InputLabel>
            <Select
              value={filtros.pacienteId}
              label="Paciente"
              onChange={(e) => handleFiltroChange('pacienteId', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {pacientes.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Profissional</InputLabel>
            <Select
              value={filtros.profissionalId}
              label="Profissional"
              onChange={(e) => handleFiltroChange('profissionalId', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {profissionais.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {logs.length === 0 ? (
            <ListItem>
              <ListItemText primary="Nenhuma mensagem encontrada." />
            </ListItem>
          ) : (
            logs.map((log) => (
              <ListItem key={log.id} alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle2">
                        {log.pacienteNome || log.telefone}
                      </Typography>
                      <Chip
                        label={tipoLabel[log.tipo] || log.tipo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={statusLabel[log.status] || log.status}
                        size="small"
                        color={getStatusColor(log.status)}
                      />
                      {log.profissionalNome && (
                        <Typography variant="caption" color="textSecondary">
                          por {log.profissionalNome}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {log.mensagem}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(log.dataEnvio).toLocaleString('pt-BR')}
                        </Typography>
                        {log.dataAgendamento && (
                          <Typography variant="caption" color="textSecondary">
                            • Agendado: {new Date(log.dataAgendamento).toLocaleString('pt-BR')}
                          </Typography>
                        )}
                        {log.tentativas > 1 && (
                          <Typography variant="caption" color="textSecondary">
                            • Tentativas: {log.tentativas}
                          </Typography>
                        )}
                        {log.erro && (
                          <Typography variant="caption" color="error">
                            • Erro: {log.erro}
                          </Typography>
                        )}
                      </Box>
                    </>
                  }
                />
                {log.status === 'falhou' && (
                  <Button
                    size="small"
                    startIcon={<Replay />}
                    onClick={() => handleReenviar(log)}
                    sx={{ ml: 1 }}
                  >
                    Reenviar
                  </Button>
                )}
              </ListItem>
            ))
          )}
        </List>
      )}
    </Paper>
  );
};

export default HistoricoMensagensWhatsApp;