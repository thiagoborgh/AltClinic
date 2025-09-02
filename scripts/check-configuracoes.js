const dbManager = require('../src/models/database');

try {
  const db = dbManager.getDb();
  
  // Verificar se a tabela configuracoes foi criada
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='configuracoes'").all();
  
  if (tables.length > 0) {
    console.log('✅ Tabela configuracoes criada com sucesso!');
    
    // Verificar estrutura da tabela
    const columns = db.prepare("PRAGMA table_info(configuracoes)").all();
    console.log('\n📋 Estrutura da tabela configuracoes:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
  } else {
    console.log('❌ Tabela configuracoes não encontrada');
  }
  
  // Verificar tabela configuracoes_audit
  const auditTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='configuracoes_audit'").all();
  
  if (auditTables.length > 0) {
    console.log('\n✅ Tabela configuracoes_audit criada com sucesso!');
  } else {
    console.log('\n❌ Tabela configuracoes_audit não encontrada');
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
