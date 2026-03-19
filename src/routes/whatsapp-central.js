/**
 * WhatsApp Central de Atendimento — endpoints REST + webhook
 * Montado em /api/whatsapp ANTES das rotas Firestore legadas
 */
const express  = require('express');
const router   = express.Router();
const pool     = require('../database/postgres');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');
const { WhatsAppConversaService, renderizarTemplate } = require('../services/WhatsAppConversaService');
const ClassificacaoService  = require('../services/ClassificacaoService');
const BotService             = require('../services/BotService');

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug || req.user?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}

function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}

function getIo() {
  try { return require('../server').io; } catch { return null; }
}

// Rate limiting de envio: 20 msg/min por tenant (em memória)
const envioContador = new Map();
function rateLimitEnvio(req, res, next) {
  const agora    = Date.now();
  const tenantId = getTenantId(req) || 'unknown';
  const entry    = envioContador.get(tenantId) || { count: 0, resetAt: agora + 60000 };
  if (agora > entry.resetAt) { entry.count = 0; entry.resetAt = agora + 60000; }
  if (entry.count >= 20) return res.status(429).json({ error: 'Limite de 20 mensagens/min atingido' });
  entry.count++;
  envioContador.set(tenantId, entry);
  next();
}

const auth = [extractTenant, authenticateToken];

// ── POST /api/whatsapp/webhook ─────────────────────────────────────────────────
router.post('/webhook', (req, res) => {
  res.status(200).json({ ok: true });

  setImmediate(async () => {
    try {
      await processarWebhookEntrada(req.body);
    } catch (err) {
      console.error('[Webhook WA] Erro:', err.message);
    }
  });
});

async function processarWebhookEntrada(payload) {
  const { tenant_slug, from, messageId, type, text, timestamp } = payload;
  if (!tenant_slug || !from) return;

  const { rows: tenantRows } = await pool.query(
    'SELECT id FROM public.tenants WHERE slug = $1 LIMIT 1',
    [tenant_slug]
  );
  if (!tenantRows.length) return;
  const tenantId = tenantRows[0].id;
  const schema   = schemaFromSlug(tenant_slug);

  // Deduplicar por provider_msg_id
  if (messageId) {
    const { rows: dup } = await pool.query(
      `SELECT 1 FROM "${schema}".whatsapp_mensagens WHERE provider_msg_id = $1`,
      [messageId]
    );
    if (dup.length) return;
  }

  const svc      = new WhatsAppConversaService(pool, tenantId, schema);
  const conversa = await svc.resolverConversa(from);

  const paciente = await svc.identificarPaciente(from);
  if (paciente && !conversa.paciente_id) {
    await pool.query(
      `UPDATE "${schema}".whatsapp_conversas SET paciente_id = $1 WHERE id = $2`,
      [paciente.id, conversa.id]
    );
  }

  const msg = await svc.registrarMensagemEntrada(conversa.id, {
    tipo:            type === 'audio' ? 'audio' : type === 'image' ? 'imagem' : 'texto',
    conteudo:        text,
    provider_msg_id: messageId,
  });

  await pool.query(`
    UPDATE "${schema}".whatsapp_conversas
    SET nao_lidas = nao_lidas + 1,
        ultima_mensagem_em = NOW(),
        ultima_mensagem_pre = LEFT($1, 80),
        sem_resposta_alerta = false,
        atualizado_em = NOW()
    WHERE id = $2
  `, [text || '[mídia]', conversa.id]);

  const io = getIo();
  if (io) io.to(`tenant:${tenantId}`).emit('nova_mensagem', {
    conversa_id:      conversa.id,
    mensagem:         msg,
    conversa_preview: {
      id: conversa.id, numero: from,
      ultima_mensagem_pre: (text || '[mídia]').slice(0, 80),
      nao_lidas: (conversa.nao_lidas || 0) + 1,
    },
  });

  if (text) ClassificacaoService.classificar(conversa.id, text, pool, tenantId, schema).catch(console.error);

  // Delegar para o bot se estiver ativo para este tenant
  const bot = new BotService(tenantId, tenant_slug);
  bot.processar(conversa.id, from, text || '', type).catch(err =>
    console.error('[Webhook WA] Erro no bot:', err.message)
  );
}

