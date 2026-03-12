/**
 * Middleware de verificação de expiração de trial — AltClinic
 *
 * Extraído de src/middleware/tenant.js para responsabilidade única.
 * Deve ser usado APÓS o middleware extractTenant (que popula req.tenant).
 *
 * Uso:
 *   const { checkTrialExpiry } = require('./checkTrialExpiry');
 *   router.use(extractTenant, checkTrialExpiry);
 */

const checkTrialExpiry = (req, res, next) => {
  try {
    const { tenant } = req;

    if (!tenant) {
      // Sem tenant na requisição — deixar outros middlewares tratar
      return next();
    }

    if (tenant.status === 'trial' && tenant.trial_expire_at) {
      if (new Date() > new Date(tenant.trial_expire_at)) {
        return res.status(402).json({
          error: 'Trial expirado',
          message: 'O período de teste expirou. Faça upgrade do seu plano para continuar.',
          upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
        });
      }
    }

    next();
  } catch (error) {
    console.error('[checkTrialExpiry] Erro ao verificar expiração do trial:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { checkTrialExpiry };
