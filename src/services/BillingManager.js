const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Sistema de Cobrança Multi-Tenant SaaS - AltClinic
 *
 * Tabela de preços:
 *   Starter    R$ 149/mês — 1 médico,  até 500 pacientes
 *   Pro        R$ 349/mês — até 5,     até 2.000 pacientes
 *   Enterprise R$ 799/mês — ilimitado, ilimitado
 */
class BillingManager {
  constructor() {
    this.stripe = stripe;
    this.isStripeEnabled = !!stripe;
    this.plansConfig = {
      trial: {
        nome: 'Trial', preco: 0, periodo: 'trial', duracao: 14,
        features: { maxMedicos: 1, maxPacientes: 100, whatsapp: true, relatorios: false, suporte: 'email' }
      },
      starter: {
        nome: 'Starter', preco: 149, periodo: 'month',
        features: { maxMedicos: 1, maxPacientes: 500, whatsapp: true, relatorios: true, suporte: 'email' }
      },
      pro: {
        nome: 'Pro', preco: 349, periodo: 'month',
        features: { maxMedicos: 5, maxPacientes: 2000, whatsapp: true, relatorios: true, suporte: 'priority' }
      },
      enterprise: {
        nome: 'Enterprise', preco: 799, periodo: 'month',
        features: { maxMedicos: -1, maxPacientes: -1, whatsapp: true, relatorios: true, suporte: 'dedicated' }
      }
    };
  }

  // ── DB helpers (PostgreSQL async) ──────────────────────────────────────────

  _getMasterDb() {
    return require('../database/MultiTenantPostgres').getMasterDb();
  }

  async _getTenant(tenantId) {
    return this._getMasterDb().get('SELECT * FROM tenants WHERE id = $1', [tenantId]);
  }

  _parseBilling(tenant) {
    // pg driver já retorna JSONB como objeto
    if (typeof tenant.billing === 'object' && tenant.billing !== null) return tenant.billing;
    try { return JSON.parse(tenant.billing || '{}'); } catch { return {}; }
  }

  async _updateTenantBilling(tenantId, billingUpdates, statusUpdate = null) {
    const masterDb = this._getMasterDb();
    const tenant = await masterDb.get('SELECT billing FROM tenants WHERE id = $1', [tenantId]);
    if (!tenant) return;
    const newBilling = { ...this._parseBilling(tenant), ...billingUpdates };
    if (statusUpdate) {
      await masterDb.run(
        'UPDATE tenants SET billing = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [newBilling, statusUpdate, tenantId]
      );
    } else {
      await masterDb.run(
        'UPDATE tenants SET billing = $1, updated_at = NOW() WHERE id = $2',
        [newBilling, tenantId]
      );
    }
  }

  // ── Planos ──────────────────────────────────────────────────────────────────

  getPlanConfig(plano) {
    return this.plansConfig[plano] || this.plansConfig.starter;
  }

  getPlanSummary(plano = 'starter') {
    const config = this.getPlanConfig(plano);
    const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;
    return {
      nomePlano: config.nome,
      preco: fmt(config.preco),
      descricao: `${config.nome} — R$ ${config.preco}/mês`,
      maxMedicos: config.features.maxMedicos,
      maxPacientes: config.features.maxPacientes,
      suporte: config.features.suporte
    };
  }

  // ── Stripe: Customer ────────────────────────────────────────────────────────

  async createOrGetStripeCustomer(tenantId) {
    const tenant = this._getTenant(tenantId);
    if (!tenant) throw new Error('Tenant ' + tenantId + ' não encontrado');
    const billing = this._parseBilling(tenant);
    if (billing.stripe_customer_id) return billing.stripe_customer_id;

    if (!this.isStripeEnabled) {
      const devId = 'cus_dev_' + tenantId;
      this._updateTenantBilling(tenantId, { stripe_customer_id: devId });
      return devId;
    }

    const customer = await this.stripe.customers.create({
      name: tenant.nome,
      email: tenant.email,
      phone: tenant.telefone || undefined,
      metadata: { tenantId, tenantSlug: tenant.slug }
    });

    this._updateTenantBilling(tenantId, { stripe_customer_id: customer.id });
    return customer.id;
  }

