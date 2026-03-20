/**
 * dashboard-ia.js — Dashboard Principal com IA Proativa (TDD 21)
 * Mount: /api/dashboard-ia
 */
const express = require('express');
const router = express.Router();
const pool    = require('../database/postgres');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');

const auth = [extractTenant, authenticateToken];

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}
function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI calculators por perfil
// ─────────────────────────────────────────────────────────────────────────────

async function calcularKpisAdmin(tenantId, schema) {
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);

  const [agRes, recRes, inadRes, noShowRes, metaRes] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status IN ('confirmado')) AS confirmados,
         COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
       FROM "${schema}".agendamentos_lite
       WHERE tenant_id = $1 AND data = $2`,
      [tenantId, hoje]
    ).catch(() => ({ rows: [{ total: 0, confirmados: 0, no_shows: 0 }] })),

    pool.query(
      `SELECT COALESCE(SUM(f.valor), 0) AS receita_mes
       FROM "${schema}".faturas f
       WHERE f.tenant_id = $1
         AND f.status = 'pago'
         AND to_char(f.criado_em, 'YYYY-MM') = $2`,
      [tenantId, mesAtual]
    ).catch(() => ({ rows: [{ receita_mes: 0 }] })),

    pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS inadimplencia_valor,
              COUNT(*) AS faturas_vencidas
       FROM "${schema}".faturas
       WHERE tenant_id = $1 AND status = 'vencida'`,
      [tenantId]
    ).catch(() => ({ rows: [{ inadimplencia_valor: 0, faturas_vencidas: 0 }] })),

    pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
       FROM "${schema}".agendamentos_lite
       WHERE tenant_id = $1
         AND to_char(data::date, 'YYYY-MM') = $2
         AND status IN ('realizado','no_show','cancelado')`,
      [tenantId, mesAtual]
    ).catch(() => ({ rows: [{ total: 0, no_shows: 0 }] })),

    pool.query(
      `SELECT tipo, valor_meta
       FROM "${schema}".metas_dashboard
       WHERE tenant_id = $1 AND mes = $2`,
      [tenantId, mesAtual]
    ).catch(() => ({ rows: [] }))
  ]);

  const metas = {};
  (metaRes.rows || []).forEach(m => { metas[m.tipo] = parseFloat(m.valor_meta); });

  const totalMes = parseInt(noShowRes.rows[0]?.total || 0);
  const noShowMes = parseInt(noShowRes.rows[0]?.no_shows || 0);

  return {
    perfil: 'admin',
    agendamentos_hoje: parseInt(agRes.rows[0]?.total || 0),
    confirmados: parseInt(agRes.rows[0]?.confirmados || 0),
    no_shows: parseInt(agRes.rows[0]?.no_shows || 0),
    receita_mes: parseFloat(recRes.rows[0]?.receita_mes || 0),
    meta_receita: metas.receita || 0,
    inadimplencia_valor: parseFloat(inadRes.rows[0]?.inadimplencia_valor || 0),
    faturas_vencidas: parseInt(inadRes.rows[0]?.faturas_vencidas || 0),
    taxa_no_show_mes: totalMes > 0 ? Math.round((noShowMes / totalMes) * 100) : 0,
    metas,
    calculado_em: new Date().toISOString()
  };
}

async function calcularKpisMedico(tenantId, schema, usuarioId) {
  const hoje = new Date().toISOString().slice(0, 10);

  const { rows } = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE tipo = 'primeira_consulta') AS primeira_consulta,
       COUNT(*) FILTER (WHERE tipo = 'retorno') AS retornos,
       AVG(duracao_min) AS duracao_media_min
     FROM "${schema}".agendamentos_lite
     WHERE tenant_id = $1
       AND profissional_id = $2
       AND data = $3
       AND status NOT IN ('cancelado')`,
    [tenantId, usuarioId, hoje]
  ).catch(() => ({ rows: [{ total: 0, primeira_consulta: 0, retornos: 0, duracao_media_min: 0 }] }));

  return {
    perfil: 'medico',
    pacientes_hoje: parseInt(rows[0]?.total || 0),
    primeira_consulta: parseInt(rows[0]?.primeira_consulta || 0),
    retornos: parseInt(rows[0]?.retornos || 0),
    duracao_media_min: Math.round(parseFloat(rows[0]?.duracao_media_min || 30)),
    calculado_em: new Date().toISOString()
  };
}

