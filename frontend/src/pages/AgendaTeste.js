import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const AgendaTeste = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🗓️ Agenda ALTclinic - Teste
      </Typography>
      
      <Typography variant="h6" color="primary" gutterBottom>
        ✅ Página carregando com sucesso!
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary">
          Teste de Componente
        </Button>
      </Box>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body1">
          Esta é uma versão de teste para verificar se o roteamento e componentes estão funcionando.
        </Typography>
      </Box>
    </Box>
  );
};

export default AgendaTeste;
