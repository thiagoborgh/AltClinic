const cron = require('node-cron');
const pool = require('../database/postgres');
const { TenantDb } = require('../database/TenantDb');

function schemaFromSlug(slug) {
  return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Executa todo domingo às 3h
cron.schedule('0 3 * * 0', async () => {
  try {
    const { rows: tenants } = await pool.query(
      "SELECT slug FROM public.tenants WHERE status = 'active'"
    );

    for (const tenant of tenants) {
      try {
        const db = new TenantDb(pool, schemaFromSlug(tenant.slug));
        await db.query(
          "DELETE FROM refresh_tokens WHERE expira_em < NOW() OR revogado = TRUE"
        );
        await db.query(
          "DELETE FROM tokens_senha WHERE expira_em < NOW() OR usado = TRUE"
        );
      } catch (e) {
        console.error(`[cleanup-tokens] Erro no tenant ${tenant.slug}:`, e.message);
      }
    }

    console.log(`[cleanup-tokens] Limpeza concluída para ${tenants.length} tenant(s)`);
  } catch (e) {
    console.error('[cleanup-tokens] Erro geral:', e.message);
  }
});

module.exports = {};
