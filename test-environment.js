#!/usr/bin/env node

/**
 * 🧪 TESTE DE CONFIGURAÇÃO DO AMBIENTE
 * 
 * Este script verifica se todas as variáveis de ambiente
 * estão configuradas corretamente para o sistema de licenças múltiplas
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('\n🔧 TESTE DE CONFIGURAÇÃO DO AMBIENTE ALTCLINIC\n');

// ===========================
// TESTES DE VARIÁVEIS DE AMBIENTE
// ===========================

const requiredVars = [
  'JWT_SECRET',
  'FRONTEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY'
];

const optionalVars = [
  'SMTP_PASS',
  'STRIPE_WEBHOOK_SECRET',
  'ENCRYPTION_KEY'
];

let allConfigured = true;

console.log('📋 VERIFICANDO VARIÁVEIS OBRIGATÓRIAS:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const configured = value && value.length > 0;
  
  console.log(`   ${configured ? '✅' : '❌'} ${varName}: ${configured ? '✓ Configurada' : '✗ NÃO CONFIGURADA'}`);
  
  if (!configured) {
    allConfigured = false;
  }
});

console.log('\n📋 VERIFICANDO VARIÁVEIS OPCIONAIS:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const configured = value && value.length > 0;
  
  console.log(`   ${configured ? '✅' : '⚠️'} ${varName}: ${configured ? '✓ Configurada' : '⚠️ Recomendada'}`);
});

// ===========================
// TESTE JWT
// ===========================

console.log('\n🔐 TESTANDO JWT:');
try {
  const testPayload = {
    userId: 'test-user-id',
    tenantId: 'test-tenant-id',
    licenseId: 'test-license-id',
    role: 'admin'
  };
  
  const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  console.log('   ✅ JWT Token gerado e verificado com sucesso');
  console.log(`   📄 Payload: ${JSON.stringify(decoded, null, 2)}`);
  
} catch (error) {
  console.log('   ❌ Erro no teste JWT:', error.message);
  allConfigured = false;
}

// ===========================
// TESTE STRIPE
// ===========================

console.log('\n💳 TESTANDO STRIPE:');
try {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  console.log('   ✅ Stripe inicializado com sucesso');
  console.log(`   🔑 Chave pública: ${process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 20)}...`);
  console.log(`   🔒 Chave secreta: ${process.env.STRIPE_SECRET_KEY?.substring(0, 20)}...`);
  
} catch (error) {
  console.log('   ❌ Erro no teste Stripe:', error.message);
  allConfigured = false;
}

// ===========================
// TESTE EMAIL
// ===========================

console.log('\n📧 TESTANDO CONFIGURAÇÃO DE EMAIL:');
try {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || 'não-configurada'
    }
  });
  
  console.log('   ✅ Transportador de email configurado');
  console.log(`   📮 SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`   🔢 SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`   👤 SMTP User: ${process.env.SMTP_USER}`);
  console.log(`   🔐 SMTP Pass: ${process.env.SMTP_PASS ? '✓ Configurada' : '❌ NÃO CONFIGURADA'}`);
  
  if (!process.env.SMTP_PASS) {
    console.log('   ⚠️  Configure SMTP_PASS para envio real de emails');
  }
  
} catch (error) {
  console.log('   ❌ Erro no teste de email:', error.message);
}

// ===========================
// TESTE BANCO DE DADOS
// ===========================

console.log('\n🗄️ TESTANDO BANCO DE DADOS:');
try {
  const fs = require('fs');
  const dbPath = process.env.DB_PATH || './saee.db';
  
  if (fs.existsSync(dbPath)) {
    console.log('   ✅ Banco de dados encontrado');
    console.log(`   📁 Caminho: ${dbPath}`);
    
    const stats = fs.statSync(dbPath);
    console.log(`   📊 Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } else {
    console.log('   ⚠️  Banco de dados não encontrado - será criado na primeira execução');
    console.log(`   📁 Caminho esperado: ${dbPath}`);
  }
  
} catch (error) {
  console.log('   ❌ Erro no teste de banco:', error.message);
}

// ===========================
// RESUMO FINAL
// ===========================

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA CONFIGURAÇÃO:');
console.log('='.repeat(60));

if (allConfigured) {
  console.log('🎉 TODAS AS CONFIGURAÇÕES OBRIGATÓRIAS ESTÃO OK!');
  console.log('✅ O sistema está pronto para funcionar');
  console.log('\n🚀 Para iniciar o servidor:');
  console.log('   npm start          # Produção');
  console.log('   npm run dev        # Desenvolvimento');
} else {
  console.log('❌ ALGUMAS CONFIGURAÇÕES PRECISAM SER AJUSTADAS');
  console.log('🔧 Verifique o arquivo .env e configure as variáveis marcadas com ❌');
  console.log('\n📚 Documentação:');
  console.log('   - JWT_SECRET: Chave secreta para tokens (mínimo 32 caracteres)');
  console.log('   - SMTP_PASS: Senha de app do Gmail ou senha do servidor SMTP');
  console.log('   - STRIPE_SECRET_KEY: Chave secreta do painel Stripe');
}

console.log('\n📞 Para suporte técnico:');
console.log('   - Verifique o arquivo SISTEMA_LICENCAS_MULTIPLAS.md');
console.log('   - Consulte os logs do servidor para mais detalhes');
console.log('   - Execute novamente este teste após fazer correções');

console.log('\n' + '='.repeat(60) + '\n');

// Sair com código de erro se algo não estiver configurado
process.exit(allConfigured ? 0 : 1);
