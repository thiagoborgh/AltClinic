/**
 * asaas-webhooks.js — Endpoint público para receber eventos do Asaas
 *
 * Issues: #12 e #13 — Integração Asaas + Webhooks de pagamento
 *
 * IMPORTANTE: Esta rota NÃO usa authenticateToken.
 * É chamada diretamente pelo Asaas (servidor externo), não pelo usuário.
 *
 * Configurar no painel Asaas:
 *   URL: https://<seu-dominio>/api/webhooks/asaas
 *   Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE,
 *            PAYMENT_DELETED, SUBSCRIPTION_CANCELLED
 */
const express = require('express');
const router = express.Router();
const multiTenantDb = require('../models/MultiTenantDatabase');

// ─── Constantes ──────────────────────────────────────────────────────────────

/**
 * Grace period em dias antes de suspender o tenant após PAYMENT_DELETED.
 * Durante esse período o tenant continua ativo.
 */
const GRACE_PERIOD_DAYS = 3;

// ─── Handlers por tipo de evento ─────────────────────────────────────────────

/**
 * PAYMENT_CONFIRMED / PAYMENT_RECEIVED
 * Ativar o tenant — pagamento confirmado com sucesso.
 */
async function handlePaymentConfirmed(masterDb, tenantId, eventData) {
  console.log(`[Asaas Webhook] PAYMENT_CONFIRMED para tenant ${tenantId}`);

  const tenant = await masterDb.get('SELECT id, billing FROM tenants WHERE id=$1', [tenantId]);
  if (!tenant) {
    console.warn(`[Asaas Webhook] Tenant ${tenantId} não encontrado.`);
    return;
  }

  const billing = typeof tenant.billing === 'string'
    ? JSON.parse(tenant.billing)
    : (tenant.billing || {});

  const updatedBilling = {
    ...billing,
    status: 'active',
    last_payment_at: new Date().toISOString(),
    last_payment_id: eventData.payment?.id || null,
  };

  await masterDb.run(
    'UPDATE tenants SET status=$1, billing=$2, updated_at=NOW() WHERE id=$3',
    ['active', JSON.stringify(updatedBilling), tenantId]
  );

  console.log(`[Asaas Webhook] Tenant ${tenantId} ativado com sucesso.`);
}

/**
 * PAYMENT_OVERDUE
 * Marcar billing como past_due e registrar log.
 * Não suspende imediatamente — aguarda a ação manual ou próximo evento.
 */
async function handlePaymentOverdue(masterDb, tenantId, eventData) {
  console.log(`[Asaas Webhook] PAYMENT_OVERDUE para tenant ${tenantId}`);

  const tenant = await masterDb.get('SELECT id, billing FROM tenants WHERE id=$1', [tenantId]);
  if (!tenant) {
    console.warn(`[Asaas Webhook] Tenant ${tenantId} não encontrado.`);
    return;
  }

  const billing = typeof tenant.billing === 'string'
    ? JSON.parse(tenant.billing)
    : (tenant.billing || {});

  const updatedBilling = {
    ...billing,
    status: 'past_due',
    overdue_since: new Date().toISOString(),
    overdue_payment_id: eventData.payment?.id || null,
  };

  // Mantém o status do tenant como 'active' por ora — grace period implícito
  await masterDb.run(
    'UPDATE tenants SET billing=$1, updated_at=NOW() WHERE id=$2',
    [JSON.stringify(updatedBilling), tenantId]
  );

  console.warn(
    `[Asaas Webhook] Tenant ${tenantId} com pagamento em atraso. billing.status=past_due`
  );
}

/**
 * PAYMENT_DELETED
 * Suspender o tenant após grace period de GRACE_PERIOD_DAYS dias.
 * Registra a data programada de suspensão no billing.
 */
