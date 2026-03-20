const cron = require('node-cron');
const pool = require('../database/postgres');
const IAFinanceiroService = require('../services/IAFinanceiroService');

function mesAnterior() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function gerarInsightsTodos() {
  const mes = mesAnterior();
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const svc = new IAFinanceiroService(tenant.id, tenant.slug);
      await svc.gerarInsightMensal(mes);
      console.log(`[IA Insights] ${tenant.slug}: insight ${mes} gerado`);
    } catch (err) {
      console.error(`[IA Insights] Erro tenant ${tenant.slug}:`, err.message);
    }
  }
}

function register() {
  cron.schedule('0 7 1 * *', () => {
    gerarInsightsTodos().catch(err =>
      console.error('[IA Insights] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });
  console.log('[IA Insights] Job registrado — 07:00 dia 1 do mês');
}

module.exports = { register, gerarInsightsTodos };
