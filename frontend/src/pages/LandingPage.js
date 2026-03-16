import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Avatar, useTheme, useMediaQuery, Accordion, AccordionSummary,
  AccordionDetails, Chip, AppBar, Toolbar
} from '@mui/material';
import {
  CheckCircle, WhatsApp, ExpandMore, Schedule,
  NotificationsActive, TrendingUp, Login as LoginIcon,
  SentimentVeryDissatisfied, PhoneDisabled, HourglassEmpty
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const WppBubble = ({ from, text, time }) => (
  <Box sx={{ display: 'flex', justifyContent: from === 'clinic' ? 'flex-end' : 'flex-start', mb: 1 }}>
    <Box sx={{
      maxWidth: '80%',
      bgcolor: from === 'clinic' ? '#dcf8c6' : '#fff',
      borderRadius: from === 'clinic' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
      px: 1.5, py: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
    }}>
      {from === 'clinic' && (
        <Typography variant="caption" sx={{ color: '#128C7E', fontWeight: 700, display: 'block', mb: 0.3 }}>
          Clínica Bella Vita
        </Typography>
      )}
      <Typography variant="body2" sx={{ color: '#111', whiteSpace: 'pre-line', fontSize: '0.82rem' }}>
        {text}
      </Typography>
      <Typography variant="caption" sx={{ color: '#999', display: 'block', textAlign: 'right', mt: 0.3 }}>
        {time} ✓✓
      </Typography>
    </Box>
  </Box>
);

const WhatsAppDemo = () => (
  <Box sx={{ bgcolor: '#e5ddd5', borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxWidth: 340, mx: 'auto' }}>
    <Box sx={{ bgcolor: '#075E54', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: '#25D366', width: 36, height: 36, fontSize: 14 }}>CB</Avatar>
      <Box>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Clínica Bella Vita</Typography>
        <Typography sx={{ color: '#ccc', fontSize: '0.72rem' }}>online</Typography>
      </Box>
    </Box>
    <Box sx={{ p: 1.5, minHeight: 280 }}>
      <WppBubble from="clinic" time="08:00" text={"Olá, *Maria*! 👋\n\nSua consulta está confirmada:\n📅 *Amanhã, 14h00*\n👩‍⚕️ Dra. Ana Silva\n\nVocê confirma sua presença?"} />
      <WppBubble from="patient" time="08:03" text="Sim, confirmo! 👍" />
      <WppBubble from="clinic" time="08:03" text={"Ótimo! 🎉 Te esperamos amanhã.\nSe precisar remarcar, é só responder aqui. 😊"} />
      <Box sx={{ textAlign: 'center', my: 1.5 }}>
        <Chip label="1h antes da consulta" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.08)', fontSize: '0.7rem' }} />
      </Box>
      <WppBubble from="clinic" time="13:00" text={"⏰ *Lembrete*\n\nMaria, sua consulta é em *1 hora*!\n📍 Rua das Flores, 123\n\nBoa tarde! 🌟"} />
    </Box>
  </Box>
);

const painPoints = [
  { icon: SentimentVeryDissatisfied, iconColor: '#e53935', title: 'Paciente marcou, mas não veio', description: 'Você só descobriu na hora. A agenda ficou vazia. A consulta, perdida.' },
  { icon: PhoneDisabled, iconColor: '#e53935', title: 'WhatsApp virou bagunça', description: 'Mensagens de agendamento misturadas com tudo. Ninguém acha mais nada.' },
  { icon: HourglassEmpty, iconColor: '#e53935', title: 'Secretária liga pra confirmar um por um', description: 'Horas do dia gastas em ligações que poderiam estar em outras tarefas.' },
];

