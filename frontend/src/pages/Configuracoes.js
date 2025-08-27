import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Settings, Save } from '@mui/icons-material';

const Configuracoes = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Configurações
        </Typography>
        <Button variant="contained" startIcon={<Save />}>
          Salvar Alterações
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box textAlign="center" py={8}>
            <Settings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Módulo de Configurações
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aqui você poderá configurar o sistema, APIs e preferências
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Configuracoes;
