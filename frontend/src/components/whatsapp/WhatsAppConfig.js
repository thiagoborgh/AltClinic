import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon
} from '@mui/icons-material';
import whatsappService from '../../services/whatsappService';
import useAutomationStatus from '../../hooks/useAutomationStatus';


export default function WhatsAppConfig() {
  const [config, setConfig] = useState({
    autoReply: false,
    autoReplyMessage: '',
    businessHours: {
      enabled: false,
      startTime: '09:00',
      endTime: '18:00'
    },
    webhookUrl: '',
    lembretesAtivos: false
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Hook para status das automações
  const { automationStatus, loading: automationStatusLoading } = useAutomationStatus();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await whatsappService.getConfig();
      if (data.config) {
        setConfig({
          autoReply: data.config.autoReply || false,
          autoReplyMessage: data.config.autoReplyMessage || '',
          businessHours: data.config.businessHours || {
            enabled: false,
            startTime: '09:00',
            endTime: '18:00'
          },
          webhookUrl: data.config.webhookUrl || '',
          lembretesAtivos: data.config.lembretesAtivos || false
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError(err.response?.data?.error || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await whatsappService.saveConfig(config);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError(err.response?.data?.error || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          ✅ Configurações salvas com sucesso!
        </Alert>
      )}

      {/* Resposta Automática */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resposta Automática
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure mensagens automáticas para novos contatos
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={config.autoReply}
                onChange={(e) => setConfig({ ...config, autoReply: e.target.checked })}
              />
            }
            label="Ativar resposta automática"
          />

          {config.autoReply && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mensagem de resposta automática"
              value={config.autoReplyMessage}
              onChange={(e) => setConfig({ ...config, autoReplyMessage: e.target.value })}
              placeholder="Olá! Recebemos sua mensagem e em breve retornaremos o contato."
              sx={{ mt: 2 }}
            />
          )}
        </CardContent>
      </Card>

      {/* Horário Comercial */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Horário Comercial
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Defina horários para envio de mensagens
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={config.businessHours.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  businessHours: {
                    ...config.businessHours,
                    enabled: e.target.checked
                  }
                })}
              />
            }
            label="Respeitar horário comercial"
          />

          {config.businessHours.enabled && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Hora de início"
                  value={config.businessHours.startTime}
                  onChange={(e) => setConfig({
                    ...config,
                    businessHours: {
                      ...config.businessHours,
                      startTime: e.target.value
                    }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Hora de término"
                  value={config.businessHours.endTime}
                  onChange={(e) => setConfig({
                    ...config,
                    businessHours: {
                      ...config.businessHours,
                      endTime: e.target.value
                    }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Webhook (Avançado)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            URL para receber notificações de eventos do WhatsApp
          </Typography>

          <TextField
            fullWidth
            label="URL do Webhook"
            value={config.webhookUrl}
            onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            placeholder="https://seu-servidor.com/webhook/whatsapp"
            helperText="Será chamado quando houver novos eventos (mensagens, conexão, etc)"
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              O webhook receberá requisições POST com dados dos eventos do WhatsApp.
              Útil para integrações com outros sistemas.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Lembretes Automáticos */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lembretes Automáticos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure lembretes automáticos para agendamentos
          </Typography>

          {automationStatus?.blocked && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Automações bloqueadas:</strong> WhatsApp desconectado. 
                Os lembretes estão temporariamente desabilitados.
              </Typography>
            </Alert>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={config.lembretesAtivos}
                onChange={(e) => setConfig({ ...config, lembretesAtivos: e.target.checked })}
                disabled={automationStatus?.blocked}
              />
            }
            label="Ativar lembretes automáticos"
          />

          {config.lembretesAtivos && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Lembretes serão enviados automaticamente 24h antes dos agendamentos.
                Certifique-se de que o WhatsApp está conectado para o funcionamento correto.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Salvar Configurações
        </Button>
      </Box>
    </Box>
  );
}

