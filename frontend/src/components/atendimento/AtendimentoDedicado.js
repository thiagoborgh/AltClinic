import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  LinearProgress,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Backdrop
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  PlayArrow as IniciarIcon,
  Pause as PausarIcon,
  Stop as ConcluirIcon,
  Cancel as CancelarIcon,
  History as HistoryIcon,
  Dashboard as MetricasIcon,
  Warning as AlertIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AtendimentoControls from '../prontuario/AtendimentoControls';
import LogsAtendimento from '../prontuario/LogsAtendimento';
import DashboardMetricas from '../prontuario/DashboardMetricas';
import useAtendimento from '../../hooks/useAtendimento';

const STATUS_CONFIG = {
  pendente: {
    color: '#ff9800',
    bgColor: '#fff3e0',
    icon: <ScheduleIcon />,
    label: 'Pendente',
    description: 'Aguardando início do atendimento'
  },
  em_atendimento: {
    color: '#4caf50',
    bgColor: '#e8f5e8',
    icon: <IniciarIcon />,
    label: 'Em Atendimento',
    description: 'Atendimento em andamento'
  },
  em_espera: {
    color: '#f44336',
    bgColor: '#ffebee',
    icon: <PausarIcon />,
    label: 'Em Espera',
    description: 'Atendimento pausado temporariamente'
  },
  concluido: {
    color: '#2196f3',
    bgColor: '#e3f2fd',
    icon: <CheckIcon />,
    label: 'Concluído',
    description: 'Atendimento finalizado com sucesso'
  },
  cancelado: {
    color: '#9e9e9e',
    bgColor: '#f5f5f5',
    icon: <CancelarIcon />,
    label: 'Cancelado',
    description: 'Atendimento cancelado'
  }
};

