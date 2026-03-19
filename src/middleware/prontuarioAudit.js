// Middleware de audit log para prontuários — registra toda leitura e escrita
function auditarProntuario(acao) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const prontuarioId = req.params?.id ?? body?.id ?? null;
        if (prontuarioId && req.db) {
          const userId = req.usuario?.id || req.user?.id;
          const tenantId = req.tenantId || req.usuario?.tenant_slug;
          try {
            await req.db.run(
              `INSERT INTO prontuario_audit_log
                 (prontuario_id, tenant_id, usuario_id, acao, detalhes, ip, user_agent)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                prontuarioId,
                tenantId,
                userId,
                acao,
                JSON.stringify({ url: req.url, params: req.params }),
                req.ip || null,
                req.get('User-Agent') || null,
              ]
            );
          } catch (err) {
            // Audit log nunca interrompe o fluxo
            console.error('[prontuarioAudit] falha:', err.message);
          }
        }
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = { auditarProntuario };
