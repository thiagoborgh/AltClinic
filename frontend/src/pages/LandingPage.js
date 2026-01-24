import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CalendarToday,
  WhatsApp,
  CheckCircle,
  Star,
  TrendingDown,
  Security
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleStartTrial = () => {
    navigate('/register');
  };

  const benefits = [
    {
      icon: <CalendarToday color="primary" sx={{ fontSize: 40 }} />,
      title: 'Agenda Simples',
      description: 'Visualize sua agenda diária, semanal e mensal de forma intuitiva'
    },
    {
      icon: <WhatsApp color="success" sx={{ fontSize: 40 }} />,
      title: 'WhatsApp Integrado',
      description: 'Envie lembretes automáticos pelo seu próprio WhatsApp'
    },
    {
      icon: <TrendingDown color="error" sx={{ fontSize: 40 }} />,
      title: 'Menos Faltas',
      description: 'Reduza faltas com lembretes automáticos 24h antes dos agendamentos'
    },
    {
      icon: <Security color="warning" sx={{ fontSize: 40 }} />,
      title: 'Sem Pegadinhas',
      description: 'Sem contrato, sem taxas escondidas, cancele quando quiser'
    }
  ];

  const testimonials = [
    {
      name: 'Dra. Ana Silva',
      clinic: 'Clínica Bella Vita',
      text: '"Em poucos minutos consegui organizar minha agenda e os lembretes automáticos reduziram minhas faltas em 70%."',
      avatar: 'A'
    },
    {
      name: 'Dr. Carlos Santos',
      clinic: 'Centro Estético Harmonia',
      text: '"O sistema é simples e funciona perfeitamente. Meus pacientes adoram receber os lembretes no WhatsApp."',
      avatar: 'C'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                component="h1"
                gutterBottom
                fontWeight="bold"
              >
                Organize sua agenda e reduza faltas com lembretes automáticos no WhatsApp
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Tudo o que sua clínica de estética precisa para confirmar consultas, sem complicação e sem pagar caro.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleStartTrial}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 2
                  }}
                >
                  Comece agora e tenha sua agenda funcionando hoje mesmo
                </Button>
              </Box>

              <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                ✓ 15 dias grátis • ✓ Sem cartão de crédito • ✓ Cancele quando quiser
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/images/agenda-preview.png"
                alt="Preview da Agenda"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: 3,
                  display: { xs: 'none', md: 'block' }
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Value Proposition */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          component="h2"
          textAlign="center"
          gutterBottom
          fontWeight="bold"
          color="text.primary"
        >
          Em poucos minutos você já consegue organizar sua agenda e enviar lembretes automáticos para seus clientes.
        </Typography>

        <Typography
          variant="h6"
          textAlign="center"
          sx={{ mt: 2, mb: 6, color: 'text.secondary' }}
        >
          Chega de perder tempo ligando para confirmar consultas. Automatize tudo!
        </Typography>
      </Container>

      {/* Benefits */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="bold"
            color="text.primary"
          >
            Tudo que você precisa
          </Typography>

          <Grid container spacing={4} sx={{ mt: 4 }}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.3s ease'
                    }
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    {benefit.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          component="h2"
          textAlign="center"
          gutterBottom
          fontWeight="bold"
          color="text.primary"
        >
          Clínicas que já transformaram seus resultados
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {testimonial.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.clinic}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  "{testimonial.text}"
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} sx={{ color: 'warning.main' }} />
                  ))}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing */}
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 8 }}>
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="bold"
          >
            Preços Simples e Transparentes
          </Typography>

          <Card sx={{ mt: 4, bgcolor: 'background.paper', color: 'text.primary' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h3" color="primary" fontWeight="bold" gutterBottom>
                R$ 19,90<span style={{ fontSize: '1rem' }}>/mês</span>
              </Typography>

              <Typography variant="h6" gutterBottom>
                Para 1 profissional
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                R$ 9,90 por profissional adicional
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tudo incluído:
                </Typography>
                {[
                  'Agenda completa e intuitiva',
                  'WhatsApp integrado',
                  'Lembretes automáticos',
                  'Gestão de pacientes ilimitada',
                  'Relatórios financeiros',
                  'Suporte por email',
                  '15 dias grátis para testar'
                ].map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">{feature}</Typography>
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleStartTrial}
                sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
              >
                Começar Trial Grátis de 15 Dias
              </Button>

              <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                Sem cartão de crédito • Cancele quando quiser
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* CTA Final */}
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Pronto para transformar sua clínica?
          </Typography>

          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Junte-se a centenas de clínicas que já organizaram suas agendas e reduziram faltas.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleStartTrial}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: 2
            }}
          >
            Começar Agora - 15 Dias Grátis
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;