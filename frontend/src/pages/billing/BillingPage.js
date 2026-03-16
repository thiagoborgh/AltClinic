import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  CheckCircle,
  Settings
} from '@mui/icons-material';
import api from '../../services/api';

const BillingPage = () => {
  const [billingInfo, setBillingInfo] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const plans = {
    starter: {
      nome: 'Starter',
      preco: 'R$ 149,00',
      periodo: '/mês',
      features: [
        '1 médico / profissional',
        'Até 500 pacientes',
        'WhatsApp integrado',
        'Agenda e agendamentos',
        'Relatórios básicos',
        'Suporte por email'
      ],
      color: 'primary'
    },
    pro: {
      nome: 'Pro',
      preco: 'R$ 349,00',
      periodo: '/mês',
      features: [
        'Até 5 médicos / profissionais',
        'Até 2.000 pacientes',
        'WhatsApp + automações CRM',
        'Funil Kanban de pacientes',
        'Relatórios avançados',
        'Dashboard executivo',
        'Suporte prioritário'
      ],
      color: 'secondary',
      popular: true
    },
    enterprise: {
      nome: 'Enterprise',
      preco: 'R$ 799,00',
      periodo: '/mês',
      features: [
        'Médicos e pacientes ilimitados',
        'WhatsApp + todos os canais',
        'CRM completo + bot configurável',
        'Relatórios personalizados',
        'API completa',
        'White-label',
        'Multi-unidade',
        'Suporte 24/7 dedicado'
      ],
      color: 'warning'
    }
  };

  useEffect(() => {
    loadBillingInfo();
    loadUsage();
  }, []);

  const loadBillingInfo = async () => {
    try {
      const response = await api.get('/billing/info');
      setBillingInfo(response.data.billing);
    } catch (error) {
      console.error('Erro ao carregar informações de cobrança:', error);
      setError('Erro ao carregar informações de cobrança');
    }
  };

  const loadUsage = async () => {
    try {
      const response = await api.get('/billing/usage');
      setUsage(response.data);
    } catch (error) {
      console.error('Erro ao carregar uso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plano) => {
    try {
      const response = await api.post('/billing/checkout', { plano });
      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      console.error('Erro no upgrade:', error);
      setError('Erro ao processar upgrade');
    }
  };

  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.portalUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao acessar portal:', error);
      setError('Erro ao acessar portal de cobrança');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'info';
      case 'past_due': return 'warning';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'trial': return 'Trial';
      case 'past_due': return 'Pendente';
      case 'canceled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="h6">
            Carregando informações de cobrança...
          </Typography>
        </Box>

        {/* Skeleton para informações de cobrança */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="rectangular" width={120} height={36} />
                <Skeleton variant="rectangular" width={120} height={36} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="text" width="80%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={60} />
            </Paper>
          </Grid>
        </Grid>

        {/* Skeleton para planos */}
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} md={4} key={i}>
                <Paper sx={{ p: 3 }}>
                  <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" gutterBottom>
          Cobrança e Planos
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Settings />}
          onClick={handleBillingPortal}
          disabled={!billingInfo?.subscription}
        >
          Portal de Cobrança
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                setError('');
                loadBillingInfo();
                loadUsage();
              }}
            >
              Tentar Novamente
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Status Atual */}
      {usage && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Plano Atual
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h5">
                  {plans[usage.plano]?.nome || usage.plano}
                </Typography>
                <Chip 
                  label={getStatusText(billingInfo?.status)} 
                  color={getStatusColor(billingInfo?.status)}
                />
              </Box>
              <Typography variant="body1" color="textSecondary">
                {plans[usage.plano]?.preco} {plans[usage.plano]?.periodo}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Uso de Recursos
              </Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Usuários</Typography>
                  <Typography variant="body2">
                    {usage.usage.usuarios.atual} / {usage.usage.usuarios.limite === -1 ? '∞' : usage.usage.usuarios.limite}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={usage.usage.usuarios.percentual} 
                  color={usage.usage.usuarios.percentual > 80 ? 'warning' : 'primary'}
                />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Pacientes</Typography>
                  <Typography variant="body2">
                    {usage.usage.pacientes.atual} / {usage.usage.pacientes.limite === -1 ? '∞' : usage.usage.pacientes.limite}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={usage.usage.pacientes.percentual}
                  color={usage.usage.pacientes.percentual > 80 ? 'warning' : 'primary'}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Alertas */}
      {usage?.plano === 'trial' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Período Trial
          </Typography>
          <Typography variant="body2">
            Você está no período trial. Escolha um plano para continuar usando todos os recursos.
          </Typography>
        </Alert>
      )}

      {billingInfo?.billingStatus === 'past_due' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pagamento Pendente
          </Typography>
          <Typography variant="body2">
            Há um pagamento pendente. Atualize sua forma de pagamento para evitar interrupções.
          </Typography>
        </Alert>
      )}

      {/* Planos Disponíveis */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Planos Disponíveis
      </Typography>
      
      <Grid container spacing={3}>
        {Object.entries(plans).map(([key, plan]) => (
          <Grid item xs={12} md={4} key={key}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                border: plan.popular ? 2 : 1,
                borderColor: plan.popular ? 'secondary.main' : 'divider'
              }}
            >
              {plan.popular && (
                <Chip
                  label="Mais Popular"
                  color="secondary"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom color={`${plan.color}.main`}>
                  {plan.nome}
                </Typography>
                
                <Box display="flex" alignItems="baseline" mb={2}>
                  <Typography variant="h4" color="text.primary">
                    {plan.preco}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {plan.periodo}
                  </Typography>
                </Box>
                
                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              
              <CardActions sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant={plan.popular ? "contained" : "outlined"}
                  color={plan.color}
                  disabled={usage?.plano === key}
                  onClick={() => {
                    setSelectedPlan(key);
                    setUpgradeDialog(true);
                  }}
                >
                  {usage?.plano === key ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog de Confirmação de Upgrade */}
      <Dialog open={upgradeDialog} onClose={() => setUpgradeDialog(false)}>
        <DialogTitle>
          Confirmar Upgrade
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Você está prestes a fazer upgrade para o plano <strong>{plans[selectedPlan]?.nome}</strong>.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Você será redirecionado para o checkout seguro do Stripe para finalizar o pagamento.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setUpgradeDialog(false);
              handleUpgrade(selectedPlan);
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BillingPage;
