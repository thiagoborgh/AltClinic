import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  TrendingUp,
  Schedule,
  Lock,
  LocalOffer
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const TrialExpiredModal = ({ open, onClose, onUpgrade }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('professional');
  
  // Planos conforme especificação ALTCLINIC
  const planos = [
    {
      id: 'starter',
      nome: 'Starter',
      preco: 149,
      precoDesconto: 119,
      limite: 500,
      descricao: 'Ideal para começar',
      recursos: [
        'Até 3 usuários',
        'Agendamentos ilimitados',
        '500 mensagens WhatsApp/mês',
        'Relatórios básicos',
        'Suporte por email'
      ],
      popular: false
    },
    {
      id: 'professional',
      nome: 'Professional',
      preco: 349,
      precoDesconto: 279,
      limite: 2500,
      descricao: 'Mais escolhido',
      recursos: [
        'Até 10 usuários',
        'Agendamentos ilimitados',
        '2.500 mensagens WhatsApp/mês',
        'Relatórios avançados',
        'Suporte prioritário',
        'Dashboard executivo'
      ],
      popular: true
    },
    {
      id: 'business',
      nome: 'Business',
      preco: 349,
      precoDesconto: 419,
      limite: 5000,
      descricao: 'Para clínicas em expansão',
      recursos: [
        'Até 25 usuários',
        'Agendamentos ilimitados',
        '5.000 mensagens WhatsApp/mês',
        'Relatórios personalizados',
        'API personalizada',
        'Multi-especialidades'
      ],
      popular: false
    },
    {
      id: 'enterprise',
      nome: 'Enterprise',
      preco: 799,
      precoDesconto: 559,
      limite: 10000,
      descricao: 'Solução completa',
      recursos: [
        'Usuários ilimitados',
        'Agendamentos ilimitados',
        '10.000 mensagens WhatsApp/mês',
        'Suporte 24/7',
        'White-label',
        'Consultoria inclusa'
      ],
      popular: false
    }
  ];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(selectedPlan);
    }
  };

  // Estatísticas do trial (mockadas para demonstração)
  const trialStats = {
    agendamentos: user?.trialStats?.agendamentos || 47,
    mensagens: user?.trialStats?.mensagens || 73,
    pacientes: user?.trialStats?.pacientes || 28,
    diasUsados: 15
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
            <Schedule />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              ⏰ Seu trial de 15 dias expirou!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Continue aproveitando todos os benefícios do ALTCLINIC
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Resumo do Trial */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 Resultados do seu trial de 15 dias:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {trialStats.agendamentos}
              </Typography>
              <Typography variant="body2">Agendamentos</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {trialStats.mensagens}
              </Typography>
              <Typography variant="body2">Mensagens enviadas</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {trialStats.pacientes}
              </Typography>
              <Typography variant="body2">Pacientes cadastrados</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                85%
              </Typography>
              <Typography variant="body2">Redução no-shows</Typography>
            </Grid>
          </Grid>
        </Alert>

        {/* Urgência */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <Lock sx={{ verticalAlign: 'middle', mr: 1 }} />
            <strong>Acesso suspenso temporariamente.</strong> 
            Escolha um plano para continuar usando o ALTCLINIC e não perder seus dados.
          </Typography>
        </Alert>

        {/* Oferta especial */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalOffer sx={{ mr: 1 }} />
            🎁 Oferta Especial para Ex-Trial
          </Typography>
          <Typography variant="body1">
            <strong>30% de desconto</strong> nos primeiros 30 dias + 
            <strong> setup gratuito</strong> da sua clínica!
          </Typography>
        </Box>

        {/* Planos */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Escolha o plano ideal para sua clínica:
        </Typography>

        <Grid container spacing={2}>
          {planos.map((plano) => (
            <Grid item xs={12} md={6} lg={3} key={plano.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedPlan === plano.id ? '2px solid' : '1px solid',
                  borderColor: selectedPlan === plano.id ? 'primary.main' : 'divider',
                  bgcolor: selectedPlan === plano.id ? 'primary.50' : 'background.paper',
                  position: 'relative',
                  height: '100%',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => setSelectedPlan(plano.id)}
              >
                {plano.popular && (
                  <Chip
                    label="MAIS POPULAR"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
                
                <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {plano.nome}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ textDecoration: 'line-through' }} 
                      color="text.secondary"
                    >
                      R$ {plano.preco}
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      R$ {plano.precoDesconto}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /mês nos primeiros 30 dias
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {plano.descricao}
                  </Typography>

                  <List dense sx={{ textAlign: 'left' }}>
                    {plano.recursos.slice(0, 3).map((recurso, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <CheckCircle color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={recurso} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {plano.recursos.length > 3 && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2.5 }}>
                        +{plano.recursos.length - 3} recursos
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Benefícios do plano selecionado */}
        {selectedPlan && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              ✨ Com o plano {planos.find(p => p.id === selectedPlan)?.nome} você terá:
            </Typography>
            <List dense>
              {planos.find(p => p.id === selectedPlan)?.recursos.map((recurso, idx) => (
                <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <CheckCircle color="success" sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText primary={recurso} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{ minWidth: 120 }}
        >
          Decidir depois
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpgrade}
          startIcon={<TrendingUp />}
          sx={{ 
            minWidth: 200,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Assinar {planos.find(p => p.id === selectedPlan)?.nome}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrialExpiredModal;