const dbManager = require('../src/models/database');
const fs = require('fs');
const path = require('path');

try {
  const db = dbManager.getDb();
  
  // Ler o arquivo de migração corrigido
  const migrationPath = path.join(__dirname, '../src/database/migrations/003_configuracoes_fixed.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📝 Executando migração de configurações corrigida...');
  
  // Dividir por comandos e executar
  const commands = sqlContent.split(';').filter(cmd => cmd.trim().length > 0);
  
  db.transaction(() => {
    commands.forEach((command, index) => {
      const trimmedCommand = command.trim();
      if (trimmedCommand) {
        try {
          db.exec(trimmedCommand);
          console.log(`✅ Comando ${index + 1}/${commands.length} executado`);
        } catch (error) {
          console.error(`❌ Erro no comando ${index + 1}:`, error.message);
          console.log(`Comando: ${trimmedCommand.substring(0, 100)}...`);
          throw error;
        }
      }
    });
  })();
  
  console.log('✅ Migração de configurações executada com sucesso!');
  
  // Verificar se as tabelas foram criadas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('configuracoes', 'configuracoes_audit', 'procedimentos', 'equipamentos')").all();
  console.log(`\n📋 Tabelas criadas: ${tables.map(t => t.name).join(', ')}`);
  
  // Registrar a migração como executada
  db.prepare('INSERT OR IGNORE INTO migrations (filename) VALUES (?)').run('003_configuracoes.sql');
  console.log('📝 Migração registrada no histórico');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
