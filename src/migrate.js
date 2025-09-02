#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Função para executar migrações
async function executarMigracoes() {
  const dbPath = path.join(__dirname, '..', 'saee.db');
  const migrationsDir = path.join(__dirname, 'database', 'migrations');
  
  console.log('🔄 Iniciando migrações do banco de dados...');
  console.log(`📂 Diretório de migrações: ${migrationsDir}`);
  console.log(`📊 Banco de dados: ${dbPath}`);
  
  // Conectar ao banco
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Criar tabela de controle de migrações se não existir
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome VARCHAR(255) NOT NULL UNIQUE,
          executado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Ler arquivos de migração
    const arquivosMigracao = fs.readdirSync(migrationsDir)
      .filter(arquivo => arquivo.endsWith('.sql'))
      .sort();
    
    console.log(`📋 Encontradas ${arquivosMigracao.length} migrações:`);
    arquivosMigracao.forEach(arquivo => console.log(`   - ${arquivo}`));
    
    // Verificar quais migrações já foram executadas
    const migracaoExecutadas = await new Promise((resolve, reject) => {
      db.all('SELECT filename FROM migrations', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.filename));
      });
    });
    
    console.log(`✅ Migrações já executadas: ${migracaoExecutadas.length}`);
    
    // Executar migrações pendentes
    for (const arquivo of arquivosMigracao) {
      if (!migracaoExecutadas.includes(arquivo)) {
        console.log(`🔄 Executando migração: ${arquivo}`);
        
        const caminhoArquivo = path.join(migrationsDir, arquivo);
        const sql = fs.readFileSync(caminhoArquivo, 'utf8');
        
        // Dividir por comandos (separados por ;)
        const comandos = sql.split(';').filter(cmd => cmd.trim().length > 0);
        
        await new Promise((resolve, reject) => {
          db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            let erro = null;
            let comandosExecutados = 0;
            
            comandos.forEach((comando, index) => {
              if (erro) return;
              
              db.run(comando.trim(), (err) => {
                if (err) {
                  erro = err;
                  console.error(`❌ Erro no comando ${index + 1} da migração ${arquivo}:`, err.message);
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }
                
                comandosExecutados++;
                
                if (comandosExecutados === comandos.length) {
                  // Registrar migração como executada
                  db.run('INSERT INTO migrations (filename) VALUES (?)', [arquivo], (err) => {
                    if (err) {
                      console.error(`❌ Erro ao registrar migração ${arquivo}:`, err.message);
                      db.run('ROLLBACK');
                      reject(err);
                      return;
                    }
                    
                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error(`❌ Erro ao fazer commit da migração ${arquivo}:`, err.message);
                        reject(err);
                      } else {
                        console.log(`✅ Migração ${arquivo} executada com sucesso`);
                        resolve();
                      }
                    });
                  });
                }
              });
            });
          });
        });
      } else {
        console.log(`⏭️ Migração ${arquivo} já foi executada`);
      }
    }
    
    console.log('🎉 Todas as migrações foram executadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a execução das migrações:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Função para criar migração
function criarMigracao(nome) {
  if (!nome) {
    console.error('❌ Nome da migração é obrigatório');
    console.log('📝 Uso: npm run migrate:create <nome-da-migracao>');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const nomeArquivo = `${timestamp}_${nome.replace(/\s+/g, '_').toLowerCase()}.sql`;
  const caminhoArquivo = path.join(__dirname, 'database', 'migrations', nomeArquivo);
  
  const template = `-- Migração: ${nome}
-- Criado em: ${new Date().toISOString()}

-- Adicionar suas alterações SQL aqui
-- Exemplo:
-- CREATE TABLE IF NOT EXISTS nova_tabela (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     nome VARCHAR(255) NOT NULL,
--     criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- Lembre-se de:
-- 1. Usar IF NOT EXISTS para CREATE TABLE
-- 2. Usar IF NOT EXISTS para CREATE INDEX
-- 3. Testar a migração antes de aplicar em produção
-- 4. Fazer backup do banco antes de aplicar em produção
`;

  // Criar diretório se não existir
  const migrationsDir = path.dirname(caminhoArquivo);
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  fs.writeFileSync(caminhoArquivo, template);
  console.log(`✅ Migração criada: ${caminhoArquivo}`);
}

// Função para mostrar status das migrações
async function statusMigracoes() {
  const dbPath = path.join(__dirname, '..', 'saee.db');
  const migrationsDir = path.join(__dirname, 'database', 'migrations');
  
  console.log('📊 Status das migrações:');
  console.log(`📂 Diretório: ${migrationsDir}`);
  console.log(`📊 Banco: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Banco de dados não encontrado');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Verificar se tabela de migrações existe
    const tabelaExiste = await new Promise((resolve) => {
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'",
        (err, row) => {
          resolve(!!row);
        }
      );
    });
    
    if (!tabelaExiste) {
      console.log('❌ Tabela de migrações não encontrada. Execute as migrações primeiro.');
      return;
    }
    
    // Buscar migrações executadas
    const migracaoExecutadas = await new Promise((resolve, reject) => {
      db.all('SELECT nome, executado_em FROM migrations ORDER BY executado_em', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Listar arquivos de migração
    const arquivosMigracao = fs.existsSync(migrationsDir) 
      ? fs.readdirSync(migrationsDir).filter(arquivo => arquivo.endsWith('.sql')).sort()
      : [];
    
    console.log('\n📋 Migrações disponíveis:');
    arquivosMigracao.forEach(arquivo => {
      const executada = migracaoExecutadas.find(m => m.nome === arquivo);
      const status = executada ? '✅ Executada' : '⏳ Pendente';
      const data = executada ? ` (${executada.executado_em})` : '';
      console.log(`   ${status} ${arquivo}${data}`);
    });
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Total de migrações: ${arquivosMigracao.length}`);
    console.log(`   Executadas: ${migracaoExecutadas.length}`);
    console.log(`   Pendentes: ${arquivosMigracao.length - migracaoExecutadas.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
  } finally {
    db.close();
  }
}

// CLI
const comando = process.argv[2];
const argumento = process.argv[3];

switch (comando) {
  case 'up':
  case 'run':
    executarMigracoes();
    break;
    
  case 'create':
    criarMigracao(argumento);
    break;
    
  case 'status':
    statusMigracoes();
    break;
    
  default:
    console.log('📚 Comandos disponíveis:');
    console.log('   npm run migrate        - Executar migrações pendentes');
    console.log('   npm run migrate:create <nome> - Criar nova migração');
    console.log('   npm run migrate:status - Ver status das migrações');
    console.log('');
    console.log('📝 Exemplos:');
    console.log('   npm run migrate:create "adicionar tabela usuarios"');
    console.log('   npm run migrate:status');
    break;
}

module.exports = {
  executarMigracoes,
  criarMigracao,
  statusMigracoes
};
