const multiTenantDb = require('../models/MultiTenantDatabase');
const crypto = require('crypto');

/**
 * Middleware para extrair e validar tenant
 */
const extractTenant = async (req, res, next) => {
  try {
    console.log('🏥 MIDDLEWARE TENANT: Iniciando extração de tenant');
    console.log('🏥 MIDDLEWARE TENANT: Headers:', req.headers);
    console.log('🏥 MIDDLEWARE TENANT: URL:', req.url);
    
    // Extrair tenant do subdomínio ou header
    let tenantSlug = null;
    
    // Opção 1: Subdomínio (clinica-abc.altclinic.com) — ignorar em hosts locais/IP
    const host = (req.get('host') || '').toLowerCase();
    const isLocalHost = host.includes('localhost') || host.startsWith('127.0.0.1') || host.startsWith('::1');
    const looksLikeIp = /^\d+\.\d+\.\d+\.\d+(?::\d+)?$/.test(host);
    if (!isLocalHost && !looksLikeIp && host.split('.').length >= 3) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        tenantSlug = subdomain;
      }
    }
    
    // Opção 2: Header personalizado (para desenvolvimento/API)
    if (!tenantSlug && req.headers['x-tenant-slug']) {
      tenantSlug = req.headers['x-tenant-slug'];
      console.log('🏥 MIDDLEWARE TENANT: Tenant encontrado no header:', tenantSlug);
    }
    
  // Opção 3: Parâmetro na URL (/api/tenant/:slug/...)
    if (!tenantSlug && req.params.tenantSlug) {
      tenantSlug = req.params.tenantSlug;
      console.log('🏥 MIDDLEWARE TENANT: Tenant encontrado nos params:', tenantSlug);
    }
    
    // Opção 4: Query parameter (?tenant=clinica-abc)
    if (!tenantSlug && req.query.tenant) {
      tenantSlug = req.query.tenant;
      console.log('🏥 MIDDLEWARE TENANT: Tenant encontrado na query:', tenantSlug);
    }
    
    console.log('🏥 MIDDLEWARE TENANT: Tenant final:', tenantSlug);
    
    if (!tenantSlug) {
      return res.status(400).json({
        error: 'Tenant não especificado',
        message: 'Use subdomínio, header X-Tenant-Slug ou parâmetro tenant'
      });
    }
    
    // Buscar tenant no database master
    const masterDb = multiTenantDb.getMasterDb();
    console.log('🏥 MIDDLEWARE TENANT: Master DB obtido');
    console.log('🏥 MIDDLEWARE TENANT: Procurando tenant:', tenantSlug);
    
    const tenant = masterDb.prepare(`
      SELECT id, slug, nome, plano, status, config, billing, theme, trial_expire_at
      FROM tenants 
      WHERE slug = ? AND status IN ('active', 'trial')
    `).get(tenantSlug);
    
    console.log('🏥 MIDDLEWARE TENANT: Query executada para slug:', tenantSlug);
    
    console.log('🏥 MIDDLEWARE TENANT: Tenant encontrado no DB:', !!tenant);
    
    if (!tenant) {
      console.log('🏥 MIDDLEWARE TENANT: Tenant não encontrado:', tenantSlug);
      return res.status(404).json({
        error: 'Clínica não encontrada',
        message: `Tenant '${tenantSlug}' não existe ou está inativo`
      });
    }
    
    // Parsear JSON fields
    tenant.config = JSON.parse(tenant.config || '{}');
    tenant.billing = JSON.parse(tenant.billing || '{}');
    tenant.theme = JSON.parse(tenant.theme || '{}');
    
    // Verificar se trial expirou
    if (tenant.status === 'trial' && tenant.trial_expire_at) {
      const trialExpire = new Date(tenant.trial_expire_at);
      if (new Date() > trialExpire) {
        return res.status(402).json({
          error: 'Trial expirado',
          message: 'O período de teste expirou. Faça upgrade do seu plano.',
          upgradeUrl: `/upgrade?tenant=${tenantSlug}`
        });
      }
    }
    
    // Adicionar tenant ao request
    req.tenant = tenant;
    req.tenantId = tenant.id;
    
    console.log('🏥 MIDDLEWARE TENANT: Tenant ID definido:', req.tenantId);
    
    // Log da requisição (opcional)
    console.log(`🏥 Request para tenant: ${tenant.nome} (${tenantSlug})`);
    
    next();
    
  } catch (error) {
    console.error('❌ Erro no middleware de tenant:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha ao processar tenant'
    });
  }
};

/**
 * Middleware para verificar limites do tenant
 */
const checkTenantLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { tenant } = req;
      
      if (!tenant) {
        return res.status(400).json({ error: 'Tenant não encontrado' });
      }
      
      // Verificar limites baseado no tipo de recurso
      switch (resourceType) {
        case 'usuarios':
          if (tenant.config.maxUsuarios !== -1) {
            const tenantDb = multiTenantDb.getTenantDb(tenant.id);
            const count = tenantDb.prepare(`
              SELECT COUNT(*) as total 
              FROM usuarios 
              WHERE tenant_id = ? AND status = 'active'
            `).get(tenant.id);
            
            if (count.total >= tenant.config.maxUsuarios) {
              return res.status(402).json({
                error: 'Limite de usuários atingido',
                message: `Seu plano permite até ${tenant.config.maxUsuarios} usuários`,
                current: count.total,
                limit: tenant.config.maxUsuarios,
                upgradeUrl: `/upgrade?tenant=${tenant.slug}`
              });
            }
          }
          break;
          
        case 'pacientes':
          if (tenant.config.maxPacientes !== -1) {
            const tenantDb = multiTenantDb.getTenantDb(tenant.id);
            const count = tenantDb.prepare(`
              SELECT COUNT(*) as total 
              FROM pacientes 
              WHERE tenant_id = ? AND status = 'ativo'
            `).get(tenant.id);
            
            if (count.total >= tenant.config.maxPacientes) {
              return res.status(402).json({
                error: 'Limite de pacientes atingido',
                message: `Seu plano permite até ${tenant.config.maxPacientes} pacientes`,
                current: count.total,
                limit: tenant.config.maxPacientes,
                upgradeUrl: `/upgrade?tenant=${tenant.slug}`
              });
            }
          }
          break;
          
        case 'whatsapp':
          if (!tenant.config.whatsappEnabled) {
            return res.status(403).json({
              error: 'WhatsApp não habilitado',
              message: 'Seu plano não inclui integração com WhatsApp',
              upgradeUrl: `/upgrade?tenant=${tenant.slug}`
            });
          }
          break;
          
        case 'telemedicina':
          if (!tenant.config.telemedicina) {
            return res.status(403).json({
              error: 'Telemedicina não habilitada',
              message: 'Seu plano não inclui telemedicina',
              upgradeUrl: `/upgrade?tenant=${tenant.slug}`
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
};

/**
 * Middleware de rate limiting por tenant
 */
const tenantRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    maxRequests = 1000,
    message = 'Muitas requisições. Tente novamente em alguns minutos.'
  } = options;
  
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const { tenant } = req;
    
    if (!tenant) {
      return next();
    }
    
    const key = `${tenant.id}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpar contadores antigos
    if (requestCounts.has(key)) {
      const requests = requestCounts.get(key);
      requestCounts.set(key, requests.filter(time => time > windowStart));
    }
    
    // Adicionar request atual
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }
    
    const requests = requestCounts.get(key);
    requests.push(now);
    
    // Verificar limite
    if (requests.length > maxRequests) {
      return res.status(429).json({
        error: 'Rate limit excedido',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Adicionar headers informativos
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - requests.length),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });
    
    next();
  };
};

/**
 * Middleware para log de atividades
 */
const logActivity = (acao, entidade = null) => {
  return async (req, res, next) => {
    // Executar a ação primeiro
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log apenas em caso de sucesso (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logTenantActivity(req, acao, entidade);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Função auxiliar para logar atividade
 */
async function logTenantActivity(req, acao, entidade) {
  try {
    const { tenant, user } = req;
    
    if (!tenant) return;
    
    const tenantDb = multiTenantDb.getTenantDb(tenant.id);
    
    tenantDb.prepare(`
      INSERT INTO activity_logs (
        tenant_id, usuario_id, acao, entidade, entidade_id, 
        detalhes, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenant.id,
      user ? user.id : null,
      acao,
      entidade,
      req.params.id || null,
      JSON.stringify({
        method: req.method,
        url: req.url,
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : null
      }),
      req.ip,
      req.get('User-Agent')
    );
    
  } catch (error) {
    console.error('❌ Erro ao logar atividade:', error);
  }
}

/**
 * Middleware para verificar features habilitadas
 */
const requireFeature = (feature) => {
  return (req, res, next) => {
    const { tenant } = req;
    
    if (!tenant) {
      return res.status(400).json({ error: 'Tenant não encontrado' });
    }
    
    if (!tenant.config[feature]) {
      return res.status(403).json({
        error: `Feature '${feature}' não habilitada`,
        message: `Seu plano não inclui ${feature}`,
        upgradeUrl: `/upgrade?tenant=${tenant.slug}`
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar tenant no token JWT
 */
const validateTenantToken = (req, res, next) => {
  // Este middleware deve ser usado após a autenticação JWT
  const { user, tenant } = req;
  
  if (!user || !tenant) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  // Verificar se o usuário pertence ao tenant
  if (user.tenantId !== tenant.id) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Usuário não pertence a esta clínica'
    });
  }
  
  next();
};

module.exports = {
  extractTenant,
  checkTenantLimits,
  tenantRateLimit,
  logActivity,
  requireFeature,
  validateTenantToken
};
