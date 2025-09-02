import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  AccessTime as TimeIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const CORES_STATUS = {
  pendente: '#ff9800',
  em_atendimento: '#4caf50',
  em_espera: '#f44336',
  cancelado: '#9e9e9e',
  concluido: '#2196f3'
};

export default function DashboardMetricas({ 
  pacienteId, 
  logs = [], 
  onAtualizarDados,
  periodo = '30' 
}) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState(periodo);
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const processarDadosLocal = () => {
      setLoading(true);
      
      try {
        const agora = new Date();
        const diasAtras = parseInt(periodoSelecionado);
        const dataInicio = startOfDay(subDays(agora, diasAtras));
        const dataFim = endOfDay(agora);

        // Filtrar logs por período
        const logsPeriodo = logs.filter(log => {
          const dataLog = new Date(log.timestamp);
          return dataLog >= dataInicio && dataLog <= dataFim;
        });

        // Calcular métricas gerais
        const metricas = calcularMetricasGerais(logsPeriodo);
        
        // Dados para gráficos
        const dadosTempoResposta = calcularTemposResposta(logsPeriodo);
        const dadosStatusDistribuicao = calcularDistribuicaoStatus(logsPeriodo);
        const dadosTendenciaDiaria = calcularTendenciaDiaria(logsPeriodo, dataInicio, dataFim);
        const dadosTempoAtendimento = calcularTemposAtendimento(logsPeriodo);

        setDadosProcessados({
          metricas,
          tempoResposta: dadosTempoResposta,
          statusDistribuicao: dadosStatusDistribuicao,
          tendenciaDiaria: dadosTendenciaDiaria,
          tempoAtendimento: dadosTempoAtendimento,
          totalLogs: logsPeriodo.length
        });
      } catch (error) {
        console.error('Erro ao processar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    processarDadosLocal();
  }, [logs, periodoSelecionado]);

  const calcularMetricasGerais = (logs) => {
    const atendimentosIniciados = logs.filter(l => l.acao === 'iniciar').length;
    const atendimentosConcluidos = logs.filter(l => l.acao === 'concluir').length;
    const atendimentosCancelados = logs.filter(l => l.acao === 'cancelar').length;
    const temposEspera = logs.filter(l => l.acao === 'espera').length;

    const taxaConclusao = atendimentosIniciados > 0 
      ? (atendimentosConcluidos / atendimentosIniciados) * 100 
      : 0;

    const taxaCancelamento = atendimentosIniciados > 0 
      ? (atendimentosCancelados / atendimentosIniciados) * 100 
      : 0;

    return {
      atendimentosIniciados,
      atendimentosConcluidos,
      atendimentosCancelados,
      temposEspera,
      taxaConclusao: Math.round(taxaConclusao),
      taxaCancelamento: Math.round(taxaCancelamento)
    };
  };

  const calcularTemposResposta = (logs) => {
    const tempos = [];
    
    for (let i = 0; i < logs.length - 1; i++) {
      const logAtual = logs[i];
      const proximoLog = logs[i + 1];
      
      if (logAtual.acao === 'iniciar' && proximoLog.acao === 'concluir') {
        const tempo = (new Date(proximoLog.timestamp) - new Date(logAtual.timestamp)) / (1000 * 60);
        tempos.push(Math.round(tempo));
      }
    }

    if (tempos.length === 0) return [];

    // Agrupar tempos em faixas
    const faixas = [
      { faixa: '0-15 min', min: 0, max: 15 },
      { faixa: '15-30 min', min: 15, max: 30 },
      { faixa: '30-60 min', min: 30, max: 60 },
      { faixa: '60+ min', min: 60, max: Infinity }
    ];

    return faixas.map(faixa => ({
      faixa: faixa.faixa,
      quantidade: tempos.filter(t => t >= faixa.min && t < faixa.max).length
    }));
  };

  const calcularDistribuicaoStatus = (logs) => {
    const contadores = {};
    
    logs.forEach(log => {
      const status = log.statusNovo || log.acao;
      contadores[status] = (contadores[status] || 0) + 1;
    });

    return Object.entries(contadores).map(([status, quantidade]) => ({
      status: status.replace('_', ' ').toUpperCase(),
      quantidade,
      cor: CORES_STATUS[status] || '#9e9e9e'
    }));
  };

  const calcularTendenciaDiaria = (logs, dataInicio, dataFim) => {
    const dias = [];
    const dataAtual = new Date(dataInicio);

    while (dataAtual <= dataFim) {
      const diaFormatado = format(dataAtual, 'dd/MM');
      const logsNoDia = logs.filter(log => {
        const dataLog = new Date(log.timestamp);
        return format(dataLog, 'dd/MM') === diaFormatado;
      });

      dias.push({
        dia: diaFormatado,
        atendimentos: logsNoDia.filter(l => l.acao === 'iniciar').length,
        conclusoes: logsNoDia.filter(l => l.acao === 'concluir').length,
        cancelamentos: logsNoDia.filter(l => l.acao === 'cancelar').length
      });

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return dias;
  };

  const calcularTemposAtendimento = (logs) => {
    const sessoes = [];
    let sessaoAtual = null;

    logs.forEach(log => {
      if (log.acao === 'iniciar') {
        sessaoAtual = { inicio: new Date(log.timestamp) };
      } else if (log.acao === 'concluir' && sessaoAtual) {
        const fim = new Date(log.timestamp);
        const duracao = (fim - sessaoAtual.inicio) / (1000 * 60);
        sessoes.push(duracao);
        sessaoAtual = null;
      }
    });

    if (sessoes.length === 0) return { media: 0, mediana: 0, min: 0, max: 0 };

    sessoes.sort((a, b) => a - b);
    const media = sessoes.reduce((a, b) => a + b, 0) / sessoes.length;
    const mediana = sessoes[Math.floor(sessoes.length / 2)];

    return {
      media: Math.round(media),
      mediana: Math.round(mediana),
      min: Math.round(sessoes[0]),
      max: Math.round(sessoes[sessoes.length - 1])
    };
  };

  const renderCardMetrica = (titulo, valor, icone, cor = 'primary', subtitulo = null) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {titulo}
            </Typography>
            <Typography variant="h4" component="div">
              {valor}
            </Typography>
            {subtitulo && (
              <Typography variant="body2" color="textSecondary">
                {subtitulo}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${cor}.main` }}>
            {icone}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Processando dados...</Typography>
      </Box>
    );
  }

  if (!dadosProcessados) {
    return (
      <Alert severity="warning">
        Não foi possível processar os dados das métricas.
      </Alert>
    );
  }

  const { metricas, tempoResposta, statusDistribuicao, tendenciaDiaria, tempoAtendimento } = dadosProcessados;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Dashboard de Métricas
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              label="Período"
            >
              <MenuItem value="7">7 dias</MenuItem>
              <MenuItem value="15">15 dias</MenuItem>
              <MenuItem value="30">30 dias</MenuItem>
              <MenuItem value="60">60 dias</MenuItem>
              <MenuItem value="90">90 dias</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Atualizar dados">
            <IconButton onClick={onAtualizarDados}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Cards de Métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderCardMetrica(
            'Atendimentos Iniciados',
            metricas.atendimentosIniciados,
            <ScheduleIcon />,
            'primary'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderCardMetrica(
            'Taxa de Conclusão',
            `${metricas.taxaConclusao}%`,
            <CheckCircleIcon />,
            'success',
            `${metricas.atendimentosConcluidos} concluídos`
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderCardMetrica(
            'Taxa de Cancelamento',
            `${metricas.taxaCancelamento}%`,
            <CancelIcon />,
            'error',
            `${metricas.atendimentosCancelados} cancelados`
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderCardMetrica(
            'Tempo Médio',
            `${tempoAtendimento.media} min`,
            <TimeIcon />,
            'info',
            `Mediana: ${tempoAtendimento.mediana} min`
          )}
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Tendência Diária */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tendência Diária de Atendimentos
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tendenciaDiaria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="atendimentos" 
                    stackId="1"
                    stroke="#1f77b4" 
                    fill="#1f77b4" 
                    name="Iniciados"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="conclusoes" 
                    stackId="1"
                    stroke="#2ca02c" 
                    fill="#2ca02c" 
                    name="Concluídos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cancelamentos" 
                    stackId="1"
                    stroke="#d62728" 
                    fill="#d62728" 
                    name="Cancelados"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribuição de Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribuição por Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribuicao}
                    dataKey="quantidade"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, quantidade }) => `${status}: ${quantidade}`}
                  >
                    {statusDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tempo de Resposta */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribuição de Tempos de Atendimento
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tempoResposta}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="faixa" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="quantidade" fill="#1f77b4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resumo de Estatísticas */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumo Estatístico - Tempos de Atendimento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Chip label={`Média: ${tempoAtendimento.media} min`} color="primary" />
            </Grid>
            <Grid item xs={3}>
              <Chip label={`Mediana: ${tempoAtendimento.mediana} min`} color="info" />
            </Grid>
            <Grid item xs={3}>
              <Chip label={`Mín: ${tempoAtendimento.min} min`} color="success" />
            </Grid>
            <Grid item xs={3}>
              <Chip label={`Máx: ${tempoAtendimento.max} min`} color="warning" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
