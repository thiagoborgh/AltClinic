#!/bin/bash

# 🔍 SCRIPT DE DIAGNÓSTICO COMPLETO - PRODUÇÃO RENDER
# Execute este script no Render Shell: https://dashboard.render.com → altclinic → Shell

echo "🔍 DIAGNÓSTICO COMPLETO - ALTCLINIC PRODUÇÃO"
echo "=============================================="
echo ""

# Cores (podem não funcionar no Render Shell)
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📊 1. INFORMAÇÕES GERAIS"
echo "========================"
echo "Diretório atual: $(pwd)"
echo "Usuário: $(whoami)"
echo "Data/Hora: $(date)"
echo ""

echo "📊 2. ESTRUTURA DE DIRETÓRIOS"
echo "=============================="
echo "Conteúdo de ./data/:"
ls -lh data/ 2>/dev/null || echo "❌ Diretório data/ não encontrado"
echo ""

echo "📊 3. BANCOS DE DADOS"
echo "====================="
echo "Arquivo master.db:"
if [ -f "data/master.db" ]; then
    echo "✅ Existe ($(du -h data/master.db | cut -f1))"
else
    echo "❌ Não encontrado"
fi
echo ""

echo "Bancos de tenant:"
ls data/tenant_*.db 2>/dev/null | wc -l | xargs echo "Total de arquivos:"
echo ""

