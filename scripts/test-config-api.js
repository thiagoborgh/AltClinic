const http = require('http');

// Função para fazer requisição GET
function testAPI(endpoint, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Testando: ${description}`);
    console.log(`📡 Endpoint: GET ${endpoint}`);
    
    const req = http.get(`http://localhost:3000${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`✅ Sucesso! Dados recebidos:`, JSON.stringify(jsonData, null, 2).substring(0, 200) + '...');
            resolve(jsonData);
          } catch (error) {
            console.log(`✅ Sucesso! Resposta: ${data.substring(0, 100)}...`);
            resolve(data);
          }
        } else {
          console.log(`❌ Erro: ${data}`);
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Erro de conexão: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ Timeout na requisição`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function runTests() {
  console.log('🚀 Testando APIs de Configuração...\n');
  
  const tests = [
    { endpoint: '/health', description: 'Health Check Global' },
    { endpoint: '/api/configuracoes/health', description: 'Health Check Configurações' },
    { endpoint: '/api/configuracoes', description: 'Listar todas as configurações' },
    { endpoint: '/api/configuracoes/whatsapp', description: 'Configurações do WhatsApp' },
    { endpoint: '/api/configuracoes/pix', description: 'Configurações do PIX' },
    { endpoint: '/api/configuracoes/ai', description: 'Configurações de IA' }
  ];
  
  let successCount = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      await testAPI(test.endpoint, test.description);
      successCount++;
    } catch (error) {
      // Erro já foi logado na função testAPI
    }
  }
  
  console.log(`\n📊 Resumo dos Testes:`);
  console.log(`✅ Sucessos: ${successCount}/${totalTests}`);
  console.log(`❌ Falhas: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log(`\n🎉 Todos os testes passaram! API funcionando corretamente.`);
  } else {
    console.log(`\n⚠️  Alguns testes falharam. Verifique os logs acima.`);
  }
}

runTests().catch(console.error);
