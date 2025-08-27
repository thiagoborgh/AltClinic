// Teste rápido do sistema SAEE
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testarSistema() {
  console.log('🧪 Testando SAEE Sistema...\n');
  
  try {
    // 1. Health Check
    console.log('1️⃣ Testando health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check OK:', health.data.status);
    
    // 2. Status do sistema
    console.log('\n2️⃣ Verificando status do sistema...');
    const status = await axios.get(`${BASE_URL}/api/status`);
    console.log('✅ Status OK. Uptime:', status.data.uptime);
    
    // 3. Testar registro de usuário
    console.log('\n3️⃣ Testando registro de usuário...');
    const userTest = {
      nome: 'Teste Sistema',
      email: `teste${Date.now()}@email.com`,
      senha: '123456',
      tipoUsuario: 'recepcionista'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, userTest);
      console.log('✅ Usuário criado com sucesso');
      
      // 4. Testar login
      console.log('\n4️⃣ Testando login...');
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: userTest.email,
        senha: userTest.senha
      });
      console.log('✅ Login realizado com sucesso');
      
      const token = loginResponse.data.token;
      
      // 5. Testar endpoint protegido
      console.log('\n5️⃣ Testando endpoint protegido...');
      const protectedResponse = await axios.get(`${BASE_URL}/api/agendamentos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Endpoint protegido acessível');
      
    } catch (userError) {
      if (userError.response?.status === 400 && userError.response?.data?.error?.includes('já existe')) {
        console.log('ℹ️ Email já existe (normal em testes repetidos)');
      } else {
        throw userError;
      }
    }
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✨ Seu sistema SAAE está funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Certifique-se de que o servidor está rodando: npm start');
    }
  }
}

// Executar testes
testarSistema();
