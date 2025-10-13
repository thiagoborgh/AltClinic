import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardHeader,
  CardContent,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  Save as SaveIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../../services/api';

const ProfessionalNotifications = () => {
  const [config, setConfig] = useState({
    enable_opening_reminder: true,
    enable_closing_reminder: true,
    opening_reminder_minutes: 30,
    closing_reminder_minutes: 15,
    custom_opening_message: '',
    custom_closing_message: '',
    notification_phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Carregar configuração existente
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await api.get('/professional/schedule/notifications-config');
        if (response.data.success) {
          setConfig(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        showSnackbar('Erro ao carregar configurações', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!config.notification_phone) {
      showSnackbar('Número do telefone é obrigatório', 'error');
      return;
    }

    // Validar formato do telefone (básico)
    const phoneRegex = /^\d{10,15}$/;
    const cleanPhone = config.notification_phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      showSnackbar('Formato do telefone inválido (apenas números, 10-15 dígitos)', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.post('/professional/schedule/setup-notifications', {
        ...config,
        notification_phone: cleanPhone
      });
      showSnackbar('Configurações salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      const message = error.response?.data?.message || 'Erro ao salvar configurações';
      showSnackbar(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async (type) => {
    if (!config.notification_phone) {
      showSnackbar('Configure e salve um número de telefone primeiro', 'error');
      return;
    }

    try {
      setTesting(true);
      const response = await api.post('/professional/schedule/test-notification', {
        message_type: type
      });
      
      if (response.data.success) {
        showSnackbar(`Notificação de teste enviada para ${response.data.sent_to}!`, 'success');
      }
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
      const message = error.response?.data?.message || 'Erro ao enviar notificação de teste';
      showSnackbar(message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      // Formato brasileiro: (XX) XXXXX-XXXX
      return cleaned.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return cleaned;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Carregando configurações...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" component="h2" gutterBottom>
        <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Notificações Automáticas
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure lembretes automáticos baseados nos horários de funcionamento do profissional.
      </Typography>

      <Grid container spacing={3}>
        {/* Configurações básicas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Configurações Gerais" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Telefone para Notificações"
                    value={config.notification_phone}
                    onChange={(e) => handleConfigChange('notification_phone', formatPhoneNumber(e.target.value))}
                    placeholder="(11) 99999-9999"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Número do WhatsApp que receberá as notificações"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enable_opening_reminder}
                        onChange={(e) => handleConfigChange('enable_opening_reminder', e.target.checked)}
                      />
                    }
                    label="Lembrete de Abertura"
                  />
                </Grid>

                {config.enable_opening_reminder && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Minutos antes da abertura"
                      value={config.opening_reminder_minutes}
                      onChange={(e) => handleConfigChange('opening_reminder_minutes', parseInt(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon />
                          </InputAdornment>
                        ),
                        inputProps: { min: 1, max: 120 }
                      }}
                      helperText="Tempo de antecedência para o lembrete (1-120 minutos)"
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enable_closing_reminder}
                        onChange={(e) => handleConfigChange('enable_closing_reminder', e.target.checked)}
                      />
                    }
                    label="Lembrete de Fechamento"
                  />
                </Grid>

                {config.enable_closing_reminder && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Minutos antes do fechamento"
                      value={config.closing_reminder_minutes}
                      onChange={(e) => handleConfigChange('closing_reminder_minutes', parseInt(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon />
                          </InputAdornment>
                        ),
                        inputProps: { min: 1, max: 120 }
                      }}
                      helperText="Tempo de antecedência para o lembrete (1-120 minutos)"
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Mensagens personalizadas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Mensagens Personalizadas" />
            <CardContent>
              <Grid container spacing={3}>
                {config.enable_opening_reminder && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Mensagem de Abertura (opcional)"
                      value={config.custom_opening_message}
                      onChange={(e) => handleConfigChange('custom_opening_message', e.target.value)}
                      placeholder="Deixe em branco para usar mensagem padrão"
                      helperText="Mensagem personalizada para lembrete de abertura"
                    />
                  </Grid>
                )}

                {config.enable_closing_reminder && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Mensagem de Fechamento (opcional)"
                      value={config.custom_closing_message}
                      onChange={(e) => handleConfigChange('custom_closing_message', e.target.value)}
                      placeholder="Deixe em branco para usar mensagem padrão"
                      helperText="Mensagem personalizada para lembrete de fechamento"
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Ações */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>

              <Divider orientation="vertical" flexItem />

              <Typography variant="body2" color="text.secondary">
                Testar notificações:
              </Typography>

              <Button
                variant="outlined"
                startIcon={testing ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={() => handleTestNotification('opening')}
                disabled={testing || !config.notification_phone}
                size="small"
              >
                Teste Abertura
              </Button>

              <Button
                variant="outlined"
                startIcon={testing ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={() => handleTestNotification('closing')}
                disabled={testing || !config.notification_phone}
                size="small"
              >
                Teste Fechamento
              </Button>
            </Box>

            {!config.notification_phone && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <WarningIcon sx={{ mr: 1 }} />
                Configure um número de telefone para habilitar as notificações automáticas.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalNotifications;