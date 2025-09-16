import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import {
  LocalHospital,
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Phone,
  Email,
  Badge,
  Save,
  Cancel,
  PersonAdd
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

// Lista de especialidades médicas
const especialidades = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Otorrinolaringologia',
  'Pediatria',
  'Psiquiatria',
  'Radiologia',
  'Urologia',
  'Anestesiologia',
  'Cirurgia Geral',
  'Clínica Geral',
  'Fisioterapia',
  'Nutrição',
  'Psicologia'
];

const ProfissionaisMedicos = () => {
  // Estados para lista
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMedico, setSelectedMedico] = useState(null);

  // Estados para modal
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    especialidade: '',
    telefone: '',
    email: '',
    observacoes: ''
  });
  const [errors, setErrors] = useState({});

  // Carregar médicos
  const loadMedicos = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data para desenvolvimento - substituir pela API real
      const mockMedicos = [
        {
          id: 1,
          nome: 'Dr. João Silva',
          crm: 'CRM/SP 123456',
          especialidade: 'Cardiologia',
          telefone: '11999999999',
          email: 'joao.silva@clinic.com',
          status: 'ativo',
          dataContratacao: '2020-01-15',
          observacoes: 'Especialista em cirurgia cardíaca'
        },
        {
          id: 2,
          nome: 'Dra. Maria Santos',
          crm: 'CRM/SP 789012',
          especialidade: 'Dermatologia',
          telefone: '11888888888',
          email: 'maria.santos@clinic.com',
          status: 'ativo',
          dataContratacao: '2019-05-20',
          observacoes: 'Foco em dermatologia estética'
        },
        {
          id: 3,
          nome: 'Dr. Carlos Lima',
          crm: 'CRM/SP 345678',
          especialidade: 'Ortopedia',
          telefone: '11777777777',
          email: 'carlos.lima@clinic.com',
          status: 'ativo',
          dataContratacao: '2021-03-10',
          observacoes: ''
        }
      ];

      // Filtrar por busca se necessário
      const filtered = searchTerm 
        ? mockMedicos.filter(medico => 
            medico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            medico.crm.toLowerCase().includes(searchTerm.toLowerCase()) ||
            medico.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : mockMedicos;

      setMedicos(filtered);
      setTotalCount(filtered.length);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar médicos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadMedicos();
  }, [loadMedicos]);

  // Handlers da lista
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, medico) => {
    setAnchorEl(event.currentTarget);
    setSelectedMedico(medico);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMedico(null);
  };

  // Handlers do modal
  const handleOpenDialog = (medico = null) => {
    if (medico) {
      setEditMode(true);
      setFormData({
        nome: medico.nome,
        crm: medico.crm,
        especialidade: medico.especialidade,
        telefone: medico.telefone,
        email: medico.email,
        observacoes: medico.observacoes || ''
      });
      setSelectedMedico(medico);
    } else {
      setEditMode(false);
      setFormData({
        nome: '',
        crm: '',
        especialidade: '',
        telefone: '',
        email: '',
        observacoes: ''
      });
      setSelectedMedico(null);
    }
    setOpenDialog(true);
    setErrors({});
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nome: '',
      crm: '',
      especialidade: '',
      telefone: '',
      email: '',
      observacoes: ''
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.crm.trim()) {
      newErrors.crm = 'CRM é obrigatório';
    }

    if (!formData.especialidade) {
      newErrors.especialidade = 'Especialidade é obrigatória';
    }

    if (!formData.telefone || formData.telefone.length < 10) {
      newErrors.telefone = 'Telefone válido é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Corrija os erros antes de continuar');
      return;
    }

    setSaving(true);
    try {
      // Aqui seria a chamada para a API real
      const action = editMode ? 'atualizado' : 'cadastrado';
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Médico ${action} com sucesso!`);
      handleCloseDialog();
      loadMedicos();
    } catch (error) {
      console.error('Erro ao salvar médico:', error);
      toast.error('Erro ao salvar médico');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedMedico) {
      try {
        // Aqui seria a chamada para a API real
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success('Médico removido com sucesso');
        loadMedicos();
      } catch (error) {
        toast.error('Erro ao remover médico');
      }
    }
    handleMenuClose();
  };

  const formatPhone = (phone) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const getInitials = (nome) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center">
          <LocalHospital sx={{ mr: 2, color: 'primary.main' }} />
          Profissionais Médicos
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Novo Médico
        </Button>
      </Box>

      {/* Filtros e Busca */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Buscar por nome, CRM ou especialidade..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {totalCount} médicos encontrados
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Médicos */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Médico</TableCell>
                <TableCell>CRM</TableCell>
                <TableCell>Especialidade</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Contratação</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((medico) => (
                <TableRow key={medico.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(medico.nome)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {medico.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {medico.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Badge sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                      <Typography variant="body2" fontFamily="monospace">
                        {medico.crm}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={medico.especialidade} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Box display="flex" alignItems="center">
                        <Phone sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatPhone(medico.telefone)}
                        </Typography>
                      </Box>
                      {medico.email && (
                        <Box display="flex" alignItems="center">
                          <Email sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {medico.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={medico.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      color={medico.status === 'ativo' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {dayjs(medico.dataContratacao).format('DD/MM/YYYY')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, medico)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Card>

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOpenDialog(selectedMedico)}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* FAB para Novo Médico */}
      <Fab
        color="primary"
        aria-label="novo médico"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <Add />
      </Fab>

      {/* Dialog de Cadastro/Edição */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Editar Médico' : 'Cadastrar Novo Médico'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome Completo *"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                error={!!errors.nome}
                helperText={errors.nome}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CRM *"
                value={formData.crm}
                onChange={(e) => handleInputChange('crm', e.target.value)}
                error={!!errors.crm}
                helperText={errors.crm}
                placeholder="CRM/SP 123456"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.especialidade}>
                <InputLabel>Especialidade *</InputLabel>
                <Select
                  value={formData.especialidade}
                  label="Especialidade *"
                  onChange={(e) => handleInputChange('especialidade', e.target.value)}
                >
                  {especialidades.map((esp) => (
                    <MenuItem key={esp} value={esp}>
                      {esp}
                    </MenuItem>
                  ))}
                </Select>
                {errors.especialidade && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.especialidade}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone *"
                value={formatPhone(formData.telefone)}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '');
                  if (numbers.length <= 11) {
                    handleInputChange('telefone', numbers);
                  }
                }}
                error={!!errors.telefone}
                helperText={errors.telefone}
                placeholder="(11) 99999-9999"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="medico@clinic.com"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o médico..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            startIcon={<Cancel />}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Salvando...' : (editMode ? 'Atualizar' : 'Cadastrar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfissionaisMedicos;