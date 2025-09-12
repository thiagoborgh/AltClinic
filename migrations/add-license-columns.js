const Database = require('better-sqlite3');
const path = require('path');

/**
 * Migração para adicionar colunas de licença na tabela tenants
 */
function migrateTenantsTable() {
  const masterDbPath = path.join(__dirname, '../../saee-master.db');

  try {
    const db = new Database(masterDbPath);

    console.log('🔄 Iniciando migração da tabela tenants...');

    // Verificar se as colunas já existem
    const columns = db.prepare("PRAGMA table_info(tenants)").all();
    const columnNames = columns.map(col => col.name);

    const newColumns = [
      { name: 'cnpj_cpf', type: 'TEXT' },
      { name: 'chave_licenca', type: 'TEXT UNIQUE' },
      { name: 'responsavel_nome', type: 'TEXT' },
      { name: 'responsavel_email', type: 'TEXT' }
    ];

    for (const column of newColumns) {
      if (!columnNames.includes(column.name)) {
        console.log(`➕ Adicionando coluna ${column.name}...`);
        db.exec(`ALTER TABLE tenants ADD COLUMN ${column.name} ${column.type}`);
      } else {
        console.log(`✅ Coluna ${column.name} já existe`);
      }
    }

    db.close();
    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateTenantsTable();
}

module.exports = { migrateTenantsTable };
