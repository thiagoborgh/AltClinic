import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Divider
} from '@mui/material';
import {
  Send,
  AccessTime,
  Cancel,
  Refresh,
  ExpandMore,
  ExpandLess,
  AccountTree
} from '@mui/icons-material';
import apiClient from '../../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const STATUS_FILA_CONFIG = {
  pendente: { label: 'Pendente', color: 'warning' },
  enviado: { label: 'Enviado', color: 'success' },
  cancelado: { label: 'Cancelado', color: 'error' },
  adiado: { label: 'Adiado', color: 'info' },
  falhou: { label: 'Falhou', color: 'error' }
};

const StatusChip = ({ status }) => {
  const config = STATUS_FILA_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

// ─── Fila de Envio ───────────────────────────────────────────────────────────

const FilaEnvio = () => {
  const [fila, setFila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchFila = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/crm/followup/fila?status=pendente');
      setFila(Array.isArray(data) ? data : data.fila || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao carregar fila de follow-up.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFila();
  }, [fetchFila]);

  const setLoaderForId = (id, state) =>
    setActionLoading((prev) => ({ ...prev, [id]: state }));

  const handleEnviarAgora = async (id) => {
    setLoaderForId(id, 'enviar');
    try {
      await apiClient.post(`/crm/followup/fila/${id}/enviar`);
      setSnackbar({ open: true, message: 'Mensagem enviada com sucesso!', severity: 'success' });
      fetchFila();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao enviar mensagem.',
        severity: 'error'
      });
    } finally {
      setLoaderForId(id, null);
    }
  };

  const handleAdiar = async (id) => {
    setLoaderForId(id, 'adiar');
    try {
      await apiClient.post(`/crm/followup/fila/${id}/adiar`, { horas: 24 });
      setSnackbar({ open: true, message: 'Envio adiado em 24 horas.', severity: 'info' });
      fetchFila();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao adiar envio.',
        severity: 'error'
      });
    } finally {
      setLoaderForId(id, null);
    }
  };

  const handleCancelar = async (id) => {
    setLoaderForId(id, 'cancelar');
    try {
      await apiClient.post(`/crm/followup/fila/${id}/cancelar`);
      setSnackbar({ open: true, message: 'Envio cancelado.', severity: 'warning' });
      fetchFila();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao cancelar envio.',
        severity: 'error'
      });
    } finally {
      setLoaderForId(id, null);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          {loading ? 'Carregando...' : `${fila.length} mensagem(ns) na fila`}
        </Typography>
        <IconButton onClick={fetchFila} disabled={loading} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={fetchFila}>Tentar novamente</Button>}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Paciente</strong></TableCell>
              <TableCell><strong>WhatsApp</strong></TableCell>
              <TableCell><strong>Sequência / Passo</strong></TableCell>
              <TableCell><strong>Agendado para</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : fila.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">Nenhuma mensagem na fila.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              fila.map((item) => {
                const isLoading = actionLoading[item.id];
                const isPendente = item.status === 'pendente' || !item.status;
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.paciente_nome || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.numero_whatsapp || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.sequencia_nome || '—'}</Typography>
                      {item.passo_descricao && (
                        <Typography variant="caption" color="textSecondary" display="block" noWrap sx={{ maxWidth: 200 }}>
                          {item.passo_descricao}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(item.agendado_para)}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status || 'pendente'} />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        {isPendente ? (
                          <>
                            <Tooltip title="Enviar agora">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleEnviarAgora(item.id)}
                                  disabled={!!isLoading}
                                >
                                  {isLoading === 'enviar' ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Send fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Adiar 24h">
                              <span>
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleAdiar(item.id)}
                                  disabled={!!isLoading}
                                >
                                  {isLoading === 'adiar' ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <AccessTime fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Cancelar envio">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelar(item.id)}
                                  disabled={!!isLoading}
                                >
                                  {isLoading === 'cancelar' ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Cancel fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        ) : (
                          <Typography variant="caption" color="textSecondary">—</Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Sequências ──────────────────────────────────────────────────────────────

const SequenciaItem = ({ sequencia }) => {
  const [expanded, setExpanded] = useState(false);
  const passos = sequencia.passos || [];

  return (
    <Paper variant="outlined" sx={{ mb: 1.5 }}>
      <ListItem
        button
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ py: 1.5 }}
      >
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              <AccountTree fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">
                {sequencia.nome}
              </Typography>
            </Box>
          }
          secondary={
            <Typography variant="caption" color="textSecondary">
              {passos.length} passo(s)
              {sequencia.etapa_id ? ` · Etapa ID: ${sequencia.etapa_id}` : ''}
            </Typography>
          }
        />
        <ListItemSecondaryAction>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={`${passos.length} passos`} size="small" color="primary" variant="outlined" />
            <IconButton size="small" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </ListItemSecondaryAction>
      </ListItem>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ px: 3, py: 1.5 }}>
          {passos.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              Nenhum passo configurado.
            </Typography>
          ) : (
            passos.map((passo, idx) => (
              <Box key={idx} display="flex" alignItems="flex-start" gap={2} mb={1}>
                <Chip
                  label={`#${passo.ordem || idx + 1}`}
                  size="small"
                  sx={{ minWidth: 40, fontWeight: 'bold' }}
                />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {passo.tipo_mensagem || '—'}
                    {passo.gatilho_dias != null && (
                      <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        (após {passo.gatilho_dias} dia(s))
                      </Typography>
                    )}
                  </Typography>
                  {passo.template && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      Template: {passo.template}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

const Sequencias = () => {
  const [sequencias, setSequencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSequencias = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/crm/sequencias');
      setSequencias(Array.isArray(data) ? data : data.sequencias || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao carregar sequências.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSequencias();
  }, [fetchSequencias]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={fetchSequencias}>Tentar novamente</Button>}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          {sequencias.length} sequência(s) configurada(s)
        </Typography>
        <IconButton onClick={fetchSequencias} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {sequencias.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">Nenhuma sequência configurada.</Typography>
        </Paper>
      ) : (
        <List disablePadding>
          {sequencias.map((seq) => (
            <SequenciaItem key={seq.id} sequencia={seq} />
          ))}
        </List>
      )}
    </Box>
  );
};

// ─── Componente Principal ────────────────────────────────────────────────────

const CRMFollowup = () => {
  const [tabInterna, setTabInterna] = useState(0);

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabInterna}
          onChange={(_, v) => setTabInterna(v)}
          variant="fullWidth"
        >
          <Tab label="Fila de Envio" icon={<Send />} iconPosition="start" />
          <Tab label="Sequências" icon={<AccountTree />} iconPosition="start" />
        </Tabs>
      </Paper>

      {tabInterna === 0 && <FilaEnvio />}
      {tabInterna === 1 && <Sequencias />}
    </Box>
  );
};

export default CRMFollowup;
