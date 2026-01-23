/**
 * Script para varredura completa do código
 * Identifica onde SQLite está sendo usado e onde deveria ser Firestore
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('VARREDURA: USO DE SQLite VS Firestore');
console.log('═══════════════════════════════════════════════════════════\n');

// Padrões a procurar
const patterns = {
  sqlite: {
    name: 'SQLite',
    patterns: [
      /better-sqlite3/g,
      /\.prepare\(/g,
      /multiTenantDb/g,
      /getMasterDb\(\)/g,
      /getTenantDb\(/g,
      /DATABASE_PATH/g,
      /\.db['"]/g
    ]
  },
  firestore: {
    name: 'Firestore',
    patterns: [
      /firebase-admin/g,
      /firestoreService/g,
      /getFirestore\(\)/g,
      /USE_FIRESTORE/g,
      /FIREBASE_PROJECT_ID/g,
      /\.collection\(/g
    ]
  }
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = {
    sqlite: 0,
    firestore: 0,
    lines: {}
  };

  patterns.sqlite.patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.sqlite += matches.length;
    }
  });

  patterns.firestore.patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      results.firestore += matches.length;
    }
  });

  return results;
}

function scanDirectory(dir, results = { files: [], summary: { sqlite: 0, firestore: 0 } }) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'build' && file !== 'public') {
        scanDirectory(filePath, results);
      }
    } else if (file.endsWith('.js') && !file.includes('.test.') && !file.includes('.spec.')) {
      const scan = scanFile(filePath);
      
      if (scan.sqlite > 0 || scan.firestore > 0) {
        results.files.push({
          path: filePath.replace(process.cwd(), '.'),
          sqlite: scan.sqlite,
          firestore: scan.firestore
        });
        results.summary.sqlite += scan.sqlite;
        results.summary.firestore += scan.firestore;
      }
    }
  });

  return results;
}

// Escanear diretórios principais
const srcDir = path.join(process.cwd(), 'src');
const results = scanDirectory(srcDir);

console.log('📊 RESUMO GERAL:\n');
console.log(`   Total de arquivos analisados: ${results.files.length}`);
console.log(`   Referências SQLite: ${results.summary.sqlite}`);
console.log(`   Referências Firestore: ${results.summary.firestore}`);
console.log('');

// Separar arquivos por categoria
const sqliteOnly = results.files.filter(f => f.sqlite > 0 && f.firestore === 0);
const firestoreOnly = results.files.filter(f => f.firestore > 0 && f.sqlite === 0);
const mixed = results.files.filter(f => f.sqlite > 0 && f.firestore > 0);

console.log('═══════════════════════════════════════════════════════════');
console.log('⚠️  ARQUIVOS USANDO APENAS SQLite (PRECISAM MIGRAÇÃO)');
console.log('═══════════════════════════════════════════════════════════\n');

if (sqliteOnly.length === 0) {
  console.log('   ✅ Nenhum arquivo encontrado!\n');
} else {
  sqliteOnly.forEach(file => {
    console.log(`   ${file.path}`);
    console.log(`   SQLite refs: ${file.sqlite}\n`);
  });
}

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ ARQUIVOS USANDO APENAS Firestore');
console.log('═══════════════════════════════════════════════════════════\n');

if (firestoreOnly.length === 0) {
  console.log('   ❌ Nenhum arquivo encontrado!\n');
} else {
  firestoreOnly.slice(0, 10).forEach(file => {
    console.log(`   ${file.path}`);
    console.log(`   Firestore refs: ${file.firestore}\n`);
  });
  if (firestoreOnly.length > 10) {
    console.log(`   ... e mais ${firestoreOnly.length - 10} arquivos\n`);
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('⚠️  ARQUIVOS COM USO MISTO (SQLite E Firestore)');
console.log('═══════════════════════════════════════════════════════════\n');

if (mixed.length === 0) {
  console.log('   ✅ Nenhum arquivo encontrado!\n');
} else {
  mixed.forEach(file => {
    console.log(`   ${file.path}`);
    console.log(`   SQLite refs: ${file.sqlite} | Firestore refs: ${file.firestore}\n`);
  });
}

// Verificar .env
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 CONFIGURAÇÃO .env');
console.log('═══════════════════════════════════════════════════════════\n');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasFirebaseProjectId = envContent.includes('FIREBASE_PROJECT_ID');
  const hasUseFirestore = envContent.includes('USE_FIRESTORE');
  
  console.log(`   FIREBASE_PROJECT_ID: ${hasFirebaseProjectId ? '✅ Configurado' : '❌ Não encontrado'}`);
  console.log(`   USE_FIRESTORE: ${hasUseFirestore ? '✅ Configurado' : '❌ Não encontrado'}`);
  console.log('');
} else {
  console.log('   ❌ Arquivo .env não encontrado!\n');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('💡 RECOMENDAÇÕES');
console.log('═══════════════════════════════════════════════════════════\n');

if (sqliteOnly.length > 0) {
  console.log(`   ⚠️  ${sqliteOnly.length} arquivo(s) precisam ser migrados de SQLite para Firestore`);
  console.log('   📝 Principais arquivos que precisam atenção:');
  sqliteOnly.slice(0, 5).forEach(file => {
    console.log(`      - ${file.path}`);
  });
  console.log('');
}

if (!fs.existsSync(envPath) || !fs.readFileSync(envPath, 'utf8').includes('USE_FIRESTORE')) {
  console.log('   ⚠️  Adicionar variáveis de ambiente:');
  console.log('      USE_FIRESTORE=true');
  console.log('      FIREBASE_PROJECT_ID=meu-app-de-clinica');
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════\n');
