// 🧪 Teste do Sistema de Gerenciamento de Sessões
const sessionManager = require('./src/middleware/sessionManager');

console.log('🧪 Testando Sistema de Gerenciamento de Sessões');
console.log('==================================================');

async function testSessionManager() {
  try {
    // Teste 1: Primeira sessão
    console.log('\n1️⃣ Teste: Primeira sessão');
    const session1 = await sessionManager.createOrCheckSession(1, '192.168.1.100', 'Chrome/Browser');
    console.log('✅ Resultado:', session1);

    // Teste 2: Mesma sessão (mesmo IP)
    console.log('\n2️⃣ Teste: Mesma sessão (mesmo IP)');
    const session2 = await sessionManager.createOrCheckSession(1, '192.168.1.100', 'Chrome/Browser');
    console.log('✅ Resultado:', session2);

    // Teste 3: IP diferente (conflito)
    console.log('\n3️⃣ Teste: IP diferente (deve detectar conflito)');
    const session3 = await sessionManager.createOrCheckSession(1, '192.168.1.200', 'Firefox/Browser');
    console.log('⚠️ Resultado:', session3);

    // Teste 4: Verificar sessões do usuário
    console.log('\n4️⃣ Teste: Listar sessões do usuário');
    const userSessions = sessionManager.getUserSessions(1);
    console.log('📋 Sessões ativas:', userSessions);

    // Teste 5: Remover outras sessões
    console.log('\n5️⃣ Teste: Remover outras sessões');
    const logout = await sessionManager.logoutOtherSessions(1, session1.sessionId);
    console.log('🔐 Logout resultado:', logout);

    // Teste 6: Verificar sessões após logout
    console.log('\n6️⃣ Teste: Sessões após logout');
    const sessionsAfter = sessionManager.getUserSessions(1);
    console.log('📋 Sessões restantes:', sessionsAfter);

    // Teste 7: Estatísticas
    console.log('\n7️⃣ Teste: Estatísticas do sistema');
    const stats = sessionManager.getStats();
    console.log('📊 Estatísticas:', stats);

    console.log('\n✅ Todos os testes concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

testSessionManager();
