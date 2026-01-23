const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Conectar ao banco master
const masterDb = new Database(path.join(__dirname, 'saee.db'));

// Listar tenants disponíveis
console.log('═══════════════════════════════════════════════════════════');
console.log('TENANTS DISPONÍVEIS NO SISTEMA');
console.log('═══════════════════════════════════════════════════════════\n');

const tenants = masterDb.prepare(`
  SELECT id, nome, slug, database_name, dominio_personalizado, status, created_at
  FROM tenants 
  WHERE status = 'ativo'
  ORDER BY created_at DESC
`).all();

if (tenants.length === 0) {
  console.log('❌ Nenhum tenant encontrado!');
  process.exit(1);
}

tenants.forEach((tenant, index) => {
  console.log(`${index + 1}. ${tenant.nome}`);
  console.log(`   ID: ${tenant.id}`);
  console.log(`   Slug: ${tenant.slug}`);
  console.log(`   Database: ${tenant.database_name}`);
  console.log(`   Status: ${tenant.status}`);
  console.log(`   Criado em: ${new Date(tenant.created_at).toLocaleString('pt-BR')}`);
  console.log('');
});

// Escolher o primeiro tenant para criar usuário de teste
const tenant = tenants[0];
console.log(`\n✅ Usando tenant: ${tenant.nome} (${tenant.slug})`);
console.log(`   Database: ${tenant.database_name}\n`);

// Conectar ao banco do tenant
const tenantDbPath = path.join(__dirname, 'data', tenant.database_name);
console.log(`🔗 Conectando em: ${tenantDbPath}`);

try {
  const tenantDb = new Database(tenantDbPath);

  // Verificar usuários existentes
  console.log('\n📋 USUÁRIOS EXISTENTES:');
  const usuarios = tenantDb.prepare('SELECT id, nome, email, papel, ativo FROM usuarios').all();
  
  if (usuarios.length === 0) {
    console.log('   Nenhum usuário encontrado.');
  } else {
    usuarios.forEach(u => {
      console.log(`   - ${u.nome} (${u.email}) - ${u.papel} - ${u.ativo ? 'Ativo' : 'Inativo'}`);
    });
  }

  // Criar usuário de teste
  console.log('\n🔧 CRIANDO USUÁRIO DE TESTE...\n');

  const senhaPlain = 'Senha@123';
  const senhaHash = bcrypt.hashSync(senhaPlain, 10);

  const usuarioTeste = {
    nome: 'Admin Teste',
    email: 'admin@teste.com',
    senha_hash: senhaHash,
    papel: 'admin',
    ativo: 1,
    telefone: '11999999999'
  };

  try {
    // Verificar se já existe
    const existente = tenantDb.prepare('SELECT id FROM usuarios WHERE email = ?').get(usuarioTeste.email);
    
    if (existente) {
      console.log(`⚠️  Usuário ${usuarioTeste.email} já existe. Atualizando senha...`);
      
      tenantDb.prepare(`
        UPDATE usuarios 
        SET senha_hash = ?, ativo = 1, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `).run(senhaHash, usuarioTeste.email);
      
      console.log('✅ Senha atualizada com sucesso!');
    } else {
      tenantDb.prepare(`
        INSERT INTO usuarios (nome, email, senha_hash, papel, ativo, telefone, tenant_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        usuarioTeste.nome,
        usuarioTeste.email,
        usuarioTeste.senha_hash,
        usuarioTeste.papel,
        usuarioTeste.ativo,
        usuarioTeste.telefone,
        tenant.id
      );
      
      console.log('✅ Usuário criado com sucesso!');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('CREDENCIAIS DE ACESSO');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`🏥 Tenant: ${tenant.nome}`);
    console.log(`🔗 Slug: ${tenant.slug}`);
    console.log(`📧 Email: ${usuarioTeste.email}`);
    console.log(`🔑 Senha: ${senhaPlain}`);
    console.log(`\n🌐 URL de Login: http://localhost:3001/#/${tenant.slug}/login`);
    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
  }

  tenantDb.close();

} catch (error) {
  console.error(`❌ Erro ao conectar no banco do tenant: ${error.message}`);
  console.log('\n💡 Possível solução: O banco de dados do tenant pode não existir.');
  console.log(`   Tente criar o banco manualmente ou registrar novamente o tenant.\n`);
}

masterDb.close();
