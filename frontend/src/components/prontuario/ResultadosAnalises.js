import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

const ResultadosAnalises = ({ resultados, analises, timeline, pacienteId }) => {
  const resultadosDisponiveis = resultados || [];

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <AssessmentIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold">
          Análises & Resultados
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avaliações Realizadas
              </Typography>
              {resultadosDisponiveis.avaliacoes && resultadosDisponiveis.avaliacoes.length > 0 ? (
                <List>
                  {resultadosDisponiveis.avaliacoes.map((avaliacao, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={avaliacao.tipo || 'Avaliação'}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Data: {avaliacao.data ? new Date(avaliacao.data).toLocaleDateString('pt-BR') : 'Data não informada'}
                            </Typography>
                            <Typography variant="body2">
                              Resultado: {avaliacao.resultado || 'Resultado não informado'}
                            </Typography>
                            {avaliacao.observacoes && (
                              <Typography variant="body2" color="text.secondary">
                                Observações: {avaliacao.observacoes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={avaliacao.status || 'Concluído'}
                        color={avaliacao.status === 'Pendente' ? 'warning' : 'success'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma avaliação registrada
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas do Tratamento
              </Typography>
              {resultadosDisponiveis.estatisticas ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total de Sessões:</strong> {resultadosDisponiveis.estatisticas.totalSessoes || 0}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Faltas:</strong> {resultadosDisponiveis.estatisticas.faltas || 0}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Cancelamentos:</strong> {resultadosDisponiveis.estatisticas.cancelamentos || 0}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Satisfação Média:</strong> {resultadosDisponiveis.estatisticas.satisfacaoMedia || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Investimento Total:</strong> R$ {resultadosDisponiveis.estatisticas.investimentoTotal || 0}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Estatísticas não disponíveis
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline de Atendimentos
              </Typography>
              {timeline && timeline.length > 0 ? (
                <List>
                  {timeline.slice(0, 5).map((atendimento, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Atendimento ${index + 1}`}
                        secondary={
                          atendimento.data
                            ? new Date(atendimento.data).toLocaleDateString('pt-BR')
                            : 'Data não informada'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum atendimento registrado
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResultadosAnalises;