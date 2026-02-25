const express = require('express');
const router = express.Router();
const multiTenantDb = require('../models/MultiTenantDatabase');

// ── Helpers ────────────────────────────────────────────────────────────────────

function ensureTables(tenantDb) {
  tenantDb.exec(`
    CREATE TABLE IF NOT EXISTS cadastros_procedimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      duracao INTEGER NOT NULL DEFAULT 30,
      valor REAL NOT NULL DEFAULT 0,
      categoria TEXT DEFAULT '',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cadastros_convenios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      codigo TEXT DEFAULT '',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cadastros_usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      cargo TEXT DEFAULT '',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getDb(tenantId) {
  const db = multiTenantDb.getTenantDb(tenantId);
  ensureTables(db);
  return db;
}

function requireTenant(req, res) {
  if (!req.tenantId) {
    res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    return false;
  }
  return true;
}

// ── PROCEDIMENTOS ──────────────────────────────────────────────────────────────

router.get('/procedimentos', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const rows = db.prepare(
      'SELECT * FROM cadastros_procedimentos WHERE tenant_id = ? ORDER BY nome'
    ).all(req.tenantId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/procedimentos', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, duracao = 30, valor = 0, categoria = '' } = req.body;
  if (!nome) return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  try {
    const db = getDb(req.tenantId);
    const result = db.prepare(
      `INSERT INTO cadastros_procedimentos (tenant_id, nome, duracao, valor, categoria)
       VALUES (?, ?, ?, ?, ?)`
    ).run(req.tenantId, nome, duracao, valor, categoria);
    const row = db.prepare('SELECT * FROM cadastros_procedimentos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/procedimentos/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, duracao, valor, categoria, ativo } = req.body;
  try {
    const db = getDb(req.tenantId);
    db.prepare(
      `UPDATE cadastros_procedimentos
       SET nome = COALESCE(?, nome),
           duracao = COALESCE(?, duracao),
           valor = COALESCE(?, valor),
           categoria = COALESCE(?, categoria),
           ativo = COALESCE(?, ativo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`
    ).run(nome, duracao, valor, categoria, ativo !== undefined ? (ativo ? 1 : 0) : undefined,
          req.params.id, req.tenantId);
    const row = db.prepare('SELECT * FROM cadastros_procedimentos WHERE id = ? AND tenant_id = ?')
      .get(req.params.id, req.tenantId);
    if (!row) return res.status(404).json({ success: false, message: 'Procedimento não encontrado' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/procedimentos/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const result = db.prepare(
      'DELETE FROM cadastros_procedimentos WHERE id = ? AND tenant_id = ?'
    ).run(req.params.id, req.tenantId);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Procedimento não encontrado' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── CONVÊNIOS ──────────────────────────────────────────────────────────────────

router.get('/convenios', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const rows = db.prepare(
      'SELECT * FROM cadastros_convenios WHERE tenant_id = ? ORDER BY nome'
    ).all(req.tenantId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/convenios', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, codigo = '' } = req.body;
  if (!nome) return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  try {
    const db = getDb(req.tenantId);
    const result = db.prepare(
      'INSERT INTO cadastros_convenios (tenant_id, nome, codigo) VALUES (?, ?, ?)'
    ).run(req.tenantId, nome, codigo);
    const row = db.prepare('SELECT * FROM cadastros_convenios WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/convenios/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, codigo, ativo } = req.body;
  try {
    const db = getDb(req.tenantId);
    db.prepare(
      `UPDATE cadastros_convenios
       SET nome = COALESCE(?, nome),
           codigo = COALESCE(?, codigo),
           ativo = COALESCE(?, ativo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`
    ).run(nome, codigo, ativo !== undefined ? (ativo ? 1 : 0) : undefined,
          req.params.id, req.tenantId);
    const row = db.prepare('SELECT * FROM cadastros_convenios WHERE id = ? AND tenant_id = ?')
      .get(req.params.id, req.tenantId);
    if (!row) return res.status(404).json({ success: false, message: 'Convênio não encontrado' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/convenios/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const result = db.prepare(
      'DELETE FROM cadastros_convenios WHERE id = ? AND tenant_id = ?'
    ).run(req.params.id, req.tenantId);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Convênio não encontrado' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── USUÁRIOS (funcionários) ────────────────────────────────────────────────────

router.get('/usuarios', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const rows = db.prepare(
      'SELECT * FROM cadastros_usuarios WHERE tenant_id = ? ORDER BY nome'
    ).all(req.tenantId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/usuarios', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, email, cargo = '' } = req.body;
  if (!nome || !email) return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios' });
  try {
    const db = getDb(req.tenantId);
    const result = db.prepare(
      'INSERT INTO cadastros_usuarios (tenant_id, nome, email, cargo) VALUES (?, ?, ?, ?)'
    ).run(req.tenantId, nome, email, cargo);
    const row = db.prepare('SELECT * FROM cadastros_usuarios WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/usuarios/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, email, cargo, ativo } = req.body;
  try {
    const db = getDb(req.tenantId);
    db.prepare(
      `UPDATE cadastros_usuarios
       SET nome = COALESCE(?, nome),
           email = COALESCE(?, email),
           cargo = COALESCE(?, cargo),
           ativo = COALESCE(?, ativo),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`
    ).run(nome, email, cargo, ativo !== undefined ? (ativo ? 1 : 0) : undefined,
          req.params.id, req.tenantId);
    const row = db.prepare('SELECT * FROM cadastros_usuarios WHERE id = ? AND tenant_id = ?')
      .get(req.params.id, req.tenantId);
    if (!row) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/usuarios/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const result = db.prepare(
      'DELETE FROM cadastros_usuarios WHERE id = ? AND tenant_id = ?'
    ).run(req.params.id, req.tenantId);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
