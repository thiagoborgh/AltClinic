import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Badge,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  AccessTime,
  Search,
  PlayArrow,
  Warning,
  Refresh,
  MedicalServices,
  Timer,
  Close
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import ProntuarioClinicoViewer from '../components/prontuario/ProntuarioClinicoViewer';
import agendamentoService from '../services/agendamentoService';
import medicoService from '../services/medicoService';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const SalaEspera = () => {
  // Estados principais
  const [pacientesEspera, setPacientesEspera] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtroProfissional, setFiltroProfissional] = useState('meus'); // 'meus', 'todos', 'especifico'
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('');
  const [ordenacao, setOrdenacao] = useState('tempoEspera'); // 'tempoEspera', 'horario', 'paciente'
  const [tempoAtual, setTempoAtual] = useState(dayjs());

  // Estados para filtros e alertas
  const [alertasAtivos, setAlertasAtivos] = useState([]);
  const [profissionaisDisponiveis, setProfissionaisDisponiveis] = useState([]);

  // Estados para modal do prontuário
  const [modalProntuarioAberto, setModalProntuarioAberto] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);

  // Hook de navegação
  const navigate = useNavigate();

  // Hook de atendimento
  // const { iniciarAtendimento } = useAtendimento();

  // Carregar dados iniciais
  useEffect(() => {
    loadPacientesEspera();
    loadProfissionais();
  }, []);

  // Atualizar tempo atual a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoAtual(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Carregar pacientes em espera
  const loadPacientesEspera = async () => {
    setLoading(true);
    try {
      const hoje = dayjs().format('YYYY-MM-DD');
      const response = await agendamentoService.buscarAgendamentos({
        data_inicio: hoje,
        data_fim: hoje
      });
      
      // Filtrar apenas agendamentos com status que indica espera
      const agendamentosEspera = response.data.filter(agendamento => 
        agendamento.status === 'confirmado' || 
        agendamento.status === 'aguardando' ||
        agendamento.status === 'chegou'
      );
      
      // Transformar agendamentos para formato da sala de espera
      const pacientesFormatados = agendamentosEspera.map(ag => ({
        id: ag.id,
        paciente: {
          id: ag.pacienteId || ag.paciente_id,
          nome: ag.paciente || ag.pacienteNome || 'Paciente não informado',
          telefone: ag.pacienteTelefone || ag.telefone || '',
          email: ag.pacienteEmail || ag.email || ''
        },
        profissional: {
          id: ag.profissionalId || ag.medico_id,
          nome: ag.profissional || ag.medicoNome || 'Profissional não informado',
          especialidade: ag.especialidade || '',
          crm: ag.crm || ''
        },
        horarioAgendado: ag.data ? `${ag.data}T${ag.horario}` : ag.dataHora,
        horarioChegada: ag.horarioChegada || ag.chegada || `${ag.data}T${ag.horario}`,
        procedimento: ag.procedimento || ag.servico || 'Consulta',
        status: 'aguardando',
        prioridade: ag.prioridade || 'normal',
        observacoes: ag.observacoes || ''
      }));
      
      setPacientesEspera(pacientesFormatados);
    } catch (error) {
      console.error('Erro ao carregar pacientes em espera:', error);
      toast.error('Erro ao carregar pacientes em espera');
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de profissionais
  const loadProfissionais = async () => {
    try {
      const response = await medicoService.buscarMedicos();
      const medicosAtivos = response.data.filter(m => m.ativo !== false);
      setProfissionaisDisponiveis(medicosAtivos.map(m => ({
        id: m.id,
        nome: m.nome,
        especialidade: m.especialidade
      })));
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  // Calcular tempo de espera
  const calcularTempoEspera = useCallback((horarioChegada) => {
    const chegada = dayjs(horarioChegada);
    const diferenca = tempoAtual.diff(chegada, 'minute');
    return Math.max(0, diferenca);
  }, [tempoAtual]);

  // Formatar tempo de espera
  const formatarTempoEspera = useCallback((minutos) => {
    if (minutos < 60) {
      return `${minutos}min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  }, []);

  // Verificar se tempo de espera é longo (>30min)
  const isEsperaLonga = useCallback((minutos) => minutos > 30, []);

  // Filtrar pacientes por profissional
  const filtrarPorProfissional = useCallback((pacientes) => {
    if (filtroProfissional === 'todos') {
      return pacientes;
    }
    if (filtroProfissional === 'meus') {
      // Simular profissional logado (ID 201)
      return pacientes.filter(p => p.profissional.id === 201);
    }
    if (filtroProfissional === 'especifico' && profissionalSelecionado) {
      return pacientes.filter(p => p.profissional.id === parseInt(profissionalSelecionado));
    }
    return pacientes;
  }, [filtroProfissional, profissionalSelecionado]);

  // Filtrar por busca
  const filtrarPorBusca = useCallback((pacientes) => {
    if (!searchTerm) return pacientes;

    return pacientes.filter(paciente =>
      paciente.paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.procedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.profissional.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Ordenar pacientes
  const ordenarPacientes = useCallback((pacientes) => {
    return [...pacientes].sort((a, b) => {
      switch (ordenacao) {
        case 'tempoEspera':
          const tempoA = calcularTempoEspera(a.horarioChegada);
          const tempoB = calcularTempoEspera(b.horarioChegada);
          return tempoB - tempoA; // Maior tempo primeiro
        case 'horario':
          return dayjs(a.horarioAgendado).diff(dayjs(b.horarioAgendado));
        case 'paciente':
          return a.paciente.nome.localeCompare(b.paciente.nome);
        default:
          return 0;
      }
    });
  }, [ordenacao, calcularTempoEspera]);

  // Aplicar todos os filtros e ordenação
  const pacientesFiltrados = useCallback(() => {
    let filtrados = pacientesEspera.filter(p => p.status === 'aguardando');
    filtrados = filtrarPorProfissional(filtrados);
    filtrados = filtrarPorBusca(filtrados);
    filtrados = ordenarPacientes(filtrados);
    return filtrados;
  }, [pacientesEspera, filtrarPorProfissional, filtrarPorBusca, ordenarPacientes]);

  // Verificar alertas
  useEffect(() => {
    const pacientesFiltradosAtual = pacientesFiltrados();
    const novosAlertas = pacientesFiltradosAtual
      .filter(p => isEsperaLonga(calcularTempoEspera(p.horarioChegada)))
      .map(p => ({
        id: p.id,
        paciente: p.paciente.nome,
        tempoEspera: calcularTempoEspera(p.horarioChegada),
        profissional: p.profissional.nome
      }));

    setAlertasAtivos(novosAlertas);
  }, [pacientesFiltrados, isEsperaLonga, calcularTempoEspera]);

  // Handlers
  const handleIniciarAtendimento = (pacienteEspera) => {
    // Abrir modal do prontuário e auto-iniciar atendimento
    setPacienteSelecionado(pacienteEspera.paciente);
    setModalProntuarioAberto(true);
  };

  const handleRefresh = async () => {
    await loadPacientesEspera();
    toast.success('Lista atualizada!');
  };

  const handleVerProntuario = (pacienteEspera) => {
    setPacienteSelecionado(pacienteEspera.paciente);
    setModalProntuarioAberto(true);
  };

  const handleFecharProntuario = () => {
    setModalProntuarioAberto(false);
    setPacienteSelecionado(null);
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

  const getPacientesFiltradosPaginados = () => {
    const filtrados = pacientesFiltrados();
    return filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center">
          <AccessTime sx={{ mr: 2, color: 'primary.main' }} />
          Sala de Espera
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Stack>
      </Box>

      {/* Alertas de Espera Longa */}
      {alertasAtivos.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            ⚠️ Pacientes com espera prolongada ({alertasAtivos.length}):
          </Typography>
          <Box mt={1}>
            {alertasAtivos.slice(0, 3).map(alerta => (
              <Typography key={alerta.id} variant="body2">
                • {alerta.paciente} - {formatarTempoEspera(alerta.tempoEspera)} com {alerta.profissional}
              </Typography>
            ))}
            {alertasAtivos.length > 3 && (
              <Typography variant="body2" color="text.secondary">
                ...e mais {alertasAtivos.length - 3} paciente(s)
              </Typography>
            )}
          </Box>
        </Alert>
      )}

      {/* Filtros e Busca */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar paciente, procedimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Profissional</InputLabel>
                <Select
                  value={filtroProfissional}
                  label="Profissional"
                  onChange={(e) => setFiltroProfissional(e.target.value)}
                >
                  <MenuItem value="meus">Meus Pacientes</MenuItem>
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="especifico">Profissional Específico</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {filtroProfissional === 'especifico' && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Selecionar Profissional</InputLabel>
                  <Select
                    value={profissionalSelecionado}
                    label="Selecionar Profissional"
                    onChange={(e) => setProfissionalSelecionado(e.target.value)}
                  >
                    {profissionaisDisponiveis.map((prof) => (
                      <MenuItem key={prof.id} value={prof.id}>
                        {prof.nome} - {prof.especialidade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={ordenacao}
                  label="Ordenar por"
                  onChange={(e) => setOrdenacao(e.target.value)}
                >
                  <MenuItem value="tempoEspera">Tempo de Espera</MenuItem>
                  <MenuItem value="horario">Horário Agendado</MenuItem>
                  <MenuItem value="paciente">Nome do Paciente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                <Badge badgeContent={pacientesFiltrados().length} color="primary">
                  {pacientesFiltrados().length} paciente{pacientesFiltrados().length !== 1 ? 's' : ''} aguardando
                </Badge>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Pacientes em Espera */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Profissional</TableCell>
                <TableCell>Procedimento</TableCell>
                <TableCell>Horário</TableCell>
                <TableCell>Tempo de Espera</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getPacientesFiltradosPaginados().map((pacienteEspera) => {
                const tempoEspera = calcularTempoEspera(pacienteEspera.horarioChegada);
                const esperaLonga = isEsperaLonga(tempoEspera);

                return (
                  <TableRow
                    key={pacienteEspera.id}
                    hover
                    sx={{
                      backgroundColor: esperaLonga ? 'warning.light' : 'inherit',
                      '&:hover': {
                        backgroundColor: esperaLonga ? 'warning.main' : 'action.hover'
                      }
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {getInitials(pacienteEspera.paciente.nome)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {pacienteEspera.paciente.nome}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pacienteEspera.paciente.telefone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {pacienteEspera.profissional.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pacienteEspera.profissional.especialidade}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {pacienteEspera.procedimento}
                      </Typography>
                      {pacienteEspera.observacoes && (
                        <Typography variant="caption" color="text.secondary">
                          {pacienteEspera.observacoes}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {dayjs(pacienteEspera.horarioAgendado).format('HH:mm')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Chegada: {dayjs(pacienteEspera.horarioChegada).format('HH:mm')}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Timer sx={{ mr: 1, color: esperaLonga ? 'error.main' : 'text.secondary' }} />
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={esperaLonga ? 'error.main' : 'text.primary'}
                        >
                          {formatarTempoEspera(tempoEspera)}
                        </Typography>
                        {esperaLonga && (
                          <Warning sx={{ ml: 1, color: 'error.main', fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={pacienteEspera.prioridade === 'alta' ? 'Alta' : 'Normal'}
                        color={pacienteEspera.prioridade === 'alta' ? 'error' : 'default'}
                        size="small"
                        variant={pacienteEspera.prioridade === 'alta' ? 'filled' : 'outlined'}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Iniciar Atendimento">
                          <IconButton
                            color="primary"
                            onClick={() => handleIniciarAtendimento(pacienteEspera)}
                            disabled={loading}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver Prontuário">
                          <IconButton color="info" onClick={() => handleVerProntuario(pacienteEspera)}>
                            <MedicalServices />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={pacientesFiltrados().length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Card>

      {/* Estatísticas Rápidas */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {pacientesFiltrados().length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pacientes Aguardando
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {alertasAtivos.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Espera Prolongada
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {pacientesFiltrados().filter(p => calcularTempoEspera(p.horarioChegada) <= 15).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Espera ≤ 15min
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {Math.round(pacientesFiltrados().reduce((acc, p) => acc + calcularTempoEspera(p.horarioChegada), 0) / Math.max(pacientesFiltrados().length, 1))}min
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tempo Médio
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal do Prontuário */}
      <Dialog
        open={modalProntuarioAberto}
        onClose={handleFecharProntuario}
        maxWidth="xl"
        fullWidth
        fullScreen
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Prontuário de {pacienteSelecionado?.nome || 'Paciente'}
          </Typography>
          <IconButton onClick={handleFecharProntuario}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 'calc(100vh - 64px)' }}>
          {pacienteSelecionado && (
            <ProntuarioClinicoViewer
              pacienteId={pacienteSelecionado.id}
              onClose={handleFecharProntuario}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SalaEspera;