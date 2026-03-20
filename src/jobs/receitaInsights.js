/**
 * receitaInsights.js — Job mensal de insights IA de receita
 * Executa no dia 1 de cada mês às 07:00 (America/Sao_Paulo)
 */
const cron      = require('node-cron');
const pool      = require('../database/postgres');
const Anthropic = require('@anthropic-ai/sdk');
const { schemaFromSlug }     = require('../services/CrmScoreService');
const { buildReceitaPrompt } = require('../services/ReceitaPrompts');

function decrementMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function anoAnteriorMes(mes) { return `${parseInt(mes.slice(0,4)) - 1}-${mes.slice(5)}`; }
function mesAnterior() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function gerarInsightsTodos() {
  const mes = mesAnterior();
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const schema = schemaFromSlug(tenant.slug);

      // Idempotência
      const exist = await pool.query(
        `SELECT id FROM "${schema}".ia_insights_financeiros_receita WHERE tenant_id = $1 AND mes = $2`,
        [tenant.id, mes]
      ).catch(() => ({ rows: [] }));
      if (exist.rows.length) continue;

      // Coletar dados
      const mesAnt  = decrementMes(mes);
      const mesAnoA = anoAnteriorMes(mes);

      const [kpisRes, profRes, procRes, agingRes] = await Promise.all([
        pool.query(`
          WITH atual AS (
            SELECT COALESCE(SUM(receita_bruta),0) AS receita_bruta, COALESCE(SUM(receita_liquida),0) AS receita_liquida,
                   COALESCE(SUM(total_atendimentos),0) AS total_atendimentos, COALESCE(AVG(ticket_medio),0) AS ticket_medio
            FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1 AND mes = $2
          ),
          anterior AS (
            SELECT COALESCE(SUM(receita_bruta),0) AS receita_bruta, COALESCE(SUM(total_atendimentos),0) AS total_atendimentos
            FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1 AND mes = $3
          ),
          ano_passado AS (SELECT COALESCE(SUM(receita_bruta),0) AS receita_bruta FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1 AND mes = $4),
          inadimplencia AS (
            SELECT COUNT(*) AS total_faturas,
                   SUM(CASE WHEN status IN ('aguardando','vencida') THEN 1 ELSE 0 END) AS faturas_em_atraso,
                   ROUND(SUM(CASE WHEN status IN ('aguardando','vencida') THEN 1.0 ELSE 0 END)/NULLIF(COUNT(*),0)*100,1) AS taxa_inadimplencia_pct
            FROM "${schema}".faturas WHERE tenant_id = $1 AND TO_CHAR(criado_em,'YYYY-MM') = $2
          )
          SELECT a.receita_bruta, a.receita_liquida, a.total_atendimentos, ROUND(a.ticket_medio::NUMERIC,2) AS ticket_medio,
                 ROUND((a.receita_bruta-ant.receita_bruta)*100.0/NULLIF(ant.receita_bruta,0),1) AS var_mes_anterior_pct,
                 ROUND((a.receita_bruta-ap.receita_bruta)*100.0/NULLIF(ap.receita_bruta,0),1) AS var_ano_anterior_pct,
                 ROUND((a.total_atendimentos-ant.total_atendimentos)*100.0/NULLIF(ant.total_atendimentos,0),1) AS var_atendimentos_pct,
                 i.taxa_inadimplencia_pct, i.faturas_em_atraso, i.total_faturas
          FROM atual a, anterior ant, ano_passado ap, inadimplencia i
        `, [tenant.id, mes, mesAnt, mesAnoA]),

        pool.query(`
          SELECT profissional_id, profissional_nome, SUM(total_atendimentos) AS total_atendimentos,
                 ROUND(SUM(receita_bruta)::NUMERIC,2) AS receita_total, ROUND(AVG(ticket_medio)::NUMERIC,2) AS ticket_medio,
                 ROUND((SUM(pct_do_total)/NULLIF(COUNT(*),0))::NUMERIC,1) AS pct_medio_do_total
          FROM "${schema}".vw_receita_por_profissional WHERE tenant_id = $1 AND mes = $2
          GROUP BY profissional_id, profissional_nome ORDER BY receita_total DESC LIMIT 5
        `, [tenant.id, mes]),

        pool.query(`
          SELECT procedimento_id, procedimento_nome, SUM(quantidade) AS quantidade_total,
                 ROUND(SUM(receita_total)::NUMERIC,2) AS receita_total, ROUND(AVG(ticket_medio)::NUMERIC,2) AS ticket_medio,
                 ROUND(AVG(variacao_3_meses)::NUMERIC,2) AS variacao_3_meses
          FROM "${schema}".vw_receita_por_procedimento WHERE tenant_id = $1 AND mes = $2
          GROUP BY procedimento_id, procedimento_nome ORDER BY receita_total DESC LIMIT 10
        `, [tenant.id, mes]),

        pool.query(`
          SELECT CASE WHEN (CURRENT_DATE-vencimento::DATE) BETWEEN 0 AND 30 THEN '0-30 dias'
                      WHEN (CURRENT_DATE-vencimento::DATE) BETWEEN 31 AND 60 THEN '31-60 dias'
                      WHEN (CURRENT_DATE-vencimento::DATE) BETWEEN 61 AND 90 THEN '61-90 dias'
                      ELSE '90+ dias' END AS faixa_aging,
                 COUNT(*) AS quantidade, ROUND(SUM(valor_liquido-valor_pago)::NUMERIC,2) AS valor_total
          FROM "${schema}".faturas WHERE tenant_id = $1 AND status IN ('aguardando','vencida') AND vencimento < CURRENT_DATE
          GROUP BY faixa_aging ORDER BY MIN(CURRENT_DATE-vencimento::DATE) ASC
        `, [tenant.id]),
      ]).catch(() => [{ rows: [{}] }, { rows: [] }, { rows: [] }, { rows: [] }]);

      const dadosContexto = {
        mes, kpis: kpisRes.rows[0] || {},
        porProfissional: profRes.rows, porProcedimento: procRes.rows, aging: agingRes.rows,
      };

      const prompt = buildReceitaPrompt(dadosContexto);
      const client = new Anthropic();
      const msg = await client.messages.create({
        model: 'claude-opus-4-5', max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });
      const texto  = msg.content[0].text;
      const tokens = (msg.usage?.input_tokens || 0) + (msg.usage?.output_tokens || 0);

      await pool.query(
        `INSERT INTO "${schema}".ia_insights_financeiros_receita
           (tenant_id, mes, texto_insight, dados_contexto, modelo_ia, tokens_usados)
         VALUES ($1,$2,$3,$4,'claude-opus-4-5',$5)
         ON CONFLICT (tenant_id, mes) DO UPDATE SET
           texto_insight = EXCLUDED.texto_insight, dados_contexto = EXCLUDED.dados_contexto,
           tokens_usados = EXCLUDED.tokens_usados, gerado_em = NOW()`,
        [tenant.id, mes, texto, JSON.stringify(dadosContexto), tokens]
      );
      console.log(`[receitaInsights] ${tenant.slug}: insight ${mes} gerado (${tokens} tokens)`);
    } catch (err) {
      console.error(`[receitaInsights] Erro tenant ${tenant.slug}:`, err.message);
    }
  }
}

function register() {
  cron.schedule('0 7 1 * *', () => {
    gerarInsightsTodos().catch(err =>
      console.error('[receitaInsights] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });
  console.log('[receitaInsights] Job registrado — 07:00 dia 1 do mês');
}

module.exports = { register, gerarInsightsTodos };
