const db = require('better-sqlite3')('data/master.db');
const tenants = db.prepare("SELECT id, slug, nome, status FROM tenants WHERE status IN ('active', 'trial') LIMIT 5").all();
console.log('Tenants disponíveis:');
tenants.forEach(t => console.log(`  ${t.id} | ${t.slug} | ${t.nome} | ${t.status}`));
db.close();
