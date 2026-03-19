const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../database/postgres');
const { TenantDb } = require('../database/TenantDb');
const { PERMISSIONS } = require('../config/permissions');

const ACCESS_TOKEN_TTL  = '1h';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES    = 15;

/** Normaliza slug para nome de schema PostgreSQL */
function schemaFromSlug(slug) {
  return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function login(tenantSlug, email, senha, ipOrigem, userAgent) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));

  const usuario = await db.get(
    'SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE',
    [email.toLowerCase().trim()]
  );

  if (!usuario) {
    throw { status: 401, message: 'Credenciais inválidas' };
  }

  // Verificar bloqueio por tentativas
  if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
    throw { status: 403, message: 'Conta bloqueada', bloqueado_ate: usuario.bloqueado_ate };
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

  if (!senhaValida) {
    const novasTentativas = usuario.tentativas_login + 1;
    const bloqueadoAte = novasTentativas >= MAX_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      : null;

    await db.query(
      `UPDATE usuarios
       SET tentativas_login = $1, bloqueado_ate = $2, atualizado_em = NOW()
       WHERE id = $3`,
      [novasTentativas, bloqueadoAte, usuario.id]
    );

    if (bloqueadoAte) {
      throw { status: 403, message: 'Conta bloqueada por excesso de tentativas', bloqueado_ate: bloqueadoAte };
    }

    throw { status: 401, message: 'Credenciais inválidas' };
  }

  // Login bem-sucedido: resetar tentativas e atualizar último acesso
  await db.query(
    `UPDATE usuarios
     SET tentativas_login = 0, bloqueado_ate = NULL, ultimo_acesso = NOW(), atualizado_em = NOW()
     WHERE id = $1`,
    [usuario.id]
  );

  const accessToken  = gerarAccessToken(usuario, tenantSlug);
  const refreshToken = await gerarRefreshToken(db, usuario.id, ipOrigem, userAgent);

  const permissions = PERMISSIONS[usuario.role] || {};

  return {
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_in:    3600,
    user: {
      id:     String(usuario.id),
      nome:   usuario.nome,
      email:  usuario.email,
      perfil: usuario.role,
    },
    permissions,
  };
}

async function refreshAccessToken(tenantSlug, refreshTokenRaw) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));
  const tokenHash = hashToken(refreshTokenRaw);

  const registro = await db.get(
    `SELECT rt.*, u.role, u.nome, u.email, u.ativo
     FROM refresh_tokens rt
     JOIN usuarios u ON u.id = rt.usuario_id
     WHERE rt.token_hash = $1
       AND rt.revogado = FALSE
       AND rt.expira_em > NOW()`,
    [tokenHash]
  );

  if (!registro || !registro.ativo) {
    throw { status: 401, message: 'Refresh token inválido ou expirado' };
  }

  const usuario = {
    id:     registro.usuario_id,
    perfil: registro.role,
    nome:   registro.nome,
    email:  registro.email,
  };
  const novoAccessToken = gerarAccessToken(usuario, tenantSlug);

  return { access_token: novoAccessToken, expires_in: 3600 };
}

async function logout(tenantSlug, usuarioId, refreshTokenRaw) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));

  if (refreshTokenRaw) {
    const tokenHash = hashToken(refreshTokenRaw);
    await db.query(
      'UPDATE refresh_tokens SET revogado = TRUE WHERE token_hash = $1',
      [tokenHash]
    );
  } else {
    await db.query(
      'UPDATE refresh_tokens SET revogado = TRUE WHERE usuario_id = $1',
      [usuarioId]
    );
  }
}

async function revogarTodosTokens(tenantSlug, usuarioId) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));
  await db.query(
    'UPDATE refresh_tokens SET revogado = TRUE WHERE usuario_id = $1',
    [usuarioId]
  );
}

async function getMe(tenantSlug, usuarioId) {
  const db = new TenantDb(pool, schemaFromSlug(tenantSlug));
  const usuario = await db.get(
    'SELECT id, nome, email, role, avatar, telefone, crm, especialidade FROM usuarios WHERE id = $1 AND ativo = TRUE',
    [usuarioId]
  );
  if (!usuario) throw { status: 404, message: 'Usuário não encontrado' };

  const permissions = PERMISSIONS[usuario.role] || {};
  return {
    user: {
      id:     String(usuario.id),
      nome:   usuario.nome,
      email:  usuario.email,
      perfil: usuario.role,
      avatar: usuario.avatar,
    },
    permissions,
  };
}

// --- Funções auxiliares ---

function gerarAccessToken(usuario, tenantSlug) {
  return jwt.sign(
    {
      sub:         String(usuario.id),
      perfil:      usuario.perfil || usuario.role,
      tenant_slug: tenantSlug,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

async function gerarRefreshToken(db, usuarioId, ipOrigem, userAgent) {
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(token);
  const expiraEm = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

  await db.query(
    `INSERT INTO refresh_tokens (usuario_id, token_hash, expira_em, ip_origem, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [usuarioId, tokenHash, expiraEm, ipOrigem || null, userAgent || null]
  );

  return token;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { login, refreshAccessToken, logout, revogarTodosTokens, getMe };