  // ── Stripe: Checkout Session ────────────────────────────────────────────────

  async createCheckoutSession({ tenantId, qtdProfissionais = 1, successUrl, cancelUrl }) {
    if (!this.isStripeEnabled) {
      return { url: successUrl || '/billing', id: 'cs_dev_' + Date.now() };
    }

    const customerId = await this.createOrGetStripeCustomer(tenantId);
    const calc = this.calculateMonthlyValue(qtdProfissionais);
    const totalCentavos = Math.round(calc.valorTotal * 100);
    const descProf = qtdProfissionais + ' profissional' + (qtdProfissionais > 1 ? 'is' : '');

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'AltClinic',
            description: descProf + ' · R$ 79,90 base + R$ 19,90/prof adicional'
          },
          unit_amount: totalCentavos,
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      metadata: { tenantId, qtdProfissionais: String(qtdProfissionais) }
    });

    return session;
  }

  // ── Stripe: Billing Portal ──────────────────────────────────────────────────

  async createBillingPortal(tenantId, returnUrl) {
    if (!this.isStripeEnabled) throw new Error('Stripe não configurado');
    const tenant = this._getTenant(tenantId);
    if (!tenant) throw new Error('Tenant ' + tenantId + ' não encontrado');
    const billing = this._parseBilling(tenant);
    if (!billing.stripe_customer_id) throw new Error('Customer Stripe não encontrado. Conclua um checkout primeiro.');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: returnUrl
    });
    return session;
  }

  // ── Stripe: Webhook ─────────────────────────────────────────────────────────

  async processWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this._handleCheckoutCompleted(event.data.object); break;
      case 'invoice.payment_succeeded':
        await this._handlePaymentSucceeded(event.data.object); break;
      case 'invoice.payment_failed':
        await this._handlePaymentFailed(event.data.object); break;
      case 'customer.subscription.deleted':
        await this._handleSubscriptionCanceled(event.data.object); break;
      case 'customer.subscription.updated':
        await this._handleSubscriptionUpdated(event.data.object); break;
      default:
        console.log('[Stripe Webhook] Evento não tratado: ' + event.type);
    }
  }

  async _handleCheckoutCompleted(session) {
    const tenantId = session.metadata && session.metadata.tenantId;
    if (!tenantId) return;
    this._updateTenantBilling(tenantId, {
      stripe_subscription_id: session.subscription,
      billing_status: 'active',
      plan: 'altclinic',
      activated_at: new Date().toISOString()
    }, 'active');
    console.log('[Stripe] Checkout concluído — tenant ' + tenantId + ' ativado');
  }

  async _handlePaymentSucceeded(invoice) {
    if (!invoice.subscription || !this.isStripeEnabled) return;
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
    const tenantId = subscription.metadata && subscription.metadata.tenantId;
    if (!tenantId) return;
    this._updateTenantBilling(tenantId, { billing_status: 'active', last_payment_at: new Date().toISOString() });
    console.log('[Stripe] Pagamento confirmado — tenant ' + tenantId);
  }

  async _handlePaymentFailed(invoice) {
    if (!invoice.subscription || !this.isStripeEnabled) return;
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
    const tenantId = subscription.metadata && subscription.metadata.tenantId;
    if (!tenantId) return;
    this._updateTenantBilling(tenantId, { billing_status: 'past_due' });
    console.log('[Stripe] Pagamento falhou — tenant ' + tenantId);
  }

  async _handleSubscriptionCanceled(subscription) {
    const tenantId = subscription.metadata && subscription.metadata.tenantId;
    if (!tenantId) return;
    this._updateTenantBilling(tenantId, {
      billing_status: 'canceled',
      canceled_at: new Date().toISOString()
    }, 'suspended');
    console.log('[Stripe] Assinatura cancelada — tenant ' + tenantId + ' suspenso');
  }

  async _handleSubscriptionUpdated(subscription) {
    const tenantId = subscription.metadata && subscription.metadata.tenantId;
    if (!tenantId) return;
    this._updateTenantBilling(tenantId, { billing_status: subscription.status });
    console.log('[Stripe] Assinatura atualizada — tenant ' + tenantId + ' status=' + subscription.status);
  }
}

module.exports = new BillingManager();
