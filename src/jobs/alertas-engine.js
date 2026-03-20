/**
 * alertas-engine.js — Job a cada 5 minutos para detectar alertas proativos
 * Cron: */5 * * * *
 */
const cron = require('node-cron');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');
const { detectarAlertas } = require('../services/alertas-detectores');

async function executar() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const schema = schemaFromSlug(tenant.slug);
      await detectarAlertas(pool, tenant.id, schema);
    } catch (err) {
      console.error(`[Alertas Engine] Erro tenant ${tenant.slug}:`, err.message);
    }
  }
}

function register() {
  cron.schedule('*/5 * * * *', () => {
    executar().catch(err =>
      console.error('[Alertas Engine] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });
  console.log('[Alertas Engine] Job registrado — a cada 5 minutos');
}

module.exports = { register, executar };
