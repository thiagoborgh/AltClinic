const dbManager = require('../src/models/database');

try {
  const db = dbManager.getDb();
  
  console.log('📝 Executando migração de configurações...');
  
  // Executar comando por comando
  const commands = [
    // Tabela principal de configurações
    `CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinica_id INTEGER NOT NULL,
      secao VARCHAR(100) NOT NULL,
      chave VARCHAR(100) NOT NULL,
      valor TEXT,
      descricao TEXT,
      tipo_valor VARCHAR(20) DEFAULT 'string',
      obrigatorio BOOLEAN DEFAULT 0,
      criptografado BOOLEAN DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE,
      UNIQUE(clinica_id, secao, chave)
    )`,
    
    // Tabela de auditoria
    `CREATE TABLE IF NOT EXISTS configuracoes_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      configuracao_id INTEGER NOT NULL,
      usuario_id INTEGER,
      acao VARCHAR(50) NOT NULL,
      valor_anterior TEXT,
      valor_novo TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT,
      FOREIGN KEY (configuracao_id) REFERENCES configuracoes(id) ON DELETE CASCADE
    )`,
    
    // Índices
    'CREATE INDEX IF NOT EXISTS idx_configuracoes_clinica ON configuracoes(clinica_id)',
    'CREATE INDEX IF NOT EXISTS idx_configuracoes_secao ON configuracoes(secao)',
    'CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave)'
  ];
  
  db.transaction(() => {
    commands.forEach((command, index) => {
      try {
        db.exec(command);
        console.log(`✅ Comando ${index + 1}/${commands.length} executado`);
      } catch (error) {
        console.error(`❌ Erro no comando ${index + 1}:`, error.message);
        throw error;
      }
    });
  })();
  
  console.log('✅ Migração de configurações executada com sucesso!');
  
  // Verificar se as tabelas foram criadas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('configuracoes', 'configuracoes_audit')").all();
  console.log(`\n📋 Tabelas criadas: ${tables.map(t => t.name).join(', ')}`);
  
  // Registrar a migração como executada
  db.prepare('INSERT OR IGNORE INTO migrations (filename) VALUES (?)').run('003_configuracoes.sql');
  console.log('📝 Migração registrada no histórico');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
