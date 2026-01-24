@echo off
REM Script de setup para testes E2E (Windows)
REM Prepara o ambiente de teste com dados de teste

echo 🚀 Configurando ambiente para testes E2E...

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
)

REM Instalar dependências dos testes
if not exist "tests\node_modules" (
    echo 📦 Instalando dependências dos testes...
    cd tests && npm install && cd ..
)

REM Instalar navegadores Playwright
echo 🌐 Instalando navegadores Playwright...
npx playwright install --with-deps

REM Setup do banco de dados de teste
echo 🗄️ Configurando banco de dados de teste...
npm run setup

REM Executar migrações
echo 🔄 Executando migrações...
npm run migrate

REM Criar usuário de teste
echo 👤 Criando usuário de teste...
node -e "
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'saee.db');
const db = new Database(dbPath);

// Criar tenant de teste
const tenantId = 'tenant_teste_e2e_' + Date.now();
db.prepare(\`
    INSERT OR REPLACE INTO tenants (id, nome_clinica, email, telefone, endereco, status, created_at, updated_at)
    VALUES (?, 'Clínica E2E Test', 'teste@clinicae2e.com', '11999999999', 'Rua Teste, 123', 'ativo', datetime('now'), datetime('now'))
\`).run(tenantId);

// Criar usuário de teste
const hashedPassword = bcrypt.hashSync('Teste123!', 10);
db.prepare(\`
    INSERT OR REPLACE INTO users (id, tenant_id, nome, email, senha, role, status, created_at, updated_at)
    VALUES (?, ?, 'Usuário Teste E2E', 'teste@clinicae2e.com', ?, 'admin', 'ativo', datetime('now'), datetime('now'))
\`).run('user_teste_e2e_' + Date.now(), tenantId, hashedPassword);

console.log('✅ Usuário de teste criado: teste@clinicae2e.com / Teste123!');
console.log('🏥 Tenant ID:', tenantId);

db.close();
"

REM Criar arquivo de configuração de teste
echo 📝 Criando arquivo de configuração de teste...
(
echo # Configurações para testes E2E
echo NODE_ENV=test
echo PORT=3000
echo DB_PATH=./saee-test.db
echo JWT_SECRET=test_jwt_secret_for_e2e_testing_only
echo ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
echo.
echo # Features habilitadas para testes
echo REACT_APP_FEATURE_AGENDA=true
echo REACT_APP_FEATURE_PACIENTES=true
echo REACT_APP_FEATURE_PROFISSIONAIS=true
echo REACT_APP_FEATURE_WHATSAPP=true
echo REACT_APP_FEATURE_CONFIGURACOES=true
echo REACT_APP_FEATURE_ANALYTICS=true
) > .env.test

echo ✅ Ambiente de teste configurado!
echo.
echo 🎯 Para executar os testes E2E:
echo    npm run test:e2e
echo.
echo 📊 Para executar todos os testes:
echo    npm run test:all
echo.
echo 🔍 Para executar apenas testes críticos:
echo    cd tests && npx playwright test critical-flows.spec.js

pause