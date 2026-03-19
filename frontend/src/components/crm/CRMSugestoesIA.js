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
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material';
import { AutoAwesome, Refresh, CheckCircle, Snooze, Cancel } from '@mui/icons-material';
import apiClient from '../../services/api';

const formatCurrency = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const PRIORIDADE_CONFIG = {
  alta: { label: 'Alta', color: 'error' },
  media: { label: 'Média', color: 'warning' },
  baixa: { label: 'Baixa', color: 'info' }
};

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'warning' },
  convertida: { label: 'Convertida', color: 'success' },
  ignorada: { label: 'Ignorada', color: 'default' },
  adiada: { label: 'Adiada', color: 'info' }
};

const PrioridadeChip = ({ prioridade }) => {
  const config = PRIORIDADE_CONFIG[prioridade] || { label: prioridade, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
};

const CRMSugestoesIA = () => {
  const [sugestoes, setSugestoes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState({});

  const fetchSugestoes = useCallback(async (status) => {
    setLoading(true);
    setError('');
    try {
      const params = status === 'todas' ? '?limit=50' : `?status=${status}&limit=50`;
      const { data } = await apiClient.get(`/crm/sugestoes${params}`);
      setSugestoes(Array.isArray(data) ? data : data.sugestoes || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao carregar sugestões.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSugestoes(filtroStatus);
  }, [filtroStatus, fetchSugestoes]);

  const handleFiltroChange = (event, novoFiltro) => {
    if (novoFiltro !== null) setFiltroStatus(novoFiltro);
  };

  const setLoaderForId = (id, state) =>
    setActionLoading((prev) => ({ ...prev, [id]: state }));

  const handleConverter = async (id) => {
    setLoaderForId(id, 'converter');
    try {
      await apiClient.post(`/crm/sugestoes/${id}/converter`);
      setSnackbar({ open: true, message: 'Sugestão convertida em oportunidade!', severity: 'success' });
      fetchSugestoes(filtroStatus);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao converter sugestão.',
        severity: 'error'
      });
    } finally {
      setLoaderForId(id, null);
    }
  };

  const handleAdiar = async (id) => {
    setLoaderForId(id, 'adiar');
    try {
      await apiClient.post(`/crm/sugestoes/${id}/adiar`, { dias: 7 });
      setSnackbar({ open: true, message: 'Sugestão adiada por 7 dias.', severity: 'info' });
      fetchSugestoes(filtroStatus);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao adiar sugestão.',
        severity: 'error'
      });
    } finally {
      setLoaderForId(id, null);
    }
  };

  const handleIgnorar = async (id) => {
    setLoaderForId(id, 'ignorar');
    try {
      await apiClient.post(`/crm/sugestoes/${id}/ignorar`);
      setSnackbar({ open: true, message: 'Sugestão ignorada.', severity: 'warning' });
      fetchSugestoes(filtroStatus);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao ignorar sugestão.',
        severity: 'error'
      });
    } finally {
      setLoaderForId(id, null);
    }
  };

  const handleProcessarAgora = async () => {
    setProcessando(true);
    try {
      await apiClient.post('/crm/sugestoes/processar');
      setSnackbar({ open: true, message: 'Processamento de IA iniciado!', severity: 'success' });
      setTimeout(() => fetchSugestoes(filtroStatus), 2000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao iniciar processamento.',
        severity: 'error'
      });
    } finally {
      setProcessando(false);
    }
  };

  const pendentesCount = sugestoes.filter((s) => s.status === 'pendente' || !s.status).length;

  return (
    <Box>
      {/* Banner IA */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'primary.dark',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesome />
          <Typography variant="subtitle1" fontWeight="bold">
            {loading
              ? 'Carregando sugestões da IA...'
              : `${sugestoes.length} sugestão(ões) gerada(s) pela IA`}
            {!loading && pendentesCount > 0 && filtroStatus !== 'pendente' && (
              <Chip
                label={`${pendentesCount} pendente(s)`}
                color="warning"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="warning"
          startIcon={processando ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
          onClick={handleProcessarAgora}
          disabled={processando}
          size="small"
        >
          {processando ? 'Processando...' : 'Processar agora'}
        </Button>
      </Paper>

      {/* Filtros */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <ToggleButtonGroup
          value={filtroStatus}
          exclusive
          onChange={handleFiltroChange}
          size="small"
        >
          <ToggleButton value="todas">Todas</ToggleButton>
          <ToggleButton value="pendente">Pendentes</ToggleButton>
          <ToggleButton value="convertida">Convertidas</ToggleButton>
          <ToggleButton value="ignorada">Ignoradas</ToggleButton>
        </ToggleButtonGroup>
        <IconButton onClick={() => fetchSugestoes(filtroStatus)} disabled={loading} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => fetchSugestoes(filtroStatus)}>Tentar novamente</Button>}>
          {error}
        </Alert>
      )}

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Descrição</strong></TableCell>
              <TableCell><strong>Paciente</strong></TableCell>
              <TableCell><strong>Prioridade</strong></TableCell>
              <TableCell><strong>Valor Potencial</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Data</strong></TableCell>
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : sugestoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">Nenhuma sugestão encontrada.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              sugestoes.map((s) => {
                const isLoading = actionLoading[s.id];
                const isPendente = s.status === 'pendente' || !s.status;
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Chip label={s.tipo || '—'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {s.descricao}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.paciente_nome || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <PrioridadeChip prioridade={s.prioridade} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary.main" fontWeight="medium">
                        {formatCurrency(s.valor_potencial)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={s.status || 'pendente'} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(s.criado_em)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        {isPendente && (
                          <>
                            <Tooltip title="Converter em oportunidade">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleConverter(s.id)}
                                  disabled={!!isLoading}
                                >
                                  {isLoading === 'converter' ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <CheckCircle fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Adiar 7 dias">
                              <span>
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleAdiar(s.id)}
                                  disabled={!!isLoading}
                                >
                                  {isLoading === 'adiar' ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Snooze fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Ignorar sugestão">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleIgnorar(s.id)}
                                  disabled={!!isLoading}
                                >
                                  {isLoading === 'ignorar' ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Cancel fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                        {!isPendente && (
                          <Typography variant="caption" color="textSecondary">
                            —
                          </Typography>
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

export default CRMSugestoesIA;
