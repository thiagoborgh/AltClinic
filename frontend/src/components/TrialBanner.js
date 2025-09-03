import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Grid,
  IconButton,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  Close,
  LocalOffer
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import UpgradeDialog from './UpgradeDialog';

const TrialBanner = () => {
  const { user } = useAuth();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  // Verificar se é usuário trial
  const isTrialUser = user?.singleLicense?.plan === 'trial' || 
                     user?.tenant?.plano === 'trial';

  useEffect(() => {
    if (isTrialUser && user?.tenant?.trial_expire_at) {
      const trialExpire = new Date(user.tenant.trial_expire_at);
      const today = new Date();
      const diffTime = trialExpire - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysLeft(Math.max(0, diffDays));
    }
  }, [isTrialUser, user]);

  if (!isTrialUser || !bannerOpen) {
    return null;
  }

  const trialProgress = trialDaysLeft <= 30 ? ((30 - trialDaysLeft) / 30) * 100 : 0;
  const urgency = trialDaysLeft <= 7 ? 'error' : trialDaysLeft <= 15 ? 'warning' : 'info';

  return (
    <Box sx={{ mb: 3 }}>
      <Paper 
        elevation={3}
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='9' cy='9' r='4'/%3E%3Ccircle cx='51' cy='51' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.3
          }}
        />

        {/* Close Button */}
        <IconButton
          size="small"
          onClick={() => setBannerOpen(false)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <Close />
        </IconButton>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Schedule sx={{ mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="h5" gutterBottom>
                  🚀 Você está no período de teste gratuito!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Aproveite todos os recursos premium por {trialDaysLeft} dias restantes
                </Typography>
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Progresso do trial
                </Typography>
                <Typography variant="body2">
                  {trialDaysLeft} de 30 dias restantes
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={trialProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: urgency === 'error' ? '#ff5252' : 
                             urgency === 'warning' ? '#ffa726' : '#4caf50'
                  }
                }}
              />
            </Box>

            {/* Urgency Alert */}
            {trialDaysLeft <= 7 && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 2,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  color: 'text.primary'
                }}
              >
                <Typography variant="body2">
                  ⚠️ <strong>Seu trial expira em {trialDaysLeft} dias!</strong> 
                  Faça o upgrade agora para não perder suas configurações.
                </Typography>
              </Alert>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Chip
                icon={<LocalOffer />}
                label="30% OFF nos primeiros 30 dias"
                color="warning"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  py: 1
                }}
              />
              
              <Box>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setUpgradeDialogOpen(true)}
                  startIcon={<TrendingUp />}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transform: 'scale(1.05)',
                      transition: 'all 0.2s'
                    }
                  }}
                >
                  Fazer Upgrade Agora
                </Button>
                
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  A partir de R$ 68/mês
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Features Preview */}
        <Collapse in={trialDaysLeft > 15}>
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography variant="h6" gutterBottom>
              🎯 O que você ganha com o upgrade:
            </Typography>
            <Grid container spacing={2}>
              {[
                '📊 Relatórios avançados e BI',
                '📱 WhatsApp Business integrado',
                '💰 Automação de cobrança',
                '👥 Usuários ilimitados',
                '🔒 Backup em tempo real',
                '🎨 Personalização completa'
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {feature}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Dialog de Upgrade */}
      <UpgradeDialog 
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        currentPlan="trial"
      />
    </Box>
  );
};

export default TrialBanner;
