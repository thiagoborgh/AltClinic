import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Search,
  Settings,
  Delete,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Restore,
  Upgrade,
  Add,
  Email
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const Licencas = () => {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [planoFilter, setPlanoFilter] = useState('todos');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [dialogType, setDialogType] = useState(''); // 'reset-trial', 'change-plan', 'change-status'
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dias: 30,
    plano: '',
    status: '',
    // Dados para criação de tenant
    nome: '',
    email: '',
    telefone: '',
    clinica: '',
    especialidade: '',
    planoTenant: 'trial',
    sendTempPassword: true,
    customPassword: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchTenants();
    fetchStats();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/tenants/admin/list');
      if (response.data.success) {
        setTenants(response.data.tenants);
      }
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar tenants',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/tenants/admin/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'suspended': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle fontSize="small" />;
      case 'trial': return <Warning fontSize="small" />;
      case 'suspended': return <ErrorIcon fontSize="small" />;
      case 'cancelled': return <Delete fontSize="small" />;
      default: return <ErrorIcon fontSize="small" />;
    }
  };

  const getPlanoColor = (plano) => {
    switch (plano) {
      case 'premium': return 'primary';
      case 'basic': return 'secondary';
      case 'trial': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID Tenant',
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value.substring(0, 8)} variant="outlined" size="small" />
      )
    },
    {
      field: 'nome',
      headerName: 'Nome da Clínica',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1, fontSize: 14 }}>
            {params.row.nome.charAt(0)}
          </Avatar>
          {params.value}
        </Box>
      )
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200
    },
    {
      field: 'owner',
      headerName: 'Proprietário',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.value?.nome || params.value?.email}</Typography>
          <Typography variant="caption" color="text.secondary">{params.value?.email}</Typography>
        </Box>
      )
    },
    {
      field: 'plano',
      headerName: 'Plano',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value?.toUpperCase() || 'TRIAL'}
          color={getPlanoColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'trial_expire_at',
      headerName: 'Vencimento Trial',
      width: 140,
      renderCell: (params) => (
        params.value ? new Date(params.value).toLocaleDateString('pt-BR') : 'N/A'
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value?.toUpperCase() || 'TRIAL'}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'created_at',
      headerName: 'Criado em',
      width: 120,
      renderCell: (params) => (
        new Date(params.value).toLocaleDateString('pt-BR')
      )
    },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Resetar Trial">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog('reset-trial', params.row)}
              color="warning"
            >
              <Restore />
            </IconButton>
          </Tooltip>
          <Tooltip title="Alterar Plano">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog('change-plan', params.row)}
              color="primary"
            >
              <Upgrade />
            </IconButton>
          </Tooltip>
          <Tooltip title="Alterar Status">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog('change-status', params.row)}
              color="secondary"
            >
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reenviar Senha">
            <IconButton
              size="small"
              onClick={() => handleResendPassword(params.row)}
              color="info"
            >
              <Email />
            </IconButton>
          </Tooltip>
          <Tooltip title="Inativar Licença">
            <IconButton
              size="small"
              onClick={() => handleDeleteTenant(params.row.id)}
              color="error"
            >
              <ErrorIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const handleOpenDialog = (type, tenant) => {
    setDialogType(type);
    setSelectedTenant(tenant);
    setFormData({
      dias: 30,
      plano: tenant.plano || '',
      status: tenant.status || ''
    });
    setOpenDialog(true);
  };

  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm('Tem certeza que deseja inativar esta licença? O tenant será marcado como cancelado e poderá ser reativado posteriormente.')) {
      try {
        const response = await axios.delete(`/tenants/admin/${tenantId}`);
        if (response.data.success) {
          // Atualizar o status do tenant na lista local
          setTenants(tenants.map(t => 
            t.id === tenantId ? { ...t, status: 'cancelled' } : t
          ));
          setSnackbar({
            open: true,
            message: 'Licença inativada com sucesso',
            severity: 'success'
          });
          fetchStats();
        }
      } catch (error) {
        console.error('Erro ao inativar licença:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao inativar licença',
          severity: 'error'
        });
      }
    }
  };

  const handleSaveAction = async () => {
    try {
      let response;
      let message = '';

      switch (dialogType) {
        case 'reset-trial':
          response = await axios.put(`/tenants/admin/${selectedTenant.id}/reset-trial`, {
            dias: formData.dias
          });
          message = `Período de teste extendido por ${formData.dias} dias`;
          break;

        case 'change-plan':
          response = await axios.put(`/tenants/admin/${selectedTenant.id}/change-plan`, {
            plano: formData.plano
          });
          message = `Plano alterado para ${formData.plano}`;
          break;

        case 'change-status':
          response = await axios.put(`/tenants/admin/${selectedTenant.id}/change-status`, {
            status: formData.status
          });
          message = `Status alterado para ${formData.status}`;
          break;

        default:
          return;
      }

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: message,
          severity: 'success'
        });
        setOpenDialog(false);
        setSelectedTenant(null);
        fetchTenants();
        fetchStats();
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao executar ação',
        severity: 'error'
      });
    }
  };

  const handleResendPassword = async (tenant) => {
    if (window.confirm(`Deseja reenviar a senha temporária para ${tenant.owner?.email}? Uma nova senha será gerada e enviada por email.`)) {
      try {
        const response = await axios.post(`/tenants/admin/${tenant.id}/send-temp-password`);
        
        if (response.data.success) {
          setSnackbar({
            open: true,
            message: 'Senha temporária reenviada com sucesso',
            severity: 'success'
          });
        }
      } catch (error) {
        console.error('Erro ao reenviar senha:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao reenviar senha',
          severity: 'error'
        });
      }
    }
  };

  const handleCreateTenant = async () => {
    try {
      const createData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        clinica: formData.clinica,
        especialidade: formData.especialidade,
        plano: formData.planoTenant,
        sendTempPassword: formData.sendTempPassword
      };

      if (!formData.sendTempPassword && formData.customPassword) {
        createData.customPassword = formData.customPassword;
      }

      const response = await axios.post('/tenants/admin/create', createData);

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Tenant criado com sucesso! ${response.data.email_sent ? 'Email enviado.' : 'Email não enviado.'}`,
          severity: 'success'
        });
        setCreateDialogOpen(false);
        
        // Reset form
        setFormData({
          ...formData,
          nome: '',
          email: '',
          telefone: '',
          clinica: '',
          especialidade: '',
          planoTenant: 'trial',
          sendTempPassword: true,
          customPassword: ''
        });
        
        fetchTenants();
        fetchStats();
      }
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar tenant';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tenant.owner?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todas' || tenant.status === statusFilter;
    const matchesPlano = planoFilter === 'todos' || tenant.plano === planoFilter;

    return matchesSearch && matchesStatus && matchesPlano;
  });

  return (
    <Box>
      {/* Estatísticas */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {stats.total_tenants}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Tenants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {stats.por_status?.trial || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Em Trial
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {stats.por_status?.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ativos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {stats.por_status?.suspended || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Suspensos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Gerenciamento de Licenças/Tenants
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            color="primary"
          >
            Novo Tenant
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => {
              fetchTenants();
              fetchStats();
            }}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por nome, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  <MenuItem value="trial">Trial</MenuItem>
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="suspended">Suspenso</MenuItem>
                  <MenuItem value="cancelled">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Plano</InputLabel>
                <Select
                  value={planoFilter}
                  label="Plano"
                  onChange={(e) => setPlanoFilter(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="trial">Trial</MenuItem>
                  <MenuItem value="basic">Básico</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  fetchTenants();
                  fetchStats();
                }}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Tenants */}
      <Card>
        <CardContent>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredTenants}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20]}
              loading={loading}
              disableSelectionOnClick
              localeText={{
                noRowsLabel: 'Nenhum tenant encontrado',
                toolbarFilters: 'Filtros',
                toolbarDensity: 'Densidade',
                toolbarColumns: 'Colunas',
                toolbarExport: 'Exportar'
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para Ações */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'reset-trial' && 'Resetar Período de Teste'}
          {dialogType === 'change-plan' && 'Alterar Plano'}
          {dialogType === 'change-status' && 'Alterar Status'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {dialogType === 'reset-trial' && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Extender o período de teste para o tenant: <strong>{selectedTenant?.nome}</strong>
                </Typography>
                <TextField
                  fullWidth
                  label="Dias adicionais"
                  type="number"
                  value={formData.dias}
                  onChange={(e) => setFormData({ ...formData, dias: parseInt(e.target.value) })}
                  helperText="Número de dias para adicionar ao período de teste"
                />
              </Grid>
            )}

            {dialogType === 'change-plan' && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Alterar plano para o tenant: <strong>{selectedTenant?.nome}</strong>
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Novo Plano</InputLabel>
                  <Select
                    value={formData.plano}
                    label="Novo Plano"
                    onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                  >
                    <MenuItem value="trial">Trial</MenuItem>
                    <MenuItem value="basic">Básico</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {dialogType === 'change-status' && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Alterar status para o tenant: <strong>{selectedTenant?.nome}</strong>
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Novo Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Novo Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="trial">Trial</MenuItem>
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="suspended">Suspenso</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveAction} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Criar Tenant */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Criar Novo Tenant
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Proprietário"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome da Clínica"
                value={formData.clinica}
                onChange={(e) => setFormData({ ...formData, clinica: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Especialidade"
                value={formData.especialidade}
                onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Plano</InputLabel>
                <Select
                  value={formData.planoTenant}
                  label="Plano"
                  onChange={(e) => setFormData({ ...formData, planoTenant: e.target.value })}
                >
                  <MenuItem value="trial">Trial (30 dias)</MenuItem>
                  <MenuItem value="basic">Básico</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Enviar Senha Temporária</InputLabel>
                <Select
                  value={formData.sendTempPassword}
                  label="Enviar Senha Temporária"
                  onChange={(e) => setFormData({ ...formData, sendTempPassword: e.target.value === 'true' })}
                >
                  <MenuItem value={true}>Sim - Gerar senha automática e enviar por email</MenuItem>
                  <MenuItem value={false}>Não - Usar senha personalizada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {!formData.sendTempPassword && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Senha Personalizada"
                  type="password"
                  value={formData.customPassword}
                  onChange={(e) => setFormData({ ...formData, customPassword: e.target.value })}
                  helperText="A senha será enviada por email para o usuário"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateTenant} variant="contained" disabled={!formData.nome || !formData.email || !formData.clinica}>
            Criar Tenant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Licencas;
