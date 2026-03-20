const jwt = require('jsonwebtoken');

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token admin não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    if (!payload.isAdmin) return res.status(403).json({ error: 'Acesso restrito a administradores' });
    req.adminUser = { id: payload.sub, nome: payload.nome, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token admin inválido ou expirado' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.adminUser?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Requer permissão super_admin' });
  }
  next();
}

module.exports = { requireAdminAuth, requireSuperAdmin };
