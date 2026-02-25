import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  MedicalServices,
  HealthAndSafety,
  People,
  Save
} from '@mui/icons-material';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import cadastrosService from '../services/cadastrosService';

// ── Configuração das abas ────────────────────────────────────────────────────

const TABS = [
  { key: 'procedimentos', label: 'Procedimentos', icon: <MedicalServices fontSize="small" /> },
  { key: 'convenios',     label: 'Convênios',     icon: <HealthAndSafety fontSize="small" /> },
  { key: 'usuarios',      label: 'Usuários',       icon: <People fontSize="small" /> },
];

// ── Estado inicial dos formulários ───────────────────────────────────────────

const EMPTY_PROCEDIMENTO = { nome: '', duracao: 30, valor: '', categoria: '', ativo: true };
const EMPTY_CONVENIO     = { nome: '', codigo: '', ativo: true };
const EMPTY_USUARIO      = { nome: '', email: '', cargo: '', ativo: true };

const CATEGORIAS = ['Consulta', 'Estética', 'Cirurgia', 'Fisioterapia', 'Exame', 'Outro'];

// ── Componente principal ─────────────────────────────────────────────────────

const Cadastros = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Dados
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios]         = useState([]);
  const [usuarios, setUsuarios]           = useState([]);

  // Dialog
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [isEdit, setIsEdit]           = useState(false);
  const [editId, setEditId]           = useState(null);
  const [formData, setFormData]       = useState({});
  const [saving, setSaving]           = useState(false);

  // Confirmação de exclusão
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, nome: '' });

  // ── Carregar dados ─────────────────────────────────────────────────────────

  const [refreshTick, setRefreshTick] = useState(0);
  const loadData = () => setRefreshTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [p, c, u] = await Promise.all([
          cadastrosService.getProcedimentos(),
          cadastrosService.getConvenios(),
          cadastrosService.getUsuarios(),
        ]);
        if (!cancelled) {
          setProcedimentos(p);
          setConvenios(c);
          setUsuarios(u);
        }
      } catch (e) {
        if (!cancelled) console.error('Erro ao carregar cadastros:', e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshTick]);

  // Filtrar usuário logado no momento do render (sem afetar o loop de deps)
  const usuariosFiltrados = usuarios.filter(u => u.email !== user?.email);

  // ── Helpers do formulário ──────────────────────────────────────────────────

  const tabKey = TABS[tab].key;

  const openCreate = () => {
    const empty = tabKey === 'procedimentos' ? { ...EMPTY_PROCEDIMENTO }
                : tabKey === 'convenios'     ? { ...EMPTY_CONVENIO }
                :                             { ...EMPTY_USUARIO };
    setFormData(empty);
    setIsEdit(false);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setFormData({
      ...row,
      ativo: row.ativo === 1 || row.ativo === true,
      valor: row.valor !== undefined ? String(row.valor) : '',
    });
    setIsEdit(true);
    setEditId(row.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        ativo: formData.ativo ? 1 : 0,
        ...(tabKey === 'procedimentos' && { valor: parseFloat(formData.valor) || 0 }),
      };

      if (isEdit) {
        if (tabKey === 'procedimentos') await cadastrosService.atualizarProcedimento(editId, payload);
        else if (tabKey === 'convenios') await cadastrosService.atualizarConvenio(editId, payload);
        else                             await cadastrosService.atualizarUsuario(editId, payload);
        showToast('Atualizado com sucesso', 'success');
      } else {
        if (tabKey === 'procedimentos') await cadastrosService.criarProcedimento(payload);
        else if (tabKey === 'convenios') await cadastrosService.criarConvenio(payload);
        else                             await cadastrosService.criarUsuario(payload);
        showToast('Cadastrado com sucesso', 'success');
      }

      setDialogOpen(false);
      loadData();
    } catch (e) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    setDeleteDialog({ open: true, id: row.id, nome: row.nome });
  };

  const handleDelete = async () => {
    try {
      if (tabKey === 'procedimentos') await cadastrosService.deletarProcedimento(deleteDialog.id);
      else if (tabKey === 'convenios') await cadastrosService.deletarConvenio(deleteDialog.id);
      else                             await cadastrosService.deletarUsuario(deleteDialog.id);
      showToast('Excluído com sucesso', 'success');
      setDeleteDialog({ open: false, id: null, nome: '' });
      loadData();
    } catch (e) {
      showToast('Erro ao excluir: ' + e.message, 'error');
    }
  };

  // ── Filtro de busca ────────────────────────────────────────────────────────

  const filtered = {
    procedimentos: procedimentos.filter(r =>
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      (r.categoria || '').toLowerCase().includes(search.toLowerCase())
    ),
    convenios: convenios.filter(r =>
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      (r.codigo || '').toLowerCase().includes(search.toLowerCase())
    ),
    usuarios: usuariosFiltrados.filter(r =>
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.cargo || '').toLowerCase().includes(search.toLowerCase())
    ),
  };

  // ── Validação básica ───────────────────────────────────────────────────────

  const isValid = () => {
    if (!formData.nome?.trim()) return false;
    if (tabKey === 'usuarios' && !formData.email?.trim()) return false;
    return true;
  };

  // ── Render tabela ──────────────────────────────────────────────────────────

  const renderAtivoChip = (ativo) => (
    <Chip
      label={ativo ? 'Ativo' : 'Inativo'}
      color={ativo ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  );

  const renderAcoes = (row) => (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Editar">
        <IconButton size="small" onClick={() => openEdit(row)}>
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Excluir">
        <IconButton size="small" color="error" onClick={() => confirmDelete(row)}>
          <Delete fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const renderTable = () => {
    if (tabKey === 'procedimentos') {
      const rows = filtered.procedimentos;
      return (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Duração</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {loading ? 'Carregando...' : 'Nenhum procedimento cadastrado'}
                  </TableCell>
                </TableRow>
              )}
              {rows.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.nome}</TableCell>
                  <TableCell>{row.duracao} min</TableCell>
                  <TableCell>R$ {Number(row.valor).toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell>{row.categoria || '—'}</TableCell>
                  <TableCell>{renderAtivoChip(row.ativo)}</TableCell>
                  <TableCell align="right">{renderAcoes(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    if (tabKey === 'convenios') {
      const rows = filtered.convenios;
      return (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Código / Operadora</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {loading ? 'Carregando...' : 'Nenhum convênio cadastrado'}
                  </TableCell>
                </TableRow>
              )}
              {rows.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.nome}</TableCell>
                  <TableCell>{row.codigo || '—'}</TableCell>
                  <TableCell>{renderAtivoChip(row.ativo)}</TableCell>
                  <TableCell align="right">{renderAcoes(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    // usuarios
    const rows = filtered.usuarios;
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Cargo / Função</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {loading ? 'Carregando...' : 'Nenhum usuário cadastrado'}
                </TableCell>
              </TableRow>
            )}
            {rows.map(row => (
              <TableRow key={row.id} hover>
                <TableCell>{row.nome}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.cargo || '—'}</TableCell>
                <TableCell>{renderAtivoChip(row.ativo)}</TableCell>
                <TableCell align="right">{renderAcoes(row)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // ── Render formulário do dialog ────────────────────────────────────────────

  const renderForm = () => {
    if (tabKey === 'procedimentos') return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Nome do procedimento *"
          fullWidth
          value={formData.nome || ''}
          onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
        />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Duração (min)"
            type="number"
            fullWidth
            value={formData.duracao || ''}
            onChange={e => setFormData(p => ({ ...p, duracao: e.target.value }))}
          />
          <TextField
            label="Valor (R$)"
            type="number"
            fullWidth
            value={formData.valor || ''}
            onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))}
          />
        </Stack>
        <FormControl fullWidth>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={formData.categoria || ''}
            label="Categoria"
            onChange={e => setFormData(p => ({ ...p, categoria: e.target.value }))}
          >
            <MenuItem value="">Sem categoria</MenuItem>
            {CATEGORIAS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={!!formData.ativo}
              onChange={e => setFormData(p => ({ ...p, ativo: e.target.checked }))}
            />
          }
          label="Ativo"
        />
      </Stack>
    );

    if (tabKey === 'convenios') return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Nome do convênio *"
          fullWidth
          value={formData.nome || ''}
          onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
        />
        <TextField
          label="Código / Operadora"
          fullWidth
          value={formData.codigo || ''}
          onChange={e => setFormData(p => ({ ...p, codigo: e.target.value }))}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!!formData.ativo}
              onChange={e => setFormData(p => ({ ...p, ativo: e.target.checked }))}
            />
          }
          label="Ativo"
        />
      </Stack>
    );

    // usuarios
    return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
          <Typography variant="caption">
            O usuário logado fica no <strong>Perfil</strong>. Aqui cadastre outros funcionários.
          </Typography>
        </Alert>
        <TextField
          label="Nome completo *"
          fullWidth
          value={formData.nome || ''}
          onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
        />
        <TextField
          label="E-mail *"
          type="email"
          fullWidth
          value={formData.email || ''}
          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
        />
        <TextField
          label="Cargo / Função"
          fullWidth
          value={formData.cargo || ''}
          onChange={e => setFormData(p => ({ ...p, cargo: e.target.value }))}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!!formData.ativo}
              onChange={e => setFormData(p => ({ ...p, ativo: e.target.checked }))}
            />
          }
          label="Ativo"
        />
      </Stack>
    );
  };

  const dialogTitle = isEdit
    ? `Editar ${TABS[tab].label.slice(0, -1)}`
    : `Novo ${TABS[tab].label.slice(0, -1)}`;

  // ── Render principal ───────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Cadastros
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie procedimentos, convênios e usuários da clínica
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreate}
        >
          Novo {TABS[tab].label.slice(0, -1)}
        </Button>
      </Stack>

      <Paper>
        {/* Abas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }}>
            {TABS.map((t, i) => (
              <Tab
                key={t.key}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {t.icon}
                    <span>{t.label}</span>
                  </Stack>
                }
                value={i}
              />
            ))}
          </Tabs>
        </Box>

        {/* Barra de busca */}
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 280 }}
          />
        </Box>

        {/* Tabela */}
        {renderTable()}
      </Paper>

      {/* Dialog de criar/editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {renderForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!isValid() || saving}
            onClick={handleSave}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, nome: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja excluir <strong>{deleteDialog.nome}</strong>? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null, nome: '' })}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cadastros;
