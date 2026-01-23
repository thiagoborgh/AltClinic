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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import {
  LocalHospital,
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Restore,
  Phone,
  Email,
  Badge as BadgeIcon,
  Save,
  Cancel,
  PersonAdd,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ProfessionalSchedule from '../components/configuracoes/ProfessionalSchedule';
import ProfessionalNotifications from '../components/configuracoes/ProfessionalNotifications';
import ConfiguracaoGrade from '../components/ConfiguracaoGrade';
import medicoService from '../services/medicoService';

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
  'Psicologia',
  'Estética'
];

const ProfissionaisMedicosNovo = () => {
  const navigate = useNavigate();
  
  // Estados para lista
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMedico, setSelectedMedico] = useState(null);

  // Estados para modal
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    especialidade: '',
    telefone: '',
    email: '',
    observacoes: ''
  });
  const [errors, setErrors] = useState({});

  // Carregar médicos da API
  const loadMedicos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await medicoService.buscar(searchTerm);
      const medicosData = response.data || [];
      setMedicos(medicosData);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar médicos');
      setMedicos([]);
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
  };

  // Handlers do modal
  const handleOpenDialog = (medico = null) => {
    if (medico) {
      setEditMode(true);
      setFormData({
        nome: medico.nome || '',
        crm: medico.crm || '',
        especialidade: medico.especialidade || '',
        telefone: medico.telefone || '',
        email: medico.email || '',
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
    setActiveTab(0);
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setActiveTab(0);
    setSelectedMedico(null);
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

    if (!formData.telefone || formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone válido é obrigatório (mínimo 10 dígitos)';
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
      const dadosMedico = {
        nome: formData.nome.trim(),
        crm: formData.crm.trim(),
        especialidade: formData.especialidade,
        telefone: formData.telefone.replace(/\D/g, ''),
        email: formData.email.trim(),
        observacoes: formData.observacoes.trim()
      };

      if (editMode && selectedMedico?.id) {
        await medicoService.atualizarMedico(selectedMedico.id, dadosMedico);
        toast.success('Médico atualizado com sucesso!');
      } else {
        await medicoService.criarMedico(dadosMedico);
        toast.success('Médico cadastrado com sucesso!');
      }
      
      handleCloseDialog();
      loadMedicos();
    } catch (error) {
      console.error('Erro ao salvar médico:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar médico';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setOpenDeleteDialog(true);
    setAnchorEl(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMedico?.id) return;

    setDeleting(true);
    try {
      const isActive = selectedMedico.status === 'ativo';
      await medicoService.alterarStatusMedico(selectedMedico.id, !isActive);
      
      const successMessage = isActive 
        ? 'Médico removido com sucesso' 
        : 'Médico reativado com sucesso';
      toast.success(successMessage);
      
      loadMedicos();
      setOpenDeleteDialog(false);
      setSelectedMedico(null);
    } catch (error) {
      console.error('Erro ao alterar status do médico:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao alterar status do médico';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const getInitials = (nome) => {
    if (!nome || typeof nome !== 'string') return '?';
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredMedicos = medicos;
  const totalCount = filteredMedicos.length;
  const displayMedicos = filteredMedicos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          onClick={() => navigate('/cadastro-profissional')}
          sx={{ borderRadius: 2 }}
        >
          Novo Profissional
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
                {totalCount} profissiona{totalCount !== 1 ? 'is' : 'l'} encontrado{totalCount !== 1 ? 's' : ''}
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
                <TableCell>Profissional</TableCell>
                <TableCell>CRM</TableCell>
                <TableCell>Especialidade</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Carregando profissionais...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayMedicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <LocalHospital sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Nenhum profissional encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {searchTerm ? 'Tente ajustar os filtros de busca' : 'Clique em "Novo Profissional" para cadastrar'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayMedicos.map((medico) => (
                  <TableRow key={medico.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {getInitials(medico.nome)}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {medico.nome}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <BadgeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
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
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
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
                    
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, medico)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
        <MenuItem onClick={() => {
          navigate(`/cadastro-profissional?id=${selectedMedico?.id}`);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem 
          onClick={handleDelete} 
          sx={{ 
            color: selectedMedico?.status === 'ativo' ? 'error.main' : 'success.main'
          }}
        >
          {selectedMedico?.status === 'ativo' ? (
            <>
              <Delete sx={{ mr: 1 }} />
              Inativar
            </>
          ) : (
            <>
              <Restore sx={{ mr: 1 }} />
              Reativar
            </>
          )}
        </MenuItem>
      </Menu>

      {/* Dialog de Cadastro/Edição */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          {editMode ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}
        </DialogTitle>
        
        {/* Abas */}
        <Paper sx={{ borderRadius: 0 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<PersonIcon />} 
              label="Dados Pessoais" 
            />
            {editMode && selectedMedico?.id && (
              <>
                <Tab 
                  icon={<ScheduleIcon />} 
                  label="Criar Grade" 
                />
                <Tab 
                  icon={<HistoryIcon />} 
                  label="Histórico de Grades" 
                />
                <Tab 
                  icon={<NotificationsIcon />} 
                  label="Notificações" 
                />
              </>
            )}
          </Tabs>
        </Paper>

        <DialogContent>
          {/* Aba 1: Dados Pessoais */}
          {activeTab === 0 && (
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
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
                    <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
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
                  placeholder="profissional@clinic.com"
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
                  placeholder="Informações adicionais sobre o profissional..."
                />
              </Grid>
            </Grid>
          )}

          {/* Aba 2: Criar Grade */}
          {activeTab === 1 && editMode && selectedMedico?.id && (
            <Box sx={{ py: 2 }}>
              <ConfiguracaoGrade
                professionalId={selectedMedico.id}
                professionalName={selectedMedico.nome}
                isEmbedded={true}
              />
            </Box>
          )}

          {/* Aba 3: Histórico de Grades */}
          {activeTab === 2 && editMode && selectedMedico?.id && (
            <Box sx={{ py: 2 }}>
              <ProfessionalSchedule 
                professionalId={selectedMedico.id}
                professionalName={selectedMedico.nome}
              />
            </Box>
          )}

          {/* Aba 4: Notificações */}
          {activeTab === 3 && editMode && (
            <Box sx={{ py: 2 }}>
              <ProfessionalNotifications />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            startIcon={<Cancel />}
          >
            Cancelar
          </Button>
          {activeTab === 0 && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Salvando...' : (editMode ? 'Atualizar' : 'Cadastrar')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão/Reativação */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
      >
        <DialogTitle>
          {selectedMedico?.status === 'ativo' ? 'Confirmar Inativação' : 'Confirmar Reativação'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {selectedMedico?.status === 'ativo' ? (
              <>
                Tem certeza que deseja inativar o profissional <strong>{selectedMedico?.nome}</strong>?
              </>
            ) : (
              <>
                Tem certeza que deseja reativar o profissional <strong>{selectedMedico?.nome}</strong>?
              </>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedMedico?.status === 'ativo' 
              ? 'O profissional será inativado e poderá ser reativado posteriormente.' 
              : 'O profissional voltará a ficar ativo no sistema.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            color={selectedMedico?.status === 'ativo' ? 'error' : 'success'}
            startIcon={deleting ? <CircularProgress size={20} /> : (
              selectedMedico?.status === 'ativo' ? <Delete /> : <Restore />
            )}
          >
            {deleting 
              ? (selectedMedico?.status === 'ativo' ? 'Inativando...' : 'Reativando...')
              : (selectedMedico?.status === 'ativo' ? 'Inativar' : 'Reativar')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfissionaisMedicosNovo;
