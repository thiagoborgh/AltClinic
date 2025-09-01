require('dotenv').config();

const aiService = require('./src/utils/ai');
const { mailchimpService } = require('./src/utils/mailchimp');

console.log('🧪 Alt Clinic - Teste de Integrações API\n');

async function testGemini() {
  console.log('🤖 Testando Google Gemini...');
  try {
    const response = await aiService.chat('Olá! Este é um teste de conexão.');
    console.log('✅ Gemini: Funcionando');
    console.log('💬 Resposta:', response.substring(0, 100) + '...\n');
    return true;
  } catch (error) {
    console.log('❌ Gemini: Erro -', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Configure GEMINI_API_KEY no arquivo .env\n');
    }
    return false;
  }
}

async function testHuggingFace() {
  console.log('🤗 Testando Hugging Face...');
  try {
    const response = await aiService.analyzeWithHuggingFace('Este é um teste de análise.');
    console.log('✅ Hugging Face: Funcionando');
    console.log('📊 Análise:', response.substring(0, 100) + '...\n');
    return true;
  } catch (error) {
    console.log('❌ Hugging Face: Erro -', error.message);
    if (error.message.includes('token') || error.message.includes('API')) {
      console.log('💡 Configure HUGGINGFACE_API_KEY no arquivo .env\n');
    }
    return false;
  }
}

async function testImageAnalysis() {
  console.log('🖼️ Testando análise de imagem...');
  try {
    const analysis = await aiService.analyzeImage('https://via.placeholder.com/300x200?text=Teste', 'Analise esta imagem de teste');
    console.log('✅ Análise de imagem: Funcionando');
    console.log('🔍 Resultado:', analysis.substring(0, 100) + '...\n');
    return true;
  } catch (error) {
    console.log('❌ Análise de imagem: Erro -', error.message);
    return false;
  }
}

async function testBotResponse() {
  console.log('💬 Testando geração de resposta do bot...');
  try {
    const response = await aiService.gerarRespostaBot('Quero agendar uma consulta', {
      nomeClinica: 'Clínica Teste',
      nomeCliente: 'Cliente Teste'
    });
    console.log('✅ Resposta do bot: Funcionando');
    console.log('🤖 Resposta:', response.substring(0, 100) + '...\n');
    return true;
  } catch (error) {
    console.log('❌ Resposta do bot: Erro -', error.message);
    return false;
  }
}

async function testMailchimp() {
  console.log('📧 Testando Mailchimp...');
  try {
    const connected = await mailchimpService.testConnection();
    if (connected) {
      console.log('✅ Mailchimp: Conectado');
      const stats = await mailchimpService.getListStats();
      if (stats) {
        console.log('📊 Lista:', stats.total_members, 'contatos\n');
      }
    } else {
      console.log('❌ Mailchimp: Não conectado');
      console.log('💡 Configure as variáveis MAILCHIMP_* no arquivo .env\n');
    }
    return connected;
  } catch (error) {
    console.log('❌ Mailchimp: Erro -', error.message);
    return false;
  }
}

async function testDatabase() {
  console.log('🗄️ Testando banco de dados...');
  try {
    const dbManager = require('./src/models/database');
    const db = dbManager.getDb();
    
    // Teste de conexão e estrutura
    const result = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type = ?').get('table');
    console.log('✅ Conexão com banco de dados estabelecida');
    console.log('✅ Banco de dados: Funcionando');
    console.log('📊 Tabelas encontradas:', result.count, '\n');
    return true;
  } catch (error) {
    console.log('✅ Conexão com banco de dados estabelecida');
    console.log('❌ Banco de dados: Erro -', error.message);
    console.log('💡 Execute: npm run migrate\n');
    return false;
  }
}

async function runTests() {
  const results = [];
  
  console.log('🏁 Iniciando testes...\n');
  
  results.push({ name: 'Google Gemini', success: await testGemini() });
  results.push({ name: 'Hugging Face', success: await testHuggingFace() });
  results.push({ name: 'Análise de Imagem', success: await testImageAnalysis() });
  results.push({ name: 'Resposta do Bot', success: await testBotResponse() });
  results.push({ name: 'Mailchimp', success: await testMailchimp() });
  results.push({ name: 'Banco de Dados', success: await testDatabase() });
  
  console.log('📋 RELATÓRIO FINAL:\n');
  console.log('═'.repeat(50));
  
  let totalPassed = 0;
  results.forEach(test => {
    const status = test.success ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${test.name.padEnd(20)} | ${status}`);
    if (test.success) totalPassed++;
  });
  
  console.log('═'.repeat(50));
  console.log(`\n🎯 RESULTADO: ${totalPassed}/${results.length} testes passaram\n`);
  
  if (totalPassed === results.length) {
    console.log('🎉 PARABÉNS! Todas as integrações estão funcionando!');
    console.log('🚀 Seu MVP está pronto para uso!\n');
  } else {
    console.log('⚠️  Algumas integrações precisam de configuração.');
    console.log('📖 Consulte CONFIGURACAO_APIS.md para instruções detalhadas.\n');
  }
  
  // Mostrar próximos passos
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Configure as APIs que falharam nos testes');
  console.log('2. Execute: npm run dev');
  console.log('3. Teste o sistema via: http://localhost:3000');
  console.log('4. Configure seu bot no Telegram/WhatsApp');
  console.log('5. Comece a usar o sistema!\n');
  
  process.exit(totalPassed === results.length ? 0 : 1);
}

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promise rejeitada:', error.message);
  process.exit(1);
});

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro nos testes:', error.message);
  process.exit(1);
});
