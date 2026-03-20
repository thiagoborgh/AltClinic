/**
 * relatorios-receita.js — TDD 20: Relatório de Receita
 * Endpoints: dashboard, por-procedimento, inadimplencia, insights, profissional/:id, export
 */
const express   = require('express');
const router    = express.Router({ mergeParams: true });
const pool      = require('../database/postgres');
const Anthropic = require('@anthropic-ai/sdk');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');
const { buildReceitaPrompt } = require('../services/ReceitaPrompts');
const { buildReceitaPDF }    = require('../services/ReceitaPDF');

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}
function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}
function getUser(req) { return req.usuario || req.user || {}; }
const auth = [extractTenant, authenticateToken];

function assertRole(...roles) {
  return (req, res, next) => {
    const perfil = getUser(req).perfil || getUser(req).role || 'admin';
    if (!roles.includes(perfil)) return res.status(403).json({ success: false, message: 'Acesso negado' });
    next();
  };
}

// Helpers de período
function decrementMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function anoAnteriorMes(mes) { return `${parseInt(mes.slice(0,4)) - 1}-${mes.slice(5)}`; }
function mesAtual() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

// Queries dinâmicas com schema
function SQL(schema) {
  return {
    KPIS_MES: `
      WITH atual AS (
        SELECT COALESCE(SUM(receita_bruta), 0) AS receita_bruta,
               COALESCE(SUM(receita_liquida), 0) AS receita_liquida,
               COALESCE(SUM(total_atendimentos), 0) AS total_atendimentos,
               COALESCE(AVG(ticket_medio), 0) AS ticket_medio
        FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1 AND mes = $2
      ),
      anterior AS (
        SELECT COALESCE(SUM(receita_bruta), 0) AS receita_bruta,
               COALESCE(SUM(total_atendimentos), 0) AS total_atendimentos,
               COALESCE(AVG(ticket_medio), 0) AS ticket_medio
        FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1 AND mes = $3
      ),
      ano_passado AS (
        SELECT COALESCE(SUM(receita_bruta), 0) AS receita_bruta
        FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1 AND mes = $4
      ),
      inadimplencia AS (
        SELECT COUNT(*) AS total_faturas,
               SUM(CASE WHEN status IN ('aguardando','vencida') THEN 1 ELSE 0 END) AS faturas_em_atraso,
               ROUND(SUM(CASE WHEN status IN ('aguardando','vencida') THEN 1.0 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100, 1) AS taxa_inadimplencia_pct
        FROM "${schema}".faturas WHERE tenant_id = $1 AND TO_CHAR(criado_em, 'YYYY-MM') = $2
      )
      SELECT a.receita_bruta, a.receita_liquida, a.total_atendimentos,
             ROUND(a.ticket_medio::NUMERIC, 2) AS ticket_medio,
             ROUND((a.receita_bruta - ant.receita_bruta) * 100.0 / NULLIF(ant.receita_bruta, 0), 1) AS var_mes_anterior_pct,
             ROUND((a.receita_bruta - ap.receita_bruta) * 100.0 / NULLIF(ap.receita_bruta, 0), 1) AS var_ano_anterior_pct,
             ROUND((a.total_atendimentos - ant.total_atendimentos) * 100.0 / NULLIF(ant.total_atendimentos, 0), 1) AS var_atendimentos_pct,
             i.taxa_inadimplencia_pct, i.faturas_em_atraso, i.total_faturas
      FROM atual a, anterior ant, ano_passado ap, inadimplencia i
    `,
    EVOLUCAO_12M: `
      SELECT mes, SUM(receita_bruta) AS receita_bruta, SUM(receita_liquida) AS receita_liquida,
             SUM(total_atendimentos) AS total_atendimentos,
             ROUND(AVG(ticket_medio)::NUMERIC, 2) AS ticket_medio,
             AVG(SUM(receita_bruta)) OVER (PARTITION BY tenant_id ORDER BY mes ROWS BETWEEN 11 PRECEDING AND CURRENT ROW) AS media_movel_12m
      FROM "${schema}".vw_receita_mensal
      WHERE tenant_id = $1 AND mes >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM')
      GROUP BY tenant_id, mes ORDER BY mes ASC
    `,
    RANKING_PROF: `
      SELECT profissional_id, profissional_nome,
             SUM(total_atendimentos) AS total_atendimentos,
             ROUND(SUM(receita_bruta)::NUMERIC, 2) AS receita_total,
             ROUND(AVG(ticket_medio)::NUMERIC, 2) AS ticket_medio,
             ROUND((SUM(pct_do_total) / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS pct_medio_do_total,
             ROUND(SUM(comissao_calculada)::NUMERIC, 2) AS comissao_total
      FROM "${schema}".vw_receita_por_profissional
      WHERE tenant_id = $1 AND mes BETWEEN $2 AND $3
      GROUP BY profissional_id, profissional_nome ORDER BY receita_total DESC
    `,
    EVOLUCAO_PROF_6M: `
      SELECT mes, profissional_id, profissional_nome,
             ROUND(SUM(receita_bruta)::NUMERIC, 2) AS receita
      FROM "${schema}".vw_receita_por_profissional
      WHERE tenant_id = $1 AND mes >= TO_CHAR(NOW() - INTERVAL '6 months', 'YYYY-MM')
      GROUP BY mes, profissional_id, profissional_nome ORDER BY mes ASC, receita DESC
    `,
    RANKING_PROC: `
      SELECT procedimento_id, procedimento_nome,
             SUM(quantidade) AS quantidade_total,
             ROUND(SUM(receita_total)::NUMERIC, 2) AS receita_total,
             ROUND(AVG(ticket_medio)::NUMERIC, 2) AS ticket_medio,
             ROUND((SUM(pct_do_total) / NULLIF(COUNT(*), 0))::NUMERIC, 1) AS pct_medio_do_total,
             ROUND(AVG(variacao_3_meses)::NUMERIC, 2) AS tendencia_3m
      FROM "${schema}".vw_receita_por_procedimento
      WHERE tenant_id = $1 AND mes BETWEEN $2 AND $3
      GROUP BY procedimento_id, procedimento_nome ORDER BY receita_total DESC
    `,
    POR_FORMA_PAGAMENTO: `
      SELECT forma_pagamento, SUM(receita_bruta) AS receita_total,
             SUM(total_atendimentos) AS total_atendimentos,
             ROUND((SUM(receita_bruta) * 100.0 / NULLIF(SUM(SUM(receita_bruta)) OVER (), 0))::NUMERIC, 1) AS pct_do_total
      FROM "${schema}".vw_receita_mensal
      WHERE tenant_id = $1 AND mes BETWEEN $2 AND $3
      GROUP BY forma_pagamento ORDER BY receita_total DESC
    `,
    AGING: `
      SELECT
        CASE
          WHEN (CURRENT_DATE - vencimento::DATE) BETWEEN 0 AND 30 THEN '0-30 dias'
          WHEN (CURRENT_DATE - vencimento::DATE) BETWEEN 31 AND 60 THEN '31-60 dias'
          WHEN (CURRENT_DATE - vencimento::DATE) BETWEEN 61 AND 90 THEN '61-90 dias'
          ELSE '90+ dias'
        END AS faixa_aging,
        CASE
          WHEN (CURRENT_DATE - vencimento::DATE) BETWEEN 0 AND 30 THEN 1
          WHEN (CURRENT_DATE - vencimento::DATE) BETWEEN 31 AND 60 THEN 2
          WHEN (CURRENT_DATE - vencimento::DATE) BETWEEN 61 AND 90 THEN 3
          ELSE 4
        END AS faixa_ordem,
        COUNT(*) AS quantidade,
        ROUND(SUM(valor_liquido - valor_pago)::NUMERIC, 2) AS valor_total,
        ROUND(AVG(valor_liquido - valor_pago)::NUMERIC, 2) AS ticket_medio_inadimplente,
        ROUND(AVG(CURRENT_DATE - vencimento::DATE)::NUMERIC, 0) AS dias_atraso_medio
      FROM "${schema}".faturas
      WHERE tenant_id = $1 AND status IN ('aguardando','vencida') AND vencimento < CURRENT_DATE
      GROUP BY faixa_aging, faixa_ordem ORDER BY faixa_ordem ASC
    `,
    TOP_DEVEDORES: `
      SELECT f.paciente_id, pac.nome AS paciente_nome, pac.telefone,
             COUNT(*) AS faturas_em_aberto,
             ROUND(SUM(f.valor_liquido - f.valor_pago)::NUMERIC, 2) AS valor_total_divida,
             MIN(f.vencimento) AS fatura_mais_antiga,
             MAX(f.vencimento) AS fatura_mais_recente
      FROM "${schema}".faturas f
      JOIN "${schema}".pacientes pac ON pac.id = f.paciente_id AND pac.tenant_id = f.tenant_id
      WHERE f.tenant_id = $1 AND f.status IN ('aguardando','vencida') AND f.vencimento < CURRENT_DATE
      GROUP BY f.paciente_id, pac.nome, pac.telefone
      ORDER BY valor_total_divida DESC LIMIT 10
    `,
    SAZONALIDADE: `
      SELECT
        ((EXTRACT(DAY FROM p.data_recebimento)::INTEGER - 1) / 7 + 1) AS semana_do_mes,
        EXTRACT(DOW FROM p.data_recebimento)::INTEGER AS dia_semana_num,
        CASE EXTRACT(DOW FROM p.data_recebimento)::INTEGER
          WHEN 0 THEN 'Dom' WHEN 1 THEN 'Seg' WHEN 2 THEN 'Ter'
          WHEN 3 THEN 'Qua' WHEN 4 THEN 'Qui' WHEN 5 THEN 'Sex' WHEN 6 THEN 'Sab'
        END AS dia_semana_nome,
        ROUND(SUM(p.valor)::NUMERIC, 2) AS receita_total,
        COUNT(*) AS total_atendimentos,
        ROUND(AVG(p.valor)::NUMERIC, 2) AS ticket_medio_dia
      FROM "${schema}".faturas f
      JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
      WHERE f.tenant_id = $1 AND f.status IN ('paga','parcial')
        AND p.data_recebimento BETWEEN $2::DATE AND $3::DATE
      GROUP BY semana_do_mes, dia_semana_num, dia_semana_nome
      ORDER BY semana_do_mes ASC, dia_semana_num ASC
    `,
    YOY: `
      WITH atual AS (
        SELECT mes, SUM(receita_bruta) AS receita
        FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1 AND mes BETWEEN $2 AND $3
        GROUP BY mes
      ),
      ano_anterior AS (
        SELECT TO_CHAR(TO_DATE(mes, 'YYYY-MM') + INTERVAL '1 year', 'YYYY-MM') AS mes_projetado,
               SUM(receita_bruta) AS receita
        FROM "${schema}".vw_receita_mensal WHERE tenant_id = $1
          AND mes BETWEEN TO_CHAR(TO_DATE($2,'YYYY-MM') - INTERVAL '1 year','YYYY-MM')
                      AND TO_CHAR(TO_DATE($3,'YYYY-MM') - INTERVAL '1 year','YYYY-MM')
        GROUP BY mes
      )
      SELECT a.mes, ROUND(a.receita::NUMERIC, 2) AS receita_atual,
             ROUND(COALESCE(aa.receita, 0)::NUMERIC, 2) AS receita_ano_anterior,
             ROUND(((a.receita - COALESCE(aa.receita, 0)) * 100.0 / NULLIF(aa.receita, 0))::NUMERIC, 1) AS variacao_yoy_pct
      FROM atual a LEFT JOIN ano_anterior aa ON aa.mes_projetado = a.mes
      ORDER BY a.mes ASC
    `,
    VISAO_PROFISSIONAL: `
      SELECT f.id, p.data_recebimento AS data_pagamento, pac.nome AS paciente_nome,
             fi.descricao AS procedimento_nome, p.valor,
             COALESCE(f.valor_desconto, 0) AS desconto,
             f.valor_liquido, p.forma AS forma_pagamento, f.status,
             ROUND((p.valor * COALESCE(pr.percentual_repasse, 0) / 100.0)::NUMERIC, 2) AS minha_comissao
      FROM "${schema}".faturas f
      JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
      JOIN "${schema}".pacientes pac ON pac.id = f.paciente_id AND pac.tenant_id = f.tenant_id
      LEFT JOIN "${schema}".faturas_itens fi ON fi.fatura_id = f.id
      JOIN "${schema}".profissionais pr ON pr.id = f.profissional_id AND pr.tenant_id = f.tenant_id
      WHERE f.tenant_id = $1 AND f.profissional_id = $2
        AND TO_CHAR(p.data_recebimento, 'YYYY-MM') BETWEEN $3 AND $4
      ORDER BY p.data_recebimento DESC
    `,
    EXPORT_ROWS: `
      SELECT p.data_recebimento AS data_pagamento, pac.nome AS paciente_nome,
             pr.nome AS profissional_nome, fi.descricao AS procedimento_nome,
             p.valor, COALESCE(f.valor_desconto, 0) AS desconto,
             f.valor_liquido, p.forma AS forma_pagamento, f.status
      FROM "${schema}".faturas f
      JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
      JOIN "${schema}".pacientes pac ON pac.id = f.paciente_id AND pac.tenant_id = f.tenant_id
      JOIN "${schema}".profissionais pr ON pr.id = f.profissional_id AND pr.tenant_id = f.tenant_id
      LEFT JOIN "${schema}".faturas_itens fi ON fi.fatura_id = f.id
      WHERE f.tenant_id = $1 AND TO_CHAR(p.data_recebimento, 'YYYY-MM') BETWEEN $2 AND $3
      ORDER BY p.data_recebimento DESC LIMIT 5000
    `,
  };
}

