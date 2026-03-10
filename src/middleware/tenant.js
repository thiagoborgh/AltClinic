/**
 * Middleware de tenant — PostgreSQL (schema por tenant)
 *
 * Extrai o tenant da requisição (JWT → header → subdomínio → query)
 * e popula req.tenant, req.tenantId e req.db (TenantDb).
 */
const multiTenantDb = require('../database/MultiTenantPostgres');

// ─── extractTenant ────────────────────────────────────────────────────────────

const extractTenant = async (req, res, next) => {
  try {
    let tenantSlug = null;
    let isFromJwt = false;

    // Prioridade 0: JWT token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.decode(token);
        if (decoded?.tenantId) {
          tenantSlug = decoded.tenantId;
          isFromJwt = true;
        }
      } catch (_) {}
    }

    // Prioridade 1: subdomínio (clinica-abc.altclinic.com)
    if (!tenantSlug) {
      const host = (req.get('host') || '').toLowerCase();
      const isLocal = host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host);
      if (!isLocal && host.split('.').length >= 3) {
        const sub = host.split('.')[0];
        if (sub && !['www', 'app'].includes(sub)) tenantSlug = sub;
      }
    }

    // Prioridade 2: header X-Tenant-Slug
    if (!tenantSlug && req.headers['x-tenant-slug']) {
      tenantSlug = req.headers['x-tenant-slug'];
    }

    // Prioridade 3: parâmetro de URL
    if (!tenantSlug && req.params?.tenantSlug) {
      tenantSlug = req.params.tenantSlug;
    }

    // Prioridade 4: query string
    if (!tenantSlug && req.query?.tenant) {
      tenantSlug = req.query.tenant;
    }

    if (!tenantSlug) {
      return res.status(400).json({
        error: 'Tenant não especificado',
        message: 'Use subdomínio, header X-Tenant-Slug ou parâmetro tenant',
      });
    }

    // Busca tenant no PostgreSQL (schema public)
    const masterDb = multiTenantDb.getMasterDb();
    const column = isFromJwt ? 'id' : 'slug';
    const tenant = await masterDb.get(
      `SELECT id, slug, nome, plano, status, config, billing, theme, trial_expire_at
       FROM tenants
       WHERE ${column} = $1 AND status IN ('active', 'trial')`,
      [tenantSlug]
    );

    if (!tenant) {
      return res.status(404).json({
        error: 'Clínica não encontrada',
        message: `Tenant '${tenantSlug}' não existe ou está inativo`,
      });
    }

    // JSONB já vem parseado pelo driver pg
    tenant.config  = tenant.config  ?? {};
    tenant.billing = tenant.billing ?? {};
    tenant.theme   = tenant.theme   ?? {};

    // Verifica trial expirado
    if (tenant.status === 'trial' && tenant.trial_expire_at) {
      if (new Date() > new Date(tenant.trial_expire_at)) {
        return res.status(402).json({
          error: 'Trial expirado',
          message: 'O período de teste expirou. Faça upgrade do seu plano.',
          upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
        });
      }
    }

    req.tenant   = tenant;
    req.tenantId = tenant.id;
    req.db       = multiTenantDb.getTenantDb(tenant.id, tenant.slug);

    next();
  } catch (error) {
    console.error('❌ Erro no middleware de tenant:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: 'Falha ao processar tenant' });
  }
};

// ─── checkTenantLimits ────────────────────────────────────────────────────────

