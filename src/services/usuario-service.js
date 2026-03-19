const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../database/postgres');
const { TenantDb } = require('../database/TenantDb');
const { revogarTodosTokens } = require('./auth-service');

function schemaFromSlug(slug) {
  return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function listarUsuarios(tenantSlug) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));
  return db.all(
    `SELECT id, nome, email, role as perfil, ativo, avatar, telefone, crm, especialidade,
            ultimo_acesso, criado_em
     FROM usuarios
     ORDER BY nome`
  );
}

async function criarUsuario(tenantSlug, { nome, email, perfil }) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));

  const existing = await db.get('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing) {
    throw { status: 409, message: 'Email já cadastrado' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const usuario = await db.transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO usuarios (tenant_id, nome, email, role, ativo, primeiro_acesso)
       VALUES ($1, $2, $3, $4, TRUE, TRUE)
       RETURNING id, nome, email, role as perfil, ativo, criado_em`,
      [tenantSlug, nome, email.toLowerCase().trim(), perfil || 'recepcionista']
    );
    const u = rows[0];

    await client.query(
      `INSERT INTO tokens_senha (usuario_id, token_hash, tipo, expira_em)
       VALUES ($1, $2, 'primeiro_acesso', NOW() + INTERVAL '48 hours')`,
      [u.id, tokenHash]
    );

    return u;
  });

  // TODO: enviar email com link de primeiro acesso contendo token
  return { usuario, invite_token: token };
}

async function atualizarStatusUsuario(tenantSlug, usuarioId, ativo) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));

  const usuario = await db.get('SELECT id FROM usuarios WHERE id = $1', [usuarioId]);
  if (!usuario) throw { status: 404, message: 'Usuário não encontrado' };

  await db.query(
    'UPDATE usuarios SET ativo = $1, atualizado_em = NOW() WHERE id = $2',
    [ativo, usuarioId]
  );

  // Ao desativar, revogar todos os tokens imediatamente
  if (!ativo) {
    await revogarTodosTokens(tenantSlug, usuarioId);
  }
}

module.exports = { listarUsuarios, criarUsuario, atualizarStatusUsuario };
