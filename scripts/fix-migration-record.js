const dbManager = require('../src/models/database');

try {
  const db = dbManager.getDb();
  
  // Verificar estrutura da tabela migrations
  const columns = db.prepare("PRAGMA table_info(migrations)").all();
  console.log('📋 Estrutura da tabela migrations:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  // Registrar migração usando a coluna correta
  const columnName = columns.find(col => col.name === 'filename') ? 'filename' : 'nome';
  
  try {
    db.prepare(`INSERT OR IGNORE INTO migrations (${columnName}) VALUES (?)`).run('003_configuracoes.sql');
    console.log('✅ Migração registrada no histórico');
  } catch (error) {
    console.log('⚠️ Migração já registrada ou erro:', error.message);
  }
  
  // Verificar configurações existentes
  const configs = db.prepare('SELECT * FROM configuracoes LIMIT 5').all();
  console.log(`\n📊 Configurações na tabela: ${configs.length}`);
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
