const express = require('express');
const router = express.Router();
const pool = require('../../database/postgres');

// GET / — MRR total, novos do mês, churn, contagens por plano
router.get('/', async (req, res) => {
  try {
    const mesAtual = new Date();
    const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString();
    const fimMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // MRR total (tenants ativos com plano pago)
    const { rows: mrrRows } = await pool.query(
      `SELECT COALESCE(SUM(p.preco_mensal), 0) AS mrr_total
       FROM tenants t
       JOIN planos p ON p.id = t.plano_id
       WHERE t.status = 'ativo' AND p.preco_mensal > 0`
    );

    // Novos tenants do mês
    const { rows: novosRows } = await pool.query(
      `SELECT COUNT(*) AS novos FROM tenants WHERE created_at >= $1 AND created_at <= $2`,
      [inicioMes, fimMes]
    );

    // Churn do mês (tenants que passaram para cancelado/suspenso)
    const { rows: churnRows } = await pool.query(
      `SELECT COUNT(*) AS churn FROM admin_audit_log
       WHERE acao = 'tenant.mudar_status'
         AND detalhes_json->>'status_novo' IN ('cancelado','suspenso')
         AND criado_em >= $1 AND criado_em <= $2`,
      [inicioMes, fimMes]
    );

    // Contagens por plano
    const { rows: porPlanoRows } = await pool.query(
      `SELECT t.plano, COUNT(*) AS total, COUNT(*) FILTER (WHERE t.status = 'ativo') AS ativos
       FROM tenants t
       GROUP BY t.plano
       ORDER BY total DESC`
    );

    res.json({
      mrr_total: parseFloat(mrrRows[0].mrr_total),
      novos_mes: parseInt(novosRows[0].novos),
      churn_mes: parseInt(churnRows[0].churn),
      por_plano: porPlanoRows
    });
  } catch (err) {
    console.error('[faturamento] GET /:', err.message);
    res.status(500).json({ error: 'Erro ao buscar dados de faturamento' });
  }
});

// GET /falhas — tenants com status='leitura' (payment failure)
router.get('/falhas', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.nome, t.slug, t.email, t.email_admin, t.plano,
              t.stripe_customer_id, t.proximo_ciclo, t.atualizado_em
       FROM tenants t
       WHERE t.status = 'leitura'
       ORDER BY t.atualizado_em DESC`
    );

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('[faturamento] GET /falhas:', err.message);
    res.status(500).json({ error: 'Erro ao buscar tenants com falha de pagamento' });
  }
});

// POST /:slug/cobrar — placeholder
router.post('/:slug/cobrar', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: 'Stripe não configurado. Configure STRIPE_SECRET_KEY.' });
  }

  const { slug } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT stripe_customer_id, stripe_subscription_id FROM tenants WHERE slug = $1',
      [slug]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Tenant não encontrado' });
    if (!rows[0].stripe_subscription_id) {
      return res.status(400).json({ error: 'Tenant não possui assinatura Stripe ativa' });
    }

    // Placeholder — implementar cobrança manual via Stripe quando necessário
    res.json({ message: 'Cobrança manual disparada (implementação pendente)', tenant: slug });
  } catch (err) {
    console.error('[faturamento] POST /:slug/cobrar:', err.message);
    res.status(500).json({ error: 'Erro ao processar cobrança' });
  }
});

module.exports = router;