async function calcularKpisRecepcionista(tenantId, schema) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [agRes, filaRes] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status IN ('agendado','pendente')) AS aguardando_confirmacao,
         COUNT(*) FILTER (WHERE status = 'check_in') AS checkins_pendentes
       FROM "${schema}".agendamentos_lite
       WHERE tenant_id = $1 AND data = $2`,
      [tenantId, hoje]
    ).catch(() => ({ rows: [{ total: 0, aguardando_confirmacao: 0, checkins_pendentes: 0 }] })),

    pool.query(
      `SELECT COUNT(*) AS fila_atual
       FROM "${schema}".fila_espera
       WHERE tenant_id = $1 AND status = 'aguardando'`,
      [tenantId]
    ).catch(() => ({ rows: [{ fila_atual: 0 }] }))
  ]);

  return {
    perfil: 'recepcionista',
    agendamentos_hoje: parseInt(agRes.rows[0]?.total || 0),
    aguardando_confirmacao: parseInt(agRes.rows[0]?.aguardando_confirmacao || 0),
    checkins_pendentes: parseInt(agRes.rows[0]?.checkins_pendentes || 0),
    fila_atual: parseInt(filaRes.rows[0]?.fila_atual || 0),
    calculado_em: new Date().toISOString()
  };
}

async function calcularKpisFinanceiro(tenantId, schema) {
  const mesAtual = new Date().toISOString().slice(0, 7);
  const hoje = new Date().toISOString().slice(0, 10);

  const [recRes, inadRes, cobrancaRes, metaRes] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS receita_mes
       FROM "${schema}".faturas
       WHERE tenant_id = $1
         AND status = 'pago'
         AND to_char(criado_em, 'YYYY-MM') = $2`,
      [tenantId, mesAtual]
    ).catch(() => ({ rows: [{ receita_mes: 0 }] })),

    pool.query(
      `SELECT COUNT(*) AS faturas_vencidas,
              COALESCE(SUM(valor), 0) AS valor_vencido
       FROM "${schema}".faturas
       WHERE tenant_id = $1 AND status = 'vencida'`,
      [tenantId]
    ).catch(() => ({ rows: [{ faturas_vencidas: 0, valor_vencido: 0 }] })),

    pool.query(
      `SELECT COUNT(*) AS cobradas_hoje
       FROM "${schema}".cobrancas_whatsapp
       WHERE tenant_id = $1 AND enviado_em::date = $2`,
      [tenantId, hoje]
    ).catch(() => ({ rows: [{ cobradas_hoje: 0 }] })),

    pool.query(
      `SELECT valor_meta FROM "${schema}".metas_dashboard
       WHERE tenant_id = $1 AND tipo = 'receita' AND mes = $2`,
      [tenantId, mesAtual]
    ).catch(() => ({ rows: [] }))
  ]);

  return {
    perfil: 'financeiro',
    receita_mes: parseFloat(recRes.rows[0]?.receita_mes || 0),
    meta_receita: parseFloat(metaRes.rows[0]?.valor_meta || 0),
    faturas_vencidas: parseInt(inadRes.rows[0]?.faturas_vencidas || 0),
    valor_vencido: parseFloat(inadRes.rows[0]?.valor_vencido || 0),
    cobradas_hoje: parseInt(cobrancaRes.rows[0]?.cobradas_hoje || 0),
    calculado_em: new Date().toISOString()
  };
}

async function calcularKpisPorPerfil(tenantId, schema, perfil, usuarioId) {
  switch (perfil) {
    case 'admin':      return calcularKpisAdmin(tenantId, schema);
    case 'medico':     return calcularKpisMedico(tenantId, schema, usuarioId);
    case 'recepcionista': return calcularKpisRecepcionista(tenantId, schema);
    case 'financeiro': return calcularKpisFinanceiro(tenantId, schema);
    default:           return calcularKpisAdmin(tenantId, schema);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard-ia — KPIs (cache-first)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const tenantId = getTenantId(req);
  const schema   = getSchema(req);
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });

  const perfil     = req.usuario.perfil || 'admin';
  const usuarioId  = req.usuario.id;
  const contextoId = perfil === 'medico' ? String(usuarioId) : null;

  try {
    // Try cache
    const cacheRes = await pool.query(
      `SELECT dados_json FROM "${schema}".dashboard_cache
       WHERE tenant_id = $1 AND perfil = $2 AND tipo = 'kpis'
         AND (contexto_id = $3 OR (contexto_id IS NULL AND $3 IS NULL))
         AND expira_em > NOW()
       ORDER BY calculado_em DESC LIMIT 1`,
      [tenantId, perfil, contextoId]
    ).catch(() => ({ rows: [] }));

    if (cacheRes.rows.length > 0) {
      return res.json({ success: true, data: cacheRes.rows[0].dados_json, fromCache: true });
    }

    // Calculate fresh
    const kpis = await calcularKpisPorPerfil(tenantId, schema, perfil, usuarioId);

    // Store in cache (TTL 5 min)
    await pool.query(
      `INSERT INTO "${schema}".dashboard_cache
         (tenant_id, perfil, contexto_id, tipo, dados_json, expira_em)
       VALUES ($1,$2,$3,'kpis',$4, NOW() + INTERVAL '5 minutes')
       ON CONFLICT (tenant_id, perfil, contexto_id, tipo)
       DO UPDATE SET dados_json=$4, calculado_em=NOW(), expira_em=NOW() + INTERVAL '5 minutes'`,
      [tenantId, perfil, contextoId, JSON.stringify(kpis)]
    ).catch(() => {});

    res.json({ success: true, data: kpis, fromCache: false });
  } catch (err) {
    console.error('[Dashboard IA] GET /:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard-ia/briefing — briefing IA do dia
// ─────────────────────────────────────────────────────────────────────────────
router.get('/briefing', auth, async (req, res) => {
  const tenantId = getTenantId(req);
  const schema   = getSchema(req);
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });

  const perfil    = req.usuario.perfil || 'admin';
  const usuarioId = req.usuario.id;

  try {
    // Try cache (TTL 1h for briefing)
    const cacheRes = await pool.query(
      `SELECT dados_json FROM "${schema}".dashboard_cache
       WHERE tenant_id = $1 AND perfil = $2 AND tipo = 'briefing'
         AND expira_em > NOW()
       ORDER BY calculado_em DESC LIMIT 1`,
      [tenantId, perfil]
    ).catch(() => ({ rows: [] }));

    if (cacheRes.rows.length > 0) {
      return res.json({ success: true, data: cacheRes.rows[0].dados_json, fromCache: true });
    }

    // Get KPIs
    const kpis = await calcularKpisPorPerfil(tenantId, schema, perfil, usuarioId);

    // Get clinic name
    const tenantRes = await pool.query(
      'SELECT nome FROM public.tenants WHERE id = $1',
      [tenantId]
    ).catch(() => ({ rows: [{ nome: 'AltClinic' }] }));
    const nomeClinica = tenantRes.rows[0]?.nome || 'AltClinic';

    // Build prompt + call Claude
    const { buildBriefingPrompt } = require('../services/briefing-prompts');
    const prompt = buildBriefingPrompt(kpis, perfil, nomeClinica);

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });
    const texto = message.content[0]?.text || '';

    const resultado = { briefing: texto, kpis, gerado_em: new Date().toISOString() };

    // Cache 1h
    await pool.query(
      `INSERT INTO "${schema}".dashboard_cache
         (tenant_id, perfil, contexto_id, tipo, dados_json, expira_em)
       VALUES ($1,$2,NULL,'briefing',$3, NOW() + INTERVAL '1 hour')
       ON CONFLICT (tenant_id, perfil, contexto_id, tipo)
       DO UPDATE SET dados_json=$3, calculado_em=NOW(), expira_em=NOW() + INTERVAL '1 hour'`,
      [tenantId, perfil, JSON.stringify(resultado)]
    ).catch(() => {});

    res.json({ success: true, data: resultado });
  } catch (err) {
    console.error('[Dashboard IA] GET /briefing:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard-ia/alertas — listar alertas do usuário
// ─────────────────────────────────────────────────────────────────────────────
router.get('/alertas', auth, async (req, res) => {
  const tenantId = getTenantId(req);
  const schema   = getSchema(req);
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });

  const usuarioId = req.usuario.id;
  const perfil    = req.usuario.perfil || 'admin';
  const { lido = 'false', limit = 20 } = req.query;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".alertas_proativos
       WHERE tenant_id = $1
         AND (usuario_id = $2 OR perfil_alvo = $3 OR perfil_alvo IS NULL)
         AND ($4::boolean IS NULL OR lido = $4)
         AND (expira_em IS NULL OR expira_em > NOW())
       ORDER BY criado_em DESC
       LIMIT $5`,
      [tenantId, usuarioId, perfil,
       lido === 'all' ? null : lido === 'true',
       Math.min(parseInt(limit) || 20, 100)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Dashboard IA] GET /alertas:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/dashboard-ia/alertas/:id/lido
// ─────────────────────────────────────────────────────────────────────────────
router.put('/alertas/:id/lido', auth, async (req, res) => {
  const tenantId = getTenantId(req);
  const schema   = getSchema(req);
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });

  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE "${schema}".alertas_proativos
       SET lido = true, lido_em = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Alerta não encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Dashboard IA] PUT /alertas/:id/lido:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard-ia/config
// ─────────────────────────────────────────────────────────────────────────────
router.get('/config', auth, async (req, res) => {
  const tenantId  = getTenantId(req);
  const schema    = getSchema(req);
  const usuarioId = req.usuario.id;
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".dashboard_config WHERE usuario_id = $1 AND tenant_id = $2`,
      [usuarioId, tenantId]
    );
    if (!rows.length) {
      return res.json({ success: true, data: {
        usuario_id: usuarioId, tenant_id: tenantId,
        layout_json: {}, alertas_config_json: {}, horario_briefing: '07:00'
      }});
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Dashboard IA] GET /config:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/dashboard-ia/config
// ─────────────────────────────────────────────────────────────────────────────
router.put('/config', auth, async (req, res) => {
  const tenantId  = getTenantId(req);
  const schema    = getSchema(req);
  const usuarioId = req.usuario.id;
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });

  const { layout_json, alertas_config_json, horario_briefing } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO "${schema}".dashboard_config
         (usuario_id, tenant_id, layout_json, alertas_config_json, horario_briefing, atualizado_em)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (usuario_id)
       DO UPDATE SET
         layout_json         = COALESCE($3, dashboard_config.layout_json),
         alertas_config_json = COALESCE($4, dashboard_config.alertas_config_json),
         horario_briefing    = COALESCE($5, dashboard_config.horario_briefing),
         atualizado_em       = NOW()
       RETURNING *`,
      [usuarioId, tenantId,
       layout_json ? JSON.stringify(layout_json) : '{}',
       alertas_config_json ? JSON.stringify(alertas_config_json) : '{}',
       horario_briefing || '07:00']
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Dashboard IA] PUT /config:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard-ia/metas
// ─────────────────────────────────────────────────────────────────────────────
router.get('/metas', auth, async (req, res) => {
  const tenantId = getTenantId(req);
  const schema   = getSchema(req);
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });

  const { mes } = req.query;
  const mesParam = mes || new Date().toISOString().slice(0, 7);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".metas_dashboard
       WHERE tenant_id = $1 AND mes = $2
       ORDER BY tipo`,
      [tenantId, mesParam]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Dashboard IA] GET /metas:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dashboard-ia/metas — criar/upsert meta
