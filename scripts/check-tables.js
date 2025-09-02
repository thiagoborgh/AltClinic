const dbManager = require('../src/models/database');

try {
  const db = dbManager.getDb();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  console.log('📋 Tabelas existentes no banco:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // Verificar se a tabela migrations existe
  const migrationsExists = tables.some(table => table.name === 'migrations');
  console.log(`\n🔍 Tabela migrations existe: ${migrationsExists ? '✅' : '❌'}`);
  
  if (!migrationsExists) {
    console.log('\n📝 Criando tabela migrations...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela migrations criada!');
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
