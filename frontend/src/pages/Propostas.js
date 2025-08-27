import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Description, Add } from '@mui/icons-material';

const Propostas = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Propostas & Orçamentos
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Nova Proposta
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box textAlign="center" py={8}>
            <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Módulo de Propostas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aqui você poderá criar e gerenciar orçamentos e propostas
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Propostas;
