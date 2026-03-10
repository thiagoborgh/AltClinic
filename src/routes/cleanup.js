const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// TODO: REMOVER após limpeza de produção concluída

router.get('/api/cleanup-orphans', async (req, res) => {
  try {
    const multiTenantDb = require('../models/MultiTenantDatabase');
    const masterDb = multiTenantDb.getMasterDb();
    const tenants = await masterDb.all('SELECT id, slug, nome FROM tenants');

    if (req.query.execute === 'true') {
      await masterDb.transaction(async (client) => {
        for (const t of tenants) {
          for (const tbl of ['global_invites', 'master_users', 'sessions', 'audit_logs']) {
            try {
              await client.query(`DELETE FROM ${tbl} WHERE tenant_id = $1`, [t.id]);
            } catch {}
          }
          await client.query('DELETE FROM tenants WHERE id = $1', [t.id]);
        }
      });
      return res.json({ success: true, action: 'CLEANUP_EXECUTED',
        tenantsRemoved: tenants.map(t => t.slug) });
    }

    res.json({ success: true, action: 'ANALYSIS_ONLY',
      message: 'Adicione ?execute=true para executar',
      stats: { total: tenants.length },
      tenantsFound: tenants.map(t => ({ slug: t.slug, nome: t.nome })) });
  } catch (e) {
    logger.error('Erro no cleanup', { message: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/api/cleanup-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const multiTenantDb = require('../models/MultiTenantDatabase');
    const masterDb = multiTenantDb.getMasterDb();
    const user = await masterDb.get('SELECT * FROM master_users WHERE email = $1', [email]);
    if (!user) return res.json({ success: false, message: 'Usuário não encontrado', email });

    const tenant = await masterDb.get('SELECT * FROM tenants WHERE id = $1', [user.tenant_id]);
    if (!tenant) return res.json({ success: false, message: 'Tenant não encontrado', email });

    if (req.query.execute === 'true') {
      await masterDb.run('DELETE FROM master_users WHERE email = $1', [email]);
      return res.json({ success: true, action: 'USER_DELETED', message: `Usuário ${email} removido` });
    }

    res.json({ success: true, action: 'ANALYSIS_ONLY',
      message: 'Adicione ?execute=true para deletar',
      analysis: { email, userId: user.id, tenantSlug: tenant.slug } });
  } catch (e) {
    logger.error('Erro no cleanup de usuario', { message: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
