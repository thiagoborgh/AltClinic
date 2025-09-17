import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

const PlanoDeTratamento = ({ planoTratamento, pacienteId, readonly = false }) => {
  if (!planoTratamento) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          Nenhum plano de tratamento encontrado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crie um plano de tratamento para este paciente
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <AssignmentIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold">
          Plano de Tratamento
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Objetivo
              </Typography>
              <Typography variant="body1">
                {planoTratamento.objetivo || 'Objetivo não definido'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Etapas do Tratamento
              </Typography>
              {planoTratamento.etapas && planoTratamento.etapas.length > 0 ? (
                <List>
                  {planoTratamento.etapas.map((etapa, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Etapa ${index + 1}`}
                        secondary={etapa.descricao || etapa}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma etapa definida
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contra-indicações
              </Typography>
              <Typography variant="body2">
                {planoTratamento.contraIndicacoes || 'Nenhuma contra-indicação registrada'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cuidados Especiais
              </Typography>
              <Typography variant="body2">
                {planoTratamento.cuidadosEspeciais || 'Nenhum cuidado especial registrado'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlanoDeTratamento;