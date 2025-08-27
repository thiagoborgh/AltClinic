import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { People, Add } from '@mui/icons-material';

const Pacientes = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Pacientes
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Novo Paciente
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box textAlign="center" py={8}>
            <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Módulo de Pacientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aqui você poderá gerenciar todos os pacientes da clínica
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Pacientes;
