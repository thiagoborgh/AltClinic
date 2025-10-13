import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Chip,
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
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search,
  Settings,
  Refresh,
  Restore,
  Upgrade,
  Add,
  Email,
  Edit,
  History,
  Repeat
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

// Configurar base URL do axios
axios.defaults.baseURL = 'http://localhost:3001/api';

const Licencas = () => {
  const navigate = useNavigate();
  const [licencas, setLicencas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [planoFilter, setPlanoFilter] = useState('todos');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [dialogType, setDialogType] = useState(''); // 'reset-trial', 'change-plan', 'change-status', 'invoice-history'
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
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
  const [recorrenciaDialogOpen, setRecorrenciaDialogOpen] = useState(false);
  const [recorrenciaData, setRecorrenciaData] = useState({
    tenantId: '',
    frequencia: 'mensal',
    valor: '',
    diasGraca: 7,
    chavePix: '',
    cartaoNumero: '',
    cartaoNome: '',
    cartaoValidade: '',
    cartaoCvv: '',
    agencia: '',
    conta: '',
    lembretesDias: 3,
    ativo: false
  });

  useEffect(() => {
    fetchLicencas();
    fetchStats();
  }, []);

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

  const fetchLicencas = async () => {
    try {
      const response = await axios.get('/admin/licencas');
      if (response.data.success) {
        setLicencas(response.data.licencas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar licenças:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar licenças',
        severity: 'error'
      });
    } finally {
      // Garantir que o loading seja liberado
      setTimeout(() => setLoading(false), 100);
    }
  };

  const handleOpenDialog = (type, tenant) => {
    setDialogType(type);
    setSelectedTenant(tenant);
    setFormData({
      dias: 30,
      plano: tenant.plano || '',
      status: tenant.status || ''
    });
    
    if (type === 'invoice-history') {
      fetchInvoiceHistory(tenant.subdomain);
    }
    
    setOpenDialog(true);
  };

  const fetchInvoiceHistory = async (subdomain) => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/financeiro/invoices/${subdomain}`);
      if (response.data.success) {
        setInvoiceHistory(response.data.invoices || []);
      } else {
        setInvoiceHistory([]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de faturas:', error);
      setInvoiceHistory([]);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar histórico de faturas',
        severity: 'error'
      });
    } finally {
      setLoading(false);
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
        fetchLicencas();
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

        fetchLicencas();
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

  const handleEditTenant = (tenant) => {
    navigate(`/configuracoes/${tenant.id}`);
  };

  const handleOpenRecorrenciaDialog = (tenant) => {
    setRecorrenciaData(prev => ({
      ...prev,
      tenantId: tenant.id
    }));
    setRecorrenciaDialogOpen(true);
  };

  const handleCloseRecorrenciaDialog = () => {
    setRecorrenciaDialogOpen(false);
    setRecorrenciaData({
      tenantId: '',
      frequencia: 'mensal',
      valor: '',
      diasGraca: 7,
      chavePix: '',
      cartaoNumero: '',
      cartaoNome: '',
      cartaoValidade: '',
      cartaoCvv: '',
      agencia: '',
      conta: '',
      lembretesDias: 3,
      ativo: false
    });
  };

  const handleRecorrenciaChange = (field, value) => {
    setRecorrenciaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveRecorrencia = async () => {
    try {
      if (!recorrenciaData.tenantId || !recorrenciaData.valor) {
        setSnackbar({
          open: true,
          message: 'Tenant e valor são obrigatórios',
          severity: 'error'
        });
        return;
      }

      const response = await axios.post('/admin/financeiro/recorrencia', recorrenciaData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Configuração de recorrência salva com sucesso!',
          severity: 'success'
        });
        handleCloseRecorrenciaDialog();
      }
    } catch (error) {
      console.error('Erro ao salvar recorrência:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erro ao salvar configuração',
        severity: 'error'
      });
    }
  };

  const filteredLicencas = licencas.filter(licenca => {
    const matchesSearch = !searchTerm || 
      licenca.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      licenca.cnpjCpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      licenca.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todas' || licenca.status === statusFilter;
    const matchesPlano = planoFilter === 'todos' || licenca.tipo === planoFilter;

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
              fetchLicencas();
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
                  fetchLicencas();
                  fetchStats();
                }}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela Principal de Licenças */}
      <Card>
        <CardContent>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredLicencas}
              columns={[
                { field: 'id', headerName: 'ID', width: 180 },
                { field: 'chave', headerName: 'Chave', width: 130 },
                { field: 'nome', headerName: 'Nome', width: 180 },
                { field: 'cnpjCpf', headerName: 'CNPJ/CPF', width: 130 },
                { field: 'tipo', headerName: 'Plano', width: 80 },
                { 
                  field: 'status', 
                  headerName: 'Status', 
                  width: 100,
                  renderCell: (params) => (
                    <Chip 
                      label={params.value} 
                      color={params.value === 'active' ? 'success' : params.value === 'trial' ? 'warning' : 'default'}
                      size="small"
                    />
                  )
                },
                { field: 'created_at', headerName: 'Criado em', width: 100, valueFormatter: (params) => new Date(params.value).toLocaleDateString('pt-BR') },
                {
                  field: 'acoes',
                  headerName: 'Ações',
                  width: 250,
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
                      <Tooltip title="Editar Licença">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTenant(params.row)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Histórico de Faturas">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('invoice-history', params.row)}
                          color="info"
                        >
                          <History />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Configurar Recorrência">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenRecorrenciaDialog(params.row)}
                          color="success"
                        >
                          <Repeat />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )
                }
              ]}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20]}
              loading={loading}
              disableSelectionOnClick
              localeText={{
                noRowsLabel: 'Nenhuma licença encontrada',
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
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth={dialogType === 'invoice-history' ? 'md' : 'sm'} 
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'reset-trial' && 'Resetar Período de Teste'}
          {dialogType === 'change-plan' && 'Alterar Plano'}
          {dialogType === 'change-status' && 'Alterar Status'}
          {dialogType === 'invoice-history' && 'Histórico de Faturas'}
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

            {dialogType === 'invoice-history' && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Histórico de faturas para: <strong>{selectedTenant?.nome}</strong>
                </Typography>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {invoiceHistory.length === 0 ? (
                      <Box textAlign="center" py={3}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhuma fatura encontrada para este tenant.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ height: 400, width: '100%' }}>
                        <DataGrid
                          rows={invoiceHistory}
                          columns={[
                            {
                              field: 'data_geracao',
                              headerName: 'Data',
                              width: 110,
                              valueFormatter: (params) => {
                                if (!params.value) return '';
                                return new Date(params.value).toLocaleDateString('pt-BR');
                              }
                            },
                            {
                              field: 'valor',
                              headerName: 'Valor',
                              width: 100,
                              valueFormatter: (params) => {
                                if (!params.value) return '';
                                return `R$ ${parseFloat(params.value).toFixed(2)}`;
                              }
                            },
                            {
                              field: 'descricao',
                              headerName: 'Descrição',
                              flex: 1
                            },
                            {
                              field: 'status',
                              headerName: 'Status',
                              width: 120,
                              renderCell: (params) => (
                                <Chip
                                  label={params.value || 'Pendente'}
                                  color={params.value === 'pago' ? 'success' : 'warning'}
                                  size="small"
                                />
                              )
                            }
                          ]}
                          pageSize={5}
                          rowsPerPageOptions={[5]}
                          disableSelectionOnClick
                          autoHeight
                        />
                      </Box>
                    )}
                  </>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          {dialogType !== 'invoice-history' && (
            <>
              <Button onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAction} variant="contained">
                Confirmar
              </Button>
            </>
          )}
          {dialogType === 'invoice-history' && (
            <Button onClick={() => setOpenDialog(false)} variant="contained">
              Fechar
            </Button>
          )}
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
                  <MenuItem value="trial">Trial (15 dias)</MenuItem>
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

      {/* Dialog de Configuração de Recorrência */}
      <Dialog open={recorrenciaDialogOpen} onClose={handleCloseRecorrenciaDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          ⚙️ Configuração de Recorrência
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Seleção do Tenant */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Selecionar Cliente</InputLabel>
                <Select
                  value={recorrenciaData.tenantId}
                  onChange={(e) => handleRecorrenciaChange('tenantId', e.target.value)}
                  label="Selecionar Cliente"
                  disabled
                >
                  {licencas.map((licenca) => (
                    <MenuItem key={licenca.id} value={licenca.id}>
                      {licenca.nome} - {licenca.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Plano e Valor */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📋 Plano e Valor
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Frequência de Cobrança</InputLabel>
                <Select
                  value={recorrenciaData.frequencia}
                  onChange={(e) => handleRecorrenciaChange('frequencia', e.target.value)}
                  label="Frequência de Cobrança"
                >
                  <MenuItem value="mensal">Mensal</MenuItem>
                  <MenuItem value="anual">Anual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor da Recorrência (R$)"
                type="number"
                value={recorrenciaData.valor}
                onChange={(e) => handleRecorrenciaChange('valor', e.target.value)}
                placeholder="199.00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dias de Graça"
                type="number"
                value={recorrenciaData.diasGraca}
                onChange={(e) => handleRecorrenciaChange('diasGraca', e.target.value)}
                helperText="Dias para pagamento após vencimento"
              />
            </Grid>

            {/* Métodos de Pagamento */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                💳 Métodos de Pagamento
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Chave PIX"
                value={recorrenciaData.chavePix}
                onChange={(e) => handleRecorrenciaChange('chavePix', e.target.value)}
                placeholder="Digite a chave PIX do cliente"
              />
            </Grid>

            {/* Dados do Cartão (Opcional) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número do Cartão (Opcional)"
                value={recorrenciaData.cartaoNumero}
                onChange={(e) => handleRecorrenciaChange('cartaoNumero', e.target.value)}
                placeholder="0000 0000 0000 0000"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome no Cartão (Opcional)"
                value={recorrenciaData.cartaoNome}
                onChange={(e) => handleRecorrenciaChange('cartaoNome', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Validade (Opcional)"
                value={recorrenciaData.cartaoValidade}
                onChange={(e) => handleRecorrenciaChange('cartaoValidade', e.target.value)}
                placeholder="MM/AA"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CVV (Opcional)"
                value={recorrenciaData.cartaoCvv}
                onChange={(e) => handleRecorrenciaChange('cartaoCvv', e.target.value)}
                type="password"
              />
            </Grid>

            {/* Conta Bancária (Opcional) */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🏦 Conta Bancária (Opcional)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Agência"
                value={recorrenciaData.agencia}
                onChange={(e) => handleRecorrenciaChange('agencia', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Conta"
                value={recorrenciaData.conta}
                onChange={(e) => handleRecorrenciaChange('conta', e.target.value)}
              />
            </Grid>

            {/* Cobrança e Alertas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📅 Cobrança e Alertas
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dias para Lembretes"
                type="number"
                value={recorrenciaData.lembretesDias}
                onChange={(e) => handleRecorrenciaChange('lembretesDias', e.target.value)}
                helperText="Dias antes do vencimento para enviar lembretes"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={recorrenciaData.ativo}
                    onChange={(e) => handleRecorrenciaChange('ativo', e.target.checked)}
                  />
                }
                label="Ativar Recorrência"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecorrenciaDialog}>Cancelar</Button>
          <Button onClick={handleSaveRecorrencia} variant="contained">
            Salvar Configuração
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
