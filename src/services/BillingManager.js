const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Sistema de Cobrança Multi-Tenant SaaS
 * Integração com Stripe para pagamentos recorrentes
 */
class BillingManager {
  constructor() {
    this.stripe = stripe;
    this.isStripeEnabled = !!stripe;
    this.plansConfig = {
      trial: {
        nome: 'Trial',
        preco: 0,
        periodo: 'trial',
        duracao: 30, // dias
        features: {
          maxUsuarios: 2,
          maxPacientes: 100,
          whatsapp: true,
          telemedicina: false,
          relatorios: false,
          api: false,
          suporte: 'email'
        }
      },
      starter: {
        nome: 'Starter',
        preco: 19900, // R$ 199,00 em centavos
        periodo: 'month',
        stripeId: 'price_starter_monthly',
        features: {
          maxUsuarios: 3,
          maxPacientes: 500,
          whatsapp: true,
          telemedicina: false,
          relatorios: true,
          api: false,
          suporte: 'email'
        }
      },
      professional: {
        nome: 'Professional',
        preco: 39900, // R$ 399,00 em centavos
        periodo: 'month',
        stripeId: 'price_professional_monthly',
        features: {
          maxUsuarios: 10,
          maxPacientes: 2000,
          whatsapp: true,
          telemedicina: true,
          relatorios: true,
          api: true,
          suporte: 'priority'
        }
      },
      enterprise: {
        nome: 'Enterprise',
        preco: 79900, // R$ 799,00 em centavos
        periodo: 'month',
        stripeId: 'price_enterprise_monthly',
        features: {
          maxUsuarios: -1, // ilimitado
          maxPacientes: -1, // ilimitado
          whatsapp: true,
          telemedicina: true,
          relatorios: true,
          api: true,
          whiteLabel: true,
          suporte: 'dedicated'
        }
      }
    };
  }

