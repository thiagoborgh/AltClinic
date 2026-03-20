const pool = require('../../database/postgres');

// Lazy-load do Stripe para evitar crash se STRIPE_SECRET_KEY não estiver configurada
let stripe;
function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

async function criarAssinatura(tenantSlug, planoNome, paymentMethodId) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY não configurada');
  }

  const { rows } = await pool.query(
    `SELECT t.stripe_customer_id, t.email, t.email_admin, p.stripe_price_id
     FROM tenants t
     LEFT JOIN planos p ON p.nome = $1
     WHERE t.slug = $2`,
    [planoNome, tenantSlug]
  );

  if (!rows[0]) throw new Error(`Tenant '${tenantSlug}' não encontrado`);

  const { stripe_customer_id, email, email_admin, stripe_price_id } = rows[0];

  if (!stripe_price_id) throw new Error(`Plano '${planoNome}' não tem stripe_price_id configurado`);

  const stripeClient = getStripe();

  // Criar ou reutilizar customer no Stripe
  let customerId = stripe_customer_id;
  if (!customerId) {
    const customer = await stripeClient.customers.create({
      email: email_admin || email,
      metadata: { tenant_slug: tenantSlug }
    });
    customerId = customer.id;
    await pool.query(
      'UPDATE tenants SET stripe_customer_id = $1 WHERE slug = $2',
      [customerId, tenantSlug]
    );
  }

  // Anexar método de pagamento
  await stripeClient.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripeClient.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId }
  });

  // Criar assinatura
  const subscription = await stripeClient.subscriptions.create({
    customer: customerId,
    items: [{ price: stripe_price_id }],
    expand: ['latest_invoice.payment_intent']
  });

  await pool.query(
    `UPDATE tenants SET stripe_subscription_id = $1, plano = $2, status = 'ativo', plano_ativo_desde = NOW()
     WHERE slug = $3`,
    [subscription.id, planoNome, tenantSlug]
  );

  return { subscriptionId: subscription.id, status: subscription.status };
}

async function processarPagamentoBemSucedido(invoice) {
  const customerId = invoice.customer;
  const { rows } = await pool.query(
    'SELECT slug FROM tenants WHERE stripe_customer_id = $1',
    [customerId]
  );
  if (!rows[0]) return;

  const tenantSlug = rows[0].slug;
  const proximoCiclo = invoice.lines?.data?.[0]?.period?.end
    ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
    : null;

  await pool.query(
    `UPDATE tenants SET status = 'ativo', proximo_ciclo = $1 WHERE slug = $2`,
    [proximoCiclo, tenantSlug]
  );

  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
     VALUES (0, $1, 'stripe.pagamento_ok', $2)`,
    [tenantSlug, JSON.stringify({ invoice_id: invoice.id, amount_paid: invoice.amount_paid })]
  ).catch(() => {});
}

async function processarFalhaPagemento(invoice) {
  const customerId = invoice.customer;
  const { rows } = await pool.query(
    'SELECT slug FROM tenants WHERE stripe_customer_id = $1',
    [customerId]
  );
  if (!rows[0]) return;

  const tenantSlug = rows[0].slug;

  await pool.query(
    `UPDATE tenants SET status = 'leitura' WHERE slug = $1`,
    [tenantSlug]
  );

  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
     VALUES (0, $1, 'stripe.pagamento_falhou', $2)`,
    [tenantSlug, JSON.stringify({ invoice_id: invoice.id, attempt_count: invoice.attempt_count })]
  ).catch(() => {});
}

async function processarAtualizacaoAssinatura(subscription) {
  const customerId = subscription.customer;
  const { rows } = await pool.query(
    'SELECT slug FROM tenants WHERE stripe_customer_id = $1',
    [customerId]
  );
  if (!rows[0]) return;

  const tenantSlug = rows[0].slug;
  const novoStatus = subscription.status === 'active' ? 'ativo' : subscription.status;

  await pool.query(
    `UPDATE tenants SET status = $1, stripe_subscription_id = $2 WHERE slug = $3`,
    [novoStatus, subscription.id, tenantSlug]
  );

  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
     VALUES (0, $1, 'stripe.assinatura_atualizada', $2)`,
    [tenantSlug, JSON.stringify({ subscription_id: subscription.id, status: subscription.status })]
  ).catch(() => {});
}

async function processarCancelamentoAssinatura(subscription) {
  const customerId = subscription.customer;
  const { rows } = await pool.query(
    'SELECT slug FROM tenants WHERE stripe_customer_id = $1',
    [customerId]
  );
  if (!rows[0]) return;

  const tenantSlug = rows[0].slug;

  await pool.query(
    `UPDATE tenants SET status = 'cancelado', stripe_subscription_id = NULL WHERE slug = $1`,
    [tenantSlug]
  );

  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
     VALUES (0, $1, 'stripe.assinatura_cancelada', $2)`,
    [tenantSlug, JSON.stringify({ subscription_id: subscription.id })]
  ).catch(() => {});
}

module.exports = {
  getStripe,
  criarAssinatura,
  processarPagamentoBemSucedido,
  processarFalhaPagemento,
  processarAtualizacaoAssinatura,
  processarCancelamentoAssinatura
};