async function handlePaymentDeleted(masterDb, tenantId, eventData) {
  console.log(`[Asaas Webhook] PAYMENT_DELETED para tenant ${tenantId}`);

  const tenant = await masterDb.get('SELECT id, billing FROM tenants WHERE id=$1', [tenantId]);
  if (!tenant) {
    console.warn(`[Asaas Webhook] Tenant ${tenantId} não encontrado.`);
    return;
  }

  const billing = typeof tenant.billing === 'string'
    ? JSON.parse(tenant.billing)
    : (tenant.billing || {});

  const suspendAt = new Date();
  suspendAt.setDate(suspendAt.getDate() + GRACE_PERIOD_DAYS);

  const updatedBilling = {
    ...billing,
    status: 'past_due',
    payment_deleted_at: new Date().toISOString(),
    suspend_at: suspendAt.toISOString(),
    deleted_payment_id: eventData.payment?.id || null,
  };

  // Mantém o tenant ativo durante o grace period.
  // Um cron job deve verificar suspend_at e suspender quando expirar.
  await masterDb.run(
    'UPDATE tenants SET billing=$1, updated_at=NOW() WHERE id=$2',
    [JSON.stringify(updatedBilling), tenantId]
  );

  console.warn(
    `[Asaas Webhook] Tenant ${tenantId} — pagamento excluído. ` +
    `Suspensão programada para ${suspendAt.toISOString()} (grace period: ${GRACE_PERIOD_DAYS}d).`
  );
}

/**
 * SUBSCRIPTION_CANCELLED
 * Suspender o tenant imediatamente.
 */
async function handleSubscriptionCancelled(masterDb, tenantId, eventData) {
  console.log(`[Asaas Webhook] SUBSCRIPTION_CANCELLED para tenant ${tenantId}`);

  const tenant = await masterDb.get('SELECT id, billing FROM tenants WHERE id=$1', [tenantId]);
  if (!tenant) {
    console.warn(`[Asaas Webhook] Tenant ${tenantId} não encontrado.`);
    return;
  }

  const billing = typeof tenant.billing === 'string'
    ? JSON.parse(tenant.billing)
    : (tenant.billing || {});

  const updatedBilling = {
    ...billing,
    status: 'canceled',
    canceled_at: new Date().toISOString(),
    subscription_id: eventData.subscription?.id || billing.asaas_subscription_id || null,
  };

  await masterDb.run(
    'UPDATE tenants SET status=$1, billing=$2, updated_at=NOW() WHERE id=$3',
    ['suspended', JSON.stringify(updatedBilling), tenantId]
  );

  console.log(`[Asaas Webhook] Tenant ${tenantId} suspenso — assinatura cancelada.`);
}

// ─── Rota principal ───────────────────────────────────────────────────────────

/**
 * POST /api/webhooks/asaas
 *
 * Recebe notificações de pagamento do Asaas.
 * O tenantId é lido do campo externalReference enviado na criação da assinatura.
 */
router.post('/asaas', async (req, res) => {
  // Responder 200 imediatamente — o Asaas exige resposta rápida
  res.status(200).json({ received: true });

  try {
    const { event, payment, subscription } = req.body || {};

    if (!event) {
      console.warn('[Asaas Webhook] Payload sem campo "event":', req.body);
      return;
    }

    console.log(`[Asaas Webhook] Evento recebido: ${event}`);

    // O tenantId é passado como externalReference na criação da assinatura
    const tenantId =
      payment?.externalReference ||
      subscription?.externalReference ||
      req.body?.externalReference ||
      null;

    if (!tenantId) {
      console.warn(`[Asaas Webhook] Evento ${event} sem externalReference — ignorando.`);
      return;
    }

    const masterDb = multiTenantDb.getMasterDb();

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await handlePaymentConfirmed(masterDb, tenantId, req.body);
        break;

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(masterDb, tenantId, req.body);
        break;

      case 'PAYMENT_DELETED':
        await handlePaymentDeleted(masterDb, tenantId, req.body);
        break;

      case 'SUBSCRIPTION_CANCELLED':
        await handleSubscriptionCancelled(masterDb, tenantId, req.body);
        break;

      default:
        console.log(`[Asaas Webhook] Evento não tratado: ${event}`);
    }
  } catch (err) {
    // Erro interno — não impacta a resposta 200 já enviada ao Asaas
    console.error('[Asaas Webhook] Erro ao processar evento:', err.message, err.stack);
  }
});

module.exports = router;
