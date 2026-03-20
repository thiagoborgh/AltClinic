'use strict';

/**
 * faturasVencidas — cron diário às 00:05 para marcar faturas vencidas
 */
const cron = require('node-cron');
const pool = require('../database/postgres');
const FaturaService = require('../services/FaturaService');

async function processarVencidas() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const svc   = new FaturaService(tenant.id, tenant.slug);
      const count = await svc.atualizarStatusVencidas();
      if (count > 0) {
        console.log(`[FaturasVencidas] ${tenant.slug}: ${count} faturas marcadas`);
      }
    } catch (err) {
      console.error(`[FaturasVencidas] Erro tenant ${tenant.slug}:`, err.message);
    }
  }
}

function register() {
  cron.schedule('5 0 * * *', () => {
    processarVencidas().catch(err =>
      console.error('[FaturasVencidas] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });
  console.log('[FaturasVencidas] Job registrado — 00:05 diário');
}

module.exports = { register, processarVencidas };
