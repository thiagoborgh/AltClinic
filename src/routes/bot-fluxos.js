/**
 * CRM C3 — Bot de atendimento configurável sem código
 * Issue #25
 *
 * O admin da clínica cria fluxos visuais de atendimento.
 * O bot processa respostas dos pacientes e faz handoff para atendente humano.
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

async function ensureTable(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS bot_fluxos (
      id BIGSERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      ativo BOOLEAN DEFAULT TRUE,
      gatilho TEXT,          -- 'primeira_mensagem' | 'palavra_chave' | 'horario_off'
      palavra_chave TEXT,    -- usado quando gatilho='palavra_chave'
      steps JSONB NOT NULL,  -- array de passos do fluxo
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `, []);

  await db.run(`
    CREATE TABLE IF NOT EXISTS bot_sessoes (
      id BIGSERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      telefone TEXT NOT NULL,
      fluxo_id BIGINT NOT NULL,
      step_atual INT DEFAULT 0,
      dados JSONB DEFAULT '{}',
      status TEXT DEFAULT 'ativo',  -- ativo, handoff, encerrado
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `, []);
}

// ── GET /api/bot/fluxos ───────────────────────────────────────────────────
router.get('/fluxos', authenticateToken, async (req, res) => {
  try {
    await ensureTable(req.db);
    const fluxos = await req.db.all(
      'SELECT id, nome, ativo, gatilho, palavra_chave, created_at FROM bot_fluxos WHERE tenant_id=$1 ORDER BY created_at DESC',
      [req.tenantId]
    );
    res.json({ success: true, fluxos });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── POST /api/bot/fluxos ──────────────────────────────────────────────────
// Criar fluxo. steps é um array de objetos:
// [{ tipo: 'mensagem', conteudo: 'Olá! Como posso ajudar?' },
//  { tipo: 'opcoes', conteudo: 'Escolha:', opcoes: ['1. Agendar', '2. Falar com atendente'] },
//  { tipo: 'handoff', mensagem: 'Aguarde, um atendente irá ajudá-lo!' }]
router.post('/fluxos', authenticateToken, async (req, res) => {
  try {
    await ensureTable(req.db);
    const { nome, gatilho = 'primeira_mensagem', palavra_chave, steps } = req.body;

    if (!nome || !steps?.length) {
      return res.status(400).json({ error: 'nome e steps são obrigatórios' });
    }

    const result = await req.db.run(`
      INSERT INTO bot_fluxos (tenant_id, nome, gatilho, palavra_chave, steps)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [req.tenantId, nome, gatilho, palavra_chave || null, JSON.stringify(steps)]);

    res.status(201).json({ success: true, id: result.lastID });
  } catch (err) {
    console.error('[Bot] Erro ao criar fluxo:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── PUT /api/bot/fluxos/:id ───────────────────────────────────────────────
router.put('/fluxos/:id', authenticateToken, async (req, res) => {
  try {
    const { nome, ativo, steps, gatilho, palavra_chave } = req.body;
    await req.db.run(`
      UPDATE bot_fluxos
      SET nome=COALESCE($1,nome), ativo=COALESCE($2,ativo),
          steps=COALESCE($3,steps), gatilho=COALESCE($4,gatilho),
          palavra_chave=COALESCE($5,palavra_chave), updated_at=NOW()
      WHERE id=$6 AND tenant_id=$7
    `, [nome, ativo, steps ? JSON.stringify(steps) : null, gatilho, palavra_chave, req.params.id, req.tenantId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── DELETE /api/bot/fluxos/:id ────────────────────────────────────────────
router.delete('/fluxos/:id', authenticateToken, async (req, res) => {
  try {
    await req.db.run(
      'DELETE FROM bot_fluxos WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── POST /api/bot/processar ───────────────────────────────────────────────
// Engine: processa resposta de um paciente e retorna próximo passo
// Chamado internamente pelo webhook do inbox
router.post('/processar', async (req, res) => {
  try {
    const { tenantId, telefone, mensagem } = req.body;

    const multiTenantDb = require('../database/MultiTenantPostgres');
    const masterDb = multiTenantDb.getMasterDb();
    const tenant = await masterDb.get('SELECT id, slug FROM tenants WHERE id=$1', [tenantId]);
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

    const db = multiTenantDb.getTenantDb(tenant.id, tenant.slug);
    await ensureTable(db);

    // Verificar sessão ativa
    let sessao = await db.get(
      "SELECT * FROM bot_sessoes WHERE telefone=$1 AND tenant_id=$2 AND status='ativo'",
      [telefone, tenantId]
    );

    // Sem sessão: tentar ativar fluxo por gatilho
    if (!sessao) {
      const fluxo = await db.get(
        "SELECT * FROM bot_fluxos WHERE tenant_id=$1 AND ativo=TRUE AND gatilho='primeira_mensagem' LIMIT 1",
        [tenantId]
      ) || await db.get(
        "SELECT * FROM bot_fluxos WHERE tenant_id=$1 AND ativo=TRUE AND gatilho='palavra_chave' AND $2 ILIKE '%' || palavra_chave || '%' LIMIT 1",
        [tenantId, mensagem]
      );

      if (!fluxo) return res.json({ acao: 'ignorar' });

      const result = await db.run(`
        INSERT INTO bot_sessoes (tenant_id, telefone, fluxo_id, step_atual)
        VALUES ($1, $2, $3, 0) RETURNING id
      `, [tenantId, telefone, fluxo.id]);

      sessao = { id: result.lastID, fluxo_id: fluxo.id, step_atual: 0, dados: '{}' };
    }

    // Buscar fluxo
    const fluxo = await db.get('SELECT * FROM bot_fluxos WHERE id=$1', [sessao.fluxo_id]);
    if (!fluxo) return res.json({ acao: 'ignorar' });

    const steps = typeof fluxo.steps === 'string' ? JSON.parse(fluxo.steps) : fluxo.steps;
    const step = steps[sessao.step_atual];

    if (!step) {
      await db.run("UPDATE bot_sessoes SET status='encerrado' WHERE id=$1", [sessao.id]);
      return res.json({ acao: 'encerrar' });
    }

    // Handoff para humano
    if (step.tipo === 'handoff') {
      await db.run("UPDATE bot_sessoes SET status='handoff' WHERE id=$1", [sessao.id]);
      return res.json({ acao: 'handoff', mensagem: step.mensagem || 'Um atendente irá ajudá-lo em breve!' });
    }

    // Avançar para próximo step
    await db.run(
      'UPDATE bot_sessoes SET step_atual=$1, updated_at=NOW() WHERE id=$2',
      [sessao.step_atual + 1, sessao.id]
    );

    return res.json({ acao: 'responder', mensagem: step.conteudo, opcoes: step.opcoes || null });
  } catch (err) {
    console.error('[Bot] Erro ao processar:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
