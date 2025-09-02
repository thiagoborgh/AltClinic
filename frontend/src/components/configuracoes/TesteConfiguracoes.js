import React from 'react';
import { Box, Typography } from '@mui/material';

// Teste simples para verificar imports
const TesteConfiguracoes = () => {
  try {
    // Tentar importar cada seção individualmente
    const IntegracoesExternas = require('./sections/IntegracoesExternas').default;
    const ClinicaOperacoes = require('./sections/ClinicaOperacoes').default;
    const TemplatesCRM = require('./sections/TemplatesCRM').default;
    const SegurancaPrivacidade = require('./sections/SegurancaPrivacidade').default;
    
    return (
      <Box p={2}>
        <Typography variant="h4">Teste de Configurações</Typography>
        <Typography>✅ Todos os componentes carregados com sucesso</Typography>
      </Box>
    );
  } catch (error) {
    return (
      <Box p={2}>
        <Typography variant="h4">Erro nos Componentes</Typography>
        <Typography color="error">❌ {error.message}</Typography>
      </Box>
    );
  }
};

export default TesteConfiguracoes;
