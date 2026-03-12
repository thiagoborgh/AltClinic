/**
 * CRM C3 — Inbox centralizado WhatsApp multiagente
 * Issue #24
 *
 * Permite que múltiplos atendentes operem no mesmo número WhatsApp.
 * Integrado com Evolution API (já existente no projeto).
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// ── DDL inline ────────────────────────────────────────────────────────────────
async function ensureTables(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS whatsapp_conversas (
      id BIGSERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      paciente_id BIGINT,
      telefone TEXT NOT NULL,
      nome_contato TEXT,
      atendente_id BIGINT,
      status TEXT DEFAULT 'aberta',   -- aberta, em_atendimento, encerrada
      ultima_mensagem TEXT,
      ultima_mensagem_at TIMESTAMP,
      nao_lidas INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `, []);

  await db.run(`
    CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
      id BIGSERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      conversa_id BIGINT NOT NULL,
      direction TEXT NOT NULL,   -- 'inbound' | 'outbound'
      remetente TEXT,            -- telefone ou nome do atendente
      conteudo TEXT NOT NULL,
      tipo TEXT DEFAULT 'text',  -- text, image, audio, document
      evolution_message_id TEXT,
      lida BOOLEAN DEFAULT FALSE,
      enviado_at TIMESTAMP DEFAULT NOW()
    )
  `, []);
}

// ── GET /api/inbox ─────────────────────────────────────────────────────────
// Lista todas as conversas do tenant (visão Kanban de atendimento)
router.get('/', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);
    const { status, atendente_id } = req.query;

    let sql = `
      SELECT c.*, u.nome AS atendente_nome, p.nome AS paciente_nome
      FROM whatsapp_conversas c
      LEFT JOIN usuarios u ON u.id = c.atendente_id
      LEFT JOIN pacientes p ON p.id = c.paciente_id
      WHERE c.tenant_id = $1
    `;
    const params = [req.tenantId];

    if (status) { sql += ` AND c.status = $${params.length + 1}`; params.push(status); }
    if (atendente_id) { sql += ` AND c.atendente_id = $${params.length + 1}`; params.push(atendente_id); }

    sql += ' ORDER BY c.ultima_mensagem_at DESC NULLS LAST';

    const conversas = await req.db.all(sql, params);
    res.json({ success: true, conversas, total: conversas.length });
  } catch (err) {
    console.error('[Inbox] Erro ao listar conversas:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── GET /api/inbox/conversa/:id ───────────────────────────────────────────
// Mensagens de uma conversa específica + marcar como lidas
router.get('/conversa/:id', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);
    const { id } = req.params;

    const conversa = await req.db.get(
      'SELECT * FROM whatsapp_conversas WHERE id=$1 AND tenant_id=$2',
      [id, req.tenantId]
    );
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

    const mensagens = await req.db.all(
      'SELECT * FROM whatsapp_mensagens WHERE conversa_id=$1 ORDER BY enviado_at ASC',
      [id]
    );

    // Marcar como lidas
    await req.db.run(
      'UPDATE whatsapp_conversas SET nao_lidas=0, updated_at=NOW() WHERE id=$1',
      [id]
    );
    await req.db.run(
      'UPDATE whatsapp_mensagens SET lida=TRUE WHERE conversa_id=$1 AND direction=$2',
      [id, 'inbound']
    );

    res.json({ success: true, conversa, mensagens });
  } catch (err) {
    console.error('[Inbox] Erro ao buscar conversa:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── POST /api/inbox/conversa/:id/mensagem ────────────────────────────────
// Atendente envia mensagem para o paciente
router.post('/conversa/:id/mensagem', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);
    const { id } = req.params;
    const { conteudo } = req.body;

    if (!conteudo) return res.status(400).json({ error: 'conteudo é obrigatório' });

    const conversa = await req.db.get(
      'SELECT * FROM whatsapp_conversas WHERE id=$1 AND tenant_id=$2',
      [id, req.tenantId]
    );
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

    // Enviar via Evolution API
    const { UnifiedWhatsAppService } = require('../services/UnifiedWhatsAppService');
    const whatsapp = new UnifiedWhatsAppService(req.tenantId, req.tenant?.slug);
    await whatsapp.sendMessage(conversa.telefone, conteudo);

    // Registrar mensagem outbound
    await req.db.run(`
      INSERT INTO whatsapp_mensagens (tenant_id, conversa_id, direction, remetente, conteudo)
      VALUES ($1, $2, 'outbound', $3, $4)
    `, [req.tenantId, id, req.user?.nome || 'Atendente', conteudo]);

    await req.db.run(
      `UPDATE whatsapp_conversas SET ultima_mensagem=$1, ultima_mensagem_at=NOW(), updated_at=NOW() WHERE id=$2`,
      [conteudo, id]
    );

    res.json({ success: true, message: 'Mensagem enviada' });
  } catch (err) {
    console.error('[Inbox] Erro ao enviar mensagem:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── PUT /api/inbox/atribuir/:id ───────────────────────────────────────────
// Atribuir conversa a um atendente
router.put('/atribuir/:id', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);
    const { id } = req.params;
    const { atendente_id } = req.body;

    await req.db.run(
      `UPDATE whatsapp_conversas
       SET atendente_id=$1, status='em_atendimento', updated_at=NOW()
       WHERE id=$2 AND tenant_id=$3`,
      [atendente_id || req.user?.id, id, req.tenantId]
    );

    res.json({ success: true, message: 'Conversa atribuída' });
  } catch (err) {
    console.error('[Inbox] Erro ao atribuir conversa:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── PUT /api/inbox/encerrar/:id ───────────────────────────────────────────
router.put('/encerrar/:id', authenticateToken, async (req, res) => {
  try {
    await req.db.run(
      `UPDATE whatsapp_conversas SET status='encerrada', updated_at=NOW() WHERE id=$1 AND tenant_id=$2`,
      [req.params.id, req.tenantId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── POST /api/inbox/webhook ───────────────────────────────────────────────
// Recebe mensagens da Evolution API (sem auth — chamado pelo servidor WhatsApp)
router.post('/webhook', async (req, res) => {
  res.status(200).json({ received: true }); // responde imediatamente

  try {
    const { data, event } = req.body;
    if (event !== 'messages.upsert') return;

    const msg = data?.messages?.[0];
    if (!msg || msg.key?.fromMe) return; // ignora mensagens enviadas por nós

    const telefone = msg.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const conteudo = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[mídia]';
    const tenantId = req.query.tenantId; // passado como query param no webhook URL

    if (!telefone || !tenantId) return;

    // Precisamos de um db do tenant — usar masterDb para descobrir o slug
    const multiTenantDb = require('../database/MultiTenantPostgres');
    const masterDb = multiTenantDb.getMasterDb();
    const tenant = await masterDb.get('SELECT id, slug FROM tenants WHERE id=$1', [tenantId]);
    if (!tenant) return;

    const tenantDb = multiTenantDb.getTenantDb(tenant.id, tenant.slug);
    await ensureTables(tenantDb);

    // Buscar ou criar conversa
    let conversa = await tenantDb.get(
      'SELECT id FROM whatsapp_conversas WHERE telefone=$1 AND tenant_id=$2 AND status != $3',
      [telefone, tenantId, 'encerrada']
    );

    if (!conversa) {
      const paciente = await tenantDb.get(
        "SELECT id, nome FROM pacientes WHERE telefone LIKE $1 LIMIT 1",
        [`%${telefone.slice(-9)}`]
      );
      const result = await tenantDb.run(`
        INSERT INTO whatsapp_conversas (tenant_id, telefone, nome_contato, paciente_id, ultima_mensagem, ultima_mensagem_at)
        VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id
      `, [tenantId, telefone, paciente?.nome || telefone, paciente?.id || null, conteudo]);
      conversa = { id: result.lastID };
    } else {
      await tenantDb.run(
        `UPDATE whatsapp_conversas SET ultima_mensagem=$1, ultima_mensagem_at=NOW(), nao_lidas=nao_lidas+1 WHERE id=$2`,
        [conteudo, conversa.id]
      );
    }

    await tenantDb.run(`
      INSERT INTO whatsapp_mensagens (tenant_id, conversa_id, direction, remetente, conteudo, evolution_message_id)
      VALUES ($1, $2, 'inbound', $3, $4, $5)
    `, [tenantId, conversa.id, telefone, conteudo, msg.key?.id]);

  } catch (err) {
    console.error('[Inbox Webhook] Erro:', err.message);
  }
});

module.exports = router;
