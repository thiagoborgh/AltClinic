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
  Badge,
  Tabs,
  Tab
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
  LocalHospital as HospitalIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { usePacientes } from '../../hooks/usePacientes';
import CadastroPacienteSimples from './CadastroPacienteSimples';
import ProntuarioClinicoViewer from './prontuario/ProntuarioClinicoViewer';
import { format, differenceInYears, isValid, parseISO } from 'date-fns';

// Componente principal unificado de Pacientes com Prontuário
const PacientesManager = () => {
  // Função auxiliar para formatar datas com segurança
  const formatarDataSegura = (data, formato = 'dd/MM/yyyy') => {
    if (!data) return '-';
    
    try {
      const dataObj = typeof data === 'string' ? parseISO(data) : new Date(data);
      return isValid(dataObj) ? format(dataObj, formato) : '-';
    } catch (error) {
      console.warn('Erro ao formatar data:', error);
      return '-';
    }
  };

  const {
    pacientes,
    carregarPacientes,
    loading,
    error
  } = usePacientes();

  const [tabAtiva, setTabAtiva] = useState(0);
  const [busca, setBusca] = useState('');
  const [prontuarioAberto, setProntuarioAberto] = useState(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPaciente, setMenuPaciente] = useState(null);

  // Abas do sistema
  const abas = [
    { label: 'Dashboard', icon: <DashboardIcon />, component: 'dashboard' },
    { label: 'Lista de Pacientes', icon: <PeopleIcon />, component: 'lista' }
  ];

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

  // Estatísticas do dashboard
  const estatisticas = {
    total: pacientes.length,
    ativos: pacientes.filter(p => p.status === 'Ativo').length,
    comProntuario: pacientes.filter(p => p.temProntuario).length,
    novosEsseMes: pacientes.filter(p => {
      const dataRegistro = new Date(p.criadoEm);
      const agora = new Date();
      return dataRegistro.getMonth() === agora.getMonth() && 
             dataRegistro.getFullYear() === agora.getFullYear();
    }).length,
    atendimentosHoje: pacientes.reduce((total, p) => {
      const hoje = new Date().toDateString();
      const ultimoAtendimento = p.ultimoAtendimento ? new Date(p.ultimoAtendimento).toDateString() : null;
      return ultimoAtendimento === hoje ? total + 1 : total;
    }, 0)
  };

  const handleTabChange = (event, novaTab) => {
    setTabAtiva(novaTab);
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
    
    try {
      const dataObj = typeof dataNascimento === 'string' ? parseISO(dataNascimento) : new Date(dataNascimento);
      if (!isValid(dataObj)) return 'N/A';
      
      return differenceInYears(new Date(), dataObj);
    } catch (error) {
      console.warn('Erro ao calcular idade:', error);
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ativo': return 'success';
      case 'Inativo': return 'default';
      case 'Pendente': return 'warning';
      default: return 'default';
    }
  };

  // Dashboard com estatísticas
  const renderDashboard = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard de Pacientes
      </Typography>
      
      {/* Cards de Estatísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {estatisticas.total}
              </Typography>
              <Typography color="text.secondary">
                Total de Pacientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={estatisticas.ativos} color="success">
                <HospitalIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              </Badge>
              <Typography variant="h4" gutterBottom color="success.main">
                {estatisticas.ativos}
              </Typography>
              <Typography color="text.secondary">
                Pacientes Ativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="primary.main">
                {estatisticas.comProntuario}
              </Typography>
              <Typography color="text.secondary">
                Com Prontuário
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonAddIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="info.main">
                {estatisticas.novosEsseMes}
              </Typography>
              <Typography color="text.secondary">
                Novos Este Mês
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="warning.main">
                {estatisticas.atendimentosHoje}
              </Typography>
              <Typography color="text.secondary">
                Atendimentos Hoje
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Últimos Pacientes Cadastrados */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Últimos Pacientes Cadastrados
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Data Cadastro</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Prontuário</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pacientes
                  .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                  .slice(0, 5)
                  .map((paciente) => (
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
                        {formatarDataSegura(paciente.criadoEm)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={paciente.status || 'Ativo'}
                          size="small"
                          color={getStatusColor(paciente.status)}
                        />
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
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  // Lista de pacientes em cards
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
                    label={`Último: ${formatarDataSegura(paciente.ultimoAtendimento)}`}
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
                  Prontuário
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

  // Lista de pacientes
  const renderListaPacientes = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Lista de Pacientes
      </Typography>

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
    </Box>
  );

  const renderConteudoTab = () => {
    const abaAtual = abas[tabAtiva];
    
    switch (abaAtual.component) {
      case 'dashboard':
        return renderDashboard();
      case 'lista':
        return renderListaPacientes();
      default:
        return <Typography>Selecione uma aba</Typography>;
    }
  };

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
          Alt Clinic - Gestão de Pacientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setCadastroAberto(true)}
        >
          Novo Paciente
        </Button>
      </Box>

      {/* Mensagem de Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Abas de Navegação */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabAtiva}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {abas.map((aba, index) => (
              <Tab
                key={index}
                icon={aba.icon}
                label={aba.label}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            ))}
          </Tabs>
        </Box>
      </Card>

      {/* Conteúdo da Aba Ativa */}
      {renderConteudoTab()}

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
        open={Boolean(prontuarioAberto)}
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
      <CadastroPacienteSimples
        open={cadastroAberto}
        onClose={() => {
          setCadastroAberto(false);
          setPacienteSelecionado(null);
          carregarPacientes(); // Recarregar lista após cadastro/edição
        }}
        pacienteParaEdicao={pacienteSelecionado}
      />

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

export default PacientesManager;
