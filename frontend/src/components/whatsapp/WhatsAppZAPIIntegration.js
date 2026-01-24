import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  WhatsApp,
  QrCode,
  CheckCircle,
  Error,
  Upgrade,
  Settings,
  BarChart
} from '@mui/icons-material';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';

const WhatsAppZAPIIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [activationStatus, setActivationStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const { showSuccess, showError, showInfo } = useToast();

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Verificar uso atual
      const usageResponse = await api.get('/whatsapp/usage');
      setUsage(usageResponse.data.usage);

      // Verificar se há instância Z-API ativa
      const configResponse = await api.get('/whatsapp/zapi/config');
      if (configResponse.data.success && configResponse.data.instance) {
        setInstanceId(configResponse.data.instance.instance_id);
        setPhoneNumber(configResponse.data.instance.phone_number);
        setActivationStatus('active');

        // Verificar status da conexão
        const statusResponse = await api.get(`/whatsapp/zapi/status/${configResponse.data.instance.instance_id}`);
        setConnectionStatus(statusResponse.data.connected ? 'connected' : 'pending');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ativar WhatsApp Z-API
  const handleActivate = async () => {
    if (!phoneNumber.match(/^\+55\d{10,11}$/)) {
      showError('Número deve estar no formato +55DDDXXXXXXX');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/whatsapp/zapi/activate', { phoneNumber });

      if (response.data.success) {
        setInstanceId(response.data.instanceId);
        setActivationStatus('pending');
        showSuccess('Instância criada! Agora obtenha o QR code para conectar.');
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // Obter QR Code
  const handleGetQR = async () => {
    if (!instanceId) return;

    try {
      setLoading(true);
      const response = await api.get(`/whatsapp/zapi/qr/${instanceId}`);

      if (response.data.success) {
        setQrCode(response.data.qrCode);
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar status da conexão
  const checkConnectionStatus = async () => {
    if (!instanceId) return;

    try {
      const response = await api.get(`/whatsapp/zapi/status/${instanceId}`);
      setConnectionStatus(response.data.connected ? 'connected' : 'pending');

      if (response.data.connected) {
        setActivationStatus('active');
        setQrCode(null); // Limpar QR se conectado
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Upgrade de plano
  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await api.post('/whatsapp/upgrade', { newPlan: selectedPlan });

      if (response.data.success) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const planLimits = {
    trial: { name: 'Trial', limit: 100, price: 'Grátis' },
    starter: { name: 'Starter', limit: 500, price: 'R$ 199/mês' },
    professional: { name: 'Professional', limit: 2500, price: 'R$ 399/mês' },
    business: { name: 'Business', limit: 5000, price: 'R$ 599/mês' },
    enterprise: { name: 'Enterprise', limit: 10000, price: 'R$ 799/mês' }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <WhatsApp sx={{ mr: 1, verticalAlign: 'middle' }} />
        Integração WhatsApp Z-API
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<Settings />} label="Configuração" />
        <Tab icon={<BarChart />} label="Dashboard" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Configuração */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuração Z-API
                </Typography>

                {activationStatus === 'active' ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <CheckCircle sx={{ mr: 1 }} />
                    WhatsApp conectado com sucesso!
                  </Alert>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      label="Número do WhatsApp"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+5511999999999"
                      sx={{ mb: 2 }}
                      disabled={activationStatus === 'pending'}
                    />

                    {!instanceId ? (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleActivate}
                        disabled={loading || !phoneNumber}
                        startIcon={loading ? <CircularProgress size={20} /> : <WhatsApp />}
                      >
                        {loading ? 'Ativando...' : 'Ativar WhatsApp'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleGetQR}
                          disabled={loading}
                          startIcon={<QrCode />}
                          sx={{ mb: 2 }}
                        >
                          Obter QR Code
                        </Button>

                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={checkConnectionStatus}
                          disabled={loading}
                          startIcon={<CheckCircle />}
                        >
                          Verificar Conexão
                        </Button>

                        <Box sx={{ mt: 2 }}>
                          <Chip
                            label={connectionStatus === 'connected' ? 'Conectado' : 'Aguardando conexão'}
                            color={connectionStatus === 'connected' ? 'success' : 'warning'}
                            icon={connectionStatus === 'connected' ? <CheckCircle /> : <Error />}
                          />
                        </Box>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* QR Code */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  QR Code para Conexão
                </Typography>

                {qrCode ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code WhatsApp"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Escaneie este código no WhatsApp para conectar sua conta.
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Clique em "Obter QR Code" para gerar o código de conexão.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Dashboard de Uso */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Uso Mensal
                </Typography>

                {usage ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {usage.used} de {usage.limit} mensagens enviadas
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={usage.percentage}
                        color={usage.percentage > 90 ? 'error' : usage.percentage > 70 ? 'warning' : 'primary'}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>

                    {usage.percentage >= 90 && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Você atingiu {usage.percentage}% do limite mensal. Considere fazer upgrade.
                      </Alert>
                    )}

                    <Typography variant="body2">
                      Próximo reset: {usage.nextReset}
                    </Typography>
                  </>
                ) : (
                  <CircularProgress />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Upgrade */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Upgrade sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Upgrade de Plano
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Selecionar Plano</InputLabel>
                  <Select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                  >
                    {Object.entries(planLimits).map(([key, plan]) => (
                      <MenuItem key={key} value={key}>
                        {plan.name} - {plan.limit} mensagens ({plan.price})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setUpgradeDialog(true)}
                  disabled={!selectedPlan || loading}
                  startIcon={<Upgrade />}
                >
                  Fazer Upgrade
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Dialog de Upgrade */}
      <Dialog open={upgradeDialog} onClose={() => setUpgradeDialog(false)}>
        <DialogTitle>Confirmar Upgrade</DialogTitle>
        <DialogContent>
          <Typography>
            Você está prestes a fazer upgrade para o plano {planLimits[selectedPlan]?.name}.
            Isso permitirá enviar até {planLimits[selectedPlan]?.limit} mensagens por mês.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpgrade} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppZAPIIntegration;