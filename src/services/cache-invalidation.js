/**
 * cache-invalidation.js — helpers para invalidar cache do dashboard IA
 * Aceita (tenantId, schema) — schema pode ser omitido (será resolvido via DB).
 */
const pool = require('../database/postgres');

async function resolveSchema(tenantId, schemaHint) {
  if (schemaHint) return schemaHint;
  const { rows } = await pool.query(
    'SELECT slug FROM public.tenants WHERE id = $1',
    [tenantId]
  ).catch(() => ({ rows: [] }));
  if (!rows[0]) return null;
  return require('./CrmScoreService').schemaFromSlug(rows[0].slug);
}

async function invalidarCacheFinanceiro(tenantId, schema) {
  const s = await resolveSchema(tenantId, schema);
  if (!s) return;
  await pool.query(
    `DELETE FROM "${s}".dashboard_cache
     WHERE tenant_id = $1 AND perfil IN ('admin','financeiro') AND tipo = 'kpis'`,
    [tenantId]
  ).catch(() => {});
}

async function invalidarCacheAgenda(tenantId, schema) {
  const s = await resolveSchema(tenantId, schema);
  if (!s) return;
  await pool.query(
    `DELETE FROM "${s}".dashboard_cache
     WHERE tenant_id = $1 AND tipo IN ('kpis','agenda_hoje')`,
    [tenantId]
  ).catch(() => {});
}

async function invalidarCacheRecepcionista(tenantId, schema) {
  const s = await resolveSchema(tenantId, schema);
  if (!s) return;
  await pool.query(
    `DELETE FROM "${s}".dashboard_cache
     WHERE tenant_id = $1 AND perfil = 'recepcionista' AND tipo = 'kpis'`,
    [tenantId]
  ).catch(() => {});
}

module.exports = { invalidarCacheFinanceiro, invalidarCacheAgenda, invalidarCacheRecepcionista };
