import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Paper,
  Stack,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Close,
  Edit,
  Save,
  Cancel,
  Phone,
  Email,
  CalendarToday,
  TrendingUp,
  Message,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Assessment,
  NoteAdd
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, formatPhone } from '../../../data/crm/mockCRMData';

// Componente de Análise Comportamental
const AnaliseComportamental = ({ paciente }) => {
  const comportamento = {
    engajamento: 85,
    frequencia: 92,
    satisfacao: 78,
    fidelidade: 89
  };

  const indicadores = [
    {
      label: 'Engajamento',
      valor: comportamento.engajamento,
      cor: comportamento.engajamento >= 80 ? 'success' : comportamento.engajamento >= 60 ? 'warning' : 'error',
      descricao: 'Nivel de interação com mensagens e conteúdos'
    },
    {
      label: 'Frequência',
      valor: comportamento.frequencia,
      cor: comportamento.frequencia >= 80 ? 'success' : comportamento.frequencia >= 60 ? 'warning' : 'error',
      descricao: 'Regularidade de comparecimento a consultas'
    },
    {
      label: 'Satisfação',
      valor: comportamento.satisfacao,
      cor: comportamento.satisfacao >= 80 ? 'success' : comportamento.satisfacao >= 60 ? 'warning' : 'error',
      descricao: 'Nível de satisfação com os serviços'
    },
    {
      label: 'Fidelidade',
      valor: comportamento.fidelidade,
      cor: comportamento.fidelidade >= 80 ? 'success' : comportamento.fidelidade >= 60 ? 'warning' : 'error',
      descricao: 'Probabilidade de continuar como paciente'
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Análise Comportamental
      </Typography>
      
      <Grid container spacing={2}>
        {indicadores.map((indicador, index) => (
          <Grid item xs={6} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {indicador.label}
                  </Typography>
                  <Typography variant="h6" color={`${indicador.cor}.main`}>
                    {indicador.valor}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={indicador.valor}
                  color={indicador.cor}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {indicador.descricao}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Insights Comportamentais
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <TrendingUp color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Alta frequência de consultas"
              secondary="Paciente demonstra comprometimento com o tratamento"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Boa resposta a mensagens"
              secondary="Taxa de abertura de 89% nos últimos 3 meses"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Warning color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Atenção à satisfação"
              secondary="Nível de satisfação pode ser melhorado"
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

// Componente de Timeline de Atividades
const TimelineAtividades = ({ paciente }) => {
  const atividades = [
    {
      tipo: 'consulta',
      titulo: 'Consulta de Rotina',
      descricao: 'Consulta realizada com Dr. Silva',
      data: new Date(2024, 7, 25),
      icon: <Person />,
      cor: 'primary'
    },
    {
      tipo: 'mensagem',
      titulo: 'Mensagem Enviada',
      descricao: 'Lembrete de consulta enviado via WhatsApp',
      data: new Date(2024, 7, 23),
      icon: <Message />,
      cor: 'secondary'
    },
    {
      tipo: 'agendamento',
      titulo: 'Consulta Agendada',
      descricao: 'Próxima consulta agendada para 15/09/2024',
      data: new Date(2024, 7, 20),
      icon: <CalendarToday />,
      cor: 'info'
    },
    {
      tipo: 'nota',
      titulo: 'Nota Adicionada',
      descricao: 'Paciente demonstrou melhora significativa',
      data: new Date(2024, 7, 18),
      icon: <NoteAdd />,
      cor: 'success'
    },
    {
      tipo: 'exame',
      titulo: 'Exame Realizado',
      descricao: 'Exames laboratoriais coletados',
      data: new Date(2024, 7, 15),
      icon: <Assessment />,
      cor: 'warning'
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Timeline de Atividades
      </Typography>
      
      <Stack spacing={3}>
        {atividades.map((atividade, index) => (
          <Box key={index} display="flex" gap={2}>
            {/* Ícone e linha da timeline */}
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: `${atividade.cor}.main`,
                  color: 'white'
                }}
              >
                {atividade.icon}
              </Avatar>
              {index < atividades.length - 1 && (
                <Box
                  sx={{
                    width: 2,
                    height: 40,
                    bgcolor: 'divider',
                    mt: 1
                  }}
                />
              )}
            </Box>
            
            {/* Conteúdo */}
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight="bold">
                {atividade.titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {atividade.descricao}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(atividade.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

// Componente de Histórico de Interações
const HistoricoInteracoes = ({ paciente }) => {
  const interacoes = [
    {
      tipo: 'whatsapp',
      titulo: 'Mensagem WhatsApp',
      conteudo: 'Olá! Lembramos que sua consulta está agendada para amanhã às 14h.',
      status: 'entregue',
      data: new Date(2024, 7, 24, 10, 30),
      resposta: 'Obrigado! Estarei lá no horário.'
    },
    {
      tipo: 'email',
      titulo: 'Email Informativo',
      conteudo: 'Seus exames estão prontos e podem ser retirados na recepção.',
      status: 'lido',
      data: new Date(2024, 7, 22, 15, 45),
      resposta: null
    },
    {
      tipo: 'sms',
      titulo: 'SMS Lembrete',
      conteudo: 'Lembrete: Consulta amanhã 14h. Confirme: sim/não',
      status: 'entregue',
      data: new Date(2024, 7, 20, 12, 0),
      resposta: 'sim'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'entregue': 'success',
      'lido': 'primary',
      'nao_entregue': 'error',
      'pendente': 'warning'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'entregue': 'Entregue',
      'lido': 'Lido',
      'nao_entregue': 'Não Entregue',
      'pendente': 'Pendente'
    };
    return labels[status] || status;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Histórico de Interações
      </Typography>
      
      <List>
        {interacoes.map((interacao, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">
                      {interacao.titulo}
                    </Typography>
                    <Chip
                      label={getStatusLabel(interacao.status)}
                      size="small"
                      color={getStatusColor(interacao.status)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary">
                      {interacao.conteudo}
                    </Typography>
                    {interacao.resposta && (
                      <Paper 
                        sx={{ 
                          p: 1, 
                          mt: 1, 
                          backgroundColor: 'action.hover',
                          borderLeft: 3,
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="body2" fontStyle="italic">
                          Resposta: {interacao.resposta}
                        </Typography>
                      </Paper>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      {format(interacao.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < interacoes.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

// Componente de Sistema de Notas
const SistemaNotas = ({ paciente }) => {
  const [notas, setNotas] = useState([
    {
      id: 1,
      conteudo: 'Paciente demonstrou melhora significativa após início do novo tratamento.',
      autor: 'Dr. Silva',
      data: new Date(2024, 7, 20),
      tipo: 'clinica'
    },
    {
      id: 2,
      conteudo: 'Paciente muito colaborativo, sempre pontual nas consultas.',
      autor: 'Recepção',
      data: new Date(2024, 7, 15),
      tipo: 'administrativa'
    }
  ]);
  const [novaNota, setNovaNota] = useState('');

  const adicionarNota = () => {
    if (novaNota.trim()) {
      const nota = {
        id: Date.now(),
        conteudo: novaNota,
        autor: 'Usuário Atual',
        data: new Date(),
        tipo: 'geral'
      };
      setNotas([nota, ...notas]);
      setNovaNota('');
    }
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'clinica': 'primary',
      'administrativa': 'secondary',
      'geral': 'default'
    };
    return colors[tipo] || 'default';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notas e Observações
      </Typography>
      
      <Box mb={3}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Adicionar nova nota..."
          value={novaNota}
          onChange={(e) => setNovaNota(e.target.value)}
          variant="outlined"
        />
        <Box mt={1} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<NoteAdd />}
            onClick={adicionarNota}
            disabled={!novaNota.trim()}
          >
            Adicionar Nota
          </Button>
        </Box>
      </Box>

      <List>
        {notas.map((nota, index) => (
          <React.Fragment key={nota.id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Chip
                      label={nota.tipo}
                      size="small"
                      color={getTipoColor(nota.tipo)}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      por {nota.autor} • {formatDistanceToNow(nota.data, { addSuffix: true, locale: ptBR })}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="body2">
                    {nota.conteudo}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Editar nota">
                  <IconButton size="small" onClick={() => console.log('Editar nota:', nota.id)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
            {index < notas.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

// Componente Principal do Modal de Perfil
const PerfilPacienteModal = ({ open, onClose, paciente }) => {
  const [tabAtiva, setTabAtiva] = useState(0);
  const [editando, setEditando] = useState(false);
  const [dadosEditados, setDadosEditados] = useState({});

  useEffect(() => {
    if (paciente) {
      setDadosEditados({ ...paciente });
    }
  }, [paciente]);

  const handleTabChange = (event, newValue) => {
    setTabAtiva(newValue);
  };

  const handleSalvar = () => {
    // Aqui seria feita a chamada para API para salvar as alterações
    console.log('Salvando alterações:', dadosEditados);
    setEditando(false);
  };

  const handleCancelar = () => {
    setDadosEditados({ ...paciente });
    setEditando(false);
  };

  if (!paciente) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
              src={paciente.avatar}
            >
              {paciente.nome.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {paciente.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {paciente.id} • Cadastrado em {paciente.dataCadastro && !isNaN(new Date(paciente.dataCadastro))
                  ? format(new Date(paciente.dataCadastro), 'dd/MM/yyyy', { locale: ptBR })
                  : 'Não informado'}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {editando ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSalvar}
                >
                  Salvar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancelar}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setEditando(true)}
              >
                Editar
              </Button>
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabAtiva} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tab icon={<Person />} label="Informações Gerais" />
          <Tab icon={<Schedule />} label="Timeline" />
          <Tab icon={<Message />} label="Interações" />
          <Tab icon={<Assessment />} label="Análise" />
          <Tab icon={<NoteAdd />} label="Notas" />
        </Tabs>

        {/* Tab Informações Gerais */}
        {tabAtiva === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dados Pessoais
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Nome Completo
                    </Typography>
                    <Typography variant="body1">
                      {paciente.nome}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body1">
                        {paciente.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Telefone
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body1">
                        {formatPhone(paciente.telefone)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={paciente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      color={paciente.status === 'ativo' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informações Clínicas
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Segmento
                    </Typography>
                    <Chip
                      label={paciente.segmento?.nome || 'Não definido'}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Valor Total
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(paciente.valorTotal)}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Última Consulta
                    </Typography>
                    <Typography variant="body1">
                      {paciente.ultimaConsulta && !isNaN(new Date(paciente.ultimaConsulta))
                        ? format(new Date(paciente.ultimaConsulta), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Nenhuma consulta registrada'}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Próxima Consulta
                    </Typography>
                    <Typography variant="body1">
                      {paciente.proximaConsulta && !isNaN(new Date(paciente.proximaConsulta))
                        ? format(new Date(paciente.proximaConsulta), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Não agendada'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab Timeline */}
        {tabAtiva === 1 && <TimelineAtividades paciente={paciente} />}

        {/* Tab Interações */}
        {tabAtiva === 2 && <HistoricoInteracoes paciente={paciente} />}

        {/* Tab Análise */}
        {tabAtiva === 3 && <AnaliseComportamental paciente={paciente} />}

        {/* Tab Notas */}
        {tabAtiva === 4 && <SistemaNotas paciente={paciente} />}
      </DialogContent>
    </Dialog>
  );
};

export default PerfilPacienteModal;
