import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingIcon,
  ShowChart as ChartIcon,
  Psychology as PsychologyIcon,
  LocalHospital as HospitalIcon,
  Star as StarIcon
} from '@mui/icons-material';

// Componente para exibir resultados e análises
const ResultadosAnalises = ({ resultados, analises, timeline, pacienteId }) => {
  if (!resultados && !analises) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Análises e resultados não disponíveis
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Os resultados aparecerão aqui conforme os atendimentos forem registrados.
        </Typography>
      </Paper>
    );
  }

  const estatisticas = resultados?.estatisticas || {};
  const avaliacoes = resultados?.avaliacoes || [];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Análises e Resultados
      </Typography>

      {/* Estatísticas Gerais */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <HospitalIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom>
                {estatisticas.totalSessoes || 0}
              </Typography>
              <Typography color="text.secondary">
                Total de Sessões
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ChartIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                {estatisticas.faltas || 0}
              </Typography>
              <Typography color="text.secondary">
                Faltas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="warning.main">
                {estatisticas.satisfacaoMedia || 0}
              </Typography>
              <Typography color="text.secondary">
                Satisfação Média
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" gutterBottom color="info.main">
                R$ {estatisticas.investimentoTotal || 0}
              </Typography>
              <Typography color="text.secondary">
                Investimento Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Avaliações */}
      {avaliacoes.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Avaliações de Progresso
            </Typography>
            <List>
              {avaliacoes.map((avaliacao, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <AssessmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={avaliacao.titulo}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {avaliacao.descricao}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Data: {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                        </Typography>
                        {avaliacao.score && (
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <Typography variant="body2">Score:</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={avaliacao.score}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">{avaliacao.score}%</Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Chip
                    label={avaliacao.resultado || 'Em análise'}
                    color={
                      avaliacao.resultado === 'Positivo' ? 'success' :
                      avaliacao.resultado === 'Negativo' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Análises de IA */}
      {analises && Object.keys(analises).length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PsychologyIcon color="primary" />
              <Typography variant="h6">
                Análises Automáticas (IA)
              </Typography>
            </Box>
            
            {analises.padroes && (
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Padrões Identificados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {analises.padroes}
                </Typography>
              </Box>
            )}
            
            {analises.recomendacoes && (
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Recomendações
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {analises.recomendacoes}
                </Typography>
              </Box>
            )}
            
            {analises.alertas && analises.alertas.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Alertas Importantes
                </Typography>
                {analises.alertas.map((alerta, index) => (
                  <Chip
                    key={index}
                    label={alerta}
                    color="warning"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ResultadosAnalises;
