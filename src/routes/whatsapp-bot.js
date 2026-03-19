/**
 * WhatsApp Bot — endpoints de configuração e administração
 * Montado em /api/whatsapp/bot
 */
const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../database/postgres');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');
const BotService             = require('../services/BotService');

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}

function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}

const auth = [extractTenant, authenticateToken];

// ── GET /api/whatsapp/bot/config ─────────────────────────────────────────────
router.get('/config', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);

    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".whatsapp_bot_config WHERE tenant_id = $1`,
      [tenantId]
    );

    if (!rows.length) {
      return res.json({
        tenant_id:      tenantId,
        ativo:          false,
        nome_bot:       'Assistente',
        horario_inicio: '07:00',
        horario_fim:    '22:00',
        dias_semana:    [1, 2, 3, 4, 5, 6],
        sla_inatividade: 30,
        max_tentativas:  3,
        mensagens:       {},
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[BotConfig] Erro ao buscar config:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/whatsapp/bot/config ─────────────────────────────────────────────
router.put('/config', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const {
      ativo, nome_bot, foto_url,
      horario_inicio, horario_fim, dias_semana,
      sla_inatividade, max_tentativas, mensagens,
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO "${schema}".whatsapp_bot_config
        (tenant_id, ativo, nome_bot, foto_url, horario_inicio, horario_fim,
         dias_semana, sla_inatividade, max_tentativas, mensagens, atualizado_em)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        ativo           = EXCLUDED.ativo,
        nome_bot        = EXCLUDED.nome_bot,
        foto_url        = EXCLUDED.foto_url,
        horario_inicio  = EXCLUDED.horario_inicio,
        horario_fim     = EXCLUDED.horario_fim,
        dias_semana     = EXCLUDED.dias_semana,
        sla_inatividade = EXCLUDED.sla_inatividade,
        max_tentativas  = EXCLUDED.max_tentativas,
        mensagens       = EXCLUDED.mensagens,
        atualizado_em   = NOW()
      RETURNING *
    `, [
      tenantId,
      ativo ?? false,
      nome_bot || 'Assistente',
      foto_url || null,
      horario_inicio || '07:00',
      horario_fim    || '22:00',
      JSON.stringify(dias_semana ?? [1, 2, 3, 4, 5, 6]),
      sla_inatividade ?? 30,
      max_tentativas  ?? 3,
      JSON.stringify(mensagens ?? {}),
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error('[BotConfig] Erro ao salvar config:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/whatsapp/bot/faq ─────────────────────────────────────────────────
router.get('/faq', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { categoria, ativo = 'true' } = req.query;

    const conds  = ['tenant_id = $1'];
    const params = [tenantId];
    let idx = 2;

    if (ativo !== 'todos') {
      conds.push(`ativo = $${idx++}`);
      params.push(ativo === 'true');
    }
    if (categoria) {
      conds.push(`categoria = $${idx++}`);
      params.push(categoria);
    }

    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".whatsapp_bot_faq WHERE ${conds.join(' AND ')} ORDER BY uso_count DESC, id`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('[BotFaq] Erro ao listar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/whatsapp/bot/faq ────────────────────────────────────────────────
router.post('/faq', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { pergunta, resposta, palavras_chave = [], categoria } = req.body;

    if (!pergunta || !resposta) {
      return res.status(400).json({ error: 'pergunta e resposta são obrigatórios' });
    }

    const { rows } = await pool.query(`
      INSERT INTO "${schema}".whatsapp_bot_faq
        (tenant_id, pergunta, resposta, palavras_chave, categoria, ativo)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [tenantId, pergunta, resposta, JSON.stringify(palavras_chave), categoria || null]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[BotFaq] Erro ao criar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/whatsapp/bot/faq/:id ─────────────────────────────────────────────
router.put('/faq/:id', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { id }   = req.params;
    const { pergunta, resposta, palavras_chave, categoria, ativo } = req.body;

    const { rows } = await pool.query(`
      UPDATE "${schema}".whatsapp_bot_faq
      SET pergunta       = COALESCE($1, pergunta),
          resposta       = COALESCE($2, resposta),
          palavras_chave = COALESCE($3, palavras_chave),
          categoria      = COALESCE($4, categoria),
          ativo          = COALESCE($5, ativo)
      WHERE id = $6 AND tenant_id = $7
      RETURNING *
    `, [
      pergunta || null,
      resposta || null,
      palavras_chave ? JSON.stringify(palavras_chave) : null,
      categoria || null,
      ativo !== undefined ? ativo : null,
      id,
      tenantId,
    ]);

    if (!rows.length) return res.status(404).json({ error: 'FAQ não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[BotFaq] Erro ao atualizar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/whatsapp/bot/faq/:id ─────────────────────────────────────────
router.delete('/faq/:id', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { id }   = req.params;

    await pool.query(
      `UPDATE "${schema}".whatsapp_bot_faq SET ativo = false WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[BotFaq] Erro ao desativar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/whatsapp/bot/sessoes ─────────────────────────────────────────────
router.get('/sessoes', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { estado, limit = 50 } = req.query;

    const conds  = ['s.tenant_id = $1'];
    const params = [tenantId];
    let idx = 2;

    if (estado) {
      conds.push(`s.estado = $${idx++}`);
      params.push(estado);
    } else {
      conds.push(`s.estado NOT IN ('encerrado')`);
    }

    params.push(parseInt(limit));
    const { rows } = await pool.query(`
      SELECT s.*, p.nome AS paciente_nome
      FROM "${schema}".whatsapp_bot_sessoes s
      LEFT JOIN "${schema}".pacientes p ON p.id = s.paciente_id
      WHERE ${conds.join(' AND ')}
      ORDER BY s.ultima_interacao DESC
      LIMIT $${idx}
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('[BotSessoes] Erro ao listar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/whatsapp/bot/sessoes/:id/transferir ─────────────────────────────
router.post('/sessoes/:id/transferir', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const slug     = req.tenant?.slug || req.usuario?.tenant_slug;
    const { id }   = req.params;
    const { motivo = 'solicitado_admin' } = req.body;

    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".whatsapp_bot_sessoes WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Sessão não encontrada' });

    const sessao = rows[0];
    const bot    = new BotService(tenantId, slug);
    await bot.transferirParaHumano(sessao, motivo);

    res.json({ ok: true, motivo });
  } catch (err) {
    console.error('[BotSessoes] Erro ao transferir:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
