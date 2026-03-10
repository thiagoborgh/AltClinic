const express = require('express');
const router = express.Router();
const multiTenantDb = require('../models/MultiTenantDatabase');

// ── Helpers ─────────────────────────────────────────────────────────────────

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
router.get('/buscar', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { q = '' } = req.query;
  const term = q.trim();

  if (term.length < 2) {
    return res.json({ success: true, pacientes: [] });
  }

  try {
    const db = req.db;
    const like = `%${term}%`;
    const termNum = term.replace(/\D/g, '');
    const likeNum = termNum ? `%${termNum}%` : null;

    let sql = `
      SELECT id, nome, cpf, telefone, email, data_nascimento, convenio, status
      FROM pacientes
      WHERE tenant_id = $1
        AND status = 'ativo'
        AND (
          nome ILIKE $2
          OR cpf LIKE $3
          OR telefone LIKE $4
    `;
    const params = [req.tenantId, like, like, like];

    if (likeNum) {
      params.push(likeNum);
      const p5 = params.length;
      params.push(likeNum);
      const p6 = params.length;
      sql += `
          OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') LIKE $${p5}
          OR REGEXP_REPLACE(telefone, '[^0-9]', '', 'g') LIKE $${p6}
      `;
    }

    sql += `
        )
      ORDER BY nome ASC
      LIMIT 50
    `;

    const rows = await db.all(sql, params);

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
router.get('/', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = req.db;
    const rows = await db.all(`
      SELECT id, nome, cpf, telefone, email, data_nascimento, convenio, status, created_at
      FROM pacientes
      WHERE tenant_id = $1
      ORDER BY nome ASC
      LIMIT 100
    `, [req.tenantId]);

    res.json({ success: true, pacientes: rows, total: rows.length });
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * GET /api/pacientes/:id
 */
router.get('/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = req.db;
    const row = await db.get(
      'SELECT * FROM pacientes WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );

    if (!row) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });

    res.json({ success: true, paciente: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * POST /api/pacientes
 */
router.post('/', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, cpf = '', telefone = '', email = '', data_nascimento = '', convenio = '', observacoes = '' } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  }

  try {
    const db = req.db;
    const result = await db.run(`
      INSERT INTO pacientes (tenant_id, nome, cpf, telefone, email, data_nascimento, convenio, observacoes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ativo')
      RETURNING id
    `, [req.tenantId, nome.trim(), cpf, telefone, email, data_nascimento, convenio, observacoes]);

    const novo = await db.get('SELECT * FROM pacientes WHERE id = $1', [result.lastID]);
    res.status(201).json({ success: true, paciente: novo, message: 'Paciente criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * PUT /api/pacientes/:id
 */
router.put('/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  const { nome, cpf, telefone, email, data_nascimento, convenio, observacoes, status } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
  }

  try {
    const db = req.db;
    const exists = await db.get(
      'SELECT id FROM pacientes WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (!exists) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });

    await db.run(`
      UPDATE pacientes
      SET nome = $1, cpf = $2, telefone = $3, email = $4, data_nascimento = $5,
          convenio = $6, observacoes = $7, status = $8, updated_at = NOW()
      WHERE id = $9 AND tenant_id = $10
    `, [
      nome.trim(), cpf || '', telefone || '', email || '', data_nascimento || '',
      convenio || '', observacoes || '', status || 'ativo',
      req.params.id, req.tenantId
    ]);

    const updated = await db.get('SELECT * FROM pacientes WHERE id = $1', [req.params.id]);
    res.json({ success: true, paciente: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

/**
 * DELETE /api/pacientes/:id  (soft-delete)
 */
router.delete('/:id', async (req, res) => {
  if (!requireTenant(req, res)) return;
  try {
    const db = req.db;
    const exists = await db.get(
      'SELECT id FROM pacientes WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (!exists) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });

    await db.run(`
      UPDATE pacientes SET status = 'inativo', updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `, [req.params.id, req.tenantId]);

    res.json({ success: true, message: 'Paciente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno', error: error.message });
  }
});

module.exports = router;
