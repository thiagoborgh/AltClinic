const http = require('http');

// Testar se o frontend está servindo a página de configurações
function testFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Testando acesso ao frontend...');
    
    const req = http.get('http://localhost:3001/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Status Frontend: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Frontend acessível!');
          resolve(true);
        } else {
          console.log(`❌ Erro no frontend: Status ${res.statusCode}`);
          reject(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Erro de conexão com frontend: ${error.message}`);
      reject(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Timeout na requisição do frontend');
      req.destroy();
      reject(false);
    });
  });
}

// Testar API do backend
function testBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Testando acesso ao backend...');
    
    const req = http.get('http://localhost:3000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Status Backend: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Backend funcionando!');
          resolve(true);
        } else {
          console.log(`❌ Erro no backend: Status ${res.statusCode}`);
          reject(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Erro de conexão com backend: ${error.message}`);
      reject(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Timeout na requisição do backend');
      req.destroy();
      reject(false);
    });
  });
}

async function runIntegrationTest() {
  console.log('🚀 Testando Integração Frontend/Backend...\n');
  
  try {
    // Testar backend primeiro
    await testBackend();
    console.log('');
    
    // Testar frontend
    await testFrontend();
    console.log('');
    
    console.log('🎉 Integração funcionando perfeitamente!');
    console.log('📋 Próximos passos:');
    console.log('   1. Inicie o backend: npm start');
    console.log('   2. Inicie o frontend: cd frontend && npm start');
    console.log('   3. Acesse: http://localhost:3001/configuracoes');
    
  } catch (error) {
    console.log('\n⚠️  Problemas na integração detectados.');
    console.log('💡 Certifique-se de que:');
    console.log('   - Backend está rodando na porta 3000');
    console.log('   - Frontend está rodando na porta 3001');
    console.log('   - Proxy configurado no package.json do frontend');
  }
}

runIntegrationTest().catch(console.error);
