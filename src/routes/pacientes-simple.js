const express = require('express');
const router = express.Router();
const multiTenantDb = require('../models/MultiTenantDatabase');

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureTables(tenantDb) {
  tenantDb.exec(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      cpf TEXT DEFAULT '',
      telefone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      data_nascimento TEXT DEFAULT '',
      convenio TEXT DEFAULT '',
      observacoes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ativo',
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

// ── Rotas ────────────────────────────────────────────────────────────────────

/**
 * GET /api/pacientes/buscar?q=termo
 * Busca por nome, CPF ou telefone (server-side, para o Autocomplete)
 */
router.get('/buscar', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { q = '' } = req.query;
  const term = q.trim();

  if (term.length < 2) {
    return res.json({ success: true, pacientes: [] });
  }

  try {
    const db = getDb(req.tenantId);
    const like = `%${term}%`;
    const termNum = term.replace(/\D/g, '');
    const likeNum = termNum ? `%${termNum}%` : null;

    const rows = db.prepare(`
      SELECT id, nome, cpf, telefone, email, data_nascimento, convenio, status
      FROM pacientes
      WHERE tenant_id = ?
        AND status = 'ativo'
        AND (
          nome LIKE ? COLLATE NOCASE
          OR cpf LIKE ?
          OR telefone LIKE ?
          ${likeNum ? 'OR REPLACE(REPLACE(REPLACE(cpf, ".", ""), "-", ""), " ", "") LIKE ?' : ''}
          ${likeNum ? 'OR REPLACE(REPLACE(REPLACE(telefone, "(", ""), ")", ""), " ", "") LIKE ?' : ''}
        )
      ORDER BY nome ASC
      LIMIT 50
    `).all(
      req.tenantId,
      like, like, like,
      ...(likeNum ? [likeNum, likeNum] : [])
    );

    res.json({ success: true, pacientes: rows });
  } catch (error) {
    console.error('Erro na busca de pacientes:', error);
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * GET /api/pacientes
 * Lista os 100 pacientes mais recentes (para fallback / telas de listagem)
 */
router.get('/', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const rows = db.prepare(`
      SELECT id, nome, cpf, telefone, email, data_nascimento, convenio, status, created_at
      FROM pacientes
      WHERE tenant_id = ?
      ORDER BY nome ASC
      LIMIT 100
    `).all(req.tenantId);

    res.json({ success: true, pacientes: rows, total: rows.length });
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * GET /api/pacientes/:id
 */
router.get('/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const row = db.prepare(
      'SELECT * FROM pacientes WHERE id = ? AND tenant_id = ?'
    ).get(req.params.id, req.tenantId);

    if (!row) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });

    res.json({ success: true, paciente: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * POST /api/pacientes
 */
router.post('/', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, cpf = '', telefone = '', email = '', data_nascimento = '', convenio = '', observacoes = '' } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  }

  try {
    const db = getDb(req.tenantId);
    const result = db.prepare(`
      INSERT INTO pacientes (tenant_id, nome, cpf, telefone, email, data_nascimento, convenio, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo')
    `).run(req.tenantId, nome.trim(), cpf, telefone, email, data_nascimento, convenio, observacoes);

    const novo = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, paciente: novo, message: 'Paciente criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * PUT /api/pacientes/:id
 */
router.put('/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, cpf, telefone, email, data_nascimento, convenio, observacoes, status } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  }

  try {
    const db = getDb(req.tenantId);
    const exists = db.prepare('SELECT id FROM pacientes WHERE id = ? AND tenant_id = ?')
      .get(req.params.id, req.tenantId);
    if (!exists) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });

    db.prepare(`
      UPDATE pacientes
      SET nome = ?, cpf = ?, telefone = ?, email = ?, data_nascimento = ?,
          convenio = ?, observacoes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(
      nome.trim(), cpf || '', telefone || '', email || '', data_nascimento || '',
      convenio || '', observacoes || '', status || 'ativo',
      req.params.id, req.tenantId
    );

    const updated = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(req.params.id);
    res.json({ success: true, paciente: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * DELETE /api/pacientes/:id  (soft-delete)
 */
router.delete('/:id', (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = getDb(req.tenantId);
    const exists = db.prepare('SELECT id FROM pacientes WHERE id = ? AND tenant_id = ?')
      .get(req.params.id, req.tenantId);
    if (!exists) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });

    db.prepare(`
      UPDATE pacientes SET status = 'inativo', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(req.params.id, req.tenantId);

    res.json({ success: true, message: 'Paciente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

module.exports = router;
