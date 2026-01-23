import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import WhatsAppConnection from '../components/whatsapp/WhatsAppConnection';
import WhatsAppMessages from '../components/whatsapp/WhatsAppMessages';
import WhatsAppConfig from '../components/whatsapp/WhatsAppConfig';
import whatsappService from '../services/whatsappService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`whatsapp-tabpanel-${index}`}
      aria-labelledby={`whatsapp-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function WhatsApp() {
  const [tabValue, setTabValue] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await whatsappService.getStatus();
      setConnectionStatus(status);
    } catch (err) {
      console.error('Erro ao carregar status:', err);
      setError(err.response?.data?.error || 'Erro ao carregar status do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    
    // Atualizar status a cada 10 segundos
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusUpdate = () => {
    loadStatus();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        WhatsApp Business
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status rápido */}
      {!loading && connectionStatus && (
        <Alert 
          severity={connectionStatus.connected ? 'success' : 'warning'} 
          sx={{ mb: 2 }}
        >
          {connectionStatus.connected ? (
            <>
              ✅ Conectado como <strong>{connectionStatus.phoneNumber}</strong>
            </>
          ) : (
            <>
              ⚠️ WhatsApp desconectado. Conecte-se para enviar mensagens.
            </>
          )}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Conexão" />
            <Tab label="Mensagens" />
            <Tab label="Configurações" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TabPanel value={tabValue} index={0}>
                <WhatsAppConnection 
                  status={connectionStatus}
                  onStatusUpdate={handleStatusUpdate}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <WhatsAppMessages 
                  connected={connectionStatus?.connected}
                  phoneNumber={connectionStatus?.phoneNumber}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <WhatsAppConfig />
              </TabPanel>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
