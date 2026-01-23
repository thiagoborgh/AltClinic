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
  Badge,
  Save,
  Cancel,
  PersonAdd,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
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
  'Psicologia'
];

const ProfissionaisMedicos = () => {
  // Estados para lista
  const [medicos, setMedicos] = useState([]);
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
  const [medicoStatuses, setMedicoStatuses] = useState({}); // Estado para controlar status dos médicos

  // Carregar médicos
  const loadMedicos = useCallback(async () => {
    try {
      const response = await medicoService.buscar(searchTerm);
      const medicosData = response.data || [];
      
      // Aplicar status modificados aos médicos
      const medicosComStatus = medicosData.map(medico => ({
        ...medico,
        status: medicoStatuses[medico.id] !== undefined ? medicoStatuses[medico.id] : medico.status
      }));

      setMedicos(medicosComStatus);
      setTotalCount(medicosComStatus.length);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar médicos');
    }
  }, [searchTerm, medicoStatuses]);

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
    // NÃO limpar selectedMedico aqui, pois pode estar sendo usado no dialog
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
    setActiveTab(0); // Resetar para a primeira aba
    setSelectedMedico(null); // Limpar o profissional selecionado apenas ao fechar o dialog
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

  const handleDelete = () => {
    setOpenDeleteDialog(true);
    setAnchorEl(null); // Fechar apenas o menu, sem limpar selectedMedico
  };

  const handleConfirmDelete = async () => {
    console.log('🩺 ProfissionaisMedicos: handleConfirmDelete called');
    console.log('🩺 ProfissionaisMedicos: selectedMedico:', selectedMedico);
    if (selectedMedico) {
      setDeleting(true);
      try {
        // Verificar status atual para decidir se vai ativar ou inativar
        const currentStatus = medicoStatuses[selectedMedico.id] !== undefined 
          ? medicoStatuses[selectedMedico.id] 
          : selectedMedico.status;
        
        const isCurrentlyActive = currentStatus === 'ativo';
        const newActiveStatus = !isCurrentlyActive; // Se está ativo, vai inativar; se inativo, vai ativar
        
        console.log('🩺 ProfissionaisMedicos: Current status:', currentStatus, 'New active status:', newActiveStatus);
        
        await medicoService.alterarStatusMedico(selectedMedico.id, newActiveStatus);
        
        // Atualizar status local
        const newStatus = newActiveStatus ? 'ativo' : 'inativo';
        setMedicoStatuses(prev => ({
          ...prev,
          [selectedMedico.id]: newStatus
        }));
        
        // Mensagem de sucesso baseada na ação
        const successMessage = newActiveStatus 
          ? 'Médico reativado com sucesso' 
          : 'Médico removido com sucesso';
        toast.success(successMessage);
        
        loadMedicos(); // Recarregar lista com novos status
        setOpenDeleteDialog(false);
        setSelectedMedico(null); // Limpar após sucesso
      } catch (error) {
        console.error('🩺 ProfissionaisMedicos: Erro ao alterar status do médico:', error);
        toast.error('Erro ao alterar status do médico');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setSelectedMedico(null); // Limpar apenas ao cancelar o modal de exclusão
  };

  const formatPhone = (phone) => {
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
        <MenuItem 
          onClick={handleDelete} 
          sx={{ 
            color: selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
              ? medicoStatuses[selectedMedico.id] 
              : selectedMedico.status) === 'ativo' 
              ? 'error.main' 
              : 'success.main' 
          }}
        >
          {selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
            ? medicoStatuses[selectedMedico.id] 
            : selectedMedico.status) === 'ativo' ? (
            <>
              <Delete sx={{ mr: 1 }} />
              Excluir
            </>
          ) : (
            <>
              <Restore sx={{ mr: 1 }} />
              Reativar
            </>
          )}
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
          {editMode ? 'Editar Médico' : 'Cadastrar Novo Médico'}
        </DialogTitle>
        
        {/* Abas para separar dados pessoais e horários */}
        <Paper sx={{ borderRadius: 0 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab 
              icon={<PersonIcon />} 
              label="Dados Pessoais" 
              id="tab-dados-pessoais"
            />
            <Tab 
              icon={<ScheduleIcon />} 
              label="Criar Grade" 
              id="tab-criar-grade"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Histórico de Grades" 
              id="tab-historico-grades"
            />
            <Tab 
              icon={<NotificationsIcon />} 
              label="Notificações" 
              id="tab-notificacoes"
            />
          </Tabs>
        </Paper>

        <DialogContent sx={{ minHeight: '400px' }}>
          {/* Debug info */}
          {console.log('🔍 activeTab atual:', activeTab)}
          
          {/* Aba 1: Dados Pessoais */}
          {activeTab === 0 && (
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
          )}

          {/* Aba 2: Criar Grade */}
          {activeTab === 1 && (
            <Box sx={{ py: 2 }}>
              {selectedMedico?.id ? (
                <ConfiguracaoGrade
                  professionalId={selectedMedico.id}
                  professionalName={formData.nome || selectedMedico.nome}
                  isEmbedded={true}
                />
              ) : (
                <Alert severity="warning">
                  Selecione um profissional para criar grades de horários.
                </Alert>
              )}
            </Box>
          )}

          {/* Aba 3: Histórico de Grades */}
          {activeTab === 2 && (
            <Box sx={{ py: 2 }}>
              {selectedMedico?.id ? (
                <ProfessionalSchedule 
                  professionalId={selectedMedico.id}
                  professionalName={formData.nome || selectedMedico.nome}
                />
              ) : (
                <Alert severity="warning">
                  Aguardando seleção do profissional...
                </Alert>
              )}
            </Box>
          )}

          {/* Aba 4: Configurações de Notificação */}
          {activeTab === 3 && (
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

      {/* Modal de Confirmação de Exclusão/Reativação */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
            ? medicoStatuses[selectedMedico.id] 
            : selectedMedico.status) === 'ativo' 
            ? 'Confirmar Exclusão' 
            : 'Confirmar Reativação'}
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            {selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
              ? medicoStatuses[selectedMedico.id] 
              : selectedMedico.status) === 'ativo' 
              ? (
                <>
                  Tem certeza que deseja remover o profissional <strong>{selectedMedico?.nome}</strong>?
                </>
              ) : (
                <>
                  Tem certeza que deseja reativar o profissional <strong>{selectedMedico?.nome}</strong>?
                </>
              )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
              ? medicoStatuses[selectedMedico.id] 
              : selectedMedico.status) === 'ativo' 
              ? 'O profissional será inativado e poderá ser reativado posteriormente.' 
              : 'O profissional voltará a ficar ativo no sistema.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            color={selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
              ? medicoStatuses[selectedMedico.id] 
              : selectedMedico.status) === 'ativo' 
              ? 'error' 
              : 'success'}
            startIcon={deleting ? <CircularProgress size={20} /> : (
              selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
                ? medicoStatuses[selectedMedico.id] 
                : selectedMedico.status) === 'ativo' 
                ? <Delete /> 
                : <Restore />
            )}
          >
            {deleting 
              ? (selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
                  ? medicoStatuses[selectedMedico.id] 
                  : selectedMedico.status) === 'ativo' 
                  ? 'Removendo...' 
                  : 'Reativando...')
              : (selectedMedico && (medicoStatuses[selectedMedico.id] !== undefined 
                  ? medicoStatuses[selectedMedico.id] 
                  : selectedMedico.status) === 'ativo' 
                  ? 'Remover' 
                  : 'Reativar')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfissionaisMedicos;