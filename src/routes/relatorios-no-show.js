const express    = require('express');
const router     = express.Router({ mergeParams: true });
const pool       = require('../database/postgres');
const Anthropic  = require('@anthropic-ai/sdk');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');
const { buildNoShowPrompt } = require('../services/NoShowPrompts');
const { buildNoShowPDF }    = require('../services/NoShowPDF');

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}
function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}
function getUser(req) {
  return req.usuario || req.user || {};
}
const auth = [extractTenant, authenticateToken];

// RBAC simples
function assertRole(...roles) {
  return (req, res, next) => {
    const perfil = getUser(req).perfil || getUser(req).role || 'admin';
    if (!roles.includes(perfil)) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    next();
  };
}

function daysBetween(d1, d2) {
  return Math.abs((new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24));
}

// ── Queries SQL ───────────────────────────────────────────────────────────────
// (montar dinamicamente com schema)
function SQL(schema) {
  return {
    KPIS: `
      WITH base AS (
        SELECT
          COUNT(*) AS total_agendamentos,
          SUM(is_no_show) AS total_no_shows,
          SUM(CASE WHEN status = 'realizado' THEN 1 ELSE 0 END) AS total_realizados
        FROM "${schema}".vw_no_shows
        WHERE tenant_id = $1 AND data BETWEEN $2 AND $3
      ),
      ticket AS (
        SELECT AVG(valor_agendado) AS ticket_medio
        FROM "${schema}".vw_no_shows
        WHERE tenant_id = $1 AND data BETWEEN $2 AND $3
          AND status = 'realizado' AND valor_agendado > 0
      ),
      mes_anterior AS (
        SELECT SUM(is_no_show) AS no_shows_anterior
        FROM "${schema}".vw_no_shows
        WHERE tenant_id = $1
          AND data BETWEEN ($2::DATE - INTERVAL '1 month') AND ($3::DATE - INTERVAL '1 month')
      )
      SELECT
        b.total_agendamentos, b.total_no_shows, b.total_realizados,
        ROUND(CASE WHEN b.total_agendamentos > 0 THEN (b.total_no_shows * 100.0 / b.total_agendamentos) ELSE 0 END, 1) AS taxa_no_show_pct,
        ROUND(t.ticket_medio::NUMERIC, 2) AS ticket_medio,
        ROUND((b.total_no_shows * COALESCE(t.ticket_medio, 0))::NUMERIC, 2) AS impacto_financeiro,
        m.no_shows_anterior,
        ROUND(CASE WHEN m.no_shows_anterior > 0 THEN ((b.total_no_shows - m.no_shows_anterior) * 100.0 / m.no_shows_anterior) ELSE 0 END, 1) AS variacao_mes_anterior_pct
      FROM base b, ticket t, mes_anterior m
    `,
    EVOLUCAO: `
      SELECT
        TO_CHAR(data::DATE, 'YYYY-MM') AS mes,
        COUNT(*) AS total,
        SUM(is_no_show) AS no_shows,
        ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(is_no_show) * 100.0 / COUNT(*)) ELSE 0 END, 1) AS taxa_pct
      FROM "${schema}".vw_no_shows
      WHERE tenant_id = $1 AND data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(data::DATE, 'YYYY-MM')
      ORDER BY mes ASC
    `,
    HEATMAP: `
      SELECT dia_semana_nome, dia_semana_num, turno,
        COUNT(*) AS total, SUM(is_no_show) AS no_shows,
        ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(is_no_show) * 100.0 / COUNT(*)) ELSE 0 END, 1) AS taxa_pct
      FROM "${schema}".vw_no_shows
      WHERE tenant_id = $1 AND data BETWEEN $2 AND $3
      GROUP BY dia_semana_num, dia_semana_nome, turno
      ORDER BY dia_semana_num ASC,
        CASE turno WHEN 'manha' THEN 1 WHEN 'tarde' THEN 2 ELSE 3 END ASC
    `,
    POR_PROFISSIONAL: `
      SELECT profissional_id, profissional_nome,
        COUNT(*) AS total_agendamentos, SUM(is_no_show) AS total_no_shows,
        ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(is_no_show) * 100.0 / COUNT(*)) ELSE 0 END, 1) AS taxa_pct,
        ROUND((SUM(is_no_show) * AVG(CASE WHEN valor_agendado > 0 THEN valor_agendado END))::NUMERIC, 2) AS impacto_financeiro
      FROM "${schema}".vw_no_shows
      WHERE tenant_id = $1 AND data BETWEEN $2 AND $3
      GROUP BY profissional_id, profissional_nome
      ORDER BY taxa_pct DESC
    `,
    POR_PROCEDIMENTO: `
      SELECT procedimento_id, procedimento_nome,
        COUNT(*) AS total, SUM(is_no_show) AS no_shows,
        ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(is_no_show) * 100.0 / COUNT(*)) ELSE 0 END, 1) AS taxa_pct
      FROM "${schema}".vw_no_shows
      WHERE tenant_id = $1 AND data BETWEEN $2 AND $3
      GROUP BY procedimento_id, procedimento_nome
      ORDER BY taxa_pct DESC
    `,
    POR_ORIGEM: `
      SELECT origem,
        COUNT(*) AS total, SUM(is_no_show) AS no_shows, SUM(foi_confirmado) AS confirmados,
        ROUND(CASE WHEN COUNT(*) > 0 THEN (SUM(is_no_show) * 100.0 / COUNT(*)) ELSE 0 END, 1) AS taxa_pct,
        ROUND(CASE WHEN SUM(foi_confirmado) > 0 THEN (SUM(CASE WHEN is_no_show = 1 AND foi_confirmado = 1 THEN 1 ELSE 0 END) * 100.0 / SUM(foi_confirmado)) ELSE 0 END, 1) AS taxa_confirmados_pct,
        ROUND(CASE WHEN (COUNT(*) - SUM(foi_confirmado)) > 0 THEN (SUM(CASE WHEN is_no_show = 1 AND foi_confirmado = 0 THEN 1 ELSE 0 END) * 100.0 / (COUNT(*) - SUM(foi_confirmado))) ELSE 0 END, 1) AS taxa_nao_confirmados_pct
      FROM "${schema}".vw_no_shows
      WHERE tenant_id = $1 AND data BETWEEN $2 AND $3
      GROUP BY origem ORDER BY taxa_pct DESC
    `,
    REINCIDENTES_6M: `
      WITH janela AS (SELECT CURRENT_DATE - INTERVAL '6 months' AS inicio, CURRENT_DATE AS fim),
      reincidentes_base AS (
        SELECT ns.paciente_id, ns.paciente_nome,
          COUNT(*) AS total_no_shows_6m,
          MAX(ns.data) AS ultimo_no_show, MIN(ns.data) AS primeiro_no_show_6m,
          (SELECT COUNT(*) FROM "${schema}".vw_no_shows WHERE tenant_id = $1 AND paciente_id = ns.paciente_id AND is_no_show = 1) AS total_no_shows_historico,
          STRING_AGG(ns.data::TEXT, ', ' ORDER BY ns.data DESC) AS datas_no_show_6m
        FROM "${schema}".vw_no_shows ns CROSS JOIN janela j
        WHERE ns.tenant_id = $1 AND ns.is_no_show = 1 AND ns.data BETWEEN j.inicio AND j.fim
        GROUP BY ns.paciente_id, ns.paciente_nome HAVING COUNT(*) >= 3
      )
      SELECT rb.*, pac.telefone,
        ROUND((rb.total_no_shows_6m * (SELECT AVG(valor_agendado) FROM "${schema}".vw_no_shows WHERE tenant_id = $1 AND paciente_id = rb.paciente_id AND valor_agendado > 0))::NUMERIC, 2) AS impacto_financeiro_estimado
      FROM reincidentes_base rb
      JOIN "${schema}".pacientes pac ON pac.id = rb.paciente_id AND pac.tenant_id = $1
      ORDER BY rb.total_no_shows_6m DESC, rb.ultimo_no_show DESC LIMIT 50
    `,
    REINCIDENTES_PERIODO: `
      SELECT paciente_id, paciente_nome,
        COUNT(*) AS total_no_shows, MAX(data) AS ultimo_no_show, MIN(data) AS primeiro_no_show,
        STRING_AGG(data::TEXT, ', ' ORDER BY data) AS datas_no_show
      FROM "${schema}".vw_no_shows
      WHERE tenant_id = $1 AND is_no_show = 1 AND data BETWEEN $3 AND $4
      GROUP BY paciente_id, paciente_nome HAVING COUNT(*) >= $2
      ORDER BY COUNT(*) DESC LIMIT 50
    `,
    IMPACTO: `
      WITH metricas AS (
        SELECT SUM(is_no_show) AS total_no_shows,
               AVG(CASE WHEN valor_agendado > 0 THEN valor_agendado END) AS ticket_medio
        FROM "${schema}".vw_no_shows
        WHERE tenant_id = $1 AND data BETWEEN $2 AND $3
      )
      SELECT total_no_shows, ROUND(ticket_medio::NUMERIC, 2) AS ticket_medio,
        ROUND((total_no_shows * ticket_medio)::NUMERIC, 2) AS perda_estimada_total,
        ROUND((total_no_shows * ticket_medio * ($4::NUMERIC / 100.0))::NUMERIC, 2) AS receita_recuperavel,
        ROUND((total_no_shows * ticket_medio * ($4::NUMERIC / 100.0) * 12)::NUMERIC, 2) AS receita_recuperavel_anual
      FROM metricas
    `,
  };
}

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const usuario  = getUser(req);
    const { inicio, fim, profissional_id } = req.query;

    if (!inicio || !fim) {
      return res.status(400).json({ success: false, message: 'inicio e fim são obrigatórios' });
    }
    if (daysBetween(inicio, fim) > 366) {
      return res.status(400).json({ success: false, message: 'Período máximo: 366 dias' });
    }

    const sql = SQL(schema);
    const [kpisRes, evolucaoRes, heatmapRes, porProfRes, porProcRes, porOrigemRes] = await Promise.all([
      pool.query(sql.KPIS,            [tenantId, inicio, fim]),
      pool.query(sql.EVOLUCAO,        [tenantId]),
      pool.query(sql.HEATMAP,         [tenantId, inicio, fim]),
      pool.query(sql.POR_PROFISSIONAL,[tenantId, inicio, fim]),
      pool.query(sql.POR_PROCEDIMENTO,[tenantId, inicio, fim]),
      pool.query(sql.POR_ORIGEM,      [tenantId, inicio, fim]),
    ]);

    let kpis = kpisRes.rows[0] || {};
    let porProfissional = porProfRes.rows;

    // Profissional só vê seus próprios dados
    if (usuario.perfil === 'profissional' && usuario.profissional_id) {
      porProfissional = porProfissional.filter(p => p.profissional_id == usuario.profissional_id);
      delete kpis.impacto_financeiro;
    }
    // Recepcionista não vê impacto financeiro coletivo
    if (usuario.perfil === 'recepcionista') {
      delete kpis.impacto_financeiro;
    }

    res.json({
      success: true,
      data: {
        kpis,
        evolucao: evolucaoRes.rows,
        heatmap: heatmapRes.rows,
        porProfissional,
        porProcedimento: porProcRes.rows,
        porOrigem: porOrigemRes.rows,
      },
    });
  } catch (err) {
    console.error('[NoShow] Erro:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /reincidentes ─────────────────────────────────────────────────────────
router.get('/reincidentes', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { inicio, fim, minimo = 2 } = req.query;
    const sql = SQL(schema);

    let rows;
    if (!inicio || !fim) {
      ({ rows } = await pool.query(sql.REINCIDENTES_6M, [tenantId]));
    } else {
      ({ rows } = await pool.query(sql.REINCIDENTES_PERIODO, [tenantId, Number(minimo), inicio, fim]));
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /impacto ──────────────────────────────────────────────────────────────
router.get('/impacto', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { inicio, fim, reducao_estimada_pct = 50 } = req.query;
    if (!inicio || !fim) {
      return res.status(400).json({ success: false, message: 'inicio e fim obrigatórios' });
    }
    const sql = SQL(schema);
    const { rows } = await pool.query(sql.IMPACTO, [tenantId, inicio, fim, reducao_estimada_pct]);
    res.json({ success: true, data: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /insights ─────────────────────────────────────────────────────────────
router.get('/insights', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { inicio, fim } = req.query;
    if (!inicio || !fim) {
      return res.status(400).json({ success: false, message: 'inicio e fim obrigatórios' });
    }
    const cacheKey = `${inicio}_${fim}`;
    const sql      = SQL(schema);

    // 1. Verificar cache
    const { rows: cached } = await pool.query(
      `SELECT dados_json FROM "${schema}".relatorio_cache
       WHERE tenant_id = $1 AND tipo = 'no_show_insights' AND chave = $2 AND expira_em > NOW()`,
      [tenantId, cacheKey]
    );
    if (cached.length) {
      return res.json({ success: true, data: JSON.parse(cached[0].dados_json), fonte: 'cache' });
    }

    // 2. Montar dados
    const [kpisRes, heatmapRes, reincidRes, porOrigemRes] = await Promise.all([
      pool.query(sql.KPIS,          [tenantId, inicio, fim]),
      pool.query(sql.HEATMAP,       [tenantId, inicio, fim]),
      pool.query(sql.REINCIDENTES_6M, [tenantId]),
      pool.query(sql.POR_ORIGEM,    [tenantId, inicio, fim]),
    ]);

    const prompt = buildNoShowPrompt({
      kpis: kpisRes.rows[0] || {},
      heatmap: heatmapRes.rows,
      reincidentes: reincidRes.rows,
      porOrigem: porOrigemRes.rows,
      periodo: { inicio, fim },
    });

    // 3. Chamar Claude
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const insights = msg.content[0].text;

    // 4. Salvar cache (TTL 6h)
    await pool.query(
      `INSERT INTO "${schema}".relatorio_cache (tenant_id, tipo, chave, dados_json, expira_em)
       VALUES ($1,'no_show_insights',$2,$3,NOW() + INTERVAL '6 hours')
       ON CONFLICT (tenant_id, tipo, chave) DO UPDATE SET
         dados_json = EXCLUDED.dados_json, gerado_em = NOW(), expira_em = EXCLUDED.expira_em`,
      [tenantId, cacheKey, JSON.stringify({ texto: insights })]
    );

    res.json({ success: true, data: { texto: insights }, fonte: 'ia' });
  } catch (err) {
    console.error('[NoShow/Insights] Erro:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /export ───────────────────────────────────────────────────────────────
router.get('/export', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { inicio, fim, formato = 'csv' } = req.query;
    if (!inicio || !fim) {
      return res.status(400).json({ success: false, message: 'inicio e fim obrigatórios' });
    }

    const { rows } = await pool.query(`
      SELECT data, horario, paciente_nome, profissional_nome, procedimento_nome,
        CASE WHEN foi_confirmado = 1 THEN 'Sim' ELSE 'Nao' END AS confirmado,
        origem, valor_agendado, is_no_show, turno, dia_semana_nome
      FROM "${schema}".vw_no_shows
      WHERE tenant_id = $1 AND is_no_show = 1 AND data BETWEEN $2 AND $3
      ORDER BY data DESC, horario DESC
      LIMIT 5000
    `, [tenantId, inicio, fim]);

    if (formato === 'csv') {
      const { Parser } = require('json2csv');
      const fields = [
        { label: 'Data', value: 'data' },
        { label: 'Horário', value: 'horario' },
        { label: 'Paciente', value: 'paciente_nome' },
        { label: 'Profissional', value: 'profissional_nome' },
        { label: 'Procedimento', value: 'procedimento_nome' },
        { label: 'Confirmado', value: 'confirmado' },
        { label: 'Origem', value: 'origem' },
        { label: 'Valor (R$)', value: 'valor_agendado' },
        { label: 'Turno', value: 'turno' },
        { label: 'Dia da Semana', value: 'dia_semana_nome' },
      ];
      const parser = new Parser({ fields, delimiter: ';', withBOM: true });
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="no-show-${inicio}-${fim}.csv"`);
      return res.send(csv);
    }

    if (formato === 'pdf') {
      const PDFDocument = require('pdfkit');
      const sql = SQL(schema);
      const { rows: kpisRows } = await pool.query(sql.KPIS, [tenantId, inicio, fim]);
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="no-show-${inicio}-${fim}.pdf"`);
      doc.pipe(res);
      buildNoShowPDF(doc, { rows, kpis: kpisRows[0] || {}, inicio, fim });
      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'formato deve ser csv ou pdf' });
  } catch (err) {
    console.error('[NoShow/Export] Erro:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /acionar-whatsapp ────────────────────────────────────────────────────
router.post('/acionar-whatsapp', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const usuario  = getUser(req);
    const { paciente_ids } = req.body;

    if (!Array.isArray(paciente_ids) || paciente_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'paciente_ids obrigatório' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const pid of paciente_ids) {
        await client.query(
          `INSERT INTO "${schema}".no_show_acoes_crm (tenant_id, paciente_id, tipo_acao, disparado_por)
           VALUES ($1,$2,'whatsapp_reativacao',$3)`,
          [tenantId, pid, usuario.id || 0]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true, enfileirados: paciente_ids.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
