const cron = require('node-cron');
const pool = require('../database/postgres');
const IAFinanceiroService = require('../services/IAFinanceiroService');

async function calcularScoresTodos() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const svc = new IAFinanceiroService(tenant.id, tenant.slug);
      const n = await svc.calcularScoresTenant();
      if (n > 0) console.log(`[IA Scores] ${tenant.slug}: ${n} pacientes processados`);
    } catch (err) {
      console.error(`[IA Scores] Erro tenant ${tenant.slug}:`, err.message);
    }
  }
}

function register() {
  cron.schedule('0 6 * * *', () => {
    calcularScoresTodos().catch(err =>
      console.error('[IA Scores] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });
  console.log('[IA Scores] Job registrado — 06:00 diário');
}

module.exports = { register, calcularScoresTodos };
