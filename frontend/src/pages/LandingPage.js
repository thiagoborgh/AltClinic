import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Avatar,
  Rating,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  People,
  Analytics,
  WhatsApp,
  Email,
  Phone,
  Security,
  MonetizationOn,
  ExpandMore,
  KeyboardArrowUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [openTrialDialog, setOpenTrialDialog] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [trialForm, setTrialForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    clinica: '',
    especialidade: ''
  });

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Planos disponíveis
  const planos = [
    {
      nome: 'Starter',
      preco: 'R$ 97',
      periodo: '/mês',
      descricao: 'Perfeito para começar',
      recursos: [
        'Até 3 usuários',
        'Agendamentos ilimitados',
        'WhatsApp integrado',
        'Relatórios básicos',
        'Suporte por email',
        'Backup automático'
      ],
      limitacoes: [
        'Sem integração avançada',
        'Relatórios limitados'
      ],
      popular: false,
      trial: true
    },
    {
      nome: 'Professional',
      preco: 'R$ 197',
      periodo: '/mês',
      descricao: 'Ideal para clínicas em crescimento',
      recursos: [
        'Até 10 usuários',
        'Agendamentos ilimitados',
        'WhatsApp + Email + SMS',
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
      popular: true,
      trial: true
    },
    {
      nome: 'Enterprise',
      preco: 'R$ 397',
      periodo: '/mês',
      descricao: 'Solução completa para grandes clínicas',
      recursos: [
        'Usuários ilimitados',
        'Agendamentos ilimitados',
        'Todos os canais de comunicação',
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
      popular: false,
      trial: true
    }
  ];

  // Depoimentos
  const depoimentos = [
    {
      nome: 'Dr. Carlos Silva',
      especialidade: 'Dermatologista',
      clinica: 'Clínica DermaCare',
      rating: 5,
      comentario: 'O Alt Clinic revolucionou nossa gestão. Reduzimos 70% das faltas e aumentamos nossa receita em 40%.',
      avatar: '/api/placeholder/64/64'
    },
    {
      nome: 'Dra. Ana Rodrigues',
      especialidade: 'Ortodontista',
      clinica: 'Sorrisos Perfeitos',
      rating: 5,
      comentario: 'Sistema intuitivo e completo. Nossa equipe se adaptou rapidamente e os pacientes adoram o WhatsApp.',
      avatar: '/api/placeholder/64/64'
    },
    {
      nome: 'Dr. Roberto Lima',
      especialidade: 'Cardiologista',
      clinica: 'CardioVida',
      rating: 5,
      comentario: 'Excelente custo-benefício. Em 6 meses já pagou o investimento com a redução de faltas.',
      avatar: '/api/placeholder/64/64'
    }
  ];

  // FAQ
  const faq = [
    {
      pergunta: 'Como funciona o período de teste gratuito?',
      resposta: 'Você tem 30 dias para testar todas as funcionalidades sem compromisso. Não cobramos cartão de crédito no cadastro.'
    },
    {
      pergunta: 'Posso migrar meus dados de outro sistema?',
      resposta: 'Sim! Nossa equipe oferece migração gratuita de dados de qualquer sistema anterior. O processo é rápido e seguro.'
    },
    {
      pergunta: 'O sistema funciona offline?',
      resposta: 'O Alt Clinic é baseado na nuvem, mas oferece funcionalidades offline básicas para situações de emergência.'
    },
    {
      pergunta: 'Há limite de agendamentos?',
      resposta: 'Não! Todos os planos incluem agendamentos ilimitados. Você paga apenas pelo número de usuários.'
    },
    {
      pergunta: 'Como funciona o suporte técnico?',
      resposta: 'Oferecemos suporte por email (Starter), chat (Professional) e telefone 24/7 (Enterprise). Todos com SLA garantido.'
    }
  ];

  const handleTrialSubmit = async () => {
    try {
      // Aqui você faria a chamada para criar o trial
      console.log('Criando trial:', trialForm);
      
      // Simular criação de tenant trial
      const response = await fetch('/api/tenants/trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trialForm)
      });

      if (response.ok) {
        const data = await response.json();
        // Redirecionar para o sistema com credenciais
        navigate(`/login?tenant=${data.slug}&trial=true`);
      }
    } catch (error) {
      console.error('Erro ao criar trial:', error);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header/Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Alt Clinic
              </Typography>
              <Typography variant="h5" gutterBottom color="rgba(255,255,255,0.9)">
                Sistema Completo de Gestão para Clínicas Estéticas
              </Typography>
              <Typography variant="h6" paragraph color="rgba(255,255,255,0.8)">
                Reduza 70% das faltas, automatize seu atendimento e aumente sua receita com nossa plataforma inteligente.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setOpenTrialDialog(true)}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 2,
                    mr: 2,
                    '&:hover': {
                      bgcolor: 'grey.100'
                    }
                  }}
                >
                  Teste Grátis 30 Dias
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 2,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                  onClick={() => document.getElementById('planos').scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver Planos
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/api/placeholder/600/400"
                alt="Alt Clinic Dashboard"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Funcionalidades Principais */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Tudo que sua clínica precisa em um só lugar
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Funcionalidades desenvolvidas especificamente para clínicas estéticas
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {[
            {
              icon: <Schedule />,
              titulo: 'Agendamento Inteligente',
              descricao: 'Sistema automatizado que confirma consultas via WhatsApp e reduz faltas em até 70%'
            },
            {
              icon: <WhatsApp />,
              titulo: 'WhatsApp Integrado',
              descricao: 'Envie lembretes, confirmações e promoções direto pelo WhatsApp Business'
            },
            {
              icon: <Analytics />,
              titulo: 'Relatórios Avançados',
              descricao: 'Dashboard completo com métricas de performance, faturamento e satisfação'
            },
            {
              icon: <People />,
              titulo: 'Gestão de Pacientes',
              descricao: 'Histórico completo, ficha de anamnese digital e acompanhamento de tratamentos'
            },
            {
              icon: <MonetizationOn />,
              titulo: 'Controle Financeiro',
              descricao: 'Faturamento, cobrança automática e gestão de inadimplência integrada'
            },
            {
              icon: <Security />,
              titulo: 'Segurança Total',
              descricao: 'Dados protegidos com criptografia e backup automático na nuvem'
            }
          ].map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {feature.titulo}
                </Typography>
                <Typography color="text.secondary">
                  {feature.descricao}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Planos e Preços */}
      <Box id="planos" sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Planos que cabem no seu bolso
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" paragraph>
            Escolha o plano ideal para o tamanho da sua clínica
          </Typography>

          <Grid container spacing={4} sx={{ mt: 4 }}>
            {planos.map((plano, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: plano.popular ? '3px solid' : '1px solid',
                    borderColor: plano.popular ? 'primary.main' : 'divider',
                    '&:hover': {
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {plano.popular && (
                    <Chip
                      label="MAIS POPULAR"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      {plano.nome}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h3" component="span" color="primary">
                        {plano.preco}
                      </Typography>
                      <Typography variant="h6" component="span" color="text.secondary">
                        {plano.periodo}
                      </Typography>
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {plano.descricao}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <List dense>
                      {plano.recursos.map((recurso, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={recurso} />
                        </ListItem>
                      ))}
                      {plano.limitacoes.map((limitacao, idx) => (
                        <ListItem key={`lim-${idx}`} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Cancel color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={limitacao}
                            sx={{ color: 'text.secondary' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={plano.popular ? "contained" : "outlined"}
                      size="large"
                      onClick={() => setOpenTrialDialog(true)}
                    >
                      {plano.trial ? 'Testar Grátis' : 'Contratar'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              🎁 Oferta Especial de Lançamento
            </Typography>
            <Typography>
              <strong>30 dias grátis</strong> para testar + <strong>30% de desconto</strong> nos primeiros 3 meses. 
              Sem compromisso, cancele quando quiser.
            </Typography>
          </Alert>
        </Container>
      </Box>

      {/* Depoimentos */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          O que nossos clientes dizem
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {depoimentos.map((depoimento, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', p: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar src={depoimento.avatar} sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h6">{depoimento.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {depoimento.especialidade}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {depoimento.clinica}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Rating value={depoimento.rating} readOnly sx={{ mb: 2 }} />
                  
                  <Typography variant="body1">
                    "{depoimento.comentario}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Perguntas Frequentes
          </Typography>

          <Box sx={{ mt: 4 }}>
            {faq.map((item, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">{item.pergunta}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{item.resposta}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Final */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Pronto para revolucionar sua clínica?
          </Typography>
          <Typography variant="h6" paragraph>
            Junte-se a mais de 1.000 clínicas que já transformaram seus resultados com o Alt Clinic
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setOpenTrialDialog(true)}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            Começar Teste Grátis Agora
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" gutterBottom>
                Alt Clinic
              </Typography>
              <Typography paragraph>
                A solução completa para gestão de clínicas estéticas. 
                Mais eficiência, menos faltas, maior faturamento.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Contato
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ mr: 1 }} />
                <Typography>(11) 99999-9999</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email sx={{ mr: 1 }} />
                <Typography>contato@altclinic.com.br</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Links Úteis
              </Typography>
              <Typography component="div">
                <Box component="a" href="#" sx={{ color: 'inherit', display: 'block', mb: 1 }}>
                  Política de Privacidade
                </Box>
                <Box component="a" href="#" sx={{ color: 'inherit', display: 'block', mb: 1 }}>
                  Termos de Uso
                </Box>
                <Box component="a" href="#" sx={{ color: 'inherit', display: 'block', mb: 1 }}>
                  Suporte
                </Box>
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, bgcolor: 'grey.700' }} />
          <Typography align="center" color="grey.400">
            © 2025 Alt Clinic. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>

      {/* Dialog de Trial */}
      <Dialog 
        open={openTrialDialog} 
        onClose={() => setOpenTrialDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Comece seu teste gratuito de 30 dias
        </DialogTitle>
        <DialogContent>
          <Typography paragraph color="text.secondary">
            Preencha os dados abaixo e tenha acesso completo ao Alt Clinic por 30 dias, sem compromisso.
          </Typography>
          
          <TextField
            fullWidth
            label="Nome completo"
            value={trialForm.nome}
            onChange={(e) => setTrialForm({...trialForm, nome: e.target.value})}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={trialForm.email}
            onChange={(e) => setTrialForm({...trialForm, email: e.target.value})}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Telefone"
            value={trialForm.telefone}
            onChange={(e) => setTrialForm({...trialForm, telefone: e.target.value})}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Nome da clínica"
            value={trialForm.clinica}
            onChange={(e) => setTrialForm({...trialForm, clinica: e.target.value})}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Especialidade"
            value={trialForm.especialidade}
            onChange={(e) => setTrialForm({...trialForm, especialidade: e.target.value})}
            margin="normal"
            placeholder="Ex: Estética, Dermatologia, Odontologia..."
          />
          
          <Alert severity="success" sx={{ mt: 2 }}>
            ✅ 30 dias grátis • ✅ Sem cartão de crédito • ✅ Cancele quando quiser
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenTrialDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleTrialSubmit}
            disabled={!trialForm.nome || !trialForm.email || !trialForm.telefone || !trialForm.clinica}
          >
            Começar Teste Grátis
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={scrollToTop}
        >
          <KeyboardArrowUp />
        </Fab>
      )}
    </Box>
  );
};

export default LandingPage;
