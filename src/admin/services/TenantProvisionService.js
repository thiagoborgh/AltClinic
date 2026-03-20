const pool = require('../../database/postgres');
const multiTenantPostgres = require('../../database/MultiTenantPostgres');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function gerarSenhaTemporaria() {
  return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
}

async function criarTenant({ nome, slug, cnpjCpf, emailAdmin, telefone, planoNome = 'trial', adminId = 0 }) {
  // Validar slug
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) throw new Error('Slug inválido: use apenas letras minúsculas, números e hífens (3-50 chars)');

  const { rows: slugRows } = await pool.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
  if (slugRows.length > 0) throw new Error(`Slug '${slug}' já está em uso`);

  // Buscar plano (pode não ter tabela planos ainda — fallback gracioso)
  let planoId = null;
  const { rows: planoRows } = await pool.query('SELECT id FROM planos WHERE nome = $1', [planoNome]).catch(() => ({ rows: [] }));
  if (planoRows[0]) planoId = planoRows[0].id;

  const senhaTemporaria = gerarSenhaTemporaria();
  const senhaHash = await bcrypt.hash(senhaTemporaria, 12);
  const tenantId = crypto.randomUUID();
  const trialFim = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const schemaName = `clinica_${slug}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO tenants
         (id, nome, slug, email, email_admin, cnpj_cpf, telefone, plano, plano_id,
          status, trial_inicio, trial_fim, schema_name, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,'trial',NOW(),$9,$10,NOW(),NOW())`,
      [tenantId, nome, slug, emailAdmin, cnpjCpf || null, telefone || null, planoNome, planoId, trialFim, schemaName]
    );

    await client.query(
      `INSERT INTO master_users (tenant_id, email, senha_hash, role, name, created_at)
       VALUES ($1,$2,$3,'admin',$4,NOW())`,
      [tenantId, emailAdmin, senhaHash, nome + ' (Admin)']
    );

    await client.query(
      `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
       VALUES ($1,$2,'tenant.criar',$3)`,
      [adminId, slug, JSON.stringify({ nome, slug, plano: planoNome })]
    ).catch(() => {}); // audit log não deve falhar o onboarding

    await multiTenantPostgres.createTenantSchema(tenantId, slug);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { tenantId, slug, senhaTemporaria };
}

module.exports = { createTenant: criarTenant, criarTenant };
