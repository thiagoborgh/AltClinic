import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import useWhatsAppAPI from '../../hooks/whatsapp/useWhatsAppAPI';

const WhatsAppConfig = () => {
  const { config, salvarConfiguracao, verificarConexao, loading, isConnected } = useWhatsAppAPI();
  const [formData, setFormData] = useState({
    phoneNumberId: config.phoneNumberId || '',
    accessToken: config.accessToken || '',
    webhookToken: config.webhookToken || ''
  });
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [etapaAtiva, setEtapaAtiva] = useState(0);

  const etapas = ['Configuração', 'Teste', 'Confirmação'];

  const handleSave = async () => {
    try {
      const sucesso = await salvarConfiguracao(formData);
      if (sucesso) {
        setTestResult('success');
        setEtapaAtiva(2);
      } else {
        setTestResult('error');
      }
    } catch (error) {
      setTestResult('error');
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const handleTest = async () => {
    setEtapaAtiva(1);
    try {
      const resultado = await verificarConexao();
      setTestResult(resultado ? 'success' : 'error');
      if (resultado) {
        setEtapaAtiva(2);
      }
    } catch (error) {
      setTestResult('error');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configuração WhatsApp Business API
      </Typography>

      <Stepper activeStep={etapaAtiva} sx={{ mb: 4 }}>
        {etapas.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Informações de Setup */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Como obter suas credenciais:
        </Typography>
        <Typography variant="body2">
          1. Acesse o <Link href="https://developers.facebook.com" target="_blank">Facebook for Developers</Link>
          <br />
          2. Crie um app Business e configure WhatsApp Business API
          <br />
          3. Copie o Phone Number ID e Access Token
          <br />
          4. Configure o Webhook Token para receber mensagens
        </Typography>
      </Alert>

      <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <TextField
          label="Phone Number ID"
          fullWidth
          margin="normal"
          value={formData.phoneNumberId}
          onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
          placeholder="Ex: 102040516078129"
          helperText="ID do número de telefone registrado no WhatsApp Business"
        />

        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel>Access Token</InputLabel>
          <OutlinedInput
            type={showToken ? 'text' : 'password'}
            value={formData.accessToken}
            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowToken(!showToken)}
                  edge="end"
                >
                  {showToken ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
            label="Access Token"
          />
        </FormControl>

        <TextField
          label="Webhook Token (Opcional)"
          fullWidth
          margin="normal"
          value={formData.webhookToken}
          onChange={(e) => setFormData({ ...formData, webhookToken: e.target.value })}
          placeholder="Token para verificação de webhook"
          helperText="Token usado para verificar webhooks de mensagens recebidas"
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading || !formData.phoneNumberId || !formData.accessToken}
          >
            {loading ? 'Salvando...' : 'Salvar e Testar'}
          </Button>

          {(formData.phoneNumberId && formData.accessToken) && (
            <Button
              variant="outlined"
              onClick={handleTest}
              disabled={loading}
            >
              Testar Conexão
            </Button>
          )}
        </Box>

        {testResult === 'success' && (
          <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
            <Typography variant="subtitle2">Conexão estabelecida com sucesso!</Typography>
            <Typography variant="body2">
              WhatsApp Business API está configurado e funcionando.
            </Typography>
          </Alert>
        )}

        {testResult === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Erro na conexão</Typography>
            <Typography variant="body2">
              Verifique suas credenciais e tente novamente.
            </Typography>
          </Alert>
        )}

        {isConnected && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Status Atual: Conectado</Typography>
            <Typography variant="body2">
              Número: {config.phoneNumberId}
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

export default WhatsAppConfig;
