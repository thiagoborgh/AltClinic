const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const firestoreService = require('../services/firestoreService');
const { getMasterDb } = require('../database/MultiTenantPostgres');
const router = express.Router();

// Validar JWT_SECRET no startup
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET não configurado em produção. Encerrando servidor.');
    process.exit(1);
  } else {
    console.warn('⚠️  JWT_SECRET não configurado. Usando chave fraca — NÃO use em produção!');
  }
}
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';

// ─── Refresh Token Helpers ───────────────────────────────────────────
function hashRT(t) { return crypto.createHash('sha256').update(t).digest('hex'); }
function genTokens(payload) {
  const access = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refresh = crypto.randomBytes(40).toString('hex');
  return { accessToken: access, refreshToken: refresh };
}
async function saveRT(masterDb, rt, userId, tenantId, email) {
  if (!masterDb) return;
  const exp = new Date(Date.now() + 7*24*60*60*1000).toISOString();
  try { await masterDb.run('INSERT INTO refresh_tokens (token_hash,user_id,tenant_id,email,expires_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (token_hash) DO UPDATE SET user_id=EXCLUDED.user_id,tenant_id=EXCLUDED.tenant_id,email=EXCLUDED.email,expires_at=EXCLUDED.expires_at', [hashRT(rt), userId, tenantId, email, exp]); } catch(e){}
}
function setCookie(res, rt) {
  res.cookie('refresh_token', rt, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'strict', maxAge: 7*24*60*60*1000 });
}
// ─────────────────────────────────────────────────────────────────────


// Middleware para autenticar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    req.user = user;
    next();
  });
}

