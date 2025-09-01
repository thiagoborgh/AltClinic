#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkDependency(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    log(`✅ ${name} instalado`, 'green');
    return true;
  } catch {
    log(`❌ ${name} não encontrado`, 'red');
    return false;
  }
}

async function healthCheck() {
  log('\n🏥 Alt Clinic - Health Check\n', 'cyan');

  let allGood = true;

  // Verificar Node.js
  log('📋 Verificando ambiente...', 'yellow');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    log(`✅ Node.js ${nodeVersion}`, 'green');
  } else {
    log(`❌ Node.js ${nodeVersion} (requer 16+)`, 'red');
    allGood = false;
  }

  // Verificar dependências
  checkDependency('npm', 'npm');
  
  // Verificar arquivos essenciais
  log('\n📁 Verificando arquivos...', 'yellow');
  const essentialFiles = [
    ['.env', 'Arquivo de configuração .env'],
    ['package.json', 'package.json'],
    ['migrations/migrate.js', 'Script de migração'],
    ['src/app.js', 'Aplicação principal'],
    ['src/models/database.js', 'Conexão com banco'],
  ];

  essentialFiles.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) {
      allGood = false;
    }
  });

  // Verificar banco de dados
  log('\n💾 Verificando banco de dados...', 'yellow');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbPathMatch = envContent.match(/DB_PATH=(.+)/);
    
    if (dbPathMatch) {
      const dbPath = dbPathMatch[1].trim();
      if (checkFile(dbPath, `Banco de dados (${dbPath})`)) {
        // Verificar tabelas essenciais
        try {
          const Database = require('better-sqlite3');
          const db = new Database(dbPath);
          
          const tables = ['usuarios', 'pacientes', 'agendamentos', 'propostas'];
          tables.forEach(table => {
            try {
              const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
              log(`✅ Tabela ${table} (${result.count} registros)`, 'green');
            } catch {
              log(`❌ Tabela ${table} não encontrada`, 'red');
              allGood = false;
            }
          });
          
          db.close();
        } catch (error) {
          log(`❌ Erro ao acessar banco: ${error.message}`, 'red');
          allGood = false;
        }
      } else {
        allGood = false;
      }
    }
  }

  // Verificar pastas
  log('\n📂 Verificando estrutura de pastas...', 'yellow');
  const folders = ['uploads', 'logs', 'src/models', 'src/routes', 'src/utils'];
  folders.forEach(folder => {
    if (!checkFile(folder, `Pasta ${folder}`)) {
      allGood = false;
    }
  });

  // Verificar variáveis de ambiente
  log('\n🔧 Verificando configurações...', 'yellow');
  const requiredEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'PORT',
    'DB_PATH'
  ];

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(`${envVar}=`)) {
        const match = envContent.match(new RegExp(`${envVar}=(.+)`));
        if (match && match[1].trim() && match[1].trim() !== 'your_key_here') {
          log(`✅ ${envVar} configurado`, 'green');
        } else {
          log(`⚠️  ${envVar} não configurado adequadamente`, 'yellow');
        }
      } else {
        log(`❌ ${envVar} não encontrado`, 'red');
        allGood = false;
      }
    });
  }

  // Verificar dependências do projeto
  log('\n📦 Verificando dependências...', 'yellow');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (fs.existsSync('node_modules')) {
      log('✅ node_modules existe', 'green');
      
      // Verificar algumas dependências críticas
      const criticalDeps = ['express', 'better-sqlite3', 'bcrypt', 'jsonwebtoken'];
      criticalDeps.forEach(dep => {
        if (fs.existsSync(`node_modules/${dep}`)) {
          log(`✅ ${dep}`, 'green');
        } else if (dependencies[dep]) {
          log(`⚠️  ${dep} listado mas não instalado`, 'yellow');
        }
      });
    } else {
      log('❌ node_modules não encontrado - execute npm install', 'red');
      allGood = false;
    }
  } catch (error) {
    log(`❌ Erro ao verificar dependências: ${error.message}`, 'red');
    allGood = false;
  }

  // Teste de conectividade (opcional)
  log('\n🌐 Testando conectividade...', 'yellow');
  try {
    const https = require('https');
    
    // Teste simples de conexão com a internet
    const testConnection = () => {
      return new Promise((resolve) => {
        const req = https.get('https://www.google.com', { timeout: 5000 }, (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      });
    };

    const connected = await testConnection();
    if (connected) {
      log('✅ Conexão com internet', 'green');
    } else {
      log('⚠️  Sem conexão com internet (APIs externas podem falhar)', 'yellow');
    }
  } catch {
    log('⚠️  Não foi possível testar conectividade', 'yellow');
  }

  // Resultado final
  log('\n📊 Resultado do Health Check:', 'cyan');
  if (allGood) {
    log('🎉 Tudo funcionando perfeitamente!', 'green');
    log('\n🚀 Comandos disponíveis:', 'cyan');
    log('• npm run dev - Iniciar desenvolvimento', 'blue');
    log('• npm start - Iniciar produção', 'blue');
    log('• npm run migrate - Executar migrations', 'blue');
    log('• node setup.js - Reconfigurar ambiente', 'blue');
  } else {
    log('⚠️  Alguns problemas foram encontrados.', 'yellow');
    log('\n💡 Soluções sugeridas:', 'cyan');
    log('• Execute: node setup.js', 'blue');
    log('• Execute: npm install', 'blue');
    log('• Execute: npm run migrate', 'blue');
    log('• Verifique o arquivo .env', 'blue');
  }

  log('\n📚 Documentação: README.md', 'cyan');
  log('🆘 Suporte: GitHub Issues\n', 'cyan');
}

// Executar health check
healthCheck().catch(error => {
  log(`❌ Erro durante health check: ${error.message}`, 'red');
  process.exit(1);
});
