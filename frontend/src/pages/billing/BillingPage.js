import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  Chip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  CheckCircle,
  Person,
  Add,
  Email,
  CreditCard,
  OpenInNew
} from '@mui/icons-material';
import api from '../../services/api';

const PLANOS = {
  starter:    { nome: 'Starter',    preco: 149, maxMedicos: 1,  maxPacientes: 500  },
  pro:        { nome: 'Pro',        preco: 349, maxMedicos: 5,  maxPacientes: 2000 },
  enterprise: { nome: 'Enterprise', preco: 799, maxMedicos: -1, maxPacientes: -1   },
};

function formatarReais(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const BillingPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingStatus, setBillingStatus] = useState('trial');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(null); // 'success' | 'canceled' | null

  useEffect(() => {
    // Detectar retorno do checkout pelo query param
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success' || status === 'canceled') {
      setCheckoutStatus(status);
      window.history.replaceState({}, '', window.location.pathname);
    }
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await api.get('/billing/summary');
      if (response.data.success) {
        setSummary(response.data.summary);
      }
      const infoResponse = await api.get('/billing/info');
      if (infoResponse.data.success) {
        setBillingStatus(infoResponse.data.billing?.status || 'trial');
      }
    } catch (error) {
      // fallback: exibe com 1 profissional
      setSummary({
        qtdProfissionais: 1,
        valorTotal: PRECO_BASE,
        valorBase: PRECO_BASE,
        profissionaisAdicionais: 0,
        valorAdicionais: 0,
        precoPorProfissionalAdicional: PRECO_POR_PROFISSIONAL
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await api.post('/billing/checkout');
      if (response.data.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      alert('Erro ao iniciar o pagamento. Tente novamente ou entre em contato com o suporte.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setCheckoutLoading(true);
    try {
      const response = await api.post('/billing/portal');
      if (response.data.success && response.data.portalUrl) {
        window.location.href = response.data.portalUrl;
      }
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      alert('Erro ao abrir portal de assinatura. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const map = { trial: 'Trial', active: 'Ativo', past_due: 'Pendente', canceled: 'Cancelado' };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = { trial: 'info', active: 'success', past_due: 'warning', canceled: 'error' };
    return map[status] || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const qtd = summary?.qtdProfissionais || 1;
  const valorTotal = calcularValor(qtd);
  const adicionais = Math.max(0, qtd - 1);

  // Exemplos de preço para o simulador
  const simulador = [1, 2, 3, 4, 5].map(n => ({
    qtd: n,
    valor: calcularValor(n),
    atual: n === qtd
  }));

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Assinatura
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Plano AltClinic · Modelo por profissional
      </Typography>

      {checkoutStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setCheckoutStatus(null)}>
          Pagamento realizado com sucesso! Sua assinatura está ativa.
        </Alert>
      )}
      {checkoutStatus === 'canceled' && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setCheckoutStatus(null)}>
          O pagamento foi cancelado. Você ainda está no período de trial.
        </Alert>
      )}

      {/* Status atual */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Plano Atual</Typography>
          <Chip label={getStatusLabel(billingStatus)} color={getStatusColor(billingStatus)} />
        </Box>

        {billingStatus === 'trial' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Você está no período de teste (14 dias grátis). Nenhum cartão de crédito necessário ainda.
          </Alert>
        )}

        {/* Cálculo do valor */}
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Plano base (1 profissional incluído)</TableCell>
              <TableCell align="right">{formatarReais(PRECO_BASE)}/mês</TableCell>
            </TableRow>
            {adicionais > 0 && (
              <TableRow>
                <TableCell>
                  {adicionais} profissional{adicionais > 1 ? 'is' : ''} adicional{adicionais > 1 ? 'is' : ''}
                  {' '}({formatarReais(PRECO_POR_PROFISSIONAL)} × {adicionais})
                </TableCell>
                <TableCell align="right">{formatarReais(summary?.valorAdicionais || adicionais * PRECO_POR_PROFISSIONAL)}/mês</TableCell>
              </TableRow>
            )}
            <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider', fontWeight: 'bold' } }}>
              <TableCell>
                <strong>Total mensal</strong>
                <Typography variant="caption" display="block" color="text.secondary">
                  {qtd} profissional{qtd > 1 ? 'is' : ''} cadastrado{qtd > 1 ? 's' : ''}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {formatarReais(valorTotal)}/mês
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap">
          {(billingStatus === 'trial' || billingStatus === 'suspended') && (
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={checkoutLoading ? <CircularProgress size={18} color="inherit" /> : <CreditCard />}
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              Assinar Agora
            </Button>
          )}
          {billingStatus === 'active' && (
            <Button
              variant="outlined"
              startIcon={<OpenInNew />}
              onClick={handlePortal}
              disabled={checkoutLoading}
            >
              Gerenciar Assinatura
            </Button>
          )}
          <Button
            variant={billingStatus === 'active' ? 'contained' : 'outlined'}
            startIcon={<Add />}
            onClick={() => { window.location.href = '/profissionais'; }}
          >
            Gerenciar Profissionais
          </Button>
          <Button
            variant="text"
            startIcon={<Email />}
            href="mailto:contato@altclinic.com.br"
          >
            Falar com suporte
          </Button>
        </Stack>
      </Paper>

      {/* O que está incluído */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>O que está incluído</Typography>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {[
            'Agenda ilimitada',
            'Pacientes ilimitados',
            'WhatsApp Business',
            'CRM e segmentação',
            'Relatórios',
            'Prontuários digitais',
            'Suporte por e-mail',
            'Atualizações incluídas'
          ].map(feature => (
            <Grid item xs={12} sm={6} key={feature}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Simulador de preço */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Simulador de preço</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          O valor da assinatura cresce conforme você adiciona profissionais.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={1}>
          {simulador.map(({ qtd: n, valor, atual }) => (
            <Grid item xs={6} sm={4} md key={n}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderColor: atual ? 'primary.main' : 'divider',
                  borderWidth: atual ? 2 : 1,
                  bgcolor: atual ? 'primary.50' : 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                  {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
                    <Person key={i} fontSize="small" color={atual ? 'primary' : 'disabled'} />
                  ))}
                  {n > 3 && <Typography variant="caption" color="text.secondary">+{n - 3}</Typography>}
                </Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  {n} profissional{n > 1 ? 'is' : ''}
                </Typography>
                <Typography variant="body1" fontWeight="bold" color={atual ? 'primary.main' : 'text.primary'}>
                  {formatarReais(valor)}
                </Typography>
                <Typography variant="caption" color="text.secondary">/mês</Typography>
                {atual && (
                  <Chip label="atual" size="small" color="primary" sx={{ mt: 0.5, display: 'block' }} />
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Alert severity="info" sx={{ mt: 2 }} icon={false}>
          <Typography variant="caption">
            <strong>Como funciona:</strong> R$ 79,90/mês base inclui 1 profissional.
            Cada profissional adicional acrescenta R$ 19,90/mês.
            O valor é ajustado automaticamente ao cadastrar ou remover profissionais.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default BillingPage;
