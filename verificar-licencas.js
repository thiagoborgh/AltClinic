const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'saee-master.db');
console.log(`📂 Abrindo banco: ${dbPath}\n`);

const db = new Database(dbPath);

// Listar tabelas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📋 Tabelas:', tables.map(t => t.name).join(', '));

// Buscar licenças/tenants
console.log('\n═══════════════════════════════════════════════════════════');
console.log('LICENÇAS/TENANTS REGISTRADOS');
console.log('═══════════════════════════════════════════════════════════\n');

try {
  const tenants = db.prepare("SELECT * FROM tenants WHERE status = 'ativo' ORDER BY created_at DESC LIMIT 10").all();
  
  if (tenants.length === 0) {
    console.log('❌ Nenhum tenant ativo encontrado!');
  } else {
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.nome || 'Sem nome'}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Slug: ${tenant.slug}`);
      console.log(`   Database: ${tenant.database_name}`);
      console.log(`   Domínio: ${tenant.dominio_personalizado || 'N/A'}`);
      console.log(`   Status: ${tenant.status}`);
      console.log('');
    });
  }
} catch (e) {
  console.error('❌ Erro:', e.message);
}

db.close();
