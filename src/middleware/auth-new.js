const jwt = require('jsonwebtoken');
const { User, Tenant, UserLicense } = require('../models');

// Middleware de autenticação principal
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar dados completos do usuário e licença
    const license = await UserLicense.findOne({
      where: {
        id: decoded.licenseId,
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nome', 'email', 'avatar', 'status']
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'slug', 'nome', 'plano', 'status']
        }
      ]
    });

    if (!license) {
      return res.status(401).json({
        success: false,
        message: 'Licença inválida ou expirada'
      });
    }

    // Verificar se usuário está ativo
    if (license.user.status !== 'ativo') {
      return res.status(403).json({
        success: false,
        message: 'Usuário suspenso ou inativo'
      });
    }

    // Verificar se tenant está ativo
    if (license.tenant.status !== 'ativo') {
      return res.status(403).json({
        success: false,
        message: 'Clínica temporariamente indisponível'
      });
    }

    // Adicionar dados à requisição
    req.user = {
      id: license.user.id,
      nome: license.user.nome,
      email: license.user.email,
      avatar: license.user.avatar,
      userId: license.userId
    };

    req.tenant = {
      id: license.tenant.id,
      slug: license.tenant.slug,
      nome: license.tenant.nome,
      plano: license.tenant.plano,
      tenantId: license.tenantId
    };

    req.license = {
      id: license.id,
      role: license.role,
      permissions: license.permissions,
      licenseId: license.id
    };

    // Atualizar último acesso (assíncrono, sem bloquear)
    license.update({ lastAccessAt: new Date() }).catch(console.error);

    next();

  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware de autorização por role
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.license) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária'
      });
    }

    // Se não especificar roles, apenas verificar autenticação
    if (roles.length === 0) {
      return next();
    }

    // Verificar se o role do usuário está na lista permitida
    if (!roles.includes(req.license.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissão insuficiente para esta ação'
      });
    }

    next();
  };
};

// Middleware de autorização por permissão específica
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.license || !req.license.permissions) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária'
      });
    }

    if (!req.license.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permissão '${permission}' necessária para esta ação`
      });
    }

    next();
  };
};

// Middleware para verificar se é admin (owner ou admin)
const requireAdmin = (req, res, next) => {
  if (!req.license) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária'
    });
  }

  if (!['owner', 'admin'].includes(req.license.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acesso administrativo necessário'
    });
  }

  next();
};

// Middleware para verificar se é proprietário
const requireOwner = (req, res, next) => {
  if (!req.license) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária'
    });
  }

  if (req.license.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Acesso de proprietário necessário'
    });
  }

  next();
};

// MANTER COMPATIBILIDADE COM SISTEMA ANTIGO
const authenticateToken = authenticate;
const requireRole = (requiredRole) => {
  return authorize([requiredRole]);
};

module.exports = {
  authenticate,
  authenticateToken, // compatibilidade
  authorize,
  requirePermission,
  requireAdmin,
  requireOwner,
  requireRole // compatibilidade
};
