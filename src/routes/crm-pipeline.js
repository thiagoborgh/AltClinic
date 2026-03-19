const express = require('express');
const router = express.Router();
const pool = require('../database/postgres');
const { extractTenant } = require('../middleware/tenant');
const { authenticateToken } = require('../middleware/auth');
const { calcularScoreIA, schemaFromSlug } = require('../services/CrmScoreService');

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug || req.tenantId;
  return schemaFromSlug(slug);
}

function getUserId(req) {
  return req.usuario?.id || req.user?.id;
}

// ── GET /api/crm/etapas ───────────────────────────────────────────────────────
router.get('/etapas', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const { rows } = await pool.query(`
      SELECT id, ordem, nome, cor, alerta_dias, ativo
      FROM "${schema}".crm_etapas_config
      ORDER BY ordem ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ GET /api/crm/etapas:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── PUT /api/crm/etapas/:id ───────────────────────────────────────────────────
router.put('/etapas/:id', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const { nome, cor, alerta_dias, ativo } = req.body;
    const fields = [];
    const params = [];

    if (nome !== undefined) { params.push(nome); fields.push(`nome = $${params.length}`); }
    if (cor !== undefined) { params.push(cor); fields.push(`cor = $${params.length}`); }
    if (alerta_dias !== undefined) { params.push(alerta_dias); fields.push(`alerta_dias = $${params.length}`); }
    if (ativo !== undefined) { params.push(ativo); fields.push(`ativo = $${params.length}`); }

    if (fields.length === 0) return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });

    params.push(req.params.id);
    const { rows: [etapa] } = await pool.query(`
      UPDATE "${schema}".crm_etapas_config SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *
    `, params);

    if (!etapa) return res.status(404).json({ success: false, error: 'Etapa não encontrada' });
    return res.json({ success: true, data: etapa });
  } catch (err) {
    console.error('❌ PUT /api/crm/etapas/:id:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── GET /api/crm/pipeline ─────────────────────────────────────────────────────
router.get('/pipeline', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const { profissional_id, etapa_id, procedimento_id, origem } = req.query;

    const { rows: etapas } = await pool.query(`
      SELECT id, ordem, nome, cor, alerta_dias
      FROM "${schema}".crm_etapas_config
      WHERE ativo = 1
      ORDER BY ordem ASC
    `);

    const filtros = ['o.ativo = 1'];
    const params  = [];

    if (profissional_id) { params.push(Number(profissional_id)); filtros.push(`o.responsavel_id = $${params.length}`); }
    if (etapa_id)        { params.push(Number(etapa_id));        filtros.push(`o.etapa_id = $${params.length}`); }
    if (procedimento_id) { params.push(Number(procedimento_id)); filtros.push(`o.procedimento_id = $${params.length}`); }
    if (origem)          { params.push(origem);                  filtros.push(`o.origem = $${params.length}`); }

    const where = filtros.join(' AND ');

    const { rows: oportunidades } = await pool.query(`
      SELECT
        o.id,
        o.paciente_id,
        p.nome                                                            AS paciente_nome,
        o.procedimento_id,
        pr.nome                                                           AS procedimento_nome,
        o.etapa_id,
        o.valor_estimado,
        o.origem,
        o.responsavel_id,
        u.nome                                                            AS responsavel_nome,
        o.score_ia,
        o.proxima_acao_em,
        o.proxima_acao_desc,
        o.criado_em,
        o.atualizado_em,
        EXTRACT(DAY FROM (NOW() - o.atualizado_em))::INTEGER             AS dias_na_etapa
      FROM "${schema}".crm_oportunidades o
      JOIN  "${schema}".pacientes         p  ON p.id  = o.paciente_id
      LEFT JOIN "${schema}".procedimentos pr ON pr.id = o.procedimento_id
      JOIN  "${schema}".usuarios          u  ON u.id  = o.responsavel_id
      WHERE ${where}
      ORDER BY o.score_ia DESC NULLS LAST, o.atualizado_em ASC
    `, params);

    const resultado = etapas.map(etapa => {
      const ops = oportunidades
        .filter(o => o.etapa_id === etapa.id)
        .map(o => ({ ...o, alerta: (o.dias_na_etapa || 0) >= etapa.alerta_dias }));

      return {
        ...etapa,
        total:       ops.length,
        valor_total: ops.reduce((s, o) => s + parseFloat(o.valor_estimado || 0), 0),
        oportunidades: ops,
      };
    });

    return res.json({ success: true, etapas: resultado });
  } catch (err) {
    console.error('❌ GET /api/crm/pipeline:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── GET /api/crm/oportunidades ────────────────────────────────────────────────
router.get('/oportunidades', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows } = await pool.query(`
      SELECT o.id, o.paciente_id, p.nome AS paciente_nome,
             o.etapa_id, e.nome AS etapa_nome, e.cor AS etapa_cor,
             o.valor_estimado, o.origem, o.score_ia, o.criado_em, o.atualizado_em
      FROM "${schema}".crm_oportunidades o
      JOIN "${schema}".pacientes p         ON p.id = o.paciente_id
      JOIN "${schema}".crm_etapas_config e ON e.id = o.etapa_id
      WHERE o.ativo = 1
      ORDER BY o.atualizado_em DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), offset]);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ GET /api/crm/oportunidades:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/crm/oportunidades ───────────────────────────────────────────────
