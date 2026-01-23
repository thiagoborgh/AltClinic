/**
 * Script para popular dados iniciais no Firebase Firestore
 */

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  try {
    // Em desenvolvimento, tenta usar arquivo de credenciais local
    const serviceAccount = require('./src/services/firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('✅ Firebase Admin inicializado com service account local');
  } catch (error) {
    // Se não tiver arquivo local, usa credenciais padrão
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'meu-app-de-clinica'
    });
    console.log('✅ Firebase Admin inicializado com credenciais padrão');
  }
}

const db = admin.firestore();

async function popularDadosTeste() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('POPULANDO DADOS DE TESTE NO FIRESTORE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Criar tenant de teste
    console.log('📋 1. Criando tenant de teste...');
    
    const tenantData = {
      nome: 'Clínica Teste',
      slug: 'clinica-teste',
      status: 'active',
      tipo: 'trial',
      database_name: 'tenant_clinica_teste',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Verificar se já existe
    const existingTenant = await db.collection('tenants')
      .where('slug', '==', 'clinica-teste')
      .limit(1)
      .get();

    let tenantId;
    
    if (!existingTenant.empty) {
      tenantId = existingTenant.docs[0].id;
      console.log(`   ⚠️  Tenant já existe (ID: ${tenantId})`);
    } else {
      const tenantRef = await db.collection('tenants').add(tenantData);
      tenantId = tenantRef.id;
      console.log(`   ✅ Tenant criado (ID: ${tenantId})`);
    }

    // 2. Criar usuário admin
    console.log('\n📋 2. Criando usuário administrador...');
    
    const senhaPlain = 'Senha@123';
    const senhaHash = await bcrypt.hash(senhaPlain, 10);

    const userData = {
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senha_hash: senhaHash,
      papel: 'admin',
      ativo: true,
      telefone: '11999999999',
      tenant_id: tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Verificar se já existe
    const existingUser = await db.collection('tenants')
      .doc(tenantId)
      .collection('usuarios')
      .where('email', '==', 'admin@teste.com')
      .limit(1)
      .get();

    if (!existingUser.empty) {
      console.log('   ⚠️  Usuário já existe, atualizando senha...');
      await db.collection('tenants')
        .doc(tenantId)
        .collection('usuarios')
        .doc(existingUser.docs[0].id)
        .update({
          senha_hash: senhaHash,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      console.log('   ✅ Senha atualizada');
    } else {
      const userRef = await db.collection('tenants')
        .doc(tenantId)
        .collection('usuarios')
        .add(userData);
      console.log(`   ✅ Usuário criado (ID: ${userRef.id})`);
    }

    // 3. Mostrar dados de acesso
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ DADOS POPULADOS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 CREDENCIAIS DE ACESSO:');
    console.log(`   🏥 Tenant: Clínica Teste`);
    console.log(`   🔗 Slug: clinica-teste`);
    console.log(`   📧 Email: admin@teste.com`);
    console.log(`   🔑 Senha: ${senhaPlain}`);
    console.log(`\n   🌐 URL: http://localhost:3001/#/clinica-teste/login`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
    throw error;
  }
}

// Executar
popularDadosTeste()
  .then(() => {
    console.log('✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
