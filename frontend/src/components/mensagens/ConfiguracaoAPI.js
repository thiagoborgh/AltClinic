import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Switch, 
  FormControlLabel, 
  Alert,
  Chip,
  CircularProgress 
} from '@mui/material';
import useConfiguracaoAPI from '../../hooks/mensagens/useConfiguracaoAPI';

// Tela de configuração da integração API
const ConfiguracaoAPI = () => {
  const { apiAtiva, chaveAPI, statusConexao, salvarConfiguracao, desativarAPI } = useConfiguracaoAPI();
  const [chaveTemp, setChaveTemp] = useState(chaveAPI);
  const [ativaTemp, setAtivaTemp] = useState(apiAtiva);

  const handleSalvar = () => {
    salvarConfiguracao(chaveTemp, ativaTemp);
  };

  const getStatusColor = () => {
    switch (statusConexao) {
      case 'conectado': return 'success';
      case 'erro': return 'error';
      case 'conectando': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = () => {
    switch (statusConexao) {
      case 'conectado': return 'Conectado';
      case 'erro': return 'Erro na Conexão';
      case 'conectando': return 'Conectando...';
      default: return 'Desconectado';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configuração de Integração API
      </Typography>
      
      <Box mb={3}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Configure a integração com APIs de mensagens para envio automático.
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <Typography variant="body2">Status:</Typography>
          <Chip 
            label={getStatusLabel()} 
            color={getStatusColor()} 
            variant="outlined"
            icon={statusConexao === 'conectando' ? <CircularProgress size={16} /> : undefined}
          />
        </Box>
      </Box>

      <Box mb={3}>
        <FormControlLabel
          control={
            <Switch
              checked={ativaTemp}
              onChange={(e) => setAtivaTemp(e.target.checked)}
            />
          }
          label="Ativar Integração API"
        />
      </Box>

      {ativaTemp && (
        <Box mb={3}>
          <TextField
            label="Chave da API"
            placeholder="Insira sua chave de API"
            fullWidth
            value={chaveTemp}
            onChange={(e) => setChaveTemp(e.target.value)}
            type="password"
            helperText="Esta chave será usada para autenticar com o serviço de mensagens"
          />
        </Box>
      )}

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSalvar}
          disabled={ativaTemp && !chaveTemp}
        >
          Salvar Configuração
        </Button>
        {apiAtiva && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={desativarAPI}
          >
            Desativar API
          </Button>
        )}
      </Box>

      {statusConexao === 'erro' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Erro na conexão com a API. Verifique sua chave e tente novamente.
        </Alert>
      )}

      {statusConexao === 'conectado' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          API conectada com sucesso! Agora você pode enviar mensagens automaticamente.
        </Alert>
      )}
    </Paper>
  );
};

export default ConfiguracaoAPI;