router.post('/oportunidades', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema  = getSchema(req);
    const userId  = getUserId(req);
    const {
      paciente_id, procedimento_id, etapa_id, valor_estimado,
      origem, responsavel_id, observacoes, proxima_acao_em, proxima_acao_desc,
    } = req.body;

    if (!paciente_id || !etapa_id || !origem) {
      return res.status(400).json({ success: false, error: 'paciente_id, etapa_id e origem são obrigatórios' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${schema}", public`);

      const { rows: [op] } = await client.query(`
        INSERT INTO crm_oportunidades
          (paciente_id, procedimento_id, etapa_id, valor_estimado, origem,
           responsavel_id, observacoes, proxima_acao_em, proxima_acao_desc)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id
      `, [
        paciente_id, procedimento_id || null, etapa_id,
        valor_estimado || null, origem,
        responsavel_id || userId, observacoes || null,
        proxima_acao_em || null, proxima_acao_desc || null,
      ]);

      await client.query(`
        INSERT INTO crm_atividades (oportunidade_id, tipo, descricao, usuario_id, criado_em)
        VALUES ($1, 'criacao', 'Oportunidade criada', $2, NOW())
      `, [op.id, userId]);

      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: { id: op.id } });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ POST /api/crm/oportunidades:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── GET /api/crm/oportunidades/:id ────────────────────────────────────────────
router.get('/oportunidades/:id', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const { id } = req.params;

    const [opResult, atvResult] = await Promise.all([
      pool.query(`
        SELECT o.*, p.nome AS paciente_nome, pr.nome AS procedimento_nome,
               e.id AS etapa_id_obj, e.nome AS etapa_nome, e.cor AS etapa_cor,
               u.nome AS responsavel_nome
        FROM "${schema}".crm_oportunidades o
        JOIN  "${schema}".pacientes          p  ON p.id  = o.paciente_id
        LEFT JOIN "${schema}".procedimentos  pr ON pr.id = o.procedimento_id
        JOIN  "${schema}".crm_etapas_config  e  ON e.id  = o.etapa_id
        JOIN  "${schema}".usuarios           u  ON u.id  = o.responsavel_id
        WHERE o.id = $1
      `, [id]),

      pool.query(`
        SELECT a.*, u.nome AS usuario_nome
        FROM "${schema}".crm_atividades a
        LEFT JOIN "${schema}".usuarios u ON u.id = a.usuario_id
        WHERE a.oportunidade_id = $1
        ORDER BY a.criado_em ASC
      `, [id]),
    ]);

    const op = opResult.rows[0];
    if (!op) return res.status(404).json({ success: false, error: 'Oportunidade não encontrada' });

    return res.json({
      success: true,
      data: {
        ...op,
        etapa: { id: op.etapa_id_obj, nome: op.etapa_nome, cor: op.etapa_cor },
        atividades: atvResult.rows,
      },
    });
  } catch (err) {
    console.error('❌ GET /api/crm/oportunidades/:id:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── PATCH /api/crm/oportunidades/:id ─────────────────────────────────────────
router.patch('/oportunidades/:id', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const { observacoes, proxima_acao_em, proxima_acao_desc } = req.body;
    const fields = ['atualizado_em = NOW()'];
    const params = [];

    if (observacoes !== undefined)       { params.push(observacoes);       fields.push(`observacoes = $${params.length}`); }
    if (proxima_acao_em !== undefined)   { params.push(proxima_acao_em);   fields.push(`proxima_acao_em = $${params.length}`); }
    if (proxima_acao_desc !== undefined) { params.push(proxima_acao_desc); fields.push(`proxima_acao_desc = $${params.length}`); }

    params.push(req.params.id);
    await pool.query(`
      UPDATE "${schema}".crm_oportunidades SET ${fields.join(', ')} WHERE id = $${params.length}
    `, params);

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ PATCH /api/crm/oportunidades/:id:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── PATCH /api/crm/oportunidades/:id/mover ───────────────────────────────────
router.patch('/oportunidades/:id/mover', extractTenant, authenticateToken, async (req, res) => {
  const schema = getSchema(req);
  const opId   = Number(req.params.id);
  const { etapa_id, motivo_perda, agendamento_id, observacao } = req.body;
  const userId = getUserId(req);

  if (!etapa_id) return res.status(400).json({ success: false, error: 'etapa_id é obrigatório' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: opRows } = await client.query(`
      SELECT o.*, e.nome AS etapa_nome
      FROM "${schema}".crm_oportunidades o
      JOIN "${schema}".crm_etapas_config e ON e.id = o.etapa_id
      WHERE o.id = $1 AND o.ativo = 1
    `, [opId]);
    const op = opRows[0];
    if (!op) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'Oportunidade não encontrada' }); }

    const { rows: etapaRows } = await client.query(
      `SELECT * FROM "${schema}".crm_etapas_config WHERE id = $1`,
      [etapa_id]
    );
    const etapaDestino = etapaRows[0];
    if (!etapaDestino) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, error: 'Etapa destino inválida' }); }

    if (etapaDestino.nome.toLowerCase() === 'perdido' && !motivo_perda) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'motivo_perda é obrigatório ao mover para Perdido' });
    }

    await client.query(`
      UPDATE "${schema}".crm_oportunidades
      SET etapa_id = $1, atualizado_em = NOW(), motivo_perda = $2, agendamento_id = $3
      WHERE id = $4
    `, [etapa_id, motivo_perda || null, agendamento_id || null, opId]);

    const descricao = observacao
      ? `Movida de '${op.etapa_nome}' para '${etapaDestino.nome}': ${observacao}`
      : `Movida de '${op.etapa_nome}' para '${etapaDestino.nome}'`;

    const { rows: [atv] } = await client.query(`
      INSERT INTO "${schema}".crm_atividades
        (oportunidade_id, tipo, descricao, metadata, usuario_id, criado_em)
      VALUES ($1, 'mudanca_etapa', $2, $3, $4, NOW())
      RETURNING id
    `, [
      opId, descricao,
      JSON.stringify({ etapa_anterior: op.etapa_nome, etapa_nova: etapaDestino.nome, motivo_perda: motivo_perda || null }),
      userId,
    ]);

    await client.query('COMMIT');
    return res.json({
      success: true,
      data: { id: opId, etapa_anterior: op.etapa_nome, etapa_nova: etapaDestino.nome, atividade_id: atv.id },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ PATCH /api/crm/oportunidades/:id/mover:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// ── POST /api/crm/oportunidades/:id/atividades ────────────────────────────────
router.post('/oportunidades/:id/atividades', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const { tipo, descricao } = req.body;
    const userId = getUserId(req);

    if (!tipo || !descricao) return res.status(400).json({ success: false, error: 'tipo e descricao são obrigatórios' });

    const { rows: [atv] } = await pool.query(`
      INSERT INTO "${schema}".crm_atividades (oportunidade_id, tipo, descricao, usuario_id, criado_em)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, tipo, descricao, criado_em
    `, [req.params.id, tipo, descricao, userId]);

    // Atualizar atualizado_em da oportunidade
    await pool.query(`UPDATE "${schema}".crm_oportunidades SET atualizado_em = NOW() WHERE id = $1`, [req.params.id]);

    return res.status(201).json({ success: true, data: atv });
  } catch (err) {
    console.error('❌ POST /api/crm/oportunidades/:id/atividades:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/crm/oportunidades/:id/score ────────────────────────────────────
router.post('/oportunidades/:id/score', extractTenant, authenticateToken, async (req, res) => {
  try {
    const schema = getSchema(req);
    const resultado = await calcularScoreIA(schema, Number(req.params.id));
    return res.json({ success: true, data: resultado });
  } catch (err) {
    if (err.message?.includes('Oportunidade não encontrada')) {
      return res.status(404).json({ success: false, error: 'Oportunidade não encontrada' });
    }
    console.error('❌ POST /api/crm/oportunidades/:id/score:', err);
    return res.status(503).json({ success: false, error: 'Serviço de IA indisponível. Score anterior mantido.' });
  }
});

module.exports = router;
