const jwt = require('jsonwebtoken');
const sessionManager = require('./sessionManager');

/**
 * Middleware de autenticação JWT com controle de sessões
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso requerido',
      message: 'Faça login para acessar este recurso'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Verificar se a sessão ainda é válida
    if (decoded.sessionId && !sessionManager.isSessionValid(decoded.id, decoded.sessionId)) {
      return res.status(401).json({ 
        error: 'Sessão expirada',
        message: 'Sua sessão foi encerrada. Faça login novamente.'
      });
    }
    
    // Adicionar informações do usuário ao request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role,
      sessionId: decoded.sessionId
    };
    
    next();
  } catch (error) {
    console.error('❌ Erro na verificação do token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Seu token de acesso expirou. Faça login novamente.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Token de acesso inválido'
      });
    }
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Erro ao verificar autenticação'
    });
  }
};

/**
 * Middleware para verificar role específica
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'owner') {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Permissão '${requiredRole}' requerida`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar múltiplas roles
 */
const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    // Owner sempre tem acesso
    if (req.user.role === 'owner') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Uma das seguintes permissões é requerida: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é owner
 */
const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas o proprietário pode realizar esta ação'
    });
  }

  next();
};

/**
 * Middleware para verificar se é admin (owner ou admin)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    });
  }

  if (!['owner', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Permissão de administrador requerida'
    });
  }

  next();
};

/**
 * Middleware opcional de autenticação (não bloqueia se não tiver token)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    const decoded = jwt.verify(token, jwtSecret);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAnyRole,
  requireOwner,
  requireAdmin,
  optionalAuth
};
