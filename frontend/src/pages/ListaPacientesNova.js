import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Phone,
  Email,
  Person,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { usePacientes } from '../hooks/usePacientes';

const ListaPacientesNova = () => {
  const navigate = useNavigate();
  const { pacientes, carregarPacientes, deletarPaciente, buscarPacientes } = usePacientes();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPacientes, setFilteredPacientes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carregar pacientes ao montar
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar pacientes quando mudar o termo de busca
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const filtered = pacientes.filter(p => 
        p.nome?.toLowerCase().includes(term) ||
        p.nomeCompleto?.toLowerCase().includes(term) ||
        p.telefone?.includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.cpf?.includes(term)
      );
      setFilteredPacientes(filtered);
    } else {
      setFilteredPacientes(pacientes);
    }
  }, [searchTerm, pacientes]);

  const loadData = async () => {
    setLoading(true);
    try {
      await carregarPacientes();
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadData();
      return;
    }

    try {
      await buscarPacientes(searchTerm);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar pacientes');
    }
  };

  const handleMenuOpen = (event, paciente) => {
    setAnchorEl(event.currentTarget);
    setSelectedPaciente(paciente);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPaciente(null);
  };

  const handleEdit = () => {
    if (selectedPaciente) {
      navigate(`/cadastro-paciente?id=${selectedPaciente.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPaciente) return;

    setDeleting(true);
    try {
      await deletarPaciente(selectedPaciente.id);
      toast.success('Paciente excluído com sucesso');
      setDeleteDialogOpen(false);
      setSelectedPaciente(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast.error('Erro ao excluir paciente');
    } finally {
      setDeleting(false);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ativo':
        return 'success';
      case 'inativo':
        return 'default';
      case 'bloqueado':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Pacientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredPacientes.length} {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'} {searchTerm ? 'encontrado(s)' : 'cadastrado(s)'}
          </Typography>
        </Box>

        <Box display="flex" gap={2}>
          <Tooltip title="Recarregar">
            <IconButton onClick={loadData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/cadastro-paciente')}
          >
            Novo Paciente
          </Button>
        </Box>
      </Box>

      {/* Barra de Busca */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            placeholder="Buscar por nome, telefone, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={handleSearch}
          >
            Buscar
          </Button>
          <Tooltip title="Filtros avançados (em breve)">
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              disabled
            >
              Filtros
            </Button>
          </Tooltip>
        </Box>
      </Card>

      {/* Tabela de Pacientes */}
      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        ) : filteredPacientes.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm 
                ? 'Tente buscar com outros termos'
                : 'Comece cadastrando seu primeiro paciente'
              }
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/cadastro-paciente')}
              >
                Cadastrar Primeiro Paciente
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nome</strong></TableCell>
                  <TableCell><strong>Telefone</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>CPF</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPacientes.map((paciente) => (
                  <TableRow 
                    key={paciente.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/cadastro-paciente?id=${paciente.id}`)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person sx={{ color: 'primary.main' }} />
                        <Typography variant="body2">
                          {paciente.nome || paciente.nomeCompleto || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatPhone(paciente.telefone)}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      {paciente.email ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {paciente.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatCPF(paciente.cpf)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={paciente.status || 'Ativo'}
                        color={getStatusColor(paciente.status)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, paciente)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta ação não pode ser desfeita!
          </Alert>
          <Typography>
            Deseja realmente excluir o paciente <strong>{selectedPaciente?.nome || selectedPaciente?.nomeCompleto}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Todos os dados associados a este paciente serão removidos permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListaPacientesNova;
