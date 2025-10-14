// 🧹 ENDPOINT TEMPORÁRIO DE LIMPEZA - DELETAR APÓS USO
// Adicione este código em src/app.js temporariamente

// Logo após as importações, antes das rotas:
app.get('/api/cleanup-orphans', async (req, res) => {
  try {
    const multiTenantDb = require('./models/MultiTenantDatabase');
    const fs = require('fs');
    const path = require('path');
    
    const masterDb = multiTenantDb.getMasterDb();
    
    // Buscar todos os tenants
    const tenants = masterDb.prepare('SELECT id, slug, nome, database_name FROM tenants').all();
    
    const orphans = [];
    const valid = [];
    
    // Verificar quais têm arquivo físico
    tenants.forEach(tenant => {
      const dbPath = path.join(__dirname, '../data', tenant.database_name);
      const exists = fs.existsSync(dbPath);
      
      if (exists) {
        valid.push({ slug: tenant.slug, database: tenant.database_name });
      } else {
        orphans.push({
          id: tenant.id,
          slug: tenant.slug,
          nome: tenant.nome,
          database: tenant.database_name
        });
      }
    });
    
    // Se não houver órfãos
    if (orphans.length === 0) {
      return res.json({
        success: true,
        message: 'Não há tenants órfãos!',
        stats: {
          total: tenants.length,
          valid: valid.length,
          orphans: 0
        }
      });
    }
    
    // Listar usuários que serão afetados
    const affectedUsers = [];
    orphans.forEach(tenant => {
      const users = masterDb.prepare('SELECT id, email FROM master_users WHERE tenant_id = ?').all(tenant.id);
      users.forEach(user => {
        affectedUsers.push({
          email: user.email,
          tenantSlug: tenant.slug
        });
      });
    });
    
    // Executar limpeza APENAS se query param ?execute=true
    if (req.query.execute === 'true') {
      let deletedTenants = 0;
      let deletedUsers = 0;
      
      orphans.forEach(tenant => {
        // Deletar usuários do tenant
        const usersResult = masterDb.prepare('DELETE FROM master_users WHERE tenant_id = ?').run(tenant.id);
        deletedUsers += usersResult.changes;
        
        // Deletar tenant
        const tenantResult = masterDb.prepare('DELETE FROM tenants WHERE id = ?').run(tenant.id);
        deletedTenants += tenantResult.changes;
      });
      
      return res.json({
        success: true,
        action: 'CLEANUP_EXECUTED',
        message: 'Limpeza de órfãos concluída!',
        deleted: {
          tenants: deletedTenants,
          users: deletedUsers
        },
        orphansRemoved: orphans.map(t => t.slug)
      });
    }
    
    // Apenas análise (sem executar)
    res.json({
      success: true,
      action: 'ANALYSIS_ONLY',
      message: 'Análise concluída. Para executar limpeza, adicione ?execute=true',
      stats: {
        total: tenants.length,
        valid: valid.length,
        orphans: orphans.length
      },
      orphansFound: orphans.map(t => ({
        slug: t.slug,
        nome: t.nome,
        database: t.database
      })),
      affectedUsers: affectedUsers,
      nextStep: 'Acesse: /api/cleanup-orphans?execute=true para executar'
    });
    
  } catch (error) {
    console.error('❌ Erro no cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
