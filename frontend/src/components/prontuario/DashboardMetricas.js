import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

export default function DashboardMetricas({ pacienteId, logs, onAtualizarDados }) {
  const [metricas, setMetricas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (pacienteId) {
      carregarMetricas();
    }
  }, [pacienteId]);

  const carregarMetricas = async () => {
    try {
      setCarregando(true);
      setErro(null);

      // Simulação de carregamento de métricas
      // Em produção, isso viria da API
      const dadosMock = {
        tempoMedioAtendimento: 45, // minutos
        numeroConsultas: 12,
        taxaRetorno: 85, // porcentagem
        satisfacaoMedia: 4.2, // de 5
        evolucaoMensal: [
          { mes: 'Jan', consultas: 8 },
          { mes: 'Fev', consultas: 12 },
          { mes: 'Mar', consultas: 15 },
          { mes: 'Abr', consultas: 10 },
          { mes: 'Mai', consultas: 14 },
          { mes: 'Jun', consultas: 12 }
        ]
      };

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMetricas(dadosMock);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setErro('Erro ao carregar métricas do paciente');
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Carregando métricas...
        </Typography>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Paper sx={{ p: 2, height: 120 }}>
                <LinearProgress />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (erro) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {erro}
        </Alert>
      </Box>
    );
  }

  if (!metricas) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Nenhuma métrica disponível para este paciente.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon />
        Dashboard de Métricas
      </Typography>

      <Grid container spacing={3}>
        {/* Tempo Médio de Atendimento */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon />
                  Tempo Médio
                </Typography>
                <Chip
                  label={`${metricas.tempoMedioAtendimento} min`}
                  color="primary"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Tempo médio de atendimento por consulta
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Número de Consultas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon />
                  Consultas
                </Typography>
                <Chip
                  label={metricas.numeroConsultas}
                  color="secondary"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total de consultas realizadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Taxa de Retorno */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon />
                  Taxa de Retorno
                </Typography>
                <Chip
                  label={`${metricas.taxaRetorno}%`}
                  color="success"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Percentual de retorno do paciente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Satisfação Média */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon />
                  Satisfação
                </Typography>
                <Chip
                  label={`${metricas.satisfacaoMedia}/5`}
                  color="warning"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Avaliação média de satisfação
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Evolução Mensal */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evolução Mensal de Consultas
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {metricas.evolucaoMensal.map((item, index) => (
                  <Chip
                    key={index}
                    label={`${item.mes}: ${item.consultas}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Logs de Atendimento */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo de Logs
              </Typography>
              {logs && logs.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total de registros: {logs.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Último log: {new Date(logs[logs.length - 1]?.timestamp).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhum log de atendimento encontrado.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
