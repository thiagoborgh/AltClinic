const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'saee.db');
console.log(`📂 Abrindo banco: ${dbPath}\n`);

const db = new Database(dbPath);

// Listar todas as tabelas
console.log('═══════════════════════════════════════════════════════════');
console.log('TABELAS DO BANCO MASTER');
console.log('═══════════════════════════════════════════════════════════\n');

const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

if (tables.length === 0) {
  console.log('❌ Nenhuma tabela encontrada!\n');
} else {
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name}`);
    
    // Contar registros
    try {
      const count = db.prepare(`SELECT COUNT(*) as total FROM ${table.name}`).get();
      console.log(`   Registros: ${count.total}`);
    } catch (e) {
      console.log(`   (Erro ao contar registros)`);
    }
    
    console.log('');
  });
}

db.close();
