const dbManager = require('./src/models/database');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando migração de imagens...');

try {
  const migrationFile = path.join(__dirname, 'src/migrations/005_create_prontuario_imagem.sql');
  console.log('📄 Lendo arquivo:', migrationFile);
  
  if (!fs.existsSync(migrationFile)) {
    throw new Error('Arquivo de migração não encontrado: ' + migrationFile);
  }
  
  const sql = fs.readFileSync(migrationFile, 'utf8');
  console.log('📖 SQL carregado, executando...');

  const db = dbManager.getDb();
  db.exec(sql);
  console.log('✅ Migração de imagens executada com sucesso!');

  // Verificar se a tabela foi criada
  const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='prontuario_imagem'`).get();
  console.log('Tabela prontuario_imagem:', result ? '✅ Existe' : '❌ Não existe');

  // Mostrar estrutura da tabela se existir
  if (result) {
    const structure = db.prepare(`PRAGMA table_info(prontuario_imagem)`).all();
    console.log('Estrutura da tabela:');
    structure.forEach(col => console.log(`- ${col.name}: ${col.type}`));
  }
} catch (error) {
  console.error('❌ Erro na migração:', error.message);
  console.error('Stack:', error.stack);
}
