import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Grid,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
  TimelineDot,
  Paper,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge
} from '@mui/material';
import {
  MedicalServices as MedicalIcon,
  Psychology as PsychologyIcon,
  Healing as HealingIcon,
  Assessment as AssessmentIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  MonitorHeart as MonitorIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Timeline completa dos atendimentos do paciente
const TimelinePaciente = ({ timeline = [], pacienteId, onNovoAtendimento }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Tipos de atendimento com ícones e cores
  const tiposAtendimento = {
    'consulta': { icon: <MedicalIcon />, color: 'primary', label: 'Consulta' },
    'procedimento': { icon: <HealingIcon />, color: 'secondary', label: 'Procedimento' },
    'avaliacao': { icon: <AssessmentIcon />, color: 'info', label: 'Avaliação' },
    'terapia': { icon: <PsychologyIcon />, color: 'success', label: 'Terapia' },
    'emergencia': { icon: <HospitalIcon />, color: 'error', label: 'Emergência' },
    'medicacao': { icon: <MedicationIcon />, color: 'warning', label: 'Medicação' },
    'exames': { icon: <MonitorIcon />, color: 'info', label: 'Exames' }
  };

  const handleExpandItem = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatarData = (data) => {
    const dataObj = new Date(data);
    
    if (isToday(dataObj)) {
      return `Hoje, ${format(dataObj, 'HH:mm')}`;
    } else if (isYesterday(dataObj)) {
      return `Ontem, ${format(dataObj, 'HH:mm')}`;
    } else {
      return format(dataObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
  };

  const timelinesFiltradas = timeline.filter(item => {
    if (filtroTipo === 'todos') return true;
    return item.tipo?.toLowerCase() === filtroTipo;
  });

  const filtrosBotoes = [
    { key: 'todos', label: 'Todos', count: timeline.length },
    ...Object.entries(tiposAtendimento).map(([key, config]) => ({
      key,
      label: config.label,
      count: timeline.filter(item => item.tipo?.toLowerCase() === key).length
    }))
  ];

  const renderSinaisVitais = (sinaisVitais) => {
    if (!sinaisVitais) return null;

    return (
      <Box mt={2}>
        <Typography variant="subtitle2" gutterBottom>
          Sinais Vitais
        </Typography>
        <Grid container spacing={2}>
          {sinaisVitais.pressaoArterial && (
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                PA: {sinaisVitais.pressaoArterial}
              </Typography>
            </Grid>
          )}
          {sinaisVitais.frequenciaCardiaca && (
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                FC: {sinaisVitais.frequenciaCardiaca} bpm
              </Typography>
            </Grid>
          )}
          {sinaisVitais.temperatura && (
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Temp: {sinaisVitais.temperatura}°C
              </Typography>
            </Grid>
          )}
          {sinaisVitais.peso && (
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Peso: {sinaisVitais.peso} kg
              </Typography>
            </Grid>
          )}
          {sinaisVitais.altura && (
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Altura: {sinaisVitais.altura} cm
              </Typography>
            </Grid>
          )}
          {sinaisVitais.imc && (
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                IMC: {sinaisVitais.imc}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  const renderProcedimentos = (procedimentos) => {
    if (!procedimentos || procedimentos.length === 0) return null;

    return (
      <Box mt={2}>
        <Typography variant="subtitle2" gutterBottom>
          Procedimentos Realizados
        </Typography>
        <List dense>
          {procedimentos.map((proc, index) => (
            <ListItem key={index} disableGutters>
              <ListItemIcon>
                <HealingIcon color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary={proc.nome}
                secondary={`${proc.profissionalExecutor} - ${proc.valor ? `R$ ${proc.valor}` : 'Sem custo'}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderAnexos = (anexos) => {
    if (!anexos || Object.keys(anexos).length === 0) return null;

    return (
      <Box mt={2}>
        <Typography variant="subtitle2" gutterBottom>
          Anexos
        </Typography>
        {Object.entries(anexos).map(([categoria, arquivos]) => (
          <Box key={categoria} mb={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {categoria}:
            </Typography>
            {arquivos.map((arquivo, index) => (
              <Chip
                key={index}
                icon={<AttachFileIcon />}
                label={arquivo.nome}
                size="small"
                variant="outlined"
                onClick={() => window.open(arquivo.url, '_blank')}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  const renderItemTimeline = (item, index) => {
    const tipoConfig = tiposAtendimento[item.tipo?.toLowerCase()] || tiposAtendimento.consulta;
    const isExpanded = expandedItems.has(item.id);

    return (
      <TimelineItem key={item.id}>
        <TimelineOppositeContent
          sx={{ m: 'auto 0', width: '120px', flexShrink: 0 }}
          align="right"
          variant="body2"
          color="text.secondary"
        >
          {formatarData(item.data)}
        </TimelineOppositeContent>
        
        <TimelineSeparator>
          <TimelineDot color={tipoConfig.color} variant="outlined">
            {tipoConfig.icon}
          </TimelineDot>
          {index < timelinesFiltradas.length - 1 && <TimelineConnector />}
        </TimelineSeparator>
        
        <TimelineContent sx={{ py: '12px', px: 2 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            {/* Header do Item */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box flex={1}>
                <Typography variant="h6" component="div" gutterBottom>
                  {item.motivoConsulta || 'Atendimento'}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label={tipoConfig.label}
                    size="small"
                    color={tipoConfig.color}
                    variant="outlined"
                  />
                  {item.profissional && (
                    <Chip
                      label={item.profissional}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {item.metadata?.status && (
                    <Chip
                      label={item.metadata.status}
                      size="small"
                      color={item.metadata.status === 'Concluído' ? 'success' : 'default'}
                    />
                  )}
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                {item.anexos && Object.keys(item.anexos).length > 0 && (
                  <Badge
                    badgeContent={Object.values(item.anexos).flat().length}
                    color="primary"
                  >
                    <AttachFileIcon fontSize="small" />
                  </Badge>
                )}
                <Tooltip title={isExpanded ? 'Recolher' : 'Expandir'}>
                  <IconButton
                    size="small"
                    onClick={() => handleExpandItem(item.id)}
                  >
                    <ExpandMoreIcon
                      sx={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Conteúdo Principal */}
            {item.historicoDoencaAtual && (
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>HDA:</strong> {item.historicoDoencaAtual}
              </Typography>
            )}

            {item.exameClinico?.exameFisico && (
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Exame Físico:</strong> {item.exameClinico.exameFisico}
              </Typography>
            )}

            {/* Conteúdo Expandido */}
            {isExpanded && (
              <Box mt={2}>
                {/* Sinais Vitais */}
                {renderSinaisVitais(item.exameClinico?.sinaisVitais)}
                
                {/* Procedimentos */}
                {renderProcedimentos(item.procedimentosRealizados)}
                
                {/* Anexos */}
                {renderAnexos(item.anexos)}
                
                {/* Hipótese Diagnóstica */}
                {item.hipoteseDiagnostica && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Hipótese Diagnóstica
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.hipoteseDiagnostica}
                    </Typography>
                  </Box>
                )}
                
                {/* Conduta */}
                {item.conduta && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Conduta
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.conduta}
                    </Typography>
                  </Box>
                )}
                
                {/* Observações */}
                {item.observacoes && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Observações
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.observacoes}
                    </Typography>
                  </Box>
                )}

                {/* Botões de Ação */}
                <Box mt={2} display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    variant="outlined"
                  >
                    Ver Detalhes
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    variant="outlined"
                  >
                    Editar
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </TimelineContent>
      </TimelineItem>
    );
  };

  return (
    <Box>
      {/* Header com Filtros e Ações */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Timeline de Atendimentos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNovoAtendimento}
        >
          Novo Atendimento
        </Button>
      </Box>

      {/* Filtros por Tipo */}
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        {filtrosBotoes.map((filtro) => (
          <Chip
            key={filtro.key}
            label={`${filtro.label} (${filtro.count})`}
            onClick={() => setFiltroTipo(filtro.key)}
            color={filtroTipo === filtro.key ? 'primary' : 'default'}
            variant={filtroTipo === filtro.key ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {/* Timeline Principal */}
      {timelinesFiltradas.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum atendimento encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {filtroTipo === 'todos'
              ? 'Este paciente ainda não possui atendimentos registrados.'
              : `Nenhum atendimento do tipo "${tiposAtendimento[filtroTipo]?.label || filtroTipo}" encontrado.`
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNovoAtendimento}
          >
            Registrar Primeiro Atendimento
          </Button>
        </Paper>
      ) : (
        <Timeline position="alternate">
          {timelinesFiltradas.map((item, index) => renderItemTimeline(item, index))}
        </Timeline>
      )}
    </Box>
  );
};

export default TimelinePaciente;
