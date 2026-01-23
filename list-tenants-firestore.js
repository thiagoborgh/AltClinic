require('dotenv').config();
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const path = require('path');
  const serviceAccount = require(path.join(__dirname, 'src', 'services', 'firebase-service-account.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listTenants() {
  try {
    console.log('🔍 Buscando tenants no Firestore...\n');
    
    const tenantsSnapshot = await db.collection('tenants')
      .where('status', 'in', ['active', 'trial'])
      .limit(5)
      .get();

    if (tenantsSnapshot.empty) {
      console.log('⚠️  Nenhum tenant encontrado.');
      return null;
    }

    console.log(`✅ Encontrados ${tenantsSnapshot.size} tenants:\n`);
    
    const tenants = [];
    tenantsSnapshot.forEach(doc => {
      const data = doc.data();
      tenants.push({
        id: doc.id,
        nome: data.nome,
        email: data.email,
        status: data.status
      });
      console.log(`  📋 ID: ${doc.id}`);
      console.log(`     Nome: ${data.nome}`);
      console.log(`     Email: ${data.email}`);
      console.log(`     Status: ${data.status}\n`);
    });

    return tenants[0]; // Retornar o primeiro tenant

  } catch (error) {
    console.error('❌ Erro ao buscar tenants:', error);
    return null;
  }
}

listTenants().then(tenant => {
  if (tenant) {
    console.log(`\n✅ Use este tenant para testes: ${tenant.id}`);
  }
  process.exit(0);
});
