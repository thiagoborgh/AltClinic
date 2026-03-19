const { hasPermission } = require('../config/permissions');

/**
 * Fábrica de middleware de permissão.
 *
 * @param {string} modulo - Módulo a verificar (ex: 'prontuario')
 * @param {string} acao   - Ação a verificar (ex: 'read')
 *
 * @example
 * router.get('/prontuarios', authMiddleware, checkPermission('prontuario', 'read'), controller.list);
 */
function checkPermission(modulo, acao) {
  return (req, res, next) => {
    const { perfil } = req.usuario;

    if (!hasPermission(perfil, modulo, acao)) {
      return res.status(403).json({
        error: 'Sem permissão para esta ação',
        modulo,
        acao,
      });
    }

    next();
  };
}

module.exports = checkPermission;
