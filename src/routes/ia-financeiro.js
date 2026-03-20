const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../database/postgres');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');
const IAFinanceiroService   = require('../services/IAFinanceiroService');

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}
function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}
const auth = [extractTenant, authenticateToken];

// Rate limiting simples para geração manual de insights (1 req/hora por tenant)
const insightThrottle = new Map();

// GET /ia/scores
router.get('/ia/scores', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { categoria, limit = 50 } = req.query;

    const conds  = [`s.tenant_id = $1`];
    const params = [tenantId];
    let idx = 2;
    if (categoria) { conds.push(`s.categoria = $${idx++}`); params.push(categoria); }
    params.push(parseInt(limit));

    const { rows } = await pool.query(`
      SELECT
        s.paciente_id, p.nome,
        s.score, s.categoria, s.calculado_em,
        COUNT(f.id) FILTER (WHERE f.status IN ('aguardando','parcial','vencida')) AS faturas_abertas,
        COALESCE(SUM(f.valor_liquido - f.valor_pago) FILTER (WHERE f.status IN ('aguardando','parcial','vencida')), 0) AS valor_em_aberto,
        MIN(f.vencimento) FILTER (WHERE f.status IN ('aguardando','parcial','vencida')) AS proxima_vencimento
      FROM "${schema}".ia_scores_financeiros s
      JOIN "${schema}".pacientes p ON p.id = s.paciente_id
      LEFT JOIN "${schema}".faturas f ON f.paciente_id = s.paciente_id AND f.tenant_id = s.tenant_id
      WHERE ${conds.join(' AND ')}
      GROUP BY s.paciente_id, p.nome, s.score, s.categoria, s.calculado_em
      ORDER BY s.score DESC
      LIMIT $${idx}
    `, params);

    const totais = await pool.query(`
      SELECT
        SUM(CASE WHEN categoria = 'alto'  THEN 1 ELSE 0 END) AS alto_risco,
        SUM(CASE WHEN categoria = 'medio' THEN 1 ELSE 0 END) AS medio_risco,
        SUM(CASE WHEN categoria = 'baixo' THEN 1 ELSE 0 END) AS baixo_risco
      FROM "${schema}".ia_scores_financeiros WHERE tenant_id = $1
    `, [tenantId]);

    res.json({ data: rows, totais: totais.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ia/scores/:pacienteId
router.get('/ia/scores/:pacienteId', ...auth, async (req, res) => {
  try {
    const schema      = getSchema(req);
    const tenantId    = getTenantId(req);
    const { pacienteId } = req.params;

    const [score, historico] = await Promise.all([
      pool.query(
        `SELECT * FROM "${schema}".ia_scores_financeiros WHERE tenant_id = $1 AND paciente_id = $2`,
        [tenantId, pacienteId]
      ),
      pool.query(
        `SELECT score, categoria, calculado_em FROM "${schema}".ia_scores_historico
         WHERE tenant_id = $1 AND paciente_id = $2
         ORDER BY calculado_em DESC LIMIT 30`,
        [tenantId, pacienteId]
      ),
    ]);

    if (!score.rows.length) return res.status(404).json({ error: 'Score não calculado' });
    res.json({ score: score.rows[0], historico: historico.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ia/acoes
router.get('/ia/acoes', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);

    const { rows } = await pool.query(`
      SELECT
        f.id AS fatura_id,
        p.id AS paciente_id,
        p.nome,
        s.score,
        s.categoria,
        ROUND((f.valor_liquido - f.valor_pago)::NUMERIC, 2) AS valor,
        (f.vencimento - CURRENT_DATE) AS dias_para_vencer,
        CASE
          WHEN s.score >= 61 AND (f.vencimento - CURRENT_DATE) <= 2 THEN 'alta'
          WHEN s.score >= 31 AND (f.vencimento - CURRENT_DATE) <= 5 THEN 'media'
          ELSE 'baixa'
        END AS prioridade,
        CASE
          WHEN (f.vencimento - CURRENT_DATE) <= 0 THEN 'Fatura vencida'
          WHEN (f.vencimento - CURRENT_DATE) = 1 THEN 'Vence amanhã'
          ELSE 'Vence em ' || (f.vencimento - CURRENT_DATE) || ' dias'
        END AS situacao,
        CASE
          WHEN s.score >= 61 AND (f.vencimento - CURRENT_DATE) <= 2 THEN 'Enviar WhatsApp hoje'
          WHEN s.score >= 31 THEN 'Agendar ligação'
          ELSE 'Monitorar'
        END AS acao_sugerida
      FROM "${schema}".faturas f
      JOIN "${schema}".pacientes p ON p.id = f.paciente_id
      JOIN "${schema}".ia_scores_financeiros s ON s.paciente_id = f.paciente_id AND s.tenant_id = f.tenant_id
      WHERE f.tenant_id = $1
        AND f.status IN ('aguardando','parcial','vencida')
      ORDER BY s.score DESC, f.vencimento ASC
      LIMIT 50
    `, [tenantId]);

    res.json({ acoes: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ia/insights
router.get('/ia/insights', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { tipo = 'mensal', limit = 6 } = req.query;

    const { rows } = await pool.query(`
      SELECT id, tipo, periodo_referencia, conteudo, tokens_usados, criado_em, lido_em
      FROM "${schema}".ia_insights_financeiros
      WHERE tenant_id = $1 AND tipo = $2
      ORDER BY criado_em DESC LIMIT $3
    `, [tenantId, tipo, parseInt(limit)]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ia/insights/:tipo/:periodo
router.get('/ia/insights/:tipo/:periodo', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { tipo, periodo } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".ia_insights_financeiros
       WHERE tenant_id = $1 AND tipo = $2 AND periodo_referencia = $3`,
      [tenantId, tipo, periodo]
    );
    if (!rows.length) return res.status(404).json({ error: 'Insight não encontrado' });

    // Marcar como lido
    if (!rows[0].lido_em) {
      await pool.query(
        `UPDATE "${schema}".ia_insights_financeiros SET lido_em = NOW() WHERE id = $1`,
        [rows[0].id]
      );
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ia/insights/gerar
router.post('/ia/insights/gerar', ...auth, async (req, res) => {
  try {
    const tenantId   = getTenantId(req);
    const tenantSlug = req.tenant?.slug || req.usuario?.tenant_slug;

    // Rate limit: 1/hora por tenant
    const agora = Date.now();
    const ultima = insightThrottle.get(tenantId) || 0;
    if (agora - ultima < 3_600_000) {
      return res.status(429).json({ error: 'Limite: 1 geração por hora por tenant' });
    }
    insightThrottle.set(tenantId, agora);

    const mes = req.body.mes || new Date().toISOString().slice(0, 7);
    const svc = new IAFinanceiroService(tenantId, tenantSlug);
    const insight = await svc.gerarInsightMensal(mes);
    res.json(insight);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ia/projecao
router.get('/ia/projecao', ...auth, async (req, res) => {
  try {
    const tenantId   = getTenantId(req);
    const tenantSlug = req.tenant?.slug || req.usuario?.tenant_slug;
    const svc = new IAFinanceiroService(tenantId, tenantSlug);
    const semanas = await svc.calcularProjecao();
    res.json({ semanas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ia/alertas
router.get('/ia/alertas', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { lidos = 'false' } = req.query;

    const cond = lidos === 'true' ? '' : 'AND lido_em IS NULL';
    const { rows } = await pool.query(`
      SELECT * FROM "${schema}".ia_alertas
      WHERE tenant_id = $1 ${cond}
      ORDER BY criado_em DESC LIMIT 50
    `, [tenantId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /ia/alertas/:id/ler
router.patch('/ia/alertas/:id/ler', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { id }   = req.params;

    const { rows } = await pool.query(`
      UPDATE "${schema}".ia_alertas
      SET lido_em = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [id, tenantId]);
    if (!rows.length) return res.status(404).json({ error: 'Alerta não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
