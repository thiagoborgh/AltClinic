const pool = require('../database/postgres');
const { TenantDb } = require('../database/TenantDb');

/**
 * Registra acesso a dados sensíveis no audit_log.
 * Usar em rotas de prontuário e dados clínicos (obrigação LGPD).
 *
 * @param {string} recurso - Nome do recurso (ex: 'prontuario')
 * @param {string} acao    - Ação: 'read' | 'create' | 'update' | 'delete'
 */
function auditLog(recurso, acao) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const schema = 'clinica_' + req.usuario.tenant_slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const db = new TenantDb(pool, schema);
        const recursoId = req.params.id || null;
        db.query(
          `INSERT INTO audit_log (usuario_id, acao, recurso, recurso_id, ip)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.usuario.id, acao, recurso, recursoId, req.ip || null]
        ).catch((e) => {
          console.error('[AuditLog] Erro ao registrar:', e.message);
        });
      }
    });
    next();
  };
}

module.exports = auditLog;
