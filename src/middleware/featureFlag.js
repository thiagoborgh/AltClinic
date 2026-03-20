const pool = require('../database/postgres');
const { FEATURE_FLAGS_PADRAO } = require('../admin/config/featureFlags');

const featuresCache = new Map(); // { slug: { features, expiry } }

async function getFeaturesCached(tenantSlug) {
  const cached = featuresCache.get(tenantSlug);
  if (cached && cached.expiry > Date.now()) return cached.features;

  // Tenta via plano_id JOIN planos
  const { rows } = await pool.query(
    `SELECT p.features_json, t.plano
     FROM tenants t
     LEFT JOIN planos p ON p.id = t.plano_id
     WHERE t.slug = $1`,
    [tenantSlug]
  ).catch(() => ({ rows: [] }));

  let features = {};
  if (rows[0]) {
    // Preferir features_json do plano se disponível, senão usar fallback por nome do plano
    features = rows[0].features_json || FEATURE_FLAGS_PADRAO[rows[0].plano] || {};
  }

  featuresCache.set(tenantSlug, { features, expiry: Date.now() + 5 * 60 * 1000 });
  return features;
}

function invalidarCacheFeatures(tenantSlug) {
  featuresCache.delete(tenantSlug);
}

function requireFeature(featureName) {
  return async (req, res, next) => {
    const tenantSlug = req.tenant?.slug || req.usuario?.tenant_slug;
    if (!tenantSlug) return res.status(401).json({ error: 'Tenant não autenticado' });

    try {
      const features = await getFeaturesCached(tenantSlug);
      if (!features[featureName]) {
        return res.status(403).json({
          error: 'Recurso não disponível no seu plano',
          feature: featureName,
          upgrade_url: '/planos'
        });
      }
      next();
    } catch (err) {
      console.error('[featureFlag] Erro:', err.message);
      next(); // fail-open para não bloquear em caso de erro
    }
  };
}

module.exports = { requireFeature, getFeaturesCached, invalidarCacheFeatures };
