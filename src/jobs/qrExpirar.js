/**
 * qrExpirar — cron a cada minuto para marcar QR codes vencidos
 * e cron a cada 10min para verificar pagamentos não confirmados (fallback)
 */
const cron = require('node-cron');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');

async function expirarQRs() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const schema = schemaFromSlug(tenant.slug);
      const { rowCount } = await pool.query(`
        UPDATE "${schema}".qr_codes
        SET status = 'expirado'
        WHERE status = 'ativo' AND expira_em < NOW()
      `);
      if (rowCount > 0) console.log(`[QRExpirar] ${tenant.slug}: ${rowCount} QRs expirados`);
    } catch { /* ignorar tenant sem tabela */ }
  }
}

async function verificarPagamentosNaoConfirmados() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const schema = schemaFromSlug(tenant.slug);
      const { rows: qrsAtivos } = await pool.query(`
        SELECT * FROM "${schema}".qr_codes
        WHERE status = 'ativo'
          AND expira_em > NOW()
          AND criado_em < NOW() - INTERVAL '5 minutes'
      `).catch(() => ({ rows: [] }));

      for (const qr of qrsAtivos) {
        try {
          const EFIBankService = require('../services/EFIBankService');
          const status = await EFIBankService.consultarCobranca({
            tenantId: tenant.id, tenantSlug: tenant.slug, txid: qr.txid,
          });
          if (status === 'CONCLUIDA') {
            const QRBillingService = require('../services/QRBillingService');
            const svc = new QRBillingService(tenant.id, tenant.slug);
            await svc.processarPagamentoPix({ txid: qr.txid, valor: qr.valor });
          }
        } catch { /* sem config EFI ou erro de rede */ }
      }
    } catch { /* ignorar tenant */ }
  }
}

function register() {
  cron.schedule('* * * * *', () => {
    expirarQRs().catch(err => console.error('[QRExpirar] Erro:', err.message));
  }, { timezone: 'America/Sao_Paulo' });

  cron.schedule('*/10 * * * *', () => {
    verificarPagamentosNaoConfirmados().catch(err =>
      console.error('[QRFallback] Erro:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[QR Jobs] Registrados — expirar (1min) + fallback (10min)');
}

module.exports = { register, expirarQRs, verificarPagamentosNaoConfirmados };
