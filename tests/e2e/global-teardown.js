// Global teardown para testes E2E
// Executado após todos os testes

async function globalTeardown() {
  console.log('🧹 Iniciando limpeza global dos testes E2E...');

  // Limpar dados de teste
  console.log('🗑️ Limpando dados de teste...');

  try {
    // Aqui você pode adicionar código para limpar dados de teste
    // como remover usuários temporários, limpar bancos de dados, etc.

    console.log('✅ Dados de teste limpos');
  } catch (error) {
    console.log('⚠️ Erro ao limpar dados de teste:', error.message);
  }

  // Gerar relatório final
  console.log('📊 Gerando relatório final...');

  // Você pode adicionar código para gerar relatórios customizados aqui

  console.log('✅ Teardown global concluído');
}

export default globalTeardown;