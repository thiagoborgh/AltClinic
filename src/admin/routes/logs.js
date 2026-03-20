const express = require('express');
const router = express.Router();
const pool = require('../../database/postgres');

// GET / — audit log com filtros
router.get('/', async (req, res) => {
  try {
    const { tenant_slug, acao, data_inicio, data_fim, limit = 50, offset = 0 } = req.query;

    let whereClauses = [];
    let params = [];
    let idx = 1;

    if (tenant_slug) {
      whereClauses.push(`tenant_slug = $${idx++}`);
      params.push(tenant_slug);
    }
    if (acao) {
      whereClauses.push(`acao ILIKE $${idx++}`);
      params.push(`%${acao}%`);
    }
    if (data_inicio) {
      whereClauses.push(`criado_em >= $${idx++}`);
      params.push(data_inicio);
    }
    if (data_fim) {
      whereClauses.push(`criado_em <= $${idx++}`);
      params.push(data_fim);
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT l.id, l.admin_id, au.nome AS admin_nome, l.tenant_slug, l.acao,
              l.detalhes_json, l.ip, l.user_agent, l.criado_em
       FROM admin_audit_log l
       LEFT JOIN admin_usuarios au ON au.id = l.admin_id
       ${whereSQL}
       ORDER BY l.criado_em DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM admin_audit_log ${whereSQL}`,
      params
    );

    res.json({
      data: rows,
      total: parseInt(countRows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('[logs] GET /:', err.message);
    res.status(500).json({ error: 'Erro ao buscar audit log' });
  }
});

// GET /impersonacoes — histórico de impersonações
router.get('/impersonacoes', async (req, res) => {
  try {
    const { admin_id, tenant_slug, ativa, limit = 50, offset = 0 } = req.query;

    let whereClauses = [];
    let params = [];
    let idx = 1;

    if (admin_id) {
      whereClauses.push(`i.admin_id = $${idx++}`);
      params.push(parseInt(admin_id));
    }
    if (tenant_slug) {
      whereClauses.push(`i.tenant_slug = $${idx++}`);
      params.push(tenant_slug);
    }
    if (ativa === 'true') {
      whereClauses.push('i.fim IS NULL');
    } else if (ativa === 'false') {
      whereClauses.push('i.fim IS NOT NULL');
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT i.id, i.admin_id, au.nome AS admin_nome, i.tenant_slug,
              i.motivo, i.inicio, i.fim, i.ip
       FROM impersonacao_sessoes i
       LEFT JOIN admin_usuarios au ON au.id = i.admin_id
       ${whereSQL}
       ORDER BY i.inicio DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM impersonacao_sessoes i ${whereSQL}`,
      params
    );

    res.json({
      data: rows,
      total: parseInt(countRows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('[logs] GET /impersonacoes:', err.message);
    res.status(500).json({ error: 'Erro ao buscar impersonações' });
  }
});

module.exports = router;
