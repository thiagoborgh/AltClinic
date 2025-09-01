#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Alt Clinic - Setup Inicial\n');
console.log('Este script irá configurar seu ambiente inicial do Alt Clinic.\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('📋 Configuração do ambiente...\n');

  // Verificar se .env já existe
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('❓ Arquivo .env já existe. Sobrescrever? (s/N): ');
    if (overwrite.toLowerCase() !== 's' && overwrite.toLowerCase() !== 'sim') {
      console.log('✅ Mantendo configuração existente.');
      rl.close();
      return;
    }
  }

  // Gerar chaves seguras
  console.log('🔐 Gerando chaves de segurança...');
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const encryptionKey = crypto.randomBytes(32).toString('hex');

  // Coletar configurações básicas
  const port = await question('🌐 Porta do servidor (padrão: 3000): ') || '3000';
  const dbPath = await question('💾 Caminho do banco de dados (padrão: ./saee.db): ') || './saee.db';
  
  console.log('\n🤖 Configuração de APIs externas (opcional):');
  const claudeKey = await question('🧠 Claude API Key (opcional): ');
  const telegramToken = await question('📱 Telegram Bot Token (opcional): ');
  const mailchimpKey = await question('📧 Mailchimp API Key (opcional): ');
  const mailchimpListId = await question('📧 Mailchimp List ID (opcional): ');

  // Criar arquivo .env
  const envContent = `# ===========================
# CONFIGURAÇÕES DO SERVIDOR
# ===========================
PORT=${port}
NODE_ENV=development

# ===========================
# BANCO DE DADOS
# ===========================
DB_PATH=${dbPath}

# ===========================
# SEGURANÇA E AUTENTICAÇÃO
# ===========================
JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}

# ===========================
# CONFIGURAÇÕES CRM
# ===========================
DIAS_INATIVO=90
DIAS_SPAM_PROTECTION=30

# ===========================
# INTEGRAÇÃO COM IA (CLAUDE)
# ===========================
CLAUDE_API_KEY=${claudeKey}

# ===========================
# BOT WHATSAPP
# ===========================
WHATSAPP_SESSION_PATH=./whatsapp-session

# ===========================
# BOT TELEGRAM
# ===========================
TELEGRAM_BOT_TOKEN=${telegramToken}

# ===========================
# MAILCHIMP INTEGRAÇÃO
# ===========================
MAILCHIMP_API_KEY=${mailchimpKey}
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_LIST_ID=${mailchimpListId}

# ===========================
# CONFIGURAÇÕES DE UPLOAD
# ===========================
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# ===========================
# RATE LIMITING
# ===========================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===========================
# CONFIGURAÇÕES DOS BOTS
# ===========================
BOT_RESPONSE_DELAY=1000
BOT_TYPING_DELAY=2000

# ===========================
# CONFIGURAÇÕES DE PRODUÇÃO
# ===========================
BASE_URL=http://localhost:${port}
FRONTEND_URL=http://localhost:3001

# ===========================
# LOGS E MONITORAMENTO
# ===========================
LOG_LEVEL=info
DEBUG_MODE=false
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com sucesso!');

  // Criar pastas necessárias
  console.log('\n📁 Criando estrutura de pastas...');
  const folders = ['uploads', 'whatsapp-session', 'logs'];
  folders.forEach(folder => {
    const folderPath = path.join(process.cwd(), folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`✅ Pasta ${folder} criada`);
    } else {
      console.log(`ℹ️  Pasta ${folder} já existe`);
    }
  });

  console.log('\n🎉 Setup concluído!\n');
  console.log('📝 Próximos passos:');
  console.log('1. npm install - Instalar dependências');
  console.log('2. npm run migrate - Executar migrations do banco');
  console.log('3. npm run dev - Iniciar servidor de desenvolvimento\n');

  const runMigrations = await question('🚀 Executar migrations agora? (S/n): ');
  if (runMigrations.toLowerCase() !== 'n' && runMigrations.toLowerCase() !== 'não') {
    console.log('\n📊 Executando migrations...');
    
    try {
      const { execSync } = require('child_process');
      execSync('node migrations/migrate.js', { stdio: 'inherit' });
      console.log('✅ Migrations executadas com sucesso!');
      
      console.log('\n👤 Usuário admin criado:');
      console.log('📧 Email: admin@clinica.com');
      console.log('🔑 Senha: 123456');
      console.log('⚠️  ALTERE A SENHA APÓS PRIMEIRO LOGIN!\n');
      
    } catch (error) {
      console.error('❌ Erro ao executar migrations:', error.message);
      console.log('💡 Execute manualmente: node migrations/migrate.js');
    }
  }

  rl.close();
}

// Verificar se o Node.js é compatível
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js 16+ é necessário. Versão atual:', nodeVersion);
  process.exit(1);
}

// Executar setup
setupEnvironment().catch(error => {
  console.error('❌ Erro durante o setup:', error);
  rl.close();
  process.exit(1);
});
