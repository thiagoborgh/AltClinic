import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip
} from '@mui/material';
import {
  Person,
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Phone,
  Email,
  CalendarMonth,
  FilterList,
  PersonAdd
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import pacienteService from '../services/pacienteService';
import dayjs from 'dayjs';

const ListaPacientes = () => {
  const navigate = useNavigate();
  
  // Estados
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPaciente, setSelectedPaciente] = useState(null);

  // Carregar pacientes
  const loadPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        search: searchTerm,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      };

      const response = await pacienteService.getPacientes(filters);
      
      if (response.success) {
        setPacientes(response.pacientes || []);
        setTotalCount(response.total || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast.error('Erro ao carregar pacientes');
      
      // Mock data para desenvolvimento
      const mockPacientes = [
        {
          id: 1,
          nome: 'João Silva',
          cpf: '12345678901',
          telefone: '11999999999',
          email: 'joao@email.com',
          dataNascimento: '1990-01-15',
          medicoResponsavel: 'Dr. Carlos Lima',
          ultimaConsulta: '2024-01-10',
          status: 'ativo'
        },
        {
          id: 2,
          nome: 'Maria Santos',
          cpf: '98765432100',
          telefone: '11888888888',
          email: 'maria@email.com',
          dataNascimento: '1985-05-20',
          medicoResponsável: 'Dra. Ana Costa',
          ultimaConsulta: '2024-01-08',
          status: 'ativo'
        }
      ];
      setPacientes(mockPacientes);
      setTotalCount(mockPacientes.length);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, rowsPerPage, page]);

  useEffect(() => {
    loadPacientes();
  }, [page, rowsPerPage, searchTerm, loadPacientes]);

  // Handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset para primeira página
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, paciente) => {
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

  const handleDelete = async () => {
    if (selectedPaciente) {
      try {
        await pacienteService.deletePaciente(selectedPaciente.id);
        toast.success('Paciente removido com sucesso');
        loadPacientes();
      } catch (error) {
        toast.error('Erro ao remover paciente');
      }
    }
    handleMenuClose();
  };

  const handleCall = (telefone) => {
    if (telefone) {
      window.open(`tel:${telefone}`, '_self');
    }
  };

  const handleEmail = (email) => {
    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  };

  const getInitials = (nome) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getIdade = (dataNascimento) => {
    if (!dataNascimento) return '-';
    return pacienteService.calculateAge(dataNascimento);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Pacientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => navigate('/cadastro-paciente')}
          sx={{ borderRadius: 2 }}
        >
          Novo Paciente
        </Button>
      </Box>

      {/* Filtros e Busca */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nome, CPF ou telefone..."
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
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                fullWidth
              >
                Filtros Avançados
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {totalCount} pacientes encontrados
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Pacientes */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>CPF</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Idade</TableCell>
                <TableCell>Médico Responsável</TableCell>
                <TableCell>Última Consulta</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(paciente.nome)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {paciente.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {paciente.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {pacienteService.formatCPF(paciente.cpf)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Box display="flex" alignItems="center">
                        <Phone sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {pacienteService.formatPhone(paciente.telefone)}
                        </Typography>
                        <IconButton size="small" onClick={() => handleCall(paciente.telefone)}>
                          <Phone fontSize="small" />
                        </IconButton>
                      </Box>
                      {paciente.email && (
                        <Box display="flex" alignItems="center">
                          <Email sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {paciente.email}
                          </Typography>
                          <IconButton size="small" onClick={() => handleEmail(paciente.email)}>
                            <Email fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {getIdade(paciente.dataNascimento)} anos
                    </Typography>
                    {paciente.dataNascimento && (
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(paciente.dataNascimento).format('DD/MM/YYYY')}
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {paciente.medicoResponsavel || '-'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {paciente.ultimaConsulta ? (
                      <Typography variant="body2">
                        {dayjs(paciente.ultimaConsulta).format('DD/MM/YYYY')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma consulta
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={paciente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      color={paciente.status === 'ativo' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Tooltip title="Agendar Consulta">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/agendamentos?paciente=${paciente.id}`)}
                      >
                        <CalendarMonth />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, paciente)}
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
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => navigate(`/prontuario/${selectedPaciente?.id}`)}>
          <Person sx={{ mr: 1 }} />
          Ver Prontuário
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* FAB para Novo Paciente */}
      <Fab
        color="primary"
        aria-label="novo paciente"
        onClick={() => navigate('/cadastro-paciente')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default ListaPacientes;