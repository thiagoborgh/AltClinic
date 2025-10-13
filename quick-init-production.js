/**
 * 🔧 Script RÁPIDO para inicializar sistema em produção
 * 
 * Execute no Shell do Render:
 * node quick-init-production.js
 */

console.log('🚀 INICIANDO SISTEMA...\n');

// Importar inicializador
const ProductionInitializer = require('./src/utils/productionInitializer');

async function init() {
  try {
    // Verificar se já tem tenants
    const hasExisting = ProductionInitializer.hasExistingTenants();
    
    if (hasExisting) {
      console.log('⚠️  Sistema já inicializado!');
      console.log('ℹ️  Use: node create-first-user-production.js para criar usuário adicional');
      process.exit(0);
    }

    console.log('📦 Criando primeiro acesso...');
    const result = await ProductionInitializer.createFirstAccess();

    console.log('\n✅ ========== SUCESSO! ==========');
    console.log('📧 Email:', result.adminEmail);
    console.log('🔑 Senha:', result.adminPassword);
    console.log('🏥 Tenant:', result.tenantSlug);
    console.log('================================\n');
    
    console.log('⚠️  IMPORTANTE: Salve essas credenciais!');
    console.log('🌐 Acesse: https://altclinic.onrender.com');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

init();
