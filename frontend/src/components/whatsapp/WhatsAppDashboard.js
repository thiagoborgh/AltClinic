import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material';
import {
  WhatsApp,
  Settings,
  Chat,
  Event,
  Payment,
  CheckCircle,
  Error
} from '@mui/icons-material';
import useWhatsAppAPI from '../../hooks/whatsapp/useWhatsAppAPI';
import WhatsAppConfig from './WhatsAppConfig';
import ConversationView from './ConversationView';

const WhatsAppDashboard = () => {
  const [tabAtiva, setTabAtiva] = useState(0);
  const { config, conversas, isConnected, loading } = useWhatsAppAPI();

  const estatisticas = {
    mensagensEnviadas: conversas.filter(c => c.tipo === 'enviada').length,
    mensagensRecebidas: conversas.filter(c => c.tipo === 'recebida').length,
    conversasAtivas: new Set(conversas.map(c => c.telefone)).size,
    taxaEntrega: 95 // Mock
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <WhatsApp color="success" sx={{ fontSize: 32 }} />
          <Typography variant="h5">WhatsApp Business</Typography>
          <Chip
            label={isConnected ? 'Conectado' : 'Desconectado'}
            color={isConnected ? 'success' : 'error'}
            icon={isConnected ? <CheckCircle /> : <Error />}
          />
        </Box>
      </Box>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Configure sua conta WhatsApp Business para começar a usar.
        </Alert>
      )}

      {/* Estatísticas Rápidas */}
      {isConnected && (
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} mb={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Mensagens Enviadas
              </Typography>
              <Typography variant="h5">
                {estatisticas.mensagensEnviadas}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Mensagens Recebidas
              </Typography>
              <Typography variant="h5">
                {estatisticas.mensagensRecebidas}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Conversas Ativas
              </Typography>
              <Typography variant="h5">
                {estatisticas.conversasAtivas}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Taxa de Entrega
              </Typography>
              <Typography variant="h5" color="success.main">
                {estatisticas.taxaEntrega}%
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabAtiva} onChange={(e, newValue) => setTabAtiva(newValue)}>
          <Tab icon={<Chat />} label="Conversas" />
          <Tab icon={<Event />} label="Agendamentos" />
          <Tab icon={<Payment />} label="Cobranças" />
          <Tab icon={<Settings />} label="Configurações" />
        </Tabs>
      </Paper>

      {/* Tab Conversas */}
      {tabAtiva === 0 && (
        <ConversationView conversas={conversas} loading={loading} />
      )}

      {/* Tab Agendamentos */}
      {tabAtiva === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Agendamentos via WhatsApp
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Funcionalidades de agendamento em desenvolvimento.
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><Event /></ListItemIcon>
              <ListItemText
                primary="Solicitações de Agendamento"
                secondary="Pacientes podem solicitar horários via WhatsApp"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle /></ListItemIcon>
              <ListItemText
                primary="Confirmações Automáticas"
                secondary="Bot confirma automaticamente horários disponíveis"
              />
            </ListItem>
          </List>
        </Paper>
      )}

      {/* Tab Cobranças */}
      {tabAtiva === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Gestão Financeira via WhatsApp
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Sistema de cobranças e pagamentos em desenvolvimento.
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><Payment /></ListItemIcon>
              <ListItemText
                primary="Cobranças Automáticas"
                secondary="Envio automático de cobranças com link de pagamento"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle /></ListItemIcon>
              <ListItemText
                primary="Confirmação de Pagamento"
                secondary="Recibos automáticos via WhatsApp"
              />
            </ListItem>
          </List>
        </Paper>
      )}

      {/* Tab Configurações */}
      {tabAtiva === 3 && (
        <WhatsAppConfig />
      )}
    </Box>
  );
};

export default WhatsAppDashboard;
