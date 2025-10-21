# 🔍 DEBUG: Identificar TODAS as Foreign Keys

Execute este código no endpoint ou crie um endpoint temporário para debug.

## Endpoint de Debug

Adicione temporariamente em `src/app.js`:

```javascript
// 🔍 DEBUG: Listar todas as tabelas e foreign keys
this.app.get('/api/debug-tables', async (req, res) => {
  try {
    const multiTenantDb = require('./models/MultiTenantDatabase');
    const masterDb = multiTenantDb.getMasterDb();

    // Listar todas as tabelas
    const tables = masterDb.prepare(\`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    \`).all();

    const tableInfo = {};

    // Para cada tabela, obter schema e foreign keys
    tables.forEach(table => {
      const tableName = table.name;

      // Obter estrutura da tabela
      const schema = masterDb.prepare(\`SELECT sql FROM sqlite_master WHERE name = ?\`).get(tableName);

      // Obter foreign keys
      const foreignKeys = masterDb.prepare(\`PRAGMA foreign_key_list(\${tableName})\`).all();

      // Contar registros
      const count = masterDb.prepare(\`SELECT COUNT(*) as total FROM \${tableName}\`).get();

      tableInfo[tableName] = {
        recordCount: count.total,
        foreignKeys: foreignKeys.map(fk => ({
          from: fk.from,
          to: fk.table + '(' + fk.to + ')'
        })),
        schema: schema ? schema.sql : null
      };
    });

    res.json({
      success: true,
      tables: Object.keys(tableInfo),
      details: tableInfo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
```

## OU: Desabilitar Foreign Keys Temporariamente

Alternativa: Desabilitar verificação de FK durante delete:

```javascript
// No endpoint cleanup-orphans, ANTES da transação:
masterDb.pragma("foreign_keys = OFF");

try {
  const transaction = masterDb.transaction(() => {
    orphans.forEach((tenant) => {
      // Deletar em qualquer ordem
      masterDb
        .prepare("DELETE FROM global_invites WHERE tenant_id = ?")
        .run(tenant.id);
      masterDb
        .prepare("DELETE FROM master_users WHERE tenant_id = ?")
        .run(tenant.id);
      masterDb.prepare("DELETE FROM tenants WHERE id = ?").run(tenant.id);
    });
  });

  transaction();
} finally {
  // Reabilitar
  masterDb.pragma("foreign_keys = ON");
}
```

## OU: Deletar por ID Específico

Para resolver AGORA sem esperar deploy, use o ID específico:

```javascript
// Endpoint temporário - deletar tenant específico
this.app.get("/api/delete-orphan/:tenantId", async (req, res) => {
  try {
    const multiTenantDb = require("./models/MultiTenantDatabase");
    const masterDb = multiTenantDb.getMasterDb();
    const { tenantId } = req.params;

    // Desabilitar FK temporariamente
    masterDb.pragma("foreign_keys = OFF");

    // Deletar tudo relacionado ao tenant
    const deleteInvites = masterDb
      .prepare("DELETE FROM global_invites WHERE tenant_id = ?")
      .run(tenantId);
    const deleteUsers = masterDb
      .prepare("DELETE FROM master_users WHERE tenant_id = ?")
      .run(tenantId);
    const deleteTenant = masterDb
      .prepare("DELETE FROM tenants WHERE id = ?")
      .run(tenantId);

    // Reabilitar FK
    masterDb.pragma("foreign_keys = ON");

    res.json({
      success: true,
      deleted: {
        invites: deleteInvites.changes,
        users: deleteUsers.changes,
        tenant: deleteTenant.changes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

Depois acesse:

```
/api/delete-orphan/b7a34675-8fcf-4d3b-923f-1b488dc313cd
```

Para cada tenant órfão listado.
