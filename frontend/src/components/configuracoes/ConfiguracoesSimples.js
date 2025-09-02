import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert
} from '@mui/material';

// Componente simples para teste
const ConfiguracoesSimples = () => {
  const [tabAtiva, setTabAtiva] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabAtiva(newValue);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        ⚙️ Configurações do Sistema
      </Typography>
      
      <Paper sx={{ width: '100%', mt: 2 }}>
        <Tabs 
          value={tabAtiva} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Integrações Externas" />
          <Tab label="Clínica e Operações" />
          <Tab label="Templates de CRM" />
          <Tab label="Segurança e Privacidade" />
        </Tabs>
        
        <Box p={3}>
          {tabAtiva === 0 && (
            <Alert severity="info">
              Seção de Integrações Externas em desenvolvimento
            </Alert>
          )}
          {tabAtiva === 1 && (
            <Alert severity="info">
              Seção de Clínica e Operações em desenvolvimento
            </Alert>
          )}
          {tabAtiva === 2 && (
            <Alert severity="info">
              Seção de Templates de CRM em desenvolvimento
            </Alert>
          )}
          {tabAtiva === 3 && (
            <Alert severity="info">
              Seção de Segurança e Privacidade em desenvolvimento
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ConfiguracoesSimples;
