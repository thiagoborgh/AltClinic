const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT.
 * Popula req.usuario = { id, perfil, tenant_slug }
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = {
      id:          payload.sub,
      perfil:      payload.perfil,
      tenant_slug: payload.tenant_slug,
    };

    // Retrocompatibilidade: rotas antigas usam req.user
    req.user = {
      id:       payload.sub,
      email:    payload.email,
      tenantId: payload.tenant_slug,
      role:     payload.perfil,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Retrocompatibilidade com rotas que importam { authenticateToken }
authMiddleware.authenticateToken = authMiddleware;

module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware;