// ─────────────────────────────────────────────────────────────────────────────
router.post('/metas', auth, async (req, res) => {
  const tenantId  = getTenantId(req);
  const schema    = getSchema(req);
  const usuarioId = req.usuario.id;
  const perfil    = req.usuario.perfil;
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });
  if (!['admin','financeiro'].includes(perfil)) {
    return res.status(403).json({ success: false, message: 'Sem permissão' });
  }

  const { tipo, valor_meta, mes } = req.body;
  if (!tipo || valor_meta == null || !mes) {
    return res.status(400).json({ success: false, message: 'tipo, valor_meta e mes são obrigatórios' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO "${schema}".metas_dashboard
         (tenant_id, tipo, valor_meta, mes, criado_por)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (tenant_id, tipo, mes)
       DO UPDATE SET valor_meta = $3
       RETURNING *`,
      [tenantId, tipo, valor_meta, mes, usuarioId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Dashboard IA] POST /metas:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/dashboard-ia/metas/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/metas/:id', auth, async (req, res) => {
  const tenantId = getTenantId(req);
  const schema   = getSchema(req);
  const perfil   = req.usuario.perfil;
  if (!schema) return res.status(400).json({ success: false, message: 'Tenant inválido' });
  if (!['admin','financeiro'].includes(perfil)) {
    return res.status(403).json({ success: false, message: 'Sem permissão' });
  }

  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `DELETE FROM "${schema}".metas_dashboard WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Meta não encontrada' });
    res.json({ success: true, message: 'Meta removida' });
  } catch (err) {
    console.error('[Dashboard IA] DELETE /metas/:id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
