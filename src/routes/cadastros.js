const express = require('express');
const router = express.Router();

function requireTenant(req, res) {
  if (!req.tenantId) {
    res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    return false;
  }
  return true;
}

// ── PROCEDIMENTOS ──────────────────────────────────────────────────────────────

router.get('/procedimentos', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const rows = await req.db.all(
      'SELECT * FROM cadastros_procedimentos WHERE tenant_id = $1 ORDER BY nome',
      [req.tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/procedimentos', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, duracao = 30, valor = 0, categoria = '' } = req.body;
  if (!nome) return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  try {
    const result = await req.db.run(
      `INSERT INTO cadastros_procedimentos (tenant_id, nome, duracao, valor, categoria)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.tenantId, nome, duracao, valor, categoria]
    );
    const row = await req.db.get(
      'SELECT * FROM cadastros_procedimentos WHERE id = $1',
      [result.lastID]
    );
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/procedimentos/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, duracao, valor, categoria, ativo } = req.body;
  try {
    await req.db.run(
      `UPDATE cadastros_procedimentos
       SET nome = COALESCE($1, nome),
           duracao = COALESCE($2, duracao),
           valor = COALESCE($3, valor),
           categoria = COALESCE($4, categoria),
           ativo = COALESCE($5, ativo),
           updated_at = NOW()
       WHERE id = $6 AND tenant_id = $7`,
      [nome, duracao, valor, categoria, ativo !== undefined ? ativo : null,
       req.params.id, req.tenantId]
    );
    const row = await req.db.get(
      'SELECT * FROM cadastros_procedimentos WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Procedimento não encontrado' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/procedimentos/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const result = await req.db.run(
      'DELETE FROM cadastros_procedimentos WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Procedimento não encontrado' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── CONVÊNIOS ──────────────────────────────────────────────────────────────────

router.get('/convenios', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const rows = await req.db.all(
      'SELECT * FROM cadastros_convenios WHERE tenant_id = $1 ORDER BY nome',
      [req.tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/convenios', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, codigo = '' } = req.body;
  if (!nome) return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  try {
    const result = await req.db.run(
      'INSERT INTO cadastros_convenios (tenant_id, nome, codigo) VALUES ($1, $2, $3) RETURNING id',
      [req.tenantId, nome, codigo]
    );
    const row = await req.db.get(
      'SELECT * FROM cadastros_convenios WHERE id = $1',
      [result.lastID]
    );
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/convenios/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, codigo, ativo } = req.body;
  try {
    await req.db.run(
      `UPDATE cadastros_convenios
       SET nome = COALESCE($1, nome),
           codigo = COALESCE($2, codigo),
           ativo = COALESCE($3, ativo),
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5`,
      [nome, codigo, ativo !== undefined ? ativo : null,
       req.params.id, req.tenantId]
    );
    const row = await req.db.get(
      'SELECT * FROM cadastros_convenios WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Convênio não encontrado' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/convenios/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const result = await req.db.run(
      'DELETE FROM cadastros_convenios WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Convênio não encontrado' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── USUÁRIOS (funcionários) ────────────────────────────────────────────────────

router.get('/usuarios', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const rows = await req.db.all(
      'SELECT * FROM cadastros_usuarios WHERE tenant_id = $1 ORDER BY nome',
      [req.tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/usuarios', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, email, cargo = '' } = req.body;
  if (!nome || !email) return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios' });
  try {
    const result = await req.db.run(
      'INSERT INTO cadastros_usuarios (tenant_id, nome, email, cargo) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.tenantId, nome, email, cargo]
    );
    const row = await req.db.get(
      'SELECT * FROM cadastros_usuarios WHERE id = $1',
      [result.lastID]
    );
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/usuarios/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, email, cargo, ativo } = req.body;
  try {
    await req.db.run(
      `UPDATE cadastros_usuarios
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           cargo = COALESCE($3, cargo),
           ativo = COALESCE($4, ativo),
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6`,
      [nome, email, cargo, ativo !== undefined ? ativo : null,
       req.params.id, req.tenantId]
    );
    const row = await req.db.get(
      'SELECT * FROM cadastros_usuarios WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/usuarios/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const result = await req.db.run(
      'DELETE FROM cadastros_usuarios WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
