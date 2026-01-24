// Global setup para testes E2E
// Executado antes de todos os testes

async function globalSetup() {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  // Verificar se o servidor está rodando
  try {
    const response = await fetch('http://localhost:3000/health');
    if (!response.ok) {
      throw new Error('Servidor não está respondendo');
    }
    console.log('✅ Servidor está rodando');
  } catch (error) {
    console.log('❌ Servidor não está rodando. Iniciando...');

    // Aqui você pode adicionar código para iniciar o servidor automaticamente
    // Por exemplo, usando child_process.spawn

    console.log('⚠️ Por favor, inicie o servidor manualmente com: npm run dev');
    console.log('⚠️ E aguarde até que esteja totalmente carregado antes de executar os testes');
  }

  // Preparar dados de teste
  console.log('📝 Preparando dados de teste...');

  // Você pode adicionar aqui código para preparar dados de teste
  // como criar usuários, tenants, etc.

  console.log('✅ Setup global concluído');
}

export default globalSetup;