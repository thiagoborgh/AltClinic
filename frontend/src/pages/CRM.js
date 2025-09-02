import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Chat, Add } from '@mui/icons-material';

const CRM = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            CRM & Comunicação
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie campanhas, comunicação com clientes e relacionamento
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Nova Campanha
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box textAlign="center" py={8}>
            <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Módulo de CRM
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aqui você poderá gerenciar comunicação automática e campanhas
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CRM;
