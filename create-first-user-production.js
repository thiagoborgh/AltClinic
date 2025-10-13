/**
 * Script para criar primeiro usuário em produção
 * Uso: node create-first-user-production.js
 */

const bcrypt = require('bcrypt');
const sqlite3 = require('better-sqlite3');
const path = require('path');

async function createFirstUser() {
  console.log('🚀 Criando primeiro usuário em produção...\n');

  try {
    // Conectar ao banco master
    const masterDbPath = process.env.MASTER_DB_PATH || path.join(__dirname, 'data', 'master.db');
    console.log('📁 Conectando ao banco master:', masterDbPath);
    const masterDb = sqlite3(masterDbPath);

    // Verificar se tenant 'teste' existe
    let tenant = masterDb.prepare('SELECT * FROM tenants WHERE slug = ?').get('teste');
    
    if (!tenant) {
      console.log('⚠️  Tenant "teste" não encontrado. Criando...');
      
      // Criar tenant teste
      const tenantResult = masterDb.prepare(`
        INSERT INTO tenants (nome, slug, database_name, status, trial_end_date, created_at)
        VALUES (?, ?, ?, ?, datetime('now', '+15 days'), datetime('now'))
      `).run('Clínica Teste', 'teste', 'tenant_teste.db', 'trial');
      
      tenant = masterDb.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantResult.lastInsertRowid);
      console.log('✅ Tenant criado:', tenant);
    } else {
      console.log('✅ Tenant encontrado:', tenant);
    }

    // Conectar ao banco do tenant
    const tenantDbPath = path.join(__dirname, 'data', tenant.database_name);
    console.log('📁 Conectando ao banco do tenant:', tenantDbPath);
    const tenantDb = sqlite3(tenantDbPath);

    // Verificar se tabela usuarios existe
    const tableExists = tenantDb.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'
    `).get();

    if (!tableExists) {
      console.log('⚠️  Tabela "usuarios" não encontrada. Criando...');
      
      tenantDb.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          senha TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          ativo INTEGER DEFAULT 1,
          telefone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela "usuarios" criada');
    }

    // Verificar se usuário já existe
    const existingUser = tenantDb.prepare('SELECT * FROM usuarios WHERE email = ?').get('thiagoborgh@gmail.com');

    if (existingUser) {
      console.log('⚠️  Usuário já existe:', existingUser.email);
      console.log('🔄 Atualizando senha...');

      // Hash da senha
      const senhaHash = await bcrypt.hash('Altclinic123', 10);

      // Atualizar senha
      tenantDb.prepare(`
        UPDATE usuarios 
        SET senha = ?, updated_at = datetime('now')
        WHERE email = ?
      `).run(senhaHash, 'thiagoborgh@gmail.com');

      console.log('✅ Senha atualizada com sucesso!');
    } else {
      console.log('➕ Criando novo usuário...');

      // Hash da senha
      const senhaHash = await bcrypt.hash('Altclinic123', 10);

      // Criar usuário
      const result = tenantDb.prepare(`
        INSERT INTO usuarios (nome, email, senha, role, ativo, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run('Thiago Borgh', 'thiagoborgh@gmail.com', senhaHash, 'admin', 1);

      console.log('✅ Usuário criado com ID:', result.lastInsertRowid);
    }

    // Verificar usuário final
    const finalUser = tenantDb.prepare('SELECT id, nome, email, role, ativo FROM usuarios WHERE email = ?').get('thiagoborgh@gmail.com');
    console.log('\n✅ Usuário final:');
    console.log('   ID:', finalUser.id);
    console.log('   Nome:', finalUser.nome);
    console.log('   Email:', finalUser.email);
    console.log('   Role:', finalUser.role);
    console.log('   Ativo:', finalUser.ativo ? 'Sim' : 'Não');

    console.log('\n✅ SUCESSO! Agora você pode fazer login com:');
    console.log('   Email: thiagoborgh@gmail.com');
    console.log('   Senha: Altclinic123');
    console.log('   Tenant: teste');

    masterDb.close();
    tenantDb.close();

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  }
}

// Executar
createFirstUser();
