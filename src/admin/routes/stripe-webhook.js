const express = require('express');
const router = express.Router();
const {
  getStripe,
  processarPagamentoBemSucedido,
  processarFalhaPagemento,
  processarAtualizacaoAssinatura,
  processarCancelamentoAssinatura
} = require('../services/StripeService');

// Stripe webhook — usa express.raw para verificação de assinatura
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe não configurado' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Sem secret configurado, parsear diretamente (desenvolvimento)
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('[stripe-webhook] Assinatura inválida:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await processarPagamentoBemSucedido(event.data.object);
        break;

      case 'invoice.payment_failed':
        await processarFalhaPagemento(event.data.object);
        break;

      case 'customer.subscription.updated':
        await processarAtualizacaoAssinatura(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await processarCancelamentoAssinatura(event.data.object);
        break;

      default:
        // Evento não tratado — ignorar silenciosamente
        break;
    }

    res.json({ received: true, event_type: event.type });
  } catch (err) {
    console.error('[stripe-webhook] Erro ao processar evento:', event.type, err.message);
    // Retornar 200 para o Stripe não reenviar; logar internamente
    res.json({ received: true, error: err.message });
  }
});

module.exports = router;
