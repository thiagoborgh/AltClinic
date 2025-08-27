import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { MedicalServices, Add } from '@mui/icons-material';

const Prontuarios = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Prontuários Médicos
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Novo Prontuário
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box textAlign="center" py={8}>
            <MedicalServices sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Módulo de Prontuários
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aqui você poderá gerenciar históricos médicos e prontuários
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Prontuarios;
