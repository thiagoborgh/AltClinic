import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Tabs,
  Tab,
  IconButton,
  Alert,
  Button
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Settings,
  Chat,
  Refresh,
  Download,
  Notifications,
  Group
} from '@mui/icons-material';
import { useCRM } from '../../hooks/crm/useCRM';
import CRMMetricsCards from '../../components/crm/dashboard/CRMMetricsCards';
import EngagementChart from '../../components/crm/dashboard/EngagementChart';
import QuickActions from '../../components/crm/dashboard/QuickActions';
import PacientesPage from './PacientesPage';
import SegmentacaoPage from './SegmentacaoPage';
import AutomacoesPage from '../automacoes/AutomacoesPage';
import MensagensDashboard from '../../components/mensagens/MensagensDashboard';

// Componente de Alertas
const AlertsPanel = ({ alerts, loading }) => {
  if (loading || !alerts?.length) {
    return null;
  }

  const getAlertSeverity = (tipo) => {
    const severity = {
      'warning': 'warning',
      'info': 'info',
      'success': 'success',
      'error': 'error'
    };
    return severity[tipo] || 'info';
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <Notifications />
          Alertas e Notificações
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {alerts.map((alert) => (
          <Alert 
            key={alert.id} 
            severity={getAlertSeverity(alert.tipo)}
            action={
              <Button size="small" color="inherit">
                {alert.acao}
              </Button>
            }
          >
            <Typography variant="subtitle2">
              {alert.titulo}
            </Typography>
            <Typography variant="body2">
              {alert.mensagem}
            </Typography>
          </Alert>
        ))}
      </Box>
    </Paper>
  );
};

// Componente Principal do CRM Dashboard
const CRMDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const { metrics, loading, error, refetch } = useCRM();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={handleRefresh} sx={{ ml: 2 }}>
            Tentar Novamente
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            CRM Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gestão inteligente de relacionamento com pacientes
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            disabled={loading}
          >
            Exportar
          </Button>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Navegação por Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Assessment />} label="Dashboard" />
          <Tab icon={<Chat />} label="Mensagens" />
          <Tab icon={<Group />} label="Pacientes" />
          <Tab icon={<TrendingUp />} label="Segmentação" />
          <Tab icon={<Settings />} label="Automações" />
          <Tab icon={<Refresh />} label="Relatórios" />
          <Tab icon={<Settings />} label="Configurações" />
        </Tabs>
      </Paper>

      {/* Conteúdo da Tab Dashboard */}
      {tabValue === 0 && (
        <Box>
          {/* Cards de Métricas */}
          <CRMMetricsCards 
            metrics={metrics} 
            loading={loading} 
            onRefresh={handleRefresh} 
          />

          {/* Gráficos e Ações */}
          <Grid container spacing={3} sx={{ mb: 3, mt: 1 }}>
            <Grid item xs={12} md={8}>
              <EngagementChart 
                data={metrics.engajamento_por_canal} 
                loading={loading} 
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <QuickActions onAction={(action) => console.log('Ação:', action)} />
            </Grid>
          </Grid>

          {/* Métricas Detalhadas */}
          {!loading && metrics.taxa_entrega && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Métricas Detalhadas
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary.main">
                          {metrics.taxa_entrega}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Taxa de Entrega
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="secondary.main">
                          {metrics.taxa_abertura}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Taxa de Abertura
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {metrics.taxa_resposta}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Taxa de Resposta
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {metrics.taxa_conversao}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Taxa de Conversão
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Alertas */}
          <AlertsPanel alerts={metrics.alerts} loading={loading} />
        </Box>
      )}

      {/* Placeholder para outras tabs */}
      {tabValue === 1 && (
        <MensagensDashboard />
      )}

      {tabValue === 2 && (
        <PacientesPage />
      )}

      {tabValue === 3 && (
        <SegmentacaoPage />
      )}

      {tabValue === 4 && (
        <AutomacoesPage />
      )}

      {tabValue === 5 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Relatórios e Analytics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Em desenvolvimento - Próxima fase da implementação
          </Typography>
        </Paper>
      )}

      {tabValue === 6 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Configurações do CRM
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Em desenvolvimento - Próxima fase da implementação
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default CRMDashboard;
