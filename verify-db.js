const Database = require('better-sqlite3');
const db = new Database('./saee-master.db');

console.log('🔍 Verificando tabelas no banco master...');

// Listar todas as tabelas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📋 Tabelas encontradas:', tables.map(t => t.name));

// Verificar estrutura da tabela tenants
if (tables.some(t => t.name === 'tenants')) {
  console.log('✅ Tabela tenants existe');

  const columns = db.prepare("PRAGMA table_info(tenants)").all();
  console.log('📊 Colunas da tabela tenants:');
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });

  // Verificar se há registros
  const count = db.prepare("SELECT COUNT(*) as count FROM tenants").get();
  console.log(`📈 Total de registros na tabela tenants: ${count.count}`);

} else {
  console.log('❌ Tabela tenants não encontrada');
}

db.close();
