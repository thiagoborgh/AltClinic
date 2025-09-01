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
  ListItemText
} from '@mui/material';
import {
  CheckCircle,
  Settings
} from '@mui/icons-material';

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
      preco: 'R$ 199,00',
      periodo: '/mês',
      features: [
        '3 usuários',
        '500 pacientes',
        'WhatsApp Business',
        'Relatórios básicos',
        'Suporte por email'
      ],
      color: 'primary'
    },
    professional: {
      nome: 'Professional',
      preco: 'R$ 399,00',
      periodo: '/mês',
      features: [
        '10 usuários',
        '2.000 pacientes',
        'WhatsApp Business',
        'Telemedicina',
        'Relatórios avançados',
        'API Access',
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
        'Usuários ilimitados',
        'Pacientes ilimitados',
        'WhatsApp Business',
        'Telemedicina',
        'Relatórios personalizados',
        'API completa',
        'White-label',
        'Suporte dedicado'
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
      const response = await fetch('/api/billing/info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBillingInfo(data.billing);
      }
    } catch (error) {
      console.error('Erro ao carregar informações de cobrança:', error);
      setError('Erro ao carregar informações de cobrança');
    }
  };

  const loadUsage = async () => {
    try {
      const response = await fetch('/api/billing/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Erro ao carregar uso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plano) => {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plano })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkoutUrl;
      } else {
        setError('Erro ao processar upgrade');
      }
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
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando informações de cobrança...
        </Typography>
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
        <Alert severity="error" sx={{ mb: 3 }}>
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
