const authService = require('../services/auth-service');
const pool = require('../database/postgres');
const { TenantDb } = require('../database/TenantDb');

function schemaFromSlug(slug) {
  return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function login(req, res) {
  try {
    const { email, senha, tenant_slug } = req.body;

    if (!email || !senha || !tenant_slug) {
      return res.status(400).json({ error: 'email, senha e tenant_slug são obrigatórios' });
    }

    // Verificar se tenant existe
    const tenant = await pool.query(
      'SELECT slug, nome, logo_url, cor_primaria, cor_primaria_dark FROM tenants WHERE slug = $1 AND status = $2',
      [tenant_slug, 'active']
    );
    if (tenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    const tenantData = tenant.rows[0];

    const result = await authService.login(
      tenant_slug,
      email,
      senha,
      req.ip,
      req.headers['user-agent']
    );

    return res.json({
      ...result,
      tenant: {
        slug:              tenantData.slug,
        nome_exibicao:     tenantData.nome,
        logo_url:          tenantData.logo_url || null,
        cor_primaria:      tenantData.cor_primaria || '#2563EB',
        cor_primaria_dark: tenantData.cor_primaria_dark || '#1D4ED8',
      },
    });
  } catch (err) {
    if (err.status) {
      const body = { error: err.message };
      if (err.bloqueado_ate) body.bloqueado_ate = err.bloqueado_ate;
      return res.status(err.status).json(body);
    }
    console.error('[AuthController] login error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function refresh(req, res) {
  try {
    const { refresh_token, tenant_slug } = req.body;
    if (!refresh_token || !tenant_slug) {
      return res.status(400).json({ error: 'refresh_token e tenant_slug são obrigatórios' });
    }

    const result = await authService.refreshAccessToken(tenant_slug, refresh_token);
    return res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[AuthController] refresh error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function logout(req, res) {
  try {
    const { refresh_token } = req.body;
    const { id, tenant_slug } = req.usuario;

    await authService.logout(tenant_slug, id, refresh_token);
    return res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    console.error('[AuthController] logout error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function me(req, res) {
  try {
    const { id, tenant_slug } = req.usuario;
    const data = await authService.getMe(tenant_slug, id);

    // Buscar dados do tenant
    const tenantRow = await pool.query(
      'SELECT slug, nome, logo_url, cor_primaria, cor_primaria_dark FROM tenants WHERE slug = $1',
      [tenant_slug]
    );
    const tenantData = tenantRow.rows[0] || {};

    return res.json({
      ...data,
      tenant: {
        slug:              tenantData.slug || tenant_slug,
        nome_exibicao:     tenantData.nome || '',
        logo_url:          tenantData.logo_url || null,
        cor_primaria:      tenantData.cor_primaria || '#2563EB',
        cor_primaria_dark: tenantData.cor_primaria_dark || '#1D4ED8',
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[AuthController] me error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function esqueciSenha(req, res) {
  try {
    const { email, tenant_slug } = req.body;
    if (!email || !tenant_slug) {
      // Sempre retorna 200 para não revelar dados
      return res.json({ message: 'Se o email existir, você receberá um link em breve' });
    }

    const db = new TenantDb(pool, schemaFromSlug(tenant_slug));
    const usuario = await db.get(
      'SELECT id, email, nome FROM usuarios WHERE email = $1 AND ativo = TRUE',
      [email.toLowerCase().trim()]
    );

    if (usuario) {
      // Futuramente: gerar token e enviar email
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await db.query(
        `INSERT INTO tokens_senha (usuario_id, token_hash, tipo, expira_em)
         VALUES ($1, $2, 'recuperacao', NOW() + INTERVAL '2 hours')
         ON CONFLICT DO NOTHING`,
        [usuario.id, tokenHash]
      );
      // TODO: enviar email com token
    }

    return res.json({ message: 'Se o email existir, você receberá um link em breve' });
  } catch (err) {
    console.error('[AuthController] esqueciSenha error:', err);
    return res.json({ message: 'Se o email existir, você receberá um link em breve' });
  }
}

async function redefinirSenha(req, res) {
  try {
    const { token, tenant_slug, nova_senha } = req.body;
    if (!token || !tenant_slug || !nova_senha) {
      return res.status(400).json({ error: 'token, tenant_slug e nova_senha são obrigatórios' });
    }

    const { validarSenha } = require('../utils/validar-senha');
    const validacao = validarSenha(nova_senha);
    if (!validacao.valida) {
      return res.status(400).json({ error: validacao.motivo });
    }

    const crypto = require('crypto');
    const bcrypt = require('bcrypt');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const db = new TenantDb(pool, schemaFromSlug(tenant_slug));

    const registro = await db.get(
      `SELECT ts.*, u.id as uid FROM tokens_senha ts
       JOIN usuarios u ON u.id = ts.usuario_id
       WHERE ts.token_hash = $1
         AND ts.usado = FALSE
         AND ts.expira_em > NOW()`,
      [tokenHash]
    );

    if (!registro) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const senhaHash = await bcrypt.hash(nova_senha, 12);

    await db.query(
      'UPDATE usuarios SET senha_hash = $1, atualizado_em = NOW(), primeiro_acesso = FALSE WHERE id = $2',
      [senhaHash, registro.usuario_id]
    );
    await db.query(
      'UPDATE tokens_senha SET usado = TRUE WHERE id = $1',
      [registro.id]
    );

    return res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error('[AuthController] redefinirSenha error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = { login, refresh, logout, me, esqueciSenha, redefinirSenha };