const howItWorks = [
  { icon: <Schedule sx={{ fontSize: 32, color: 'primary.main' }} />, step: '01', title: 'Paciente agenda', description: 'Pelo link da clínica, pelo WhatsApp ou no sistema. Em segundos.' },
  { icon: <WhatsApp sx={{ fontSize: 32, color: '#25D366' }} />, step: '02', title: 'Confirmação automática', description: 'Mensagem vai na hora pelo seu próprio WhatsApp da clínica.' },
  { icon: <NotificationsActive sx={{ fontSize: 32, color: '#ff9800' }} />, step: '03', title: 'Lembrete 24h antes', description: 'Paciente recebe lembrete. Pode confirmar ou remarcar ali mesmo.' },
  { icon: <TrendingUp sx={{ fontSize: 32, color: '#4caf50' }} />, step: '04', title: 'Faltas despencam', description: 'Clínicas relatam redução de 60–80% nas faltas no primeiro mês.' },
];

const testimonials = [
  { name: 'Dra. Ana Paula', clinic: 'Clínica Bella Vita — SP', avatar: 'A', color: '#e91e63', metric: '−75% de faltas', quote: 'Antes eu perdia em média 8 consultas por mês. Agora são 1 ou 2 no máximo. Só com isso já paguei o sistema por 3 anos.' },
  { name: 'Carlos (recepcionista)', clinic: 'Espaço Saúde & Bem-Estar — RJ', avatar: 'C', color: '#1976d2', metric: '2h/dia economizadas', quote: 'Eu passava 2 horas por dia só confirmando consulta por telefone. Hoje esse tempo é zero. O sistema faz tudo.' },
  { name: 'Dra. Fernanda Costa', clinic: 'Fisio Movimento — BH', avatar: 'F', color: '#388e3c', metric: 'ROI no 1º mês', quote: 'O preço é ridiculamente justo. Eu recupero o valor do plano na primeira consulta que seria falta e não foi.' },
];

