const express = require('express');
const router = express.Router();
const billingManager = require('../services/BillingManager');
const { authenticateToken } = require('../middleware/auth');
const { getMasterDb } = require('../database/MultiTenantPostgres');

/**
 * Rotas para Sistema de Cobrança - AltClinic
 *
 * Modelo: R$ 79,90/mês base (1 profissional incluído)
 *         + R$ 19,90/mês por profissional adicional
 */

/**
 * GET /api/billing/plans
 * Retorna o modelo de precificação do AltClinic
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    pricing: {
      modelo: 'por_profissional',
      precoBase: 79.90,
      precoBaseFormatado: 'R$ 79,90',
      precoPorProfissionalAdicional: 19.90,
      precoPorProfissionalAdicionalFormatado: 'R$ 19,90',
      descricao: 'R$ 79,90/mês · inclui 1 profissional · +R$ 19,90 por profissional adicional',
      exemplos: [
        { profissionais: 1, valorTotal: 79.90, formatado: 'R$ 79,90/mês' },
        { profissionais: 2, valorTotal: 99.80, formatado: 'R$ 99,80/mês' },
        { profissionais: 3, valorTotal: 119.70, formatado: 'R$ 119,70/mês' },
        { profissionais: 5, valorTotal: 159.50, formatado: 'R$ 159,50/mês' }
      ],
      trial: {
        duracao: 14,
        descricao: '14 dias grátis, sem cartão de crédito'
      }
    }
  });
});

/**
 * GET /api/billing/summary
 * Retorna o resumo de cobrança do tenant atual com valor calculado
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant não identificado' });
    }

    // Contar profissionais ativos do tenant
    let qtdProfissionais = 1;
    try {
      const row = await req.db.get(
        "SELECT COUNT(*) as total FROM medicos WHERE tenant_id = $1 AND (status = 'ativo' OR status IS NULL)",
        [tenantId]
      );
      qtdProfissionais = Math.max(1, row?.total || 0);
    } catch (_) { /* usa o default 1 */ }

    const summary = billingManager.getPlanSummary(qtdProfissionais);

    res.json({
      success: true,
      summary,
      _note: 'Pagamento via Stripe pendente de ativação'
    });
  } catch (error) {
    console.error('Erro ao obter resumo de cobrança:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter resumo' });
  }
});

/**
 * POST /api/billing/checkout
 * Criar sessão de checkout no Stripe
 */
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant não identificado' });
    }

    const origin = req.headers.origin || (process.env.FRONTEND_URL || 'http://localhost:3000');
    const successUrl = origin + '/billing?status=success';
    const cancelUrl  = origin + '/billing?status=canceled';

    // Contar profissionais ativos para calcular valor
    let qtdProfissionais = 1;
    try {
      const row = await req.db.get(
        "SELECT COUNT(*) as total FROM medicos WHERE tenant_id = $1 AND (status = 'ativo' OR status IS NULL)",
        [tenantId]
      );
      qtdProfissionais = Math.max(1, (row && row.total) || 0);
    } catch (_) { /* usa o default 1 */ }

    const session = await billingManager.createCheckoutSession({
      tenantId, qtdProfissionais, successUrl, cancelUrl
    });

    res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    res.status(500).json({ success: false, error: 'Erro ao iniciar checkout: ' + error.message });
  }
});

/**
 * GET /api/billing/info
 * Informações de cobrança do tenant
 */
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    let billingStatus = 'trial';
    let billingData = {};

    if (tenantId) {
      try {
        const masterDb = getMasterDb();
        const tenant = await masterDb.get('SELECT status, billing FROM tenants WHERE id = $1', [tenantId]);
        if (tenant) {
          billingStatus = tenant.status || 'trial';
          billingData = tenant.billing || {};
        }
      } catch (_) {}
    }

    res.json({
      success: true,
      billing: {
        status: billingStatus,
        billing_status: billingData.billing_status || billingStatus,
        plano: billingData.plan || 'altclinic',
        modelo: 'por_profissional',
        precoBase: 79.90,
        precoPorProfissionalAdicional: 19.90,
        stripe_customer_id: billingData.stripe_customer_id || null,
        last_payment_at: billingData.last_payment_at || null
      }
    });
  } catch (error) {
    console.error('Erro ao obter informacoes de cobranca:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/portal
 * Portal de cobrança (Stripe pendente)
 */
router.post('/portal', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant não identificado' });
    }
    const returnUrl = (req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000') + '/billing';
    const session = await billingManager.createBillingPortal(tenantId, returnUrl);
    res.json({ success: true, portalUrl: session.url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/billing/cancel
 * Cancelar assinatura
 */
router.post('/cancel', authenticateToken, (req, res) => {
  res.json({
    success: false,
    message: 'Para cancelar sua assinatura, entre em contato: contato@altclinic.com.br'
  });
});

/**
 * POST /webhook/stripe
 * Webhook do Stripe para eventos de cobrança
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ error: 'Stripe não configurado' });
  }

  let event;
  try {
    event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(
      req.body, sig, endpointSecret
    );
  } catch (err) {
    console.error('Erro na verificação do webhook Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await billingManager.processWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

