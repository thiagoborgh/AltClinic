const Database = require('better-sqlite3');
const path = require('path');

const masterDb = new Database(path.join(__dirname, 'saee.db'));

try {
  const tenant = masterDb.prepare('SELECT id, nome, database_name FROM tenants WHERE id = ?').get('b7a34675-8fcf-4d3b-923f-1b488dc313cd');

  if (tenant) {
    console.log('Tenant encontrado:', tenant);
  } else {
    console.log('Tenant não encontrado, criando...');

    // Criar o tenant correto com todos os campos obrigatórios
    const insertTenant = masterDb.prepare(`
      INSERT OR REPLACE INTO tenants (id, nome, slug, email, database_name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    insertTenant.run(
      'b7a34675-8fcf-4d3b-923f-1b488dc313cd',
      'Clínica Teste',
      'teste',
      'teste@clinica.com',
      'tenant_teste.db',
      'active'
    );
    console.log('Tenant criado com sucesso');
  }
} catch (error) {
  console.error('Erro:', error.message);
} finally {
  masterDb.close();
}