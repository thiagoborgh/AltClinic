const Database = require('better-sqlite3');
const db = new Database('./saee-master.db');

console.log('🔄 Executando migração manual das colunas de licença...');

try {
  // Verificar se as colunas já existem
  const columns = db.prepare("PRAGMA table_info(tenants)").all();
  const columnNames = columns.map(col => col.name);

  console.log('📊 Colunas existentes:', columnNames);

  const newColumns = [
    { name: 'cnpj_cpf', type: 'TEXT' },
    { name: 'chave_licenca', type: 'TEXT' },
    { name: 'responsavel_nome', type: 'TEXT' },
    { name: 'responsavel_email', type: 'TEXT' }
  ];

  for (const column of newColumns) {
    if (!columnNames.includes(column.name)) {
      console.log(`➕ Adicionando coluna ${column.name}...`);
      db.exec(`ALTER TABLE tenants ADD COLUMN ${column.name} ${column.type}`);
      console.log(`✅ Coluna ${column.name} adicionada com sucesso`);
    } else {
      console.log(`✅ Coluna ${column.name} já existe`);
    }
  }

  // Criar índice único para chave_licenca se não existir
  try {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tenants'").all();
    const indexNames = indexes.map(idx => idx.name);

    if (!indexNames.includes('idx_tenants_chave_licenca_unique')) {
      console.log('🔗 Criando índice único para chave_licenca...');
      db.exec(`CREATE UNIQUE INDEX idx_tenants_chave_licenca_unique ON tenants(chave_licenca)`);
      console.log('✅ Índice único criado com sucesso');
    } else {
      console.log('✅ Índice único para chave_licenca já existe');
    }
  } catch (indexError) {
    console.log('⚠️ Índice único pode já existir ou há dados duplicados');
  }

  // Verificar resultado final
  const finalColumns = db.prepare("PRAGMA table_info(tenants)").all();
  console.log('📊 Colunas finais:', finalColumns.map(col => col.name));

  console.log('✅ Migração concluída com sucesso!');

} catch (error) {
  console.error('❌ Erro na migração:', error);
} finally {
  db.close();
}
