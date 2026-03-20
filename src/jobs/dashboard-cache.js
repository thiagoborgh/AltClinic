/**
 * dashboard-cache.js — Job horário de pré-cálculo de KPIs para o dashboard IA
 * Cron: 0 * * * * (a cada hora, no início da hora)
 */
const cron = require('node-cron');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');

const PERFIS = ['admin', 'financeiro', 'recepcionista'];

async function calcularECacheKpis(tenantId, schema, perfil) {
  const hoje     = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);

  let kpis = { perfil, calculado_em: new Date().toISOString() };

  try {
    if (perfil === 'admin' || perfil === 'financeiro') {
      const [agRes, recRes, inadRes] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
           FROM "${schema}".agendamentos_lite
           WHERE tenant_id = $1 AND data = $2`,
          [tenantId, hoje]
        ).catch(() => ({ rows: [{ total: 0, no_shows: 0 }] })),
        pool.query(
          `SELECT COALESCE(SUM(valor),0) AS receita_mes
           FROM "${schema}".faturas
           WHERE tenant_id = $1 AND status = 'pago'
             AND to_char(criado_em,'YYYY-MM') = $2`,
          [tenantId, mesAtual]
        ).catch(() => ({ rows: [{ receita_mes: 0 }] })),
        pool.query(
          `SELECT COALESCE(SUM(valor),0) AS inadimplencia, COUNT(*) AS vencidas
           FROM "${schema}".faturas
           WHERE tenant_id = $1 AND status = 'vencida'`,
          [tenantId]
        ).catch(() => ({ rows: [{ inadimplencia: 0, vencidas: 0 }] }))
      ]);
      kpis = {
        ...kpis,
        agendamentos_hoje: parseInt(agRes.rows[0]?.total || 0),
        no_shows: parseInt(agRes.rows[0]?.no_shows || 0),
        receita_mes: parseFloat(recRes.rows[0]?.receita_mes || 0),
        inadimplencia_valor: parseFloat(inadRes.rows[0]?.inadimplencia || 0),
        faturas_vencidas: parseInt(inadRes.rows[0]?.vencidas || 0),
      };
    } else if (perfil === 'recepcionista') {
      const [agRes, filaRes] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status IN ('agendado','pendente')) AS aguardando
           FROM "${schema}".agendamentos_lite
           WHERE tenant_id = $1 AND data = $2`,
          [tenantId, hoje]
        ).catch(() => ({ rows: [{ total: 0, aguardando: 0 }] })),
        pool.query(
          `SELECT COUNT(*) AS fila
           FROM "${schema}".fila_espera
           WHERE tenant_id = $1 AND status = 'aguardando'`,
          [tenantId]
        ).catch(() => ({ rows: [{ fila: 0 }] }))
      ]);
      kpis = {
        ...kpis,
        agendamentos_hoje: parseInt(agRes.rows[0]?.total || 0),
        aguardando_confirmacao: parseInt(agRes.rows[0]?.aguardando || 0),
        fila_atual: parseInt(filaRes.rows[0]?.fila || 0),
      };
    }

    await pool.query(
      `INSERT INTO "${schema}".dashboard_cache
         (tenant_id, perfil, contexto_id, tipo, dados_json, expira_em)
       VALUES ($1,$2,NULL,'kpis',$3, NOW() + INTERVAL '65 minutes')
       ON CONFLICT (tenant_id, perfil, contexto_id, tipo)
       DO UPDATE SET dados_json=$3, calculado_em=NOW(), expira_em=NOW() + INTERVAL '65 minutes'`,
      [tenantId, perfil, JSON.stringify(kpis)]
    ).catch(() => {});
  } catch (err) {
    console.error(`[Dashboard Cache] Erro tenant ${tenantId} perfil ${perfil}:`, err.message);
  }
}

async function executar() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    const schema = schemaFromSlug(tenant.slug);
    for (const perfil of PERFIS) {
      await calcularECacheKpis(tenant.id, schema, perfil);
    }
    if (tenants.length > 1) console.log(`[Dashboard Cache] ${tenant.slug}: KPIs calculados`);
  }
  console.log(`[Dashboard Cache] Ciclo concluído — ${tenants.length} tenant(s)`);
}

function register() {
  cron.schedule('0 * * * *', () => {
    executar().catch(err =>
      console.error('[Dashboard Cache] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });
  console.log('[Dashboard Cache] Job registrado — a cada hora');
}

module.exports = { register, executar };
