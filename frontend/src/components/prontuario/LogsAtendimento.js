import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  PlayArrow as IniciarIcon,
  Pause as EsperaIcon,
  Cancel as CancelarIcon,
  CheckCircle as ConcluirIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_ICONS = {
  iniciar: { icon: <IniciarIcon />, color: 'success', label: 'Iniciado' },
  espera: { icon: <EsperaIcon />, color: 'warning', label: 'Em Espera' },
  cancelar: { icon: <CancelarIcon />, color: 'error', label: 'Cancelado' },
  concluir: { icon: <ConcluirIcon />, color: 'info', label: 'Concluído' },
  retomar: { icon: <IniciarIcon />, color: 'success', label: 'Retomado' }
};

export default function LogsAtendimento({ 
  pacienteId, 
  logs = [], 
  onExportarLogs,
  onVisualizarDetalhes 
}) {
  const [logsFiltrados, setLogsFiltrados] = useState(logs);
  const [filtros, setFiltros] = useState({
    busca: '',
    periodo: 'todos',
    acao: 'todas',
    usuario: 'todos'
  });
  const [expandedLogs, setExpandedLogs] = useState(new Set());

  useEffect(() => {
    aplicarFiltros();
  }, [logs, filtros]);

  const aplicarFiltros = () => {
    let filtered = [...logs];

    // Filtro por busca
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      filtered = filtered.filter(log => 
        log.acao.toLowerCase().includes(termo) ||
        log.motivo?.toLowerCase().includes(termo) ||
        log.observacoes?.toLowerCase().includes(termo) ||
        log.usuario?.toLowerCase().includes(termo)
      );
    }

    // Filtro por período
    if (filtros.periodo !== 'todos') {
      const agora = new Date();
      const dataLimite = new Date();
      
      switch (filtros.periodo) {
        case 'hoje':
          dataLimite.setHours(0, 0, 0, 0);
          break;
        case 'semana':
          dataLimite.setDate(agora.getDate() - 7);
          break;
        case 'mes':
          dataLimite.setMonth(agora.getMonth() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= dataLimite
      );
    }

    // Filtro por ação
    if (filtros.acao !== 'todas') {
      filtered = filtered.filter(log => log.acao === filtros.acao);
    }

    // Filtro por usuário
    if (filtros.usuario !== 'todos') {
      filtered = filtered.filter(log => log.usuario === filtros.usuario);
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setLogsFiltrados(filtered);
  };

  const handleExpandLog = (logId) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const calcularDuracao = (log) => {
    if (log.acao === 'iniciar' || log.acao === 'retomar') {
      // Procurar próximo log de pausa/conclusão/cancelamento
      const proximoLog = logs.find(l => 
        new Date(l.timestamp) > new Date(log.timestamp) &&
        ['espera', 'concluir', 'cancelar'].includes(l.acao)
      );
      
      if (proximoLog) {
        const minutos = differenceInMinutes(
          new Date(proximoLog.timestamp),
          new Date(log.timestamp)
        );
        return `${minutos} min`;
      }
    }
    return null;
  };

  const formatarTempo = (timestamp) => {
    try {
      return format(parseISO(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    } catch {
      return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    }
  };

  const getUsuariosUnicos = () => {
    const usuarios = [...new Set(logs.map(log => log.usuario).filter(Boolean))];
    return usuarios;
  };

  const renderLogItem = (log) => {
    const statusConfig = STATUS_ICONS[log.acao] || STATUS_ICONS.iniciar;
    const isExpanded = expandedLogs.has(log.id);
    const duracao = calcularDuracao(log);

    return (
      <Card key={log.id} sx={{ mb: 2, border: `1px solid ${statusConfig.color}` }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              {/* Header do Log */}
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Avatar sx={{ bgcolor: `${statusConfig.color}.main`, width: 32, height: 32 }}>
                  {statusConfig.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {statusConfig.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatarTempo(log.timestamp)}
                  </Typography>
                </Box>
                {duracao && (
                  <Chip 
                    icon={<TimeIcon />}
                    label={duracao}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Informações Básicas */}
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Chip label={`Usuário: ${log.usuario}`} size="small" />
                {log.statusAnterior && (
                  <Chip 
                    label={`Status: ${log.statusAnterior} → ${log.statusNovo}`} 
                    size="small" 
                    color="info" 
                  />
                )}
              </Box>

              {/* Motivo (se houver) */}
              {log.motivo && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Motivo:</strong> {log.motivo}
                </Typography>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {log.observacoes && (
                <Badge color="info" variant="dot">
                  <InfoIcon fontSize="small" />
                </Badge>
              )}
              <Tooltip title={isExpanded ? 'Recolher' : 'Ver detalhes'}>
                <IconButton
                  size="small"
                  onClick={() => handleExpandLog(log.id)}
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

          {/* Detalhes Expandidos */}
          {isExpanded && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                {log.observacoes && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Observações:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {log.observacoes}
                    </Typography>
                  </Box>
                )}

                {log.metadata && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Metadados:
                    </Typography>
                    <Box component="pre" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </Box>
                  </Box>
                )}

                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => onVisualizarDetalhes?.(log)}
                  >
                    Ver Detalhes
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header com Filtros */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Logs de Atendimento
          <Badge badgeContent={logsFiltrados.length} color="primary" sx={{ ml: 1 }} />
        </Typography>
        <Button
          startIcon={<DownloadIcon />}
          onClick={() => onExportarLogs?.(logsFiltrados)}
          variant="outlined"
        >
          Exportar
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar nos logs..."
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={filtros.periodo}
              onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
              label="Período"
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="hoje">Hoje</MenuItem>
              <MenuItem value="semana">7 dias</MenuItem>
              <MenuItem value="mes">30 dias</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ação</InputLabel>
            <Select
              value={filtros.acao}
              onChange={(e) => setFiltros({ ...filtros, acao: e.target.value })}
              label="Ação"
            >
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="iniciar">Iniciar</MenuItem>
              <MenuItem value="espera">Espera</MenuItem>
              <MenuItem value="cancelar">Cancelar</MenuItem>
              <MenuItem value="concluir">Concluir</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Usuário</InputLabel>
            <Select
              value={filtros.usuario}
              onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
              label="Usuário"
            >
              <MenuItem value="todos">Todos</MenuItem>
              {getUsuariosUnicos().map(usuario => (
                <MenuItem key={usuario} value={usuario}>
                  {usuario}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Lista de Logs */}
      {logsFiltrados.length > 0 ? (
        <Box>
          {logsFiltrados.map(log => renderLogItem(log))}
        </Box>
      ) : (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum log encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {logs.length === 0 
              ? 'Ainda não há registros de atendimento para este paciente.'
              : 'Tente ajustar os filtros para encontrar os logs desejados.'
            }
          </Typography>
        </Card>
      )}
    </Box>
  );
}
