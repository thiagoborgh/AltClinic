import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  Tooltip,
  Alert,
  Fab,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import { usePacientes } from '../../hooks/usePacientes';
import ProntuarioClinicoViewer from './ProntuarioClinicoViewer';
import CadastroPaciente from '../pacientes/CadastroPaciente';
import { format, differenceInYears } from 'date-fns';

// Gestão completa de pacientes com prontuário integrado
const GestaoPacientes = () => {
  const {
    pacientes,
    carregarPacientes,
    loading,
    error,
    filtros,
    updateFiltros
  } = usePacientes();

  const [busca, setBusca] = useState('');
  const [prontuarioAberto, setProntuarioAberto] = useState(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPaciente, setMenuPaciente] = useState(null);

  // Carregar pacientes na inicialização
  useEffect(() => {
    carregarPacientes();
  }, [carregarPacientes]);

  // Filtrar pacientes com base na busca
  const pacientesFiltrados = pacientes.filter(paciente => {
    const termoBusca = busca.toLowerCase();
    return (
      paciente.nomeCompleto?.toLowerCase().includes(termoBusca) ||
      paciente.cpf?.includes(termoBusca) ||
      paciente.telefone?.includes(termoBusca) ||
      paciente.email?.toLowerCase().includes(termoBusca)
    );
  });

  // Estatísticas rápidas
  const estatisticas = {
    total: pacientes.length,
    ativos: pacientes.filter(p => p.status === 'Ativo').length,
    comProntuario: pacientes.filter(p => p.temProntuario).length,
    novosEsseMes: pacientes.filter(p => {
      const dataRegistro = new Date(p.criadoEm);
      const agora = new Date();
      return dataRegistro.getMonth() === agora.getMonth() && 
             dataRegistro.getFullYear() === agora.getFullYear();
    }).length
  };

  const handleBusca = (event) => {
    setBusca(event.target.value);
  };

  const handleAbrirProntuario = (paciente) => {
    setPacienteSelecionado(paciente);
    setProntuarioAberto(true);
    setMenuAnchor(null);
  };

  const handleFecharProntuario = () => {
    setProntuarioAberto(false);
    setPacienteSelecionado(null);
  };

  const handleEditarPaciente = (paciente) => {
    setPacienteSelecionado(paciente);
    setCadastroAberto(true);
    setMenuAnchor(null);
  };

  const handleMenuClick = (event, paciente) => {
    setMenuAnchor(event.currentTarget);
    setMenuPaciente(paciente);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuPaciente(null);
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 'N/A';
    return differenceInYears(new Date(), new Date(dataNascimento));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ativo': return 'success';
      case 'Inativo': return 'default';
      case 'Pendente': return 'warning';
      default: return 'default';
    }
  };

  const renderCardsPaciente = () => (
    <Grid container spacing={3}>
      {pacientesFiltrados.map((paciente) => (
        <Grid item xs={12} sm={6} md={4} key={paciente.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              {/* Header do Card */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {paciente.nomeCompleto?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" noWrap>
                      {paciente.nomeCompleto}
                    </Typography>
                    <Chip
                      label={paciente.status || 'Ativo'}
                      size="small"
                      color={getStatusColor(paciente.status)}
                    />
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, paciente)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>

              {/* Informações do Paciente */}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Idade:</strong> {calcularIdade(paciente.dataNascimento)} anos
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>CPF:</strong> {paciente.cpf || 'Não informado'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Telefone:</strong> {paciente.telefone || 'Não informado'}
                </Typography>
                {paciente.email && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Email:</strong> {paciente.email}
                  </Typography>
                )}
              </Box>

              {/* Badges de Status */}
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {paciente.temProntuario && (
                  <Chip
                    icon={<AssignmentIcon />}
                    label="Com Prontuário"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {paciente.ultimoAtendimento && (
                  <Chip
                    icon={<TimelineIcon />}
                    label={`Último: ${format(new Date(paciente.ultimoAtendimento), 'dd/MM/yyyy')}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Ações Rápidas */}
              <Box display="flex" gap={1} mt="auto">
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ViewIcon />}
                  onClick={() => handleAbrirProntuario(paciente)}
                  fullWidth
                >
                  Ver Prontuário
                </Button>
                {paciente.telefone && (
                  <Tooltip title="Ligar">
                    <IconButton
                      size="small"
                      color="primary"
                      href={`tel:${paciente.telefone}`}
                    >
                      <PhoneIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {paciente.email && (
                  <Tooltip title="Email">
                    <IconButton
                      size="small"
                      color="primary"
                      href={`mailto:${paciente.email}`}
                    >
                      <EmailIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderTabelaPacientes = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Paciente</TableCell>
            <TableCell>Idade</TableCell>
            <TableCell>Contato</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Último Atendimento</TableCell>
            <TableCell>Prontuário</TableCell>
            <TableCell align="center">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pacientesFiltrados.map((paciente) => (
            <TableRow key={paciente.id} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    {paciente.nomeCompleto?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {paciente.nomeCompleto}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {paciente.cpf}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                {calcularIdade(paciente.dataNascimento)} anos
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">{paciente.telefone}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {paciente.email}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={paciente.status || 'Ativo'}
                  size="small"
                  color={getStatusColor(paciente.status)}
                />
              </TableCell>
              <TableCell>
                {paciente.ultimoAtendimento
                  ? format(new Date(paciente.ultimoAtendimento), 'dd/MM/yyyy')
                  : 'Nunca'
                }
              </TableCell>
              <TableCell>
                {paciente.temProntuario ? (
                  <Badge color="primary" variant="dot">
                    <HospitalIcon color="primary" />
                  </Badge>
                ) : (
                  <HospitalIcon color="disabled" />
                )}
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => handleAbrirProntuario(paciente)}
                  color="primary"
                >
                  <ViewIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, paciente)}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading && pacientes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Carregando pacientes...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Gestão de Pacientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setCadastroAberto(true)}
        >
          Novo Paciente
        </Button>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total de Pacientes
              </Typography>
              <Typography variant="h4">
                {estatisticas.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pacientes Ativos
              </Typography>
              <Typography variant="h4" color="success.main">
                {estatisticas.ativos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Com Prontuário
              </Typography>
              <Typography variant="h4" color="primary.main">
                {estatisticas.comProntuario}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Novos Este Mês
              </Typography>
              <Typography variant="h4" color="info.main">
                {estatisticas.novosEsseMes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros e Busca */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Buscar por nome, CPF, telefone ou email..."
                value={busca}
                onChange={handleBusca}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                fullWidth
              >
                Filtros Avançados
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Mensagem de Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Lista de Pacientes */}
      {pacientesFiltrados.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {busca
              ? 'Tente ajustar os termos de busca ou limpar o filtro.'
              : 'Comece cadastrando o primeiro paciente do sistema.'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setCadastroAberto(true)}
          >
            Cadastrar Paciente
          </Button>
        </Paper>
      ) : (
        renderCardsPaciente()
      )}

      {/* Menu de Ações */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAbrirProntuario(menuPaciente)}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Prontuário
        </MenuItem>
        <MenuItem onClick={() => handleEditarPaciente(menuPaciente)}>
          <EditIcon sx={{ mr: 1 }} />
          Editar Dados
        </MenuItem>
        <MenuItem>
          <CalendarIcon sx={{ mr: 1 }} />
          Agendar Consulta
        </MenuItem>
      </Menu>

      {/* Dialog do Prontuário */}
      <Dialog
        open={prontuarioAberto}
        onClose={handleFecharProntuario}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        {pacienteSelecionado && (
          <ProntuarioClinicoViewer
            pacienteId={pacienteSelecionado.id}
            onClose={handleFecharProntuario}
          />
        )}
      </Dialog>

      {/* Dialog de Cadastro */}
      <Dialog
        open={cadastroAberto}
        onClose={() => {
          setCadastroAberto(false);
          setPacienteSelecionado(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <CadastroPaciente
          paciente={pacienteSelecionado}
          onClose={() => {
            setCadastroAberto(false);
            setPacienteSelecionado(null);
            carregarPacientes(); // Recarregar lista após cadastro/edição
          }}
        />
      </Dialog>

      {/* FAB para Novo Paciente */}
      <Fab
        color="primary"
        aria-label="novo paciente"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCadastroAberto(true)}
      >
        <PersonAddIcon />
      </Fab>
    </Box>
  );
};

export default GestaoPacientes;