echo "📊 4. TENANTS NO DATABASE MASTER"
echo "================================="
node -e "
const Database = require('better-sqlite3');
try {
  const db = new Database('./data/master.db', { readonly: true });
  
  const count = db.prepare('SELECT COUNT(*) as total FROM tenants').get();
  console.log('Total de tenants:', count.total);
  console.log('');
  
  console.log('Lista de tenants:');
  console.log('ID | Slug | Nome | Status | Database');
  console.log('---|------|------|--------|----------');
  
  const tenants = db.prepare(\`
    SELECT id, slug, nome, status, database_name, created_at 
    FROM tenants 
    ORDER BY created_at DESC
  \`).all();
  
  tenants.forEach(t => {
    console.log(\`\${t.id.substring(0,8)}... | \${t.slug} | \${t.nome.substring(0,20)} | \${t.status} | \${t.database_name}\`);
  });
  
  db.close();
} catch (error) {
  console.error('❌ Erro:', error.message);
}
"
echo ""

echo "📊 5. USUÁRIOS NO DATABASE MASTER"
echo "=================================="
node -e "
const Database = require('better-sqlite3');
try {
  const db = new Database('./data/master.db', { readonly: true });
  
  const count = db.prepare('SELECT COUNT(*) as total FROM master_users').get();
  console.log('Total de usuários:', count.total);
  console.log('');
  
  console.log('Lista de usuários:');
  console.log('Email | Tenant ID | Role');
  console.log('------|-----------|-----');
  
  const users = db.prepare(\`
    SELECT email, tenant_id, role, created_at 
    FROM master_users 
    ORDER BY created_at DESC
    LIMIT 10
  \`).all();
  
  users.forEach(u => {
    console.log(\`\${u.email} | \${u.tenant_id.substring(0,12)}... | \${u.role}\`);
  });
  
  if (count.total > 10) {
    console.log(\`... e mais \${count.total - 10} usuários\`);
  }
  
  db.close();
} catch (error) {
  console.error('❌ Erro:', error.message);
}
"
echo ""

echo "📊 6. VERIFICAR TENANT 'teste' ESPECÍFICO"
echo "=========================================="
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
try {
  const masterDb = new Database('./data/master.db', { readonly: true });
  
  const tenant = masterDb.prepare(\`
    SELECT * FROM tenants WHERE slug = 'teste'
  \`).get();
  
  if (tenant) {
    console.log('✅ Tenant \"teste\" encontrado:');
    console.log('  ID:', tenant.id);
    console.log('  Nome:', tenant.nome);
    console.log('  Database:', tenant.database_name);
    console.log('  Status:', tenant.status);
    console.log('');
    
    const dbPath = './data/' + tenant.database_name;
    if (fs.existsSync(dbPath)) {
      console.log('✅ Banco de dados existe:', dbPath);
      const stats = fs.statSync(dbPath);
      console.log('  Tamanho:', (stats.size / 1024).toFixed(2), 'KB');
      console.log('');
      
      // Verificar estrutura do banco
      const tenantDb = new Database(dbPath, { readonly: true });
      const tables = tenantDb.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all();
      console.log('  Tabelas no banco:');
      tables.forEach(t => console.log('    -', t.name));
      
      tenantDb.close();
    } else {
      console.log('❌ Banco de dados NÃO existe:', dbPath);
    }
  } else {
    console.log('❌ Tenant \"teste\" NÃO encontrado');
  }
  
  masterDb.close();
} catch (error) {
  console.error('❌ Erro:', error.message);
}
"
echo ""

echo "📊 7. VERIFICAR ESTRUTURA DAS TABELAS"
echo "======================================"
node -e "
const Database = require('better-sqlite3');
try {
  const db = new Database('./data/master.db', { readonly: true });
  
  console.log('Tabelas no master.db:');
  const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all();
  tables.forEach(t => console.log('  -', t.name));
  console.log('');
  
  console.log('Estrutura da tabela tenants:');
  const columns = db.prepare('PRAGMA table_info(tenants)').all();
  console.log('Colunas:');
  columns.forEach(c => console.log(\`  - \${c.name} (\${c.type})\`));
  
  db.close();
} catch (error) {
  console.error('❌ Erro:', error.message);
}
"
echo ""

echo "📊 8. VERIFICAR ARQUIVOS vs DATABASE"
echo "====================================="
echo "Comparando tenants no DB com arquivos físicos:"
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
try {
  const db = new Database('./data/master.db', { readonly: true });
  
  const tenants = db.prepare('SELECT id, slug, database_name FROM tenants').all();
  
  let existem = 0;
  let faltam = 0;
  
  tenants.forEach(t => {
    const dbPath = './data/' + t.database_name;
    const exists = fs.existsSync(dbPath);
    if (exists) {
      existem++;
    } else {
      faltam++;
      console.log('❌ FALTANDO:', t.slug, '-', dbPath);
    }
  });
  
  console.log('');
  console.log('Resumo:');
  console.log('  ✅ Arquivos existentes:', existem);
  console.log('  ❌ Arquivos faltando:', faltam);
  
  db.close();
} catch (error) {
  console.error('❌ Erro:', error.message);
}
"
echo ""

echo "📊 9. BUSCAR USUÁRIO thiagoborgh@gmail.com"
echo "==========================================="
node -e "
const Database = require('better-sqlite3');
try {
  const masterDb = new Database('./data/master.db', { readonly: true });
  
  const user = masterDb.prepare(\`
    SELECT * FROM master_users WHERE email = 'thiagoborgh@gmail.com'
  \`).get();
  
  if (user) {
    console.log('✅ Usuário encontrado no master_users:');
    console.log('  Email:', user.email);
    console.log('  Tenant ID:', user.tenant_id);
    console.log('  Role:', user.role);
    console.log('');
    
    const tenant = masterDb.prepare('SELECT slug, nome FROM tenants WHERE id = ?').get(user.tenant_id);
    if (tenant) {
      console.log('  Tenant:', tenant.slug, '(' + tenant.nome + ')');
    }
  } else {
    console.log('❌ Usuário NÃO encontrado em master_users');
    console.log('Tentando buscar em tenant específico...');
  }
  
  masterDb.close();
} catch (error) {
  console.error('❌ Erro:', error.message);
}
"
echo ""

echo "📊 10. VERIFICAR CONFIGURAÇÕES"
echo "==============================="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo ""

echo "✅ DIAGNÓSTICO COMPLETO!"
echo "========================"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Analise os resultados acima"
echo "2. Verifique se os arquivos de banco existem"
echo "3. Confirme se o tenant 'teste' está presente"
echo "4. Valide a estrutura das tabelas"
echo ""