const checkTenantLimits = (resourceType) => async (req, res, next) => {
  try {
    const { tenant } = req;
    if (!tenant) return res.status(400).json({ error: 'Tenant não encontrado' });

    switch (resourceType) {
      case 'usuarios': {
        if (tenant.config.maxUsuarios !== -1) {
          const row = await req.db.get(
            `SELECT COUNT(*) AS total FROM usuarios WHERE tenant_id = $1 AND status = 'active'`,
            [tenant.id]
          );
          if (parseInt(row.total) >= tenant.config.maxUsuarios) {
            return res.status(402).json({
              error: 'Limite de usuários atingido',
              message: `Seu plano permite até ${tenant.config.maxUsuarios} usuários`,
              current: parseInt(row.total),
              limit: tenant.config.maxUsuarios,
              upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
            });
          }
        }
        break;
      }
      case 'pacientes': {
        if (tenant.config.maxPacientes !== -1) {
          const row = await req.db.get(
            `SELECT COUNT(*) AS total FROM pacientes WHERE tenant_id = $1 AND status = 'ativo'`,
            [tenant.id]
          );
          if (parseInt(row.total) >= tenant.config.maxPacientes) {
            return res.status(402).json({
              error: 'Limite de pacientes atingido',
              message: `Seu plano permite até ${tenant.config.maxPacientes} pacientes`,
              current: parseInt(row.total),
              limit: tenant.config.maxPacientes,
              upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
            });
          }
        }
        break;
      }
      case 'whatsapp':
        if (!tenant.config.whatsappEnabled) {
          return res.status(403).json({
            error: 'WhatsApp não habilitado',
            message: 'Seu plano não inclui integração com WhatsApp',
            upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
          });
        }
        break;
      case 'telemedicina':
        if (!tenant.config.telemedicina) {
          return res.status(403).json({
            error: 'Telemedicina não habilitada',
            message: 'Seu plano não inclui telemedicina',
            upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
          });
        }
        break;
    }

    next();
  } catch (error) {
    console.error('❌ Erro ao verificar limites do tenant:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ─── tenantRateLimit ──────────────────────────────────────────────────────────

const tenantRateLimit = (options = {}) => {
  const { windowMs = 15 * 60 * 1000, maxRequests = 1000, message = 'Muitas requisições.' } = options;
  const requestCounts = new Map();

  return (req, res, next) => {
    const { tenant } = req;
    if (!tenant) return next();

    const key = `${tenant.id}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const requests = (requestCounts.get(key) ?? []).filter(t => t > windowStart);
    requests.push(now);
    requestCounts.set(key, requests);

    if (requests.length > maxRequests) {
      return res.status(429).json({ error: 'Rate limit excedido', message, retryAfter: Math.ceil(windowMs / 1000) });
    }

    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - requests.length),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
    });

    next();
  };
};

// ─── logActivity ──────────────────────────────────────────────────────────────

const logActivity = (acao, entidade = null) => async (req, res, next) => {
  const originalSend = res.send.bind(res);
  res.send = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logTenantActivity(req, acao, entidade).catch(() => {});
    }
    return originalSend(data);
  };
  next();
};

async function logTenantActivity(req, acao, entidade) {
  const { tenant, user } = req;
  if (!tenant) return;
  await req.db.run(
    `INSERT INTO activity_logs
       (tenant_id, usuario_id, acao, entidade, entidade_id, detalhes, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      tenant.id,
      user?.id ?? null,
      acao,
      entidade,
      req.params?.id ?? null,
      JSON.stringify({ method: req.method, url: req.url, body: ['POST', 'PUT'].includes(req.method) ? req.body : null }),
      req.ip,
      req.get('User-Agent'),
    ]
  );
}

// ─── requireFeature / validateTenantToken ────────────────────────────────────

const requireFeature = (feature) => (req, res, next) => {
  if (!req.tenant) return res.status(400).json({ error: 'Tenant não encontrado' });
  if (!req.tenant.config[feature]) {
    return res.status(403).json({
      error: `Feature '${feature}' não habilitada`,
      message: `Seu plano não inclui ${feature}`,
      upgradeUrl: `/upgrade?tenant=${req.tenant.slug}`,
    });
  }
  next();
};

const validateTenantToken = (req, res, next) => {
  const { user, tenant } = req;
  if (!user || !tenant) return res.status(401).json({ error: 'Não autorizado' });
  if (user.tenantId !== tenant.id) {
    return res.status(403).json({ error: 'Acesso negado', message: 'Usuário não pertence a esta clínica' });
  }
  next();
};

module.exports = {
  extractTenant,
  checkTenantLimits,
  tenantRateLimit,
  logActivity,
  requireFeature,
  validateTenantToken,
};
