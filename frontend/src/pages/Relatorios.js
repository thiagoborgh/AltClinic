import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Assessment, Download } from '@mui/icons-material';

const Relatorios = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Relatórios & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize dados, métricas de performance e relatórios financeiros
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Download />}>
          Exportar Relatório
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box textAlign="center" py={8}>
            <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Módulo de Relatórios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aqui você poderá visualizar relatórios financeiros e de performance
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Relatorios;
