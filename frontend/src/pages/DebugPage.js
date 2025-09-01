import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

const DebugPage = () => {
  const clearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem('authToken');
    console.log('Token no localStorage:', token);
    alert(`Token: ${token}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Debug Page
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={clearLocalStorage}
          sx={{ mr: 2 }}
        >
          Limpar localStorage
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={checkLocalStorage}
        >
          Verificar Token
        </Button>
      </Paper>
    </Box>
  );
};

export default DebugPage;
