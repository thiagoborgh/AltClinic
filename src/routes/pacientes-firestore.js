const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

// Todas as rotas usam req.db (TenantDb PostgreSQL) injetado pelo extractTenant middleware

// Normaliza campos snake_case → camelCase para compatibilidade com o frontend
function normalizePaciente(p) {
  if (!p) return p;
  return {
    ...p,
    dataNascimento: p.data_nascimento || p.dataNascimento || null,
    nomeCompleto: p.nome,
  };
}

/**
 * GET /api/pacientes-v2
 * Lista pacientes com filtros opcionais
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { db, tenantId } = req;
    const { search, status } = req.query;

    let sql = `SELECT * FROM pacientes WHERE tenant_id = $1`;
    const params = [tenantId];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (nome ILIKE $${params.length} OR cpf ILIKE $${params.length} OR telefone ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    sql += ` ORDER BY nome ASC`;

    const pacientes = await db.query(sql, params);
    const rows = (pacientes.rows ?? pacientes).map(normalizePaciente);

    res.json({ success: true, data: rows, total: rows.length, page: 1, totalPages: 1 });
  } catch (error) {
    console.error('❌ Erro ao listar pacientes:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar pacientes', error: error.message });
  }
});

/**
 * GET /api/pacientes-v2/buscar
 * Buscar pacientes por termo
 */
router.get('/buscar', authenticateToken, async (req, res) => {
  try {
    const { db, tenantId } = req;
    const { termo } = req.query;

    if (!termo) return res.json({ success: true, data: [] });

    const t = `%${termo}%`;
    const pacientes = await db.query(
      `SELECT * FROM pacientes WHERE tenant_id = $1
       AND (nome ILIKE $2 OR cpf ILIKE $2 OR telefone ILIKE $2 OR email ILIKE $2)
       ORDER BY nome ASC LIMIT 20`,
      [tenantId, t]
    );
    const rows = (pacientes.rows ?? pacientes).map(normalizePaciente);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar pacientes', error: error.message });
  }
});

/**
 * GET /api/pacientes-v2/verificar-duplicatas
 * Verificar se CPF ou telefone já existe
 */
router.get('/verificar-duplicatas', authenticateToken, async (req, res) => {
  try {
    const { db, tenantId } = req;
    const { cpf, telefone } = req.query;

    let cpfDuplicado = false;
    let telefoneDuplicado = false;

    if (cpf) {
      const r = await db.get(`SELECT id FROM pacientes WHERE tenant_id = $1 AND cpf = $2 LIMIT 1`, [tenantId, cpf]);
      cpfDuplicado = !!r;
    }
    if (telefone) {
      const r = await db.get(`SELECT id FROM pacientes WHERE tenant_id = $1 AND telefone = $2 LIMIT 1`, [tenantId, telefone]);
      telefoneDuplicado = !!r;
    }

    res.json({ success: true, cpfDuplicado, telefoneDuplicado, exists: cpfDuplicado || telefoneDuplicado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao verificar duplicatas', error: error.message });
  }
});

/**
 * GET /api/pacientes-v2/:id
 * Buscar paciente por ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { db, tenantId } = req;
    const paciente = await db.get(
      `SELECT * FROM pacientes WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    const p = normalizePaciente(paciente);
    res.json({ success: true, data: p, paciente: p });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar paciente', error: error.message });
  }
});

/**
 * POST /api/pacientes-v2
 * Criar novo paciente
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { db, tenantId } = req;
    const {
      nome, nomeCompleto, email, telefone, cpf,
      dataNascimento, data_nascimento,   // aceita ambos os formatos
      sexo, endereco, numero, complemento, bairro, cidade, estado, cep,
      observacoes
    } = req.body;

    const nomeFinal = nome || nomeCompleto;
    if (!nomeFinal) return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
    if (!telefone) return res.status(400).json({ success: false, message: 'Telefone é obrigatório' });

    const nascimento = dataNascimento || data_nascimento || null;

    const paciente = await db.get(
      `INSERT INTO pacientes
         (tenant_id, nome, email, telefone, cpf, data_nascimento, sexo,
          endereco, numero, complemento, bairro, cidade, estado, cep, observacoes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'ativo')
       RETURNING *`,
      [tenantId, nomeFinal, email || null, telefone, cpf || null, nascimento,
       sexo || null, endereco || null, numero || null, complemento || null,
       bairro || null, cidade || null, estado || null, cep || null, observacoes || null]
    );

    const p = normalizePaciente(paciente);
    res.status(201).json({ success: true, message: 'Paciente criado com sucesso', data: p, paciente: p });
  } catch (error) {
    console.error('❌ Erro ao criar paciente:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar paciente', error: error.message });
  }
});

/**
 * PUT /api/pacientes-v2/:id
 * Atualizar paciente
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { db, tenantId } = req;
    const { id } = req.params;
    const {
      nome, nomeCompleto, email, telefone, cpf,
      dataNascimento, data_nascimento,
      sexo, endereco, numero, complemento, bairro, cidade, estado, cep,
      observacoes, status
    } = req.body;

    const nomeFinal = nome || nomeCompleto || null;
    const nascimento = dataNascimento || data_nascimento || null;

    const paciente = await db.get(
      `UPDATE pacientes SET
         nome            = COALESCE($3,  nome),
         email           = COALESCE($4,  email),
         telefone        = COALESCE($5,  telefone),
         cpf             = COALESCE($6,  cpf),
         data_nascimento = COALESCE($7,  data_nascimento),
         sexo            = COALESCE($8,  sexo),
         endereco        = COALESCE($9,  endereco),
         numero          = COALESCE($10, numero),
         complemento     = COALESCE($11, complemento),
         bairro          = COALESCE($12, bairro),
         cidade          = COALESCE($13, cidade),
         estado          = COALESCE($14, estado),
         cep             = COALESCE($15, cep),
         observacoes     = COALESCE($16, observacoes),
         status          = COALESCE($17, status),
         updated_at      = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, nomeFinal, email || null, telefone || null, cpf || null,
       nascimento, sexo || null, endereco || null, numero || null,
       complemento || null, bairro || null, cidade || null, estado || null,
       cep || null, observacoes || null, status || null]
    );

    if (!paciente) return res.status(404).json({ success: false, message: 'Paciente não encontrado' });

    const p = normalizePaciente(paciente);
    res.json({ success: true, message: 'Paciente atualizado com sucesso', data: p, paciente: p });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar paciente', error: error.message });
  }
});

/**
 * DELETE /api/pacientes-v2/:id
 * Remover paciente (soft delete)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { db, tenantId } = req;
    await db.run(
      `UPDATE pacientes SET status = 'inativo', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    res.json({ success: true, message: 'Paciente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao remover paciente', error: error.message });
  }
});

module.exports = router;
