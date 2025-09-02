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
  Fab
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Settings,
  Edit,
  Delete,
  Business,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const Licencas = () => {
  const [licencas, setLicencas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLicenca, setSelectedLicenca] = useState(null);
  const [formData, setFormData] = useState({
    cliente: '',
    email: '',
    telefone: '',
    plano: '',
    dataVencimento: '',
    status: 'ativa',
    observacoes: ''
  });
  const navigate = useNavigate();

  // Dados mock para desenvolvimento
  const licencasMock = [
    {
      id: 'LIC001',
      cliente: 'Clínica São Paulo Ltda',
      email: 'contato@clinicasp.com.br',
      telefone: '(11) 3333-4444',
      plano: 'Premium',
      dataVencimento: '2025-12-15',
      status: 'ativa',
      ultimoAcesso: '2025-09-01',
      observacoes: 'Cliente há 2 anos'
    },
    {
      id: 'LIC002',
      cliente: 'Consultório Dr. Silva',
      email: 'dr.silva@email.com',
      telefone: '(11) 2222-3333',
      plano: 'Básico',
      dataVencimento: '2025-09-20',
      status: 'vencendo',
      ultimoAcesso: '2025-08-30',
      observacoes: 'Renovação pendente'
    },
    {
      id: 'LIC003',
      cliente: 'Clínica Odonto Plus',
      email: 'contato@odontoplus.com',
      telefone: '(11) 4444-5555',
      plano: 'Premium',
      dataVencimento: '2026-01-10',
      status: 'ativa',
      ultimoAcesso: '2025-09-02',
      observacoes: 'Novo cliente'
    },
    {
      id: 'LIC004',
      cliente: 'Centro Médico ABC',
      email: 'admin@centroabc.com.br',
      telefone: '(11) 5555-6666',
      plano: 'Empresarial',
      dataVencimento: '2025-08-30',
      status: 'vencida',
      ultimoAcesso: '2025-08-25',
      observacoes: 'Contatar urgente'
    },
    {
      id: 'LIC005',
      cliente: 'Clínica Dermatologia',
      email: 'info@dermaclinica.com',
      telefone: '(11) 6666-7777',
      plano: 'Premium',
      dataVencimento: '2025-11-25',
      status: 'ativa',
      ultimoAcesso: '2025-09-01',
      observacoes: 'Cliente premium'
    }
  ];

  useEffect(() => {
    fetchLicencas();
  }, []);

  const fetchLicencas = async () => {
    try {
      // const response = await axios.get('/licencas');
      // setLicencas(response.data);
      
      // Usando dados mock por enquanto
      setLicencas(licencasMock);
    } catch (error) {
      console.error('Erro ao carregar licenças:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativa': return 'success';
      case 'vencendo': return 'warning';
      case 'vencida': return 'error';
      case 'suspensa': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ativa': return <CheckCircle fontSize="small" />;
      case 'vencendo': return <Warning fontSize="small" />;
      case 'vencida': return <ErrorIcon fontSize="small" />;
      default: return <ErrorIcon fontSize="small" />;
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID Licença',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} variant="outlined" size="small" />
      )
    },
    {
      field: 'cliente',
      headerName: 'Cliente',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1, fontSize: 14 }}>
            {params.row.cliente.charAt(0)}
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
      field: 'plano',
      headerName: 'Plano',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'Premium' ? 'primary' : params.value === 'Empresarial' ? 'secondary' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'dataVencimento',
      headerName: 'Vencimento',
      width: 120,
      renderCell: (params) => (
        new Date(params.value).toLocaleDateString('pt-BR')
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value.toUpperCase()}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Configurações">
            <IconButton
              size="small"
              onClick={() => navigate(`/configuracoes/${params.row.id}`)}
              color="primary"
            >
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => handleEditLicenca(params.row)}
              color="primary"
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              size="small"
              onClick={() => handleDeleteLicenca(params.row.id)}
              color="error"
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const handleEditLicenca = (licenca) => {
    setSelectedLicenca(licenca);
    setFormData({
      cliente: licenca.cliente,
      email: licenca.email,
      telefone: licenca.telefone,
      plano: licenca.plano,
      dataVencimento: licenca.dataVencimento,
      status: licenca.status,
      observacoes: licenca.observacoes || ''
    });
    setOpenDialog(true);
  };

  const handleDeleteLicenca = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta licença?')) {
      try {
        // await axios.delete(`/licencas/${id}`);
        setLicencas(licencas.filter(l => l.id !== id));
        console.log(`Licença ${id} excluída`);
      } catch (error) {
        console.error('Erro ao excluir licença:', error);
      }
    }
  };

  const handleSaveLicenca = async () => {
    try {
      if (selectedLicenca) {
        // Editar licença existente
        // await axios.put(`/licencas/${selectedLicenca.id}`, formData);
        setLicencas(licencas.map(l => 
          l.id === selectedLicenca.id 
            ? { ...l, ...formData } 
            : l
        ));
      } else {
        // Criar nova licença
        const newId = `LIC${String(licencas.length + 1).padStart(3, '0')}`;
        // await axios.post('/licencas', { ...formData, id: newId });
        setLicencas([...licencas, { ...formData, id: newId, ultimoAcesso: new Date().toISOString().split('T')[0] }]);
      }
      
      setOpenDialog(false);
      setSelectedLicenca(null);
      setFormData({
        cliente: '',
        email: '',
        telefone: '',
        plano: '',
        dataVencimento: '',
        status: 'ativa',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro ao salvar licença:', error);
    }
  };

  const filteredLicencas = licencas.filter(licenca => {
    const matchesSearch = licenca.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         licenca.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         licenca.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todas' || licenca.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Gerenciamento de Licenças
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Nova Licença
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por cliente, email ou ID..."
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
                  <MenuItem value="ativa">Ativas</MenuItem>
                  <MenuItem value="vencendo">Vencendo</MenuItem>
                  <MenuItem value="vencida">Vencidas</MenuItem>
                  <MenuItem value="suspensa">Suspensas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchLicencas}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Licenças */}
      <Card>
        <CardContent>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredLicencas}
              columns={columns}
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

      {/* Dialog para Criar/Editar Licença */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedLicenca ? 'Editar Licença' : 'Nova Licença'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Cliente"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
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
              <FormControl fullWidth required>
                <InputLabel>Plano</InputLabel>
                <Select
                  value={formData.plano}
                  label="Plano"
                  onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                >
                  <MenuItem value="Básico">Básico</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                  <MenuItem value="Empresarial">Empresarial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Vencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="ativa">Ativa</MenuItem>
                  <MenuItem value="vencendo">Vencendo</MenuItem>
                  <MenuItem value="vencida">Vencida</MenuItem>
                  <MenuItem value="suspensa">Suspensa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveLicenca} variant="contained">
            {selectedLicenca ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Licencas;
