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
        preco: 'R$ 149,00',
        precoNumerico: 149,
        periodo: '/mês',
        maxMedicos: 1,
        maxPacientes: 500,
        features: [
          '1 médico',
          'Até 500 pacientes',
          'Agenda completa',
          'WhatsApp Business',
          'Relatórios básicos',
          'Suporte por email'
        ],
        popular: false
      },
      pro: {
        nome: 'Pro',
        preco: 'R$ 349,00',
        precoNumerico: 349,
        periodo: '/mês',
        maxMedicos: 5,
        maxPacientes: 2000,
        features: [
          'Até 5 médicos',
          'Até 2.000 pacientes',
          'Agenda multi-profissional',
          'WhatsApp Business',
          'CRM de pacientes',
          'Relatórios avançados',
          'Suporte prioritário'
        ],
        popular: true
      },
      enterprise: {
        nome: 'Enterprise',
        preco: 'R$ 799,00',
        precoNumerico: 799,
        periodo: '/mês',
        maxMedicos: -1,
        maxPacientes: -1,
        features: [
          'Médicos ilimitados',
          'Pacientes ilimitados',
          'Multi-unidades',
          'WhatsApp Business',
          'CRM avançado',
          'Relatórios personalizados',
          'API completa',
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

    const limites = {
      trial:      { maxMedicos: 1,  maxPacientes: 100  },
      starter:    { maxMedicos: 1,  maxPacientes: 500  },
      pro:        { maxMedicos: 5,  maxPacientes: 2000 },
      enterprise: { maxMedicos: -1, maxPacientes: -1   }
    };
    const plano = tenant.plano || 'starter';
    const lim = limites[plano] || limites.starter;

    const [medRow, pacRow] = await Promise.all([
      req.db.get('SELECT COUNT(*) AS total FROM usuarios WHERE tenant_id = $1 AND status = $2', [tenantId, 'active']),
      req.db.get('SELECT COUNT(*) AS total FROM pacientes WHERE tenant_id = $1 AND status = $2', [tenantId, 'ativo'])
    ]);

    const qtdMedicos   = parseInt(medRow?.total ?? 0);
    const qtdPacientes = parseInt(pacRow?.total ?? 0);

    const pct = (cur, lim) => lim === -1 ? 0 : Math.round((cur / lim) * 100);

    const usage = {
      medicos:   { current: qtdMedicos,   limit: lim.maxMedicos,   percentage: pct(qtdMedicos,   lim.maxMedicos)   },
      pacientes: { current: qtdPacientes, limit: lim.maxPacientes, percentage: pct(qtdPacientes, lim.maxPacientes) }
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
