const Database = require('better-sqlite3');
const multiTenantDb = require('../src/models/MultiTenantDatabase');

const migration = {
  version: 10,
  name: 'add_professional_schedules_to_tenants',
  up: `
    -- Adicionar tabela professional_schedules aos tenants existentes
    CREATE TABLE IF NOT EXISTS professional_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      professional_id INTEGER,
      professional_name TEXT NOT NULL,
      day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Segunda, etc.
      start_time TEXT NOT NULL, -- HH:MM
      end_time TEXT NOT NULL, -- HH:MM
      pause_start TEXT, -- HH:MM
      pause_end TEXT, -- HH:MM
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_tenant ON professional_schedules(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_professional ON professional_schedules(professional_id);
  `,

  down: `
    -- Remover índices
    DROP INDEX IF EXISTS idx_professional_schedules_professional;
    DROP INDEX IF EXISTS idx_professional_schedules_tenant;

    -- Remover tabela
    DROP TABLE IF EXISTS professional_schedules;
  `
};

// Função para executar a migração
async function runMigration() {
  console.log('📋 Executando migração 010: Adicionando professional_schedules aos tenants...');

  try {
    // Executar migração em todos os tenants
    await multiTenantDb.runMigrationOnAllTenants(migration.up);
    console.log('✅ Migração 010 executada com sucesso em todos os tenants!');
    return true;
  } catch (error) {
    console.error('❌ Erro na migração 010:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migração concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na migração:', error);
      process.exit(1);
    });
}

module.exports = { migration, runMigration };