import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  CreditCard,
  TrendingUp,
  Star,
  LocalOffer
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const UpgradeDialog = ({ open, onClose, currentPlan = 'trial' }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Plan, 2: Payment

  const planos = [
    {
      id: 'starter',
      nome: 'Starter',
      preco: 199,
      precoDesconto: 139, // 30% off primeiros 30 dias
      descricao: 'Perfeito para começar',
      recursos: [
        'Até 3 usuários',
        'Agendamentos ilimitados',
        'WhatsApp integrado (500 msg/mês)',
        'Relatórios básicos',
        'Suporte por email',
        'Backup automático'
      ],
      limitacoes: [
        'Sem integração avançada',
        'Relatórios limitados'
      ],
      popular: false
    },
    {
      id: 'professional',
      nome: 'Professional',
      preco: 399,
      precoDesconto: 279, // 30% off primeiros 30 dias
      descricao: 'Ideal para clínicas em crescimento',
      recursos: [
        'Até 10 usuários',
        'Agendamentos ilimitados',
        'WhatsApp + Email + SMS (2500 msg/mês)',
        'Relatórios avançados',
        'Suporte prioritário',
        'Backup automático',
        'Integração com laboratórios',
        'Dashboard executivo',
        'Automação de cobrança'
      ],
      limitacoes: [
        'Customizações limitadas'
      ],
      popular: true
    },
    {
      id: 'business',
      nome: 'Business',
      preco: 599,
      precoDesconto: 419, // 30% off primeiros 30 dias
      descricao: 'Para clínicas em expansão',
      recursos: [
        'Até 25 usuários',
        'Agendamentos ilimitados',
        'Todos os canais de comunicação (5000 msg/mês)',
        'Relatórios personalizados',
        'Suporte prioritário',
        'Backup em tempo real',
        'API personalizada',
        'Integrações avançadas',
        'Multi-especialidades'
      ],
      limitacoes: [
        'Sem white-label'
      ],
      popular: false
    },
    {
      id: 'enterprise',
      nome: 'Enterprise',
      preco: 799,
      precoDesconto: 559, // 30% off primeiros 30 dias
      descricao: 'Solução completa para grandes clínicas',
      recursos: [
        'Usuários ilimitados',
        'Agendamentos ilimitados',
        'Todos os canais de comunicação (10000 msg/mês)',
        'Relatórios personalizados',
        'Suporte 24/7',
        'Backup em tempo real',
        'Integração completa',
        'BI avançado',
        'Automação total',
        'API personalizada',
        'Treinamento incluso',
        'Consultoria mensal'
      ],
      limitacoes: [],
      popular: false
    }
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Simular processamento (remover em produção)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(`/api/trial/${user.tenant_id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plano: selectedPlan,
          paymentMethod: paymentMethod
        })
      });

      const data = await response.json();

      if (data.success) {
        // Upgrade realizado com sucesso
        setStep(3); // Success step
        setTimeout(() => {
          window.location.reload(); // Recarregar para atualizar o plano
        }, 3000);
      } else {
        console.error('Erro no upgrade:', data.message);
        // Adicionar feedback de erro
        alert('Erro ao processar upgrade. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = planos.find(p => p.id === selectedPlan);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <TrendingUp />
          </Avatar>
          <Box>
            <Typography variant="h5">
              Upgrade do Plano
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Desbloqueie todo o potencial do Alt Clinic
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {step === 1 && (
          <Box>
            {/* Oferta Especial */}
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              icon={<LocalOffer />}
            >
              <Typography variant="h6" gutterBottom>
                🎉 Oferta Especial de Upgrade!
              </Typography>
              <Typography>
                <strong>30% de desconto</strong> nos primeiros 30 dias + todas as funcionalidades desbloqueadas imediatamente.
              </Typography>
            </Alert>

            {/* Trial Info */}
            {currentPlan === 'trial' && (
              <Card sx={{ mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📅 Status do seu Trial
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Você está aproveitando o período de teste gratuito. Faça o upgrade agora e mantenha todas as suas configurações!
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Restam 7 dias do seu trial
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Planos */}
            <Grid container spacing={3}>
              {planos.map((plano) => (
                <Grid item xs={12} md={4} key={plano.id}>
                  <Card
                    sx={{
                      height: '100%',
                      position: 'relative',
                      border: selectedPlan === plano.id ? '2px solid' : '1px solid',
                      borderColor: selectedPlan === plano.id ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                      }
                    }}
                    onClick={() => setSelectedPlan(plano.id)}
                  >
                    {plano.popular && (
                      <Chip
                        label="MAIS POPULAR"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 1
                        }}
                      />
                    )}

                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="h5" gutterBottom>
                        {plano.nome}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="h4" 
                          component="span" 
                          color="primary"
                          sx={{ textDecoration: 'line-through', opacity: 0.6 }}
                        >
                          R$ {plano.preco}
                        </Typography>
                        <Typography variant="h3" component="div" color="success.main">
                          R$ {plano.precoDesconto}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          /mês nos primeiros 30 dias
                        </Typography>
                        <Chip 
                          label="30% OFF" 
                          color="success" 
                          size="small" 
                          sx={{ mt: 1 }}
                        />
                      </Box>

                      <Typography color="text.secondary" gutterBottom>
                        {plano.descricao}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <List dense>
                        {plano.recursos.map((recurso, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <CheckCircle color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={recurso}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                        {plano.limitacoes.map((limitacao, idx) => (
                          <ListItem key={`lim-${idx}`} sx={{ px: 0, py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <Cancel color="error" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={limitacao}
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: 'text.secondary'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {step === 2 && selectedPlanData && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 Confirmar Upgrade
              </Typography>
              <Typography>
                Plano selecionado: <strong>{selectedPlanData.nome}</strong> - 
                R$ {selectedPlanData.precoDesconto}/mês (30% OFF nos primeiros 30 dias)
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💳 Forma de Pagamento
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Método de Pagamento</InputLabel>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        label="Método de Pagamento"
                      >
                        <MenuItem value="credit_card">Cartão de Crédito</MenuItem>
                        <MenuItem value="pix">PIX</MenuItem>
                        <MenuItem value="boleto">Boleto Bancário</MenuItem>
                      </Select>
                    </FormControl>

                    {paymentMethod === 'credit_card' && (
                      <Box>
                        <TextField
                          fullWidth
                          label="Número do Cartão"
                          placeholder="0000 0000 0000 0000"
                          sx={{ mb: 2 }}
                        />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Validade"
                              placeholder="MM/AA"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="CVV"
                              placeholder="000"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📄 Resumo do Pedido
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        <strong>{selectedPlanData.nome}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPlanData.descricao}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Preço normal:</Typography>
                      <Typography sx={{ textDecoration: 'line-through' }}>
                        R$ {selectedPlanData.preco}/mês
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Desconto (30%):</Typography>
                      <Typography color="success.main">
                        -R$ {selectedPlanData.preco - selectedPlanData.precoDesconto}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary">
                        R$ {selectedPlanData.precoDesconto}/mês
                      </Typography>
                    </Box>

                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        ✅ Cobrança recorrente mensal<br/>
                        ✅ Cancele quando quiser<br/>
                        ✅ Suporte incluso
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'success.main', 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 3 
              }}
            >
              <CheckCircle sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h4" gutterBottom>
              🎉 Upgrade Realizado!
            </Typography>
            
            <Typography variant="h6" paragraph color="text.secondary">
              Parabéns! Sua clínica foi atualizada para o plano <strong>{selectedPlanData?.nome}</strong>
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography>
                Todas as funcionalidades foram desbloqueadas imediatamente. 
                Você será redirecionado em alguns segundos...
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {step === 1 && (
          <>
            <Button onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setStep(2)}
              startIcon={<CreditCard />}
            >
              Continuar com {selectedPlanData?.nome}
            </Button>
          </>
        )}
        
        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUpgrade}
              disabled={loading}
              startIcon={loading ? null : <Star />}
            >
              {loading ? 'Processando...' : `Fazer Upgrade - R$ ${selectedPlanData?.precoDesconto}/mês`}
            </Button>
          </>
        )}
        
        {step === 3 && (
          <Button variant="contained" onClick={onClose} fullWidth>
            Começar a Usar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeDialog;
