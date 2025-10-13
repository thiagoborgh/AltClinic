const express = require('express');
const router = express.Router();
const billingManager = require('../services/BillingManager');
// const { Tenant } = require('../models'); // TODO: configurar modelos
const { authenticateToken } = require('../middleware/auth');

/**
 * Rotas para Sistema de Cobrança
 */

/**
 * GET /api/billing/plans
 * Listar planos disponíveis
 */
router.get('/plans', async (req, res) => {
  try {
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
        popular: false
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
        popular: false
      }
    };

    res.json({ success: true, plans });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/checkout
 * Criar sessão de checkout
 */
router.post('/checkout', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Checkout em desenvolvimento - Stripe não configurado',
      checkoutUrl: '/billing?dev=true'
    });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
});

/**
 * GET /api/billing/info
 * Obter informações de cobrança do tenant
 */
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const billingInfo = await billingManager.getBillingInfo(tenant);
    
    res.json({ success: true, billing: billingInfo });
  } catch (error) {
    console.error('Erro ao obter informações de cobrança:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/billing/usage
 * Obter informações de uso do tenant
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Mock de dados de uso - em produção, calcular baseado no banco
    const usage = {
      users: {
        current: 2,
        limit: tenant.plano === 'starter' ? 3 : tenant.plano === 'professional' ? 10 : 999,
        percentage: tenant.plano === 'starter' ? 67 : tenant.plano === 'professional' ? 20 : 1
      },
      patients: {
        current: 45,
        limit: tenant.plano === 'starter' ? 500 : tenant.plano === 'professional' ? 2000 : 99999,
        percentage: tenant.plano === 'starter' ? 9 : tenant.plano === 'professional' ? 2 : 0
      },
      messages: {
        current: 1250,
        limit: tenant.plano === 'starter' ? 1000 : tenant.plano === 'professional' ? 5000 : 99999,
        percentage: tenant.plano === 'starter' ? 125 : tenant.plano === 'professional' ? 25 : 1
      },
      storage: {
        current: 2.1,
        limit: tenant.plano === 'starter' ? 5 : tenant.plano === 'professional' ? 25 : 100,
        percentage: tenant.plano === 'starter' ? 42 : tenant.plano === 'professional' ? 8 : 2
      }
    };

    res.json({ success: true, usage });
  } catch (error) {
    console.error('Erro ao obter informações de uso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/portal
 * Criar sessão do portal de cobrança
 */
router.post('/portal', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${tenant.slug}.altclinic.com.br`
      : `http://localhost:3001`;

    const session = await billingManager.createBillingPortal(
      tenant,
      `${baseUrl}/billing`
    );

    res.json({ 
      success: true, 
      portalUrl: session.url 
    });
  } catch (error) {
    console.error('Erro ao criar portal de cobrança:', error);
    res.status(500).json({ error: 'Erro ao acessar portal de cobrança' });
  }
});

/**
 * POST /api/billing/cancel
 * Cancelar assinatura
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { immediate = false } = req.body;
    const tenantId = req.user.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    await billingManager.cancelSubscription(tenant, immediate);

    res.json({ 
      success: true, 
      message: immediate 
        ? 'Assinatura cancelada imediatamente'
        : 'Assinatura será cancelada no final do período atual'
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

/**
 * POST /webhook/stripe
 * Webhook do Stripe para eventos de cobrança
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(
      req.body, 
      sig, 
      endpointSecret
    );
  } catch (err) {
    console.error('Erro na verificação do webhook:', err.message);
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

/**
 * GET /api/billing/usage
 * Verificar uso atual vs limites do plano
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const planConfig = billingManager.plansConfig[tenant.plano];
    
    // Calcular uso atual
    const usage = {
      usuarios: {
        atual: await require('../models/UsuarioMultiTenant').count({
          where: { tenantId: tenant.id }
        }),
        limite: planConfig.features.maxUsuarios,
        percentual: 0
      },
      pacientes: {
        atual: 0, // TODO: implementar contagem de pacientes
        limite: planConfig.features.maxPacientes,
        percentual: 0
      }
    };

    // Calcular percentuais
    if (usage.usuarios.limite > 0) {
      usage.usuarios.percentual = Math.round(
        (usage.usuarios.atual / usage.usuarios.limite) * 100
      );
    }

    if (usage.pacientes.limite > 0) {
      usage.pacientes.percentual = Math.round(
        (usage.pacientes.atual / usage.pacientes.limite) * 100
      );
    }

    res.json({ 
      success: true, 
      usage,
      plano: tenant.plano,
      features: planConfig.features
    });
  } catch (error) {
    console.error('Erro ao obter uso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