const faqs = [
  { q: 'Precisa de WhatsApp Business?', a: 'Não. Funciona com seu WhatsApp normal ou Business. Você conecta o número da clínica uma vez escaneando um QR Code e pronto.' },
  { q: 'Quanto tempo leva pra configurar?', a: 'Em média 15 minutos. Você cria a conta, conecta o WhatsApp e já pode cadastrar os primeiros agendamentos. Sem instalação, sem técnico.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Os dados ficam isolados por clínica, com criptografia em trânsito e em repouso. Em conformidade com a LGPD.' },
  { q: 'E se eu quiser cancelar?', a: 'Cancela quando quiser, sem multa, sem burocracia. Você exporta todos os seus dados antes de sair.' },
  { q: 'Funciona para qualquer tipo de clínica?', a: 'Sim. Estética, fisioterapia, psicologia, odontologia, clínica médica — qualquer profissional de saúde que trabalha com agendamentos.' },
];

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(false);

  const goRegister = (plano = 'starter') => navigate(`/register?plan=${plano}`);
  const goLogin   = () => navigate('/login');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>

      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 'lg', width: '100%', mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: 'primary.main', letterSpacing: -0.5 }}>AltClinic</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>Já tem conta?</Typography>
            <Button variant="outlined" size="small" startIcon={<LoginIcon />} onClick={goLogin}>Entrar</Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box sx={(t) => ({ pt: { xs: 7, md: 10 }, pb: { xs: 6, md: 10 }, background: `linear-gradient(160deg, ${t.palette.primary.main}12 0%, ${t.palette.secondary.main}0a 100%)`, bgcolor: '#fafafa' })}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip label="Novo: lembrete automático 1h antes da consulta" size="small" sx={{ mb: 2.5, bgcolor: '#e3f2fd', color: 'primary.dark', fontWeight: 600 }} />
              <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" fontWeight={800} lineHeight={1.2} gutterBottom>
                Chega de perder consultas porque o paciente{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>esqueceu</Box>
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3.5, fontWeight: 400, lineHeight: 1.6 }}>
                AltClinic confirma e lembra seus pacientes automaticamente pelo WhatsApp.
                Sem ligar, sem copiar mensagem, sem falta surpresa.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2.5 }}>
                <Button variant="contained" size="large" onClick={goRegister} sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1rem', borderRadius: 2, boxShadow: 3 }}>
                  Testar 14 dias grátis
                </Button>
                <Button variant="outlined" size="large" onClick={goLogin} sx={{ px: 3, py: 1.5, fontWeight: 600, borderRadius: 2 }}>
                  Já tenho conta
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {['Sem cartão de crédito', 'Pronto em 15 minutos', 'Cancele quando quiser'].map(t => (
                  <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>{t}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex' }}>
                  {['#e91e63','#1976d2','#388e3c','#f57c00','#7b1fa2'].map((c, i) => (
                    <Avatar key={i} sx={{ width: 28, height: 28, fontSize: 11, bgcolor: c, ml: i > 0 ? -0.8 : 0, border: '2px solid #fff', zIndex: 5 - i }}>
                      {['D','C','F','M','R'][i]}
                    </Avatar>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>+320 clínicas</Box> já usam o AltClinic
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <WhatsAppDemo />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Números */}
      <Box sx={{ bgcolor: 'primary.main', py: 2.5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 3, md: 8 } }}>
            {[{ value: '+1.200', label: 'consultas confirmadas/mês' }, { value: '−70%', label: 'de faltas em média' }, { value: '15 min', label: 'pra configurar tudo' }].map(({ value, label }) => (
              <Box key={label} sx={{ textAlign: 'center', color: '#fff' }}>
                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Dores */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>Você vive alguma dessas situações?</Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 6, fontWeight: 400 }}>
          Se sim, você está perdendo dinheiro todo dia — e tem uma solução a partir de R$149/mês.
        </Typography>
        <Grid container spacing={3}>
          {painPoints.map(({ icon: Icon, iconColor, title, description }) => (
            <Grid item xs={12} md={4} key={title}>
              <Card variant="outlined" sx={{ p: 3, height: '100%', borderColor: '#ffcdd2', borderWidth: 2, borderRadius: 3, bgcolor: '#fff9f9' }}>
                <Box sx={{ mb: 2 }}>
                  <Icon sx={{ fontSize: 40, color: iconColor }} />
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>{title}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{description}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Como funciona */}
      <Box sx={{ bgcolor: '#f8fafb', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>Como funciona</Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 7, fontWeight: 400 }}>
            Do agendamento ao lembrete — tudo acontece sozinho.
          </Typography>
          <Grid container spacing={4}>
            {howItWorks.map(({ icon, step, title, description }) => (
              <Grid item xs={12} sm={6} md={3} key={step}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    {icon}
                  </Box>
                  <Typography variant="overline" color="primary" fontWeight={700}>{step}</Typography>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{title}</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{description}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 6 }}><WhatsAppDemo /></Box>
        </Container>
      </Box>

      {/* Depoimentos */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>Clínicas reais, resultados reais</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>Sem exagero, sem promessa vazia.</Typography>
        <Grid container spacing={3}>
          {testimonials.map(({ name, clinic, avatar, color, quote, metric }) => (
            <Grid item xs={12} md={4} key={name}>
              <Card sx={{ p: 3, height: '100%', borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
                <Chip label={metric} size="small" sx={{ alignSelf: 'flex-start', mb: 2, bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
                <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1, fontStyle: 'italic', lineHeight: 1.7, mb: 3 }}>"{quote}"</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: color, width: 40, height: 40, fontWeight: 700 }}>{avatar}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{name}</Typography>
                    <Typography variant="caption" color="text.secondary">{clinic}</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Preço — 3 Planos */}
      <Box sx={{ bgcolor: '#f0f7ff', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>Planos para toda clínica</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 5 }}>
            14 dias grátis em qualquer plano. Sem cartão de crédito.
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {[
              {
                nome: 'Starter', preco: 149, destaque: false,
                descricao: 'Para clínica solo ou autônomo',
                features: ['1 médico', 'até 500 pacientes', 'WhatsApp + confirmações', 'CRM básico', 'Prontuário eletrônico', 'Suporte por email'],
              },
              {
                nome: 'Pro', preco: 349, destaque: true,
                descricao: 'Para clínicas em crescimento',
                features: ['até 5 médicos', 'até 2.000 pacientes', 'WhatsApp multiagente', 'CRM completo + funil', 'Inbox centralizado', 'Bot configurável', 'NPS automático', 'Suporte prioritário'],
              },
              {
                nome: 'Enterprise', preco: 799, destaque: false,
                descricao: 'Para redes e multi-unidades',
                features: ['Médicos ilimitados', 'Pacientes ilimitados', 'Multi-unidade', 'API completa', 'White-label', 'Dashboard consolidado', 'Suporte dedicado'],
              },
            ].map(({ nome, preco, destaque, descricao, features }) => (
              <Grid item xs={12} md={4} key={nome}>
                <Card sx={{
                  borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column',
                  boxShadow: destaque ? '0 8px 40px rgba(0,0,0,0.18)' : '0 4px 20px rgba(0,0,0,0.08)',
                  border: destaque ? '2px solid' : '1px solid',
                  borderColor: destaque ? 'primary.main' : 'divider',
                  position: 'relative', overflow: 'visible',
                }}>
                  {destaque && (
                    <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', bgcolor: 'primary.main', color: '#fff', px: 2, py: 0.5, borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      MAIS POPULAR
                    </Box>
                  )}
                  <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight={800} gutterBottom>{nome}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{descricao}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 3 }}>
                      <Typography variant="body1" color="text.secondary">R$</Typography>
                      <Typography variant="h3" fontWeight={800} color={destaque ? 'primary.main' : 'text.primary'} lineHeight={1}>{preco}</Typography>
                      <Typography variant="body2" color="text.secondary">/mês</Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, mb: 3 }}>
                      {features.map(f => (
                        <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 17 }} />
                          <Typography variant="body2">{f}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      variant={destaque ? 'contained' : 'outlined'}
                      size="large" fullWidth onClick={() => goRegister(nome.toLowerCase())}
                      sx={{ py: 1.4, fontWeight: 700, borderRadius: 2 }}
                    >
                      Testar 14 dias grátis
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" sx={{ mt: 3 }}>
            Sem cartão • Cancele quando quiser • Dados preservados por 30 dias após cancelamento
          </Typography>
        </Container>
      </Box>

      {/* FAQ */}
      <Container maxWidth="md" sx={{ py: { xs: 7, md: 10 } }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>Perguntas frequentes</Typography>
        <Box sx={{ mt: 4 }}>
          {faqs.map(({ q, a }, i) => (
            <Accordion key={i} expanded={expandedFaq === i} onChange={() => setExpandedFaq(expandedFaq === i ? false : i)}
              sx={{ mb: 1.5, borderRadius: '12px !important', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' }, boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3 }}>
                <Typography fontWeight={600}>{q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pt: 0 }}>
                <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>

      {/* CTA Final */}
      <Box sx={(t) => ({ background: `linear-gradient(135deg, ${t.palette.secondary.dark} 0%, ${t.palette.primary.dark} 100%)`, py: { xs: 8, md: 12 }, textAlign: 'center' })}>
        <Container maxWidth="md">
          <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={800} color="#fff" gutterBottom lineHeight={1.3}>
            Comece hoje. Veja a diferença<br />na primeira semana.
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontWeight: 400 }}>
            14 dias grátis. Sem cartão. Sem compromisso.
          </Typography>
          <Button variant="contained" size="large" onClick={goRegister}
            sx={{ bgcolor: '#fff', color: 'primary.main', px: 6, py: 2, fontWeight: 800, fontSize: '1.1rem', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', '&:hover': { bgcolor: '#f5f5f5' } }}>
            Criar minha conta grátis
          </Button>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
            Pronto em 15 minutos • Suporte por WhatsApp
          </Typography>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0d1117', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>AltClinic</Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>© 2026 AltClinic. Todos os direitos reservados.</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" sx={{ color: '#666', cursor: 'pointer' }}>Privacidade</Typography>
              <Typography variant="caption" sx={{ color: '#666', cursor: 'pointer' }}>Termos</Typography>
              <Typography variant="caption" sx={{ color: '#25D366', cursor: 'pointer', fontWeight: 700 }} onClick={goLogin}>Entrar</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default LandingPage;