  /**
   * Criar customer no Stripe
   */
  async createStripeCustomer(tenant) {
    if (!this.isStripeEnabled) {
      console.warn('Stripe não configurado - modo desenvolvimento');
      return { id: `cus_dev_${tenant.id}` };
    }
    
    try {
      const customer = await this.stripe.customers.create({
        name: tenant.nome,
        email: tenant.email,
        phone: tenant.telefone,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug
        }
      });

      // Salvar customer ID no tenant
      await tenant.update({
        stripeCustomerId: customer.id
      });

      return customer;
    } catch (error) {
      console.error('Erro ao criar customer Stripe:', error);
      throw error;
    }
  }

  /**
   * Criar sessão de checkout para upgrade de plano
   */
  async createCheckoutSession(tenant, plano, successUrl, cancelUrl) {
    if (!this.isStripeEnabled) {
      console.warn('Stripe não configurado - simulando checkout');
      return { 
        url: `${successUrl}?session_id=cs_dev_${Date.now()}`,
        id: `cs_dev_${Date.now()}`
      };
    }
    
    try {
      const planConfig = this.plansConfig[plano];
      if (!planConfig || plano === 'trial') {
        throw new Error('Plano inválido para checkout');
      }

      // Criar customer se não existir
      if (!tenant.stripeCustomerId) {
        await this.createStripeCustomer(tenant);
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: tenant.stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: planConfig.stripeId,
          quantity: 1,
        }],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          tenantId: tenant.id,
          plano: plano
        },
        subscription_data: {
          trial_period_days: tenant.status === 'trial' ? 7 : 0, // 7 dias extras se estiver em trial
          metadata: {
            tenantId: tenant.id,
            tenantSlug: tenant.slug
          }
        }
      });

      return session;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }

  /**
   * Processar webhook do Stripe
   */
  async processWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
          
        default:
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Checkout completado - ativar assinatura
   */
  async handleCheckoutCompleted(session) {
    const tenantId = session.metadata.tenantId;
    const plano = session.metadata.plano;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    await tenant.update({
      plano: plano,
      status: 'active',
      stripeSubscriptionId: session.subscription,
      planActivatedAt: new Date(),
      billingStatus: 'active'
    });

    console.log(`✅ Plano ${plano} ativado para tenant ${tenant.slug}`);
  }

  /**
   * Pagamento bem-sucedido
   */
  async handlePaymentSucceeded(invoice) {
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
    const tenantId = subscription.metadata.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (tenant) {
      await tenant.update({
        billingStatus: 'active',
        lastPaymentAt: new Date()
      });
      
      console.log(`💰 Pagamento processado para tenant ${tenant.slug}`);
    }
  }

  /**
   * Pagamento falhou
   */
  async handlePaymentFailed(invoice) {
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
    const tenantId = subscription.metadata.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (tenant) {
      await tenant.update({
        billingStatus: 'past_due'
      });
      
      // Enviar email de cobrança
      console.log(`❌ Pagamento falhou para tenant ${tenant.slug}`);
    }
  }

  /**
   * Assinatura cancelada
   */
  async handleSubscriptionCanceled(subscription) {
    const tenantId = subscription.metadata.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (tenant) {
      await tenant.update({
        status: 'canceled',
        billingStatus: 'canceled',
        canceledAt: new Date()
      });
      
      console.log(`🚫 Assinatura cancelada para tenant ${tenant.slug}`);
    }
  }

  /**
   * Assinatura atualizada
   */
  async handleSubscriptionUpdated(subscription) {
    const tenantId = subscription.metadata.tenantId;
    
    const tenant = await Tenant.findByPk(tenantId);
    if (tenant) {
      // Determinar novo plano baseado no price_id
      const priceId = subscription.items.data[0].price.id;
      const newPlan = Object.keys(this.plansConfig).find(
        plan => this.plansConfig[plan].stripeId === priceId
      );
      
      if (newPlan) {
        await tenant.update({
          plano: newPlan,
          billingStatus: subscription.status
        });
        
        console.log(`🔄 Plano atualizado para ${newPlan} - tenant ${tenant.slug}`);
      }
    }
  }

  /**
   * Verificar se tenant pode usar recurso
   */
  async canUseFeature(tenant, feature) {
    const planConfig = this.plansConfig[tenant.plano];
    if (!planConfig) return false;

    // Verificar status de billing
    if (tenant.billingStatus === 'past_due' || tenant.billingStatus === 'canceled') {
      return false;
    }

    // Verificar trial expirado
    if (tenant.status === 'trial' && tenant.isTrialExpired()) {
      return false;
    }

    return planConfig.features[feature] === true;
  }

  /**
   * Verificar limites de uso
   */
  async checkUsageLimits(tenant, resource) {
    const planConfig = this.plansConfig[tenant.plano];
    if (!planConfig) return false;

    const limit = planConfig.features[`max${resource}`];
    if (limit === -1) return true; // ilimitado

    // Contar recursos atuais - TODO: implementar com modelos corretos
    let currentUsage = 0;
    console.warn(`Verificação de uso para ${resource} - implementar com modelos`);

    return currentUsage < limit;
  }

  /**
   * Gerar portal de cobrança
   */
  async createBillingPortal(tenant, returnUrl) {
    try {
      if (!tenant.stripeCustomerId) {
        throw new Error('Customer Stripe não encontrado');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Erro ao criar portal de cobrança:', error);
      throw error;
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(tenant, immediate = false) {
    try {
      if (!tenant.stripeSubscriptionId) {
        throw new Error('Assinatura não encontrada');
      }

      if (immediate) {
        await this.stripe.subscriptions.cancel(tenant.stripeSubscriptionId);
      } else {
        await this.stripe.subscriptions.update(tenant.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }

      await tenant.update({
        cancelRequestedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  /**
   * Obter informações de cobrança
   */
  async getBillingInfo(tenant) {
    try {
      const billingInfo = {
        plano: tenant.plano,
        status: tenant.status,
        billingStatus: tenant.billingStatus,
        features: this.plansConfig[tenant.plano]?.features || {},
        subscription: null,
        invoices: []
      };

      if (tenant.stripeSubscriptionId) {
        billingInfo.subscription = await this.stripe.subscriptions.retrieve(
          tenant.stripeSubscriptionId
        );
        
        billingInfo.invoices = await this.stripe.invoices.list({
          customer: tenant.stripeCustomerId,
          limit: 10
        });
      }

      return billingInfo;
    } catch (error) {
      console.error('Erro ao obter informações de cobrança:', error);
      throw error;
    }
  }
}

module.exports = new BillingManager();