export default function AtendimentoDedicado({ 
  pacienteId, 
  pacienteNome, 
  onVoltar, 
  open = true 
}) {
  const [activeTab, setActiveTab] = useState('controles');
  const [showLogs, setShowLogs] = useState(false);
  const [showMetricas, setShowMetricas] = useState(false);

  const {
    atendimento,
    logs,
    loading,
    error,
    tempoDecorrido,
    isAtendimentoAtivo,
    buscarLogs,
    buscarMetricas,
    exportarLogs
  } = useAtendimento(pacienteId);

  useEffect(() => {
    if (pacienteId && open) {
      buscarLogs();
      buscarMetricas();
    }
  }, [pacienteId, open, buscarLogs, buscarMetricas]);

  const statusConfig = STATUS_CONFIG[atendimento?.status] || STATUS_CONFIG.pendente;

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVisualizarDetalhesLog = (log) => {
    console.log('Detalhes do log:', log);
  };

  const handleAtualizarDados = () => {
    buscarLogs();
    buscarMetricas();
  };

  if (!open) return null;

  return (
    <Backdrop
      open={open}
      sx={{ 
        zIndex: 1300,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1301
          }}
        >
          {/* Header Superior */}
          <Paper
            elevation={4}
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 0
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={onVoltar}
                  sx={{ color: 'white' }}
                  size="large"
                >
                  <ArrowBackIcon />
                </IconButton>
                
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {pacienteNome || 'Paciente Selecionado'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Atendimento Dedicado • ID: {pacienteId}
                  </Typography>
                </Box>
              </Box>

              {/* Status e Timer */}
              <Box display="flex" alignItems="center" gap={2}>
                {isAtendimentoAtivo && (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={1}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      px: 2,
                      py: 1,
                      borderRadius: 2
                    }}
                  >
                    <TimeIcon />
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                      {formatarTempo(tempoDecorrido)}
                    </Typography>
                  </Box>
                )}
                
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  sx={{
                    bgcolor: 'white',
                    color: statusConfig.color,
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Status Banner */}
          <Paper
            sx={{
              bgcolor: statusConfig.bgColor,
              borderRadius: 0,
              p: 2,
              borderLeft: `4px solid ${statusConfig.color}`
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                {statusConfig.icon}
                <Typography variant="body1" sx={{ color: statusConfig.color, fontWeight: 'bold' }}>
                  {statusConfig.description}
                </Typography>
              </Box>
              
              {atendimento?.ultimaAtualizacao && (
                <Typography variant="caption" color="text.secondary">
                  Atualizado: {format(new Date(atendimento.ultimaAtualizacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Alertas */}
          {error && (
            <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <LinearProgress sx={{ mx: 2, mt: 1 }} />
          )}

          {/* Área Principal */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            {/* Sidebar de Navegação */}
            <Paper
              sx={{
                width: 280,
                borderRadius: 0,
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Painel de Controle
                </Typography>
                
                <List dense>
                  <ListItem
                    button
                    selected={activeTab === 'controles'}
                    onClick={() => setActiveTab('controles')}
                    sx={{ borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <IniciarIcon color={activeTab === 'controles' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Controles"
                      secondary="Iniciar, pausar, concluir"
                    />
                  </ListItem>

                  <ListItem
                    button
                    selected={activeTab === 'logs'}
                    onClick={() => setActiveTab('logs')}
                    sx={{ borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <HistoryIcon color={activeTab === 'logs' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Histórico"
                      secondary={`${logs?.length || 0} registros`}
                    />
                  </ListItem>

                  <ListItem
                    button
                    selected={activeTab === 'metricas'}
                    onClick={() => setActiveTab('metricas')}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <MetricasIcon color={activeTab === 'metricas' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Métricas"
                      secondary="Analytics e KPIs"
                    />
                  </ListItem>
                </List>
              </Box>

              <Divider />

              {/* Resumo Rápido */}
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Resumo Rápido
                </Typography>
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Logs Hoje
                      </Typography>
                      <Typography variant="h6">
                        {logs?.filter(log => {
                          const hoje = new Date().toDateString();
                          return new Date(log.timestamp).toDateString() === hoje;
                        }).length || 0}
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Tempo Ativo
                      </Typography>
                      <Typography variant="h6">
                        {isAtendimentoAtivo ? formatarTempo(tempoDecorrido) : '--:--'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Área de Conteúdo Principal */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {activeTab === 'controles' && (
                <Fade in timeout={300}>
                  <Box>
                    <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                      Controles de Atendimento
                    </Typography>
                    <AtendimentoControls
                      pacienteId={pacienteId}
                      atendimento={atendimento}
                    />
                  </Box>
                </Fade>
              )}

              {activeTab === 'logs' && (
                <Fade in timeout={300}>
                  <Box>
                    <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                      Histórico de Atendimento
                    </Typography>
                    <LogsAtendimento
                      pacienteId={pacienteId}
                      logs={logs}
                      onExportarLogs={exportarLogs}
                      onVisualizarDetalhes={handleVisualizarDetalhesLog}
                    />
                  </Box>
                </Fade>
              )}

              {activeTab === 'metricas' && (
                <Fade in timeout={300}>
                  <Box>
                    <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                      Métricas e Analytics
                    </Typography>
                    <DashboardMetricas
                      pacienteId={pacienteId}
                      logs={logs}
                      onAtualizarDados={handleAtualizarDados}
                    />
                  </Box>
                </Fade>
              )}
            </Box>
          </Box>

          {/* Footer com Ações Rápidas */}
          <Paper
            elevation={4}
            sx={{
              p: 2,
              borderRadius: 0,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Atendimento em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </Typography>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveTab('logs')}
                  startIcon={<HistoryIcon />}
                >
                  Ver Logs
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveTab('metricas')}
                  startIcon={<MetricasIcon />}
                >
                  Ver Métricas
                </Button>
                
                <Button
                  variant="contained"
                  size="small"
                  onClick={onVoltar}
                  startIcon={<ArrowBackIcon />}
                >
                  Voltar ao Prontuário
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Backdrop>
  );
}
