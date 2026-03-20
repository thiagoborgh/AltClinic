/**
 * briefing-diario.js — Job diário às 7h para gerar briefing IA por tenant/perfil
 * Cron: 0 7 * * *
 */
const cron = require('node-cron');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');
const { buildBriefingPrompt } = require('../services/briefing-prompts');

const PERFIS = ['admin', 'financeiro', 'recepcionista'];

async function gerarKpisBasicos(tenantId, schema, perfil) {
  const hoje     = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);
  let kpis = { perfil };

  try {
    if (perfil === 'admin') {
      const [agRes, recRes, inadRes, metaRes] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status = 'confirmado') AS confirmados,
                  COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
           FROM "${schema}".agendamentos_lite
           WHERE tenant_id = $1 AND data = $2`,
          [tenantId, hoje]
        ).catch(() => ({ rows: [{ total: 0, confirmados: 0, no_shows: 0 }] })),
        pool.query(
          `SELECT COALESCE(SUM(valor),0) AS receita_mes
           FROM "${schema}".faturas
           WHERE tenant_id = $1 AND status = 'pago' AND to_char(criado_em,'YYYY-MM') = $2`,
          [tenantId, mesAtual]
        ).catch(() => ({ rows: [{ receita_mes: 0 }] })),
        pool.query(
          `SELECT COALESCE(SUM(valor),0) AS inadimplencia_valor
           FROM "${schema}".faturas
           WHERE tenant_id = $1 AND status = 'vencida'`,
          [tenantId]
        ).catch(() => ({ rows: [{ inadimplencia_valor: 0 }] })),
        pool.query(
          `SELECT valor_meta FROM "${schema}".metas_dashboard
           WHERE tenant_id = $1 AND tipo = 'receita' AND mes = $2`,
          [tenantId, mesAtual]
        ).catch(() => ({ rows: [] }))
      ]);
      kpis = {
        ...kpis,
        agendamentos_hoje: parseInt(agRes.rows[0]?.total || 0),
        confirmados: parseInt(agRes.rows[0]?.confirmados || 0),
        no_shows: parseInt(agRes.rows[0]?.no_shows || 0),
        receita_mes: parseFloat(recRes.rows[0]?.receita_mes || 0),
        meta_receita: parseFloat(metaRes.rows[0]?.valor_meta || 0),
        inadimplencia_valor: parseFloat(inadRes.rows[0]?.inadimplencia_valor || 0),
        alertas_criticos: 0
      };
    } else if (perfil === 'financeiro') {
      const [recRes, inadRes, metaRes] = await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(valor),0) AS receita_mes
           FROM "${schema}".faturas
           WHERE tenant_id = $1 AND status = 'pago' AND to_char(criado_em,'YYYY-MM') = $2`,
          [tenantId, mesAtual]
        ).catch(() => ({ rows: [{ receita_mes: 0 }] })),
        pool.query(
          `SELECT COALESCE(SUM(valor),0) AS valor_vencido,
                  COUNT(*) AS faturas_vencidas
           FROM "${schema}".faturas
           WHERE tenant_id = $1 AND status = 'vencida'`,
          [tenantId]
        ).catch(() => ({ rows: [{ valor_vencido: 0, faturas_vencidas: 0 }] })),
        pool.query(
          `SELECT valor_meta FROM "${schema}".metas_dashboard
           WHERE tenant_id = $1 AND tipo = 'receita' AND mes = $2`,
          [tenantId, mesAtual]
        ).catch(() => ({ rows: [] }))
      ]);
      kpis = {
        ...kpis,
        receita_mes: parseFloat(recRes.rows[0]?.receita_mes || 0),
        meta_receita: parseFloat(metaRes.rows[0]?.valor_meta || 0),
        faturas_vencidas: parseInt(inadRes.rows[0]?.faturas_vencidas || 0),
        valor_vencido: parseFloat(inadRes.rows[0]?.valor_vencido || 0),
        cobradas_hoje: 0
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
        checkins_pendentes: 0,
        fila_atual: parseInt(filaRes.rows[0]?.fila || 0)
      };
    }
  } catch (err) {
    console.error(`[Briefing] Erro KPIs ${tenantId}/${perfil}:`, err.message);
  }
  return kpis;
}

async function gerarBriefingTenant(tenant) {
  const schema = schemaFromSlug(tenant.slug);

  // Get clinic name
  const nomeClinica = tenant.nome || 'AltClinic';

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (const perfil of PERFIS) {
    try {
      const kpis = await gerarKpisBasicos(tenant.id, schema, perfil);
      const prompt = buildBriefingPrompt(kpis, perfil, nomeClinica);

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }]
      });
      const texto = message.content[0]?.text || '';
      const resultado = { briefing: texto, kpis, gerado_em: new Date().toISOString() };

      await pool.query(
        `INSERT INTO "${schema}".dashboard_cache
           (tenant_id, perfil, contexto_id, tipo, dados_json, expira_em)
         VALUES ($1,$2,NULL,'briefing',$3, NOW() + INTERVAL '23 hours')
         ON CONFLICT (tenant_id, perfil, contexto_id, tipo)
         DO UPDATE SET dados_json=$3, calculado_em=NOW(), expira_em=NOW() + INTERVAL '23 hours'`,
        [tenant.id, perfil, JSON.stringify(resultado)]
      ).catch(() => {});

      console.log(`[Briefing] ${tenant.slug}/${perfil}: gerado (${texto.length} chars)`);
    } catch (err) {
      console.error(`[Briefing] Erro ${tenant.slug}/${perfil}:`, err.message);
    }
  }
}

async function executar() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug, nome FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    await gerarBriefingTenant(tenant);
  }
  console.log(`[Briefing Diário] Concluído — ${tenants.length} tenant(s)`);
}

function register() {
  cron.schedule('0 7 * * *', () => {
    executar().catch(err =>
      console.error('[Briefing Diário] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });
  console.log('[Briefing Diário] Job registrado — 07:00 diário');
}

module.exports = { register, executar };
