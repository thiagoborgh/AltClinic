import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Componente para exibir plano de tratamento
const PlanoDeTratamento = ({ planoTratamento, pacienteId, readonly = false }) => {
  if (!planoTratamento) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Plano de Tratamento não definido
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Um plano de tratamento estruturado ajuda a organizar e acompanhar a evolução do paciente.
        </Typography>
        {!readonly && (
          <Button variant="contained">
            Criar Plano de Tratamento
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Plano de Tratamento
      </Typography>

      {/* Objetivo do Tratamento */}
      {planoTratamento.objetivo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Objetivo do Tratamento
            </Typography>
            <Typography variant="body1">
              {planoTratamento.objetivo}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Etapas do Tratamento */}
      {planoTratamento.etapas && planoTratamento.etapas.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Etapas do Tratamento
            </Typography>
            <List>
              {planoTratamento.etapas.map((etapa, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {etapa.status === 'concluida' ? (
                      <CheckIcon color="success" />
                    ) : etapa.status === 'em_andamento' ? (
                      <ScheduleIcon color="primary" />
                    ) : (
                      <TimelineIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={etapa.titulo}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {etapa.descricao}
                        </Typography>
                        {etapa.prazo && (
                          <Typography variant="caption" color="text.secondary">
                            Prazo: {etapa.prazo}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Chip
                    label={
                      etapa.status === 'concluida' ? 'Concluída' :
                      etapa.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'
                    }
                    color={
                      etapa.status === 'concluida' ? 'success' :
                      etapa.status === 'em_andamento' ? 'primary' : 'default'
                    }
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Contraindicações */}
      {planoTratamento.contraIndicacoes && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <WarningIcon color="warning" />
              <Typography variant="h6">
                Contraindicações
              </Typography>
            </Box>
            <Typography variant="body1">
              {planoTratamento.contraIndicacoes}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Cuidados Especiais */}
      {planoTratamento.cuidadosEspeciais && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cuidados Especiais
            </Typography>
            <Typography variant="body1">
              {planoTratamento.cuidadosEspeciais}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PlanoDeTratamento;