// ── GET /api/whatsapp/conversas ───────────────────────────────────────────────
router.get('/conversas', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { status, tag, atendente_id, minhas, q, page = 1, limit = 20 } = req.query;

    const conditions = ['wc.tenant_id = $1'];
    const params     = [tenantId];
    let idx = 2;

    if (status)       { conditions.push(`wc.status = $${idx++}`);       params.push(status); }
    if (tag)          { conditions.push(`wc.tag = $${idx++}`);           params.push(tag); }
    if (atendente_id) { conditions.push(`wc.atendente_id = $${idx++}`);  params.push(atendente_id); }
    if (minhas === 'true') {
      const userId = req.usuario?.id || req.user?.id;
      conditions.push(`wc.atendente_id = $${idx++}`);
      params.push(userId);
    }
    if (q) {
      const like = `%${q}%`;
      conditions.push(`(p.nome ILIKE $${idx} OR wc.numero ILIKE $${idx + 1} OR wc.ultima_mensagem_pre ILIKE $${idx + 2})`);
      params.push(like, like, like);
      idx += 3;
    }

    const where  = 'WHERE ' + conditions.join(' AND ');
    const offset = (Number(page) - 1) * Number(limit);

    const { rows: conversas } = await pool.query(`
      SELECT
        wc.id, wc.numero, wc.status, wc.tag, wc.nao_lidas, wc.origem,
        wc.ultima_mensagem_em, wc.ultima_mensagem_pre,
        p.id AS paciente_id, p.nome AS paciente_nome,
        u.id AS atendente_id, u.nome AS atendente_nome
      FROM "${schema}".whatsapp_conversas wc
      LEFT JOIN "${schema}".pacientes p ON p.id = wc.paciente_id
      LEFT JOIN "${schema}".usuarios  u ON u.id = wc.atendente_id
      ${where}
      ORDER BY
        CASE WHEN wc.nao_lidas > 0 THEN 0 ELSE 1 END,
        wc.ultima_mensagem_em DESC NULLS LAST
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, Number(limit), offset]);

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS c FROM "${schema}".whatsapp_conversas wc
       LEFT JOIN "${schema}".pacientes p ON p.id = wc.paciente_id
       ${where}`,
      params
    );

    return res.json({
      conversas: conversas.map(c => ({
        id: c.id, numero: c.numero, status: c.status, tag: c.tag,
        nao_lidas: c.nao_lidas, ultima_mensagem_em: c.ultima_mensagem_em,
        ultima_mensagem_pre: c.ultima_mensagem_pre,
        paciente:  c.paciente_id  ? { id: c.paciente_id,  nome: c.paciente_nome  } : null,
        atendente: c.atendente_id ? { id: c.atendente_id, nome: c.atendente_nome } : null,
      })),
      total: Number(countRows[0].c),
      pagina: Number(page),
    });
  } catch (err) {
    console.error('❌ GET /whatsapp/conversas:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── POST /api/whatsapp/conversas ──────────────────────────────────────────────
router.post('/conversas', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { numero, paciente_id, origem = 'sistema' } = req.body;
    if (!numero) return res.status(400).json({ error: 'numero é obrigatório' });

    const svc      = new WhatsAppConversaService(pool, tenantId, schema);
    const conversa = await svc.resolverConversa(numero);
    if (paciente_id && !conversa.paciente_id) {
      const userId = req.usuario?.id || req.user?.id;
      await svc.vincularPaciente(numero, paciente_id, userId);
    }
    return res.status(201).json(conversa);
  } catch (err) {
    console.error('❌ POST /whatsapp/conversas:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── GET /api/whatsapp/conversas/:id ──────────────────────────────────────────
router.get('/conversas/:id', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);

    const { rows: [conversa] } = await pool.query(`
      SELECT wc.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone,
             u.nome AS atendente_nome
      FROM "${schema}".whatsapp_conversas wc
      LEFT JOIN "${schema}".pacientes p ON p.id = wc.paciente_id
      LEFT JOIN "${schema}".usuarios  u ON u.id = wc.atendente_id
      WHERE wc.id = $1 AND wc.tenant_id = $2
    `, [req.params.id, tenantId]);

    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });
    return res.json(conversa);
  } catch (err) {
    console.error('❌ GET /whatsapp/conversas/:id:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── GET /api/whatsapp/conversas/:id/mensagens ─────────────────────────────────
router.get('/conversas/:id/mensagens', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { antes_de, limit = 50 } = req.query;

    const { rows: convRows } = await pool.query(
      `SELECT id FROM "${schema}".whatsapp_conversas WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!convRows.length) return res.status(404).json({ error: 'Conversa não encontrada' });

    let sql    = `SELECT * FROM "${schema}".whatsapp_mensagens WHERE conversa_id = $1`;
    const params = [req.params.id];
    let idx    = 2;

    if (antes_de) { sql += ` AND id < $${idx++}`; params.push(antes_de); }
    sql += ` ORDER BY id DESC LIMIT $${idx}`;
    params.push(Number(limit));

    const { rows: mensagens } = await pool.query(sql, params);
    mensagens.reverse();

    // Zerar não lidas
    await pool.query(
      `UPDATE "${schema}".whatsapp_conversas SET nao_lidas = 0 WHERE id = $1`,
      [req.params.id]
    );

    return res.json({ mensagens, tem_mais: mensagens.length === Number(limit) });
  } catch (err) {
    console.error('❌ GET /whatsapp/conversas/:id/mensagens:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── POST /api/whatsapp/conversas/:id/mensagens ────────────────────────────────
router.post('/conversas/:id/mensagens', ...auth, rateLimitEnvio, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { tipo = 'texto', conteudo, template_id } = req.body;

    const { rows: [conversa] } = await pool.query(
      `SELECT * FROM "${schema}".whatsapp_conversas WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

    let textoFinal = conteudo;
    if (template_id) {
      const { rows: [tpl] } = await pool.query(
        `SELECT * FROM "${schema}".whatsapp_templates WHERE id = $1`,
        [template_id]
      );
      if (tpl) {
        let pacienteVars = {};
        if (conversa.paciente_id) {
          const { rows: [pac] } = await pool.query(
            `SELECT * FROM "${schema}".pacientes WHERE id = $1`,
            [conversa.paciente_id]
          );
          pacienteVars = pac || {};
        }
        textoFinal = renderizarTemplate(tpl.texto, pacienteVars);
      }
    }

    if (!textoFinal) return res.status(400).json({ error: 'conteudo ou template_id é obrigatório' });

    // Tentar enviar via UnifiedWhatsAppService
    let providerMsgId = null;
    try {
      const UnifiedWhatsAppService = require('../services/UnifiedWhatsAppService');
      const slug = req.tenant?.slug || req.usuario?.tenant_slug;
      const wa   = new UnifiedWhatsAppService();
      const r    = await wa.sendMessage(slug, 'central', { to: conversa.numero, body: textoFinal });
      providerMsgId = r?.messageId || null;
    } catch (err) {
      console.warn('[WA Central] Envio via provider falhou:', err.message);
    }

    const { rows: [msg] } = await pool.query(`
      INSERT INTO "${schema}".whatsapp_mensagens
        (conversa_id, direcao, tipo, conteudo, origem, provider_msg_id)
      VALUES ($1, 'saida', $2, $3, 'humano', $4)
      RETURNING *
    `, [conversa.id, tipo, textoFinal, providerMsgId]);

    await pool.query(
      `UPDATE "${schema}".whatsapp_conversas SET nao_lidas = 0, atualizado_em = NOW() WHERE id = $1`,
      [conversa.id]
    );

    const io = getIo();
    if (io) io.to(`tenant:${tenantId}`).emit('mensagem_enviada', { conversa_id: conversa.id, mensagem: msg });

    return res.status(201).json(msg);
  } catch (err) {
    console.error('❌ POST /whatsapp/conversas/:id/mensagens:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── PATCH /api/whatsapp/conversas/:id/atribuir ────────────────────────────────
router.patch('/conversas/:id/atribuir', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { atendente_id } = req.body;

    await pool.query(
      `UPDATE "${schema}".whatsapp_conversas SET atendente_id = $1, atualizado_em = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [atendente_id, req.params.id, tenantId]
    );

    const { rows: [user] } = await pool.query(
      `SELECT id, nome FROM "${schema}".usuarios WHERE id = $1`,
      [atendente_id]
    );

    const io = getIo();
    if (io) io.to(`tenant:${tenantId}`).emit('conversa_atribuida', {
      conversa_id: Number(req.params.id), atendente: user || null,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ PATCH /whatsapp/conversas/:id/atribuir:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── PATCH /api/whatsapp/conversas/:id/encerrar ────────────────────────────────
router.patch('/conversas/:id/encerrar', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);

    await pool.query(
      `UPDATE "${schema}".whatsapp_conversas SET status = 'encerrada', atualizado_em = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );

    const io = getIo();
    if (io) io.to(`tenant:${tenantId}`).emit('conversa_encerrada', { conversa_id: Number(req.params.id) });

    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ PATCH /whatsapp/conversas/:id/encerrar:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── PATCH /api/whatsapp/conversas/:id/vincular-paciente ──────────────────────
router.patch('/conversas/:id/vincular-paciente', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { paciente_id } = req.body;
    const userId = req.usuario?.id || req.user?.id;

    if (!paciente_id) return res.status(400).json({ error: 'paciente_id é obrigatório' });

    const { rows: [conversa] } = await pool.query(
      `SELECT numero FROM "${schema}".whatsapp_conversas WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

    const svc = new WhatsAppConversaService(pool, tenantId, schema);
    await svc.vincularPaciente(conversa.numero, paciente_id, userId);

    await pool.query(
      `UPDATE "${schema}".whatsapp_conversas SET paciente_id = $1, atualizado_em = NOW()
       WHERE id = $2`,
      [paciente_id, req.params.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ PATCH /whatsapp/conversas/:id/vincular-paciente:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── POST /api/whatsapp/conversas/:id/sugerir-resposta ─────────────────────────
router.post('/conversas/:id/sugerir-resposta', ...auth, async (req, res) => {
  try {
    const schema = getSchema(req);
    const sugestao = await ClassificacaoService.sugerirResposta(req.params.id, pool, schema);
    return res.json({ sugestao });
  } catch (err) {
    console.error('❌ POST /whatsapp/conversas/:id/sugerir-resposta:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/whatsapp/templates ───────────────────────────────────────────────
router.get('/templates', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".whatsapp_templates WHERE tenant_id = $1 AND ativo = true ORDER BY nome`,
      [tenantId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ GET /whatsapp/templates:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── POST /api/whatsapp/templates ──────────────────────────────────────────────
router.post('/templates', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { nome, texto, variaveis = [], categoria } = req.body;
    if (!nome || !texto) return res.status(400).json({ error: 'nome e texto são obrigatórios' });

    const { rows: [tpl] } = await pool.query(`
      INSERT INTO "${schema}".whatsapp_templates (tenant_id, nome, texto, variaveis, categoria)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [tenantId, nome, texto, JSON.stringify(variaveis), categoria || null]);

    return res.status(201).json({ success: true, data: tpl });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe template com este nome' });
    console.error('❌ POST /whatsapp/templates:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── PUT /api/whatsapp/templates/:id ──────────────────────────────────────────
router.put('/templates/:id', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { nome, texto, variaveis, categoria, ativo } = req.body;
    const fields = ['atualizado_em = NOW()'];
    const params = [];

    if (nome !== undefined)      { params.push(nome);                   fields.push(`nome = $${params.length}`); }
    if (texto !== undefined)     { params.push(texto);                  fields.push(`texto = $${params.length}`); }
    if (variaveis !== undefined) { params.push(JSON.stringify(variaveis)); fields.push(`variaveis = $${params.length}`); }
    if (categoria !== undefined) { params.push(categoria);              fields.push(`categoria = $${params.length}`); }
    if (ativo !== undefined)     { params.push(ativo);                  fields.push(`ativo = $${params.length}`); }

    if (params.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    params.push(req.params.id, tenantId);
    const { rows: [tpl] } = await pool.query(`
      UPDATE "${schema}".whatsapp_templates
      SET ${fields.join(', ')}
      WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
      RETURNING *
    `, params);

    if (!tpl) return res.status(404).json({ error: 'Template não encontrado' });
    return res.json({ success: true, data: tpl });
  } catch (err) {
    console.error('❌ PUT /whatsapp/templates/:id:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── DELETE /api/whatsapp/templates/:id ───────────────────────────────────────
router.delete('/templates/:id', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    await pool.query(
      `UPDATE "${schema}".whatsapp_templates SET ativo = false WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ DELETE /whatsapp/templates/:id:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── POST /api/whatsapp/templates/:id/renderizar ───────────────────────────────
router.post('/templates/:id/renderizar', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { rows: [tpl] } = await pool.query(
      `SELECT * FROM "${schema}".whatsapp_templates WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!tpl) return res.status(404).json({ error: 'Template não encontrado' });

    const texto = renderizarTemplate(tpl.texto, req.body || {});
    return res.json({ texto });
  } catch (err) {
    console.error('❌ POST /whatsapp/templates/:id/renderizar:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