// ── GET / — dashboard principal ───────────────────────────────────────────────
router.get('/', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const inicio   = req.query.inicio || mesAtual();
    const fim      = req.query.fim    || mesAtual();
    const sql      = SQL(schema);
    const mesAnt   = decrementMes(inicio);
    const mesAnoA  = anoAnteriorMes(inicio);

    // Cache check
    const cacheKey = `receita_${inicio}_${fim}`;
    const { rows: cached } = await pool.query(
      `SELECT dados_json FROM "${schema}".relatorio_cache
       WHERE tenant_id = $1 AND tipo = $2 AND expira_em > NOW() LIMIT 1`,
      [tenantId, cacheKey]
    ).catch(() => ({ rows: [] }));
    if (cached.length) {
      return res.json({ success: true, data: JSON.parse(cached[0].dados_json), fonte: 'cache' });
    }

    const [kpisRes, evolRes, profRes, evolProfRes, procRes, formaRes, agingRes, devedRes, sazonRes, yoyRes] =
      await Promise.all([
        pool.query(sql.KPIS_MES,           [tenantId, inicio, mesAnt, mesAnoA]),
        pool.query(sql.EVOLUCAO_12M,        [tenantId]),
        pool.query(sql.RANKING_PROF,        [tenantId, inicio, fim]),
        pool.query(sql.EVOLUCAO_PROF_6M,    [tenantId]),
        pool.query(sql.RANKING_PROC,        [tenantId, inicio, fim]),
        pool.query(sql.POR_FORMA_PAGAMENTO, [tenantId, inicio, fim]),
        pool.query(sql.AGING,               [tenantId]),
        pool.query(sql.TOP_DEVEDORES,       [tenantId]),
        pool.query(sql.SAZONALIDADE,        [tenantId, `${inicio}-01`, `${fim}-31`]),
        pool.query(sql.YOY,                 [tenantId, inicio, fim]),
      ]);

    const data = {
      kpis: kpisRes.rows[0] || {},
      evolucao: evolRes.rows,
      porProfissional: profRes.rows,
      evolucaoProfissional: evolProfRes.rows,
      porProcedimento: procRes.rows,
      porFormaPagamento: formaRes.rows,
      aging: agingRes.rows,
      topDevedores: devedRes.rows,
      sazonalidade: sazonRes.rows,
      yoy: yoyRes.rows,
    };

    // Salvar cache 1h
    await pool.query(
      `INSERT INTO "${schema}".relatorio_cache (tenant_id, tipo, chave, dados_json, expira_em)
       VALUES ($1,$2,$3,$4,NOW() + INTERVAL '1 hour')
       ON CONFLICT (tenant_id, tipo, chave) DO UPDATE
         SET dados_json = EXCLUDED.dados_json, gerado_em = NOW(), expira_em = EXCLUDED.expira_em`,
      [tenantId, cacheKey, cacheKey, JSON.stringify(data)]
    ).catch(() => {});

    res.json({ success: true, data, fonte: 'db' });
  } catch (err) {
    console.error('[Receita] Erro:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /por-procedimento ──────────────────────────────────────────────────────
router.get('/por-procedimento', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const inicio   = req.query.inicio || mesAtual();
    const fim      = req.query.fim    || mesAtual();
    const { rows } = await pool.query(SQL(schema).RANKING_PROC, [tenantId, inicio, fim]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /inadimplencia ────────────────────────────────────────────────────────
router.get('/inadimplencia', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const sql      = SQL(schema);
    const [agingRes, devedRes] = await Promise.all([
      pool.query(sql.AGING, [tenantId]),
      pool.query(sql.TOP_DEVEDORES, [tenantId]),
    ]);
    res.json({ success: true, data: { aging: agingRes.rows, topDevedores: devedRes.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /insights ─────────────────────────────────────────────────────────────
router.get('/insights', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const mes      = req.query.mes || mesAtual();
    const { rows } = await pool.query(
      `SELECT texto_insight, dados_contexto, gerado_em, modelo_ia, tokens_usados
       FROM "${schema}".ia_insights_financeiros_receita
       WHERE tenant_id = $1 AND mes = $2`,
      [tenantId, mes]
    );
    if (!rows.length) {
      return res.status(202).json({
        success: false,
        message: 'Insights ainda sendo gerados. Disponível a partir do 1º do mês às 07:00.',
        retry_after: 60,
      });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /profissional/:id ─────────────────────────────────────────────────────
router.get('/profissional/:id', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const usuario  = getUser(req);
    const profId   = Number(req.params.id);
    if (usuario.perfil === 'profissional' && usuario.profissional_id !== profId) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    const inicio = req.query.inicio || mesAtual();
    const fim    = req.query.fim    || mesAtual();
    const { rows } = await pool.query(SQL(schema).VISAO_PROFISSIONAL, [tenantId, profId, inicio, fim]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /export ───────────────────────────────────────────────────────────────
router.get('/export', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const inicio   = req.query.inicio || mesAtual();
    const fim      = req.query.fim    || mesAtual();
    const formato  = req.query.formato || 'csv';
    const sql      = SQL(schema);
    const { rows } = await pool.query(sql.EXPORT_ROWS, [tenantId, inicio, fim]);

    if (formato === 'csv') {
      const { Parser } = require('json2csv');
      const fields = [
        { label: 'Data Pagamento',  value: 'data_pagamento' },
        { label: 'Paciente',        value: 'paciente_nome' },
        { label: 'Profissional',    value: 'profissional_nome' },
        { label: 'Procedimento',    value: 'procedimento_nome' },
        { label: 'Valor (R$)',      value: 'valor' },
        { label: 'Desconto (R$)',   value: 'desconto' },
        { label: 'Líquido (R$)',    value: 'valor_liquido' },
        { label: 'Forma Pagamento', value: 'forma_pagamento' },
        { label: 'Status',          value: 'status' },
      ];
      const parser = new Parser({ fields, delimiter: ';', withBOM: true });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="receita-${inicio}-${fim}.csv"`);
      return res.send(csv);
    }

    if (formato === 'pdf') {
      const mesAnt  = decrementMes(inicio);
      const mesAnoA = anoAnteriorMes(inicio);
      const [kpisRes, profRes, procRes, agingRes] = await Promise.all([
        pool.query(sql.KPIS_MES,    [tenantId, inicio, mesAnt, mesAnoA]),
        pool.query(sql.RANKING_PROF,[tenantId, inicio, fim]),
        pool.query(sql.RANKING_PROC,[tenantId, inicio, fim]),
        pool.query(sql.AGING,       [tenantId]),
      ]);
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receita-${inicio}-${fim}.pdf"`);
      doc.pipe(res);
      buildReceitaPDF(doc, {
        rows, kpis: kpisRes.rows[0] || {},
        porProfissional: profRes.rows, porProcedimento: procRes.rows,
        aging: agingRes.rows, inicio, fim,
      });
      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'formato deve ser csv ou pdf' });
  } catch (err) {
    console.error('[Receita/Export] Erro:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
