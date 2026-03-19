import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider
} from '@mui/material';
import { Add, ArrowForward } from '@mui/icons-material';
import apiClient from '../../services/api';

const formatCurrency = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const ScoreBadge = ({ score }) => {
  if (score == null) return null;
  const color = score >= 70 ? 'success' : score >= 40 ? 'warning' : 'error';
  return (
    <Chip
      label={`IA: ${score}`}
      color={color}
      size="small"
      sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
    />
  );
};

const OportunidadeCard = ({ oportunidade, etapas, onMover }) => {
  const etapaAtualIndex = etapas.findIndex((e) => e.id === oportunidade.etapa_id);
  const proximaEtapa = etapas[etapaAtualIndex + 1] || null;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderLeft: '4px solid',
        borderLeftColor: etapas[etapaAtualIndex]?.cor || 'primary.main',
        '&:hover': { boxShadow: 3 }
      }}
    >
      <CardContent sx={{ pb: 0, pt: 1.5, px: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" noWrap>
          {oportunidade.titulo}
        </Typography>
        <Typography variant="body2" color="textSecondary" noWrap>
          {oportunidade.paciente_nome}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="body2" color="primary.main" fontWeight="medium">
            {formatCurrency(oportunidade.valor)}
          </Typography>
          <ScoreBadge score={oportunidade.score_ia} />
        </Box>
      </CardContent>
      {proximaEtapa && (
        <CardActions sx={{ pt: 0, px: 2, pb: 1 }}>
          <Button
            size="small"
            variant="text"
            endIcon={<ArrowForward fontSize="small" />}
            onClick={() => onMover(oportunidade.id, proximaEtapa.id, proximaEtapa.nome)}
            sx={{ fontSize: '0.72rem', textTransform: 'none', ml: 'auto' }}
          >
            {proximaEtapa.nome}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

const KanbanColumn = ({ etapa, oportunidades, etapas, onMover }) => (
  <Paper
    elevation={2}
    sx={{
      minWidth: 260,
      maxWidth: 280,
      flex: '0 0 auto',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 300px)',
      bgcolor: 'grey.50'
    }}
  >
    {/* Header da coluna */}
    <Box
      sx={{
        p: 1.5,
        borderTop: '4px solid',
        borderTopColor: etapa.cor || 'primary.main',
        borderRadius: '4px 4px 0 0',
        bgcolor: 'white'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight="bold">
          {etapa.nome}
        </Typography>
        <Chip
          label={oportunidades.length}
          size="small"
          sx={{ bgcolor: etapa.cor || 'primary.main', color: 'white', fontWeight: 'bold' }}
        />
      </Box>
    </Box>
    <Divider />
    {/* Cards */}
    <Box sx={{ p: 1.5, overflowY: 'auto', flex: 1 }}>
      {oportunidades.length === 0 ? (
        <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ mt: 2 }}>
          Nenhuma oportunidade
        </Typography>
      ) : (
        oportunidades.map((op) => (
          <OportunidadeCard
            key={op.id}
            oportunidade={op}
            etapas={etapas}
            onMover={onMover}
          />
        ))
      )}
    </Box>
  </Paper>
);

const NovaOportunidadeDialog = ({ open, onClose, etapas, onSalvar }) => {
  const [form, setForm] = useState({ titulo: '', valor: '', etapa_id: '', paciente_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSalvar = async () => {
    if (!form.titulo || !form.etapa_id) {
      setError('Título e etapa são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        titulo: form.titulo,
        etapa_id: Number(form.etapa_id),
        valor: form.valor ? Number(form.valor) : undefined,
        paciente_id: form.paciente_id ? Number(form.paciente_id) : undefined
      };
      await apiClient.post('/crm/oportunidades', payload);
      setForm({ titulo: '', valor: '', etapa_id: '', paciente_id: '' });
      onSalvar();
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao criar oportunidade.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ titulo: '', valor: '', etapa_id: '', paciente_id: '' });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nova Oportunidade</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Título *"
          value={form.titulo}
          onChange={handleChange('titulo')}
          fullWidth
          size="small"
        />
        <TextField
          label="ID do Paciente"
          value={form.paciente_id}
          onChange={handleChange('paciente_id')}
          fullWidth
          size="small"
          type="number"
          helperText="Deixe em branco se não houver paciente vinculado"
        />
        <TextField
          label="Valor (R$)"
          value={form.valor}
          onChange={handleChange('valor')}
          fullWidth
          size="small"
          type="number"
          inputProps={{ min: 0, step: '0.01' }}
        />
        <TextField
          select
          label="Etapa *"
          value={form.etapa_id}
          onChange={handleChange('etapa_id')}
          fullWidth
          size="small"
        >
          {etapas.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.nome}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CRMPipeline = () => {
  const [etapas, setEtapas] = useState([]);
  const [oportunidades, setOportunidades] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEtapas = useCallback(async () => {
    const { data } = await apiClient.get('/crm/etapas');
    return data;
  }, []);

  const fetchOportunidades = useCallback(async (etapasData) => {
    const results = {};
    await Promise.all(
      etapasData.map(async (etapa) => {
        const { data } = await apiClient.get(`/crm/oportunidades?etapa_id=${etapa.id}&limit=50`);
        results[etapa.id] = Array.isArray(data) ? data : data.oportunidades || [];
      })
    );
    return results;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const etapasData = await fetchEtapas();
      const opData = await fetchOportunidades(etapasData);
      setEtapas(etapasData);
      setOportunidades(opData);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao carregar pipeline.');
    } finally {
      setLoading(false);
    }
  }, [fetchEtapas, fetchOportunidades]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMover = async (oportunidadeId, novaEtapaId, novaEtapaNome) => {
    try {
      await apiClient.patch(`/crm/oportunidades/${oportunidadeId}/mover`, { etapa_id: novaEtapaId });
      setSnackbar({ open: true, message: `Movido para "${novaEtapaNome}"`, severity: 'success' });
      loadData();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Erro ao mover oportunidade.',
        severity: 'error'
      });
    }
  };

  const handleNovaOportunidade = () => {
    loadData();
    setDialogOpen(false);
    setSnackbar({ open: true, message: 'Oportunidade criada com sucesso!', severity: 'success' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={loadData}>Tentar novamente</Button>}>
        {error}
      </Alert>
    );
  }

  const totalOportunidades = Object.values(oportunidades).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Box>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6">Pipeline de Vendas</Typography>
          <Typography variant="body2" color="textSecondary">
            {totalOportunidades} oportunidades em {etapas.length} etapas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Nova Oportunidade
        </Button>
      </Box>

      {/* Board Kanban */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          alignItems: 'flex-start'
        }}
      >
        {etapas.map((etapa) => (
          <KanbanColumn
            key={etapa.id}
            etapa={etapa}
            oportunidades={oportunidades[etapa.id] || []}
            etapas={etapas}
            onMover={handleMover}
          />
        ))}
      </Box>

      {/* Dialog Nova Oportunidade */}
      <NovaOportunidadeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        etapas={etapas}
        onSalvar={handleNovaOportunidade}
      />

      {/* Feedback Snackbar */}
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

export default CRMPipeline;
