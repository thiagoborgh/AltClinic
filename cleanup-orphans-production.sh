#!/bin/bash

# 🧹 LIMPEZA DE TENANTS ÓRFÃOS - PRODUÇÃO RENDER
# Execute no Render Shell: https://dashboard.render.com → altclinic → Shell

echo "🧹 LIMPEZA DE TENANTS ÓRFÃOS"
echo "============================="
echo ""

node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('📊 1. ANÁLISE DE TENANTS ÓRFÃOS');
console.log('================================');

const masterDb = new Database('./data/master.db');

// Obter todos os tenants
const tenants = masterDb.prepare('SELECT id, slug, nome, database_name FROM tenants').all();
console.log('Total de tenants no master.db:', tenants.length);
console.log('');

// Verificar quais têm arquivo físico
const orfaos = [];
const validos = [];

tenants.forEach(tenant => {
  const dbPath = path.join('./data', tenant.database_name);
  const exists = fs.existsSync(dbPath);
  
  if (exists) {
    validos.push(tenant);
  } else {
    orfaos.push(tenant);
    console.log('❌ ÓRFÃO:', tenant.slug, '→', tenant.database_name, '(não existe)');
  }
});

console.log('');
console.log('📊 RESUMO:');
console.log('  ✅ Tenants válidos:', validos.length);
console.log('  ❌ Tenants órfãos:', orfaos.length);
console.log('');

if (orfaos.length === 0) {
  console.log('✅ Não há tenants órfãos! Sistema limpo.');
  masterDb.close();
  process.exit(0);
}

console.log('🧹 2. LIMPEZA DE ÓRFÃOS');
console.log('======================');
console.log('');

// Listar usuários que serão afetados
console.log('👥 Usuários que serão removidos:');
orfaos.forEach(tenant => {
  const users = masterDb.prepare('SELECT email FROM master_users WHERE tenant_id = ?').all(tenant.id);
  users.forEach(user => {
    console.log('  - ', user.email, '(tenant:', tenant.slug + ')');
  });
});
console.log('');

// PERGUNTAR SE QUER CONTINUAR (em produção, fazer backup antes!)
console.log('⚠️  ATENÇÃO: Esta operação vai DELETAR os registros acima!');
console.log('⚠️  Em produção, faça backup antes de executar!');
console.log('');
console.log('Para executar a limpeza, rode:');
console.log('  node cleanup-orphans-execute.js');
console.log('');

// Criar arquivo de execução
const cleanupScript = \`
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const masterDb = new Database('./data/master.db');
const tenants = masterDb.prepare('SELECT id, slug, database_name FROM tenants').all();

let deleted = 0;
tenants.forEach(tenant => {
  const dbPath = path.join('./data', tenant.database_name);
  if (!fs.existsSync(dbPath)) {
    // Deletar usuários do tenant órfão
    const usersDeleted = masterDb.prepare('DELETE FROM master_users WHERE tenant_id = ?').run(tenant.id);
    // Deletar tenant órfão
    const tenantDeleted = masterDb.prepare('DELETE FROM tenants WHERE id = ?').run(tenant.id);
    console.log('🗑️  Deletado:', tenant.slug);
    deleted++;
  }
});

console.log('');
console.log('✅ Limpeza concluída!');
console.log('  Tenants removidos:', deleted);

masterDb.close();
\`;

fs.writeFileSync('cleanup-orphans-execute.js', cleanupScript);
console.log('✅ Script de limpeza criado: cleanup-orphans-execute.js');

masterDb.close();
"

echo ""
echo "✅ ANÁLISE COMPLETA!"
echo ""