// 📧 LOGIN COM FIREBASE FIRESTORE
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 LOGIN FIRESTORE: Tentativa de login:', email);

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar tenant pelo slug (se fornecido no header)
    const tenantSlug = req.headers['x-tenant-slug'];
    
    if (tenantSlug) {
      console.log('🔐 LOGIN: Buscando tenant específico:', tenantSlug);
      const tenant = await firestoreService.getTenantBySlug(tenantSlug);
      
      if (!tenant) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não encontrado ou inativo'
        });
      }

      // Buscar usuário no tenant
      const user = await firestoreService.getUserByEmail(tenant.id, email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado',
          errorType: 'USER_NOT_FOUND'
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, user.senha_hash);
      
      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Senha incorreta',
          errorType: 'INVALID_PASSWORD'
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id,
          tenantId: tenant.id,
          email: user.email,
          role: user.papel || user.role
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.papel || user.role
        },
        token,
        tenant: {
          id: tenant.id,
          nome: tenant.nome,
          slug: tenant.slug
        },
        sessionId: `session_${Date.now()}`
      });
    }

    // Buscar usuário em todos os tenants ativos
    console.log('🔐 LOGIN: Buscando em todos os tenants ativos...');
    const results = await firestoreService.findUserAcrossTenants(email);
    
    if (!results || results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email não encontrado em nenhuma clínica',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // Usar o primeiro resultado (se houver múltiplos tenants, pode expandir depois)
    const result = results[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, result.user.senha_hash);
    
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta',
        errorType: 'INVALID_PASSWORD'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: result.user.id,
        tenantId: result.tenant.id,
        email: result.user.email,
        role: result.user.papel || result.user.role
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('✅ LOGIN: Sucesso para', email, 'no tenant', result.tenant.slug);

    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        role: result.user.papel || result.user.role
      },
      token,
      tenant: {
        id: result.tenant.id,
        nome: result.tenant.nome,
        slug: result.tenant.slug
      },
      sessionId: `session_${Date.now()}`
    });

  } catch (error) {
    // Fallback para SQLite quando Firestore nao esta configurado (dev)
    const isFirestoreAuthError = error.code === 16 ||
      (error.message && (error.message.includes('UNAUTHENTICATED') || error.message.includes('authentication credentials')));

    if (isFirestoreAuthError) {
      try {
        const { email, senha } = req.body;
        const masterDb = getMasterDb();
        const row = await masterDb.get(
          'SELECT u.id, u.email, u.senha_hash, u.role, u.tenant_id, t.id as tid, t.nome as tnome, t.slug as tslug ' +
          'FROM master_users u JOIN tenants t ON t.id = u.tenant_id WHERE u.email = $1',
          [email]
        );

        if (!row) {
          return res.status(401).json({ success: false, message: 'Email nao encontrado', errorType: 'USER_NOT_FOUND' });
        }
        const senhaValida = await bcrypt.compare(senha, row.senha_hash);
        if (!senhaValida) {
          return res.status(401).json({ success: false, message: 'Senha incorreta', errorType: 'INVALID_PASSWORD' });
        }
        const token = jwt.sign(
          { userId: row.id, tenantId: row.tid, email: row.email, role: row.role },
          JWT_SECRET,
          { expiresIn: '15m' }
        );
        console.log('LOGIN (SQLite fallback):', email, '-> tenant', row.tslug);
        return res.json({
          success: true,
          message: 'Login realizado com sucesso',
          user: { id: row.id, email: row.email, role: row.role },
          token,
          tenant: { id: row.tid, nome: row.tnome, slug: row.tslug },
          sessionId: 'session_' + Date.now()
        });
      } catch (fallbackErr) {
        console.error('Erro no fallback SQLite:', fallbackErr.message);
      }
    }

    console.error('Erro no login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// 👤 OBTER DADOS DO USUÁRIO AUTENTICADO
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let user = null;
    let tenantData = null;

    try {
      user = await firestoreService.getUserByEmail(req.user.tenantId, req.user.email);
      const tenantSnapshot = await firestoreService.db.collection('tenants').doc(req.user.tenantId).get();
      tenantData = tenantSnapshot.exists ? { id: tenantSnapshot.id, ...tenantSnapshot.data() } : null;
    } catch (fsErr) {
      // Fallback PostgreSQL para dev sem Firebase
      const masterDb = getMasterDb();
      const row = await masterDb.get(
        'SELECT u.id, u.email, u.role, u.tenant_id, t.nome as tnome, t.slug as tslug, t.status as tstatus ' +
        'FROM master_users u JOIN tenants t ON t.id = u.tenant_id ' +
        'WHERE u.email = $1 AND u.tenant_id = $2',
        [req.user.email, req.user.tenantId]
      );
      if (row) {
        user = { id: row.id, email: row.email, role: row.role, nome: row.email.split('@')[0], papel: row.role };
        tenantData = { id: row.tenant_id, nome: row.tnome, slug: row.tslug, status: row.tstatus, plano: 'trial' };
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.papel || user.role
      },
      tenant: tenantData ? {
        id: tenantData.id,
        nome: tenantData.nome,
        slug: tenantData.slug
      } : null,
      license: null // Pode ser expandido depois se houver sistema de licenças
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário'
    });
  }
});

// 🚪 LOGOUT
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});


// 🔄 POST /api/auth/refresh — renovar access token
router.post('/refresh', async (req, res) => {
  const rt = req.cookies && req.cookies.refresh_token;
  if (!rt) return res.status(401).json({ success: false, message: 'Refresh token ausente' });
  const masterDb = getMasterDb();
  if (!masterDb) return res.status(503).json({ success: false, message: 'Banco indisponivel' });
  try {
    const row = await masterDb.get(
      "SELECT * FROM refresh_tokens WHERE token_hash=$1 AND expires_at>NOW() AND revoked=0",
      [hashRT(rt)]
    );
    if (!row) return res.status(401).json({ success: false, message: 'Refresh token invalido' });
    const { accessToken, refreshToken: newRt } = genTokens({ userId: row.user_id, tenantId: row.tenant_id, email: row.email });
    await masterDb.run('UPDATE refresh_tokens SET revoked=1 WHERE token_hash=$1', [hashRT(rt)]);
    await saveRT(masterDb, newRt, row.user_id, row.tenant_id, row.email);
    setCookie(res, newRt);
    return res.json({ success: true, accessToken, token: accessToken });
  } catch(e) {
    return res.status(500).json({ success: false, message: 'Erro ao renovar token' });
  }
});
module.exports = router;
module.exports.authenticateToken = authenticateToken;
