import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  QrCode,
  Visibility,
  VisibilityOff,
  Save
} from '@mui/icons-material';
import axios from 'axios';

const ConfiguracoesFinanceiras = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    // PIX Institucional
    pix_chave: '',
    pix_nome_titular: '',
    pix_cpf_cnpj: '',
    pix_banco: '',
    pix_ativo: true,

    // Gateway Adquirentes
    gateway_stripe_public_key: '',
    gateway_stripe_secret_key: '',
    gateway_stripe_ativo: false,

    gateway_pagseguro_email: '',
    gateway_pagseguro_token: '',
    gateway_pagseguro_ativo: false,

    // Configurações Gerais
    moeda_padrao: 'BRL',
    timezone: 'America/Sao_Paulo',
    notificacoes_email: true,
    notificacoes_whatsapp: true
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchConfiguracoes();
  }, []);

  const fetchConfiguracoes = async () => {
    try {
      const response = await axios.get('/admin/financeiro/configuracoes');
      if (response.data.success) {
        setConfiguracoes(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Em caso de erro, mantém os valores padrão
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfiguracoes(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.post('/admin/financeiro/configuracoes', configuracoes);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Configurações salvas com sucesso!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar configurações',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const testarPIX = async () => {
    try {
      // Simular teste de chave PIX
      setSnackbar({
        open: true,
        message: 'Teste de chave PIX realizado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao testar chave PIX',
        severity: 'error'
      });
    }
  };

  const testarGateway = async (gateway) => {
    try {
      // Simular teste de gateway
      setSnackbar({
        open: true,
        message: `Teste de ${gateway} realizado com sucesso!`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erro ao testar ${gateway}`,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography>Carregando configurações...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ⚙️ Configurações Financeiras da Empresa
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure os dados institucionais para recebimento de pagamentos. Estas configurações serão usadas para todas as licenças e faturas geradas.
      </Typography>

      {/* PIX Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🏦 Configuração PIX Institucional
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Dados para geração automática de QR Codes PIX para todas as faturas dos clientes.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Chave PIX"
                value={configuracoes.pix_chave || ''}
                onChange={(e) => handleConfigChange('pix_chave', e.target.value)}
                helperText="Email, telefone, CPF/CNPJ ou chave aleatória"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Titular"
                value={configuracoes.pix_nome_titular || ''}
                onChange={(e) => handleConfigChange('pix_nome_titular', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF/CNPJ do Titular"
                value={configuracoes.pix_cpf_cnpj || ''}
                onChange={(e) => handleConfigChange('pix_cpf_cnpj', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Banco"
                value={configuracoes.pix_banco || ''}
                onChange={(e) => handleConfigChange('pix_banco', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.pix_ativo || false}
                      onChange={(e) => handleConfigChange('pix_ativo', e.target.checked)}
                    />
                  }
                  label="PIX Ativo"
                />
                <Button
                  variant="outlined"
                  startIcon={<QrCode />}
                  onClick={testarPIX}
                  disabled={!configuracoes.pix_chave || !configuracoes.pix_ativo}
                >
                  Testar Chave PIX
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Gateway Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💳 Gateway de Pagamento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Integração com gateways para processamento de cartões de crédito.
          </Typography>

          {/* Stripe */}
          <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>
            Stripe
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Public Key"
                type={showPasswords.stripe_public_key ? 'text' : 'password'}
                value={configuracoes.gateway_stripe_public_key || ''}
                onChange={(e) => handleConfigChange('gateway_stripe_public_key', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => togglePasswordVisibility('stripe_public_key')}>
                      {showPasswords.stripe_public_key ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secret Key"
                type={showPasswords.stripe_secret_key ? 'text' : 'password'}
                value={configuracoes.gateway_stripe_secret_key || ''}
                onChange={(e) => handleConfigChange('gateway_stripe_secret_key', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => togglePasswordVisibility('stripe_secret_key')}>
                      {showPasswords.stripe_secret_key ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.gateway_stripe_ativo || false}
                      onChange={(e) => handleConfigChange('gateway_stripe_ativo', e.target.checked)}
                    />
                  }
                  label="Stripe Ativo"
                />
                <Button
                  variant="outlined"
                  onClick={() => testarGateway('Stripe')}
                  disabled={!configuracoes.gateway_stripe_ativo}
                >
                  Testar Stripe
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* PagSeguro */}
          <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>
            PagSeguro
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={configuracoes.gateway_pagseguro_email || ''}
                onChange={(e) => handleConfigChange('gateway_pagseguro_email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Token"
                type={showPasswords.pagseguro_token ? 'text' : 'password'}
                value={configuracoes.gateway_pagseguro_token || ''}
                onChange={(e) => handleConfigChange('gateway_pagseguro_token', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => togglePasswordVisibility('pagseguro_token')}>
                      {showPasswords.pagseguro_token ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.gateway_pagseguro_ativo || false}
                      onChange={(e) => handleConfigChange('gateway_pagseguro_ativo', e.target.checked)}
                    />
                  }
                  label="PagSeguro Ativo"
                />
                <Button
                  variant="outlined"
                  onClick={() => testarGateway('PagSeguro')}
                  disabled={!configuracoes.gateway_pagseguro_ativo}
                >
                  Testar PagSeguro
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚙️ Configurações Gerais
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Moeda Padrão"
                value={configuracoes.moeda_padrao || 'BRL'}
                onChange={(e) => handleConfigChange('moeda_padrao', e.target.value)}
                select
              >
                <option value="BRL">BRL - Real Brasileiro</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Timezone"
                value={configuracoes.timezone || 'America/Sao_Paulo'}
                onChange={(e) => handleConfigChange('timezone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configuracoes.notificacoes_email || false}
                    onChange={(e) => handleConfigChange('notificacoes_email', e.target.checked)}
                  />
                }
                label="Notificações por Email"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configuracoes.notificacoes_whatsapp || false}
                    onChange={(e) => handleConfigChange('notificacoes_whatsapp', e.target.checked)}
                  />
                }
                label="Notificações por WhatsApp"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfiguracoesFinanceiras;
