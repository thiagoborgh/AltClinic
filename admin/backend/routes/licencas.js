const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// GET /api/admin/licencas
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM licencas WHERE 1=1';
    const params = [];

    // Filtro por status
    if (status && status !== 'todas') {
      query += ' AND status = ?';
      params.push(status);
    }

    // Filtro por busca
    if (search) {
      query += ' AND (cliente LIKE ? OR email LIKE ? OR id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    // Paginação
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const licencas = db.db.prepare(query).all(...params);

    // Contar total para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM licencas WHERE 1=1';
    const countParams = [];

    if (status && status !== 'todas') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (cliente LIKE ? OR email LIKE ? OR id LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const total = db.db.prepare(countQuery).get(...countParams).total;

    // Log da ação
    db.logAction(
      req.user.userId,
      'LIST_LICENCAS',
      'licencas',
      null,
      { filters: { status, search }, total },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      licencas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar licenças:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/licencas/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const licenca = db.getLicencaById(id);

    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Log da ação
    db.logAction(
      req.user.userId,
      'VIEW_LICENCA',
      'licencas',
      id,
      { licenca_id: id },
      req.ip,
      req.get('User-Agent')
    );

    res.json(licenca);

  } catch (error) {
    console.error('Erro ao buscar licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/licencas
router.post('/', [
  authenticateToken,
  body('cliente').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('plano').notEmpty().trim(),
  body('dataVencimento').isISO8601(),
  body('status').optional().isIn(['ativa', 'vencendo', 'vencida', 'suspensa'])
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const {
      cliente,
      email,
      telefone,
      plano,
      valorMensal,
      dataVencimento,
      status = 'ativa',
      observacoes
    } = req.body;

    // Gerar ID da licença
    const lastLicenca = db.db.prepare('SELECT id FROM licencas ORDER BY id DESC LIMIT 1').get();
    let nextNumber = 1;
    
    if (lastLicenca) {
      const lastNumber = parseInt(lastLicenca.id.replace('LIC', ''));
      nextNumber = lastNumber + 1;
    }
    
    const licencaId = `LIC${String(nextNumber).padStart(3, '0')}`;

    // Inserir licença
    const result = db.db.prepare(`
      INSERT INTO licencas (
        id, cliente, email, telefone, plano, valor_mensal,
        data_vencimento, status, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      licencaId,
      cliente,
      email,
      telefone || null,
      plano,
      valorMensal || null,
      dataVencimento,
      status,
      observacoes || null
    );

    // Log da ação
    db.logAction(
      req.user.userId,
      'CREATE_LICENCA',
      'licencas',
      licencaId,
      { licenca_id: licencaId, cliente },
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json({
      message: 'Licença criada com sucesso',
      licencaId,
      id: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Erro ao criar licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/licencas/:id
router.put('/:id', [
  authenticateToken,
  body('cliente').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('plano').optional().notEmpty().trim(),
  body('dataVencimento').optional().isISO8601(),
  body('status').optional().isIn(['ativa', 'vencendo', 'vencida', 'suspensa'])
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const licenca = db.getLicencaById(id);

    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    const {
      cliente,
      email,
      telefone,
      plano,
      valorMensal,
      dataVencimento,
      status,
      observacoes
    } = req.body;

    // Atualizar licença
    const updateFields = [];
    const updateValues = [];

    if (cliente !== undefined) {
      updateFields.push('cliente = ?');
      updateValues.push(cliente);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (telefone !== undefined) {
      updateFields.push('telefone = ?');
      updateValues.push(telefone);
    }
    if (plano !== undefined) {
      updateFields.push('plano = ?');
      updateValues.push(plano);
    }
    if (valorMensal !== undefined) {
      updateFields.push('valor_mensal = ?');
      updateValues.push(valorMensal);
    }
    if (dataVencimento !== undefined) {
      updateFields.push('data_vencimento = ?');
      updateValues.push(dataVencimento);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (observacoes !== undefined) {
      updateFields.push('observacoes = ?');
      updateValues.push(observacoes);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `UPDATE licencas SET ${updateFields.join(', ')} WHERE id = ?`;
    
    db.db.prepare(updateQuery).run(...updateValues);

    // Log da ação
    db.logAction(
      req.user.userId,
      'UPDATE_LICENCA',
      'licencas',
      id,
      { licenca_id: id, changes: req.body },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      message: 'Licença atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/licencas/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const licenca = db.getLicencaById(id);

    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Soft delete - apenas desativar
    db.db.prepare('UPDATE licencas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('suspensa', id);

    // Log da ação
    db.logAction(
      req.user.userId,
      'DELETE_LICENCA',
      'licencas',
      id,
      { licenca_id: id, cliente: licenca.cliente },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      message: 'Licença suspensa com sucesso'
    });

  } catch (error) {
    console.error('Erro ao suspender licença:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/licencas/sync
router.post('/sync', authenticateToken, (req, res) => {
  try {
    // Verificar se user tem permissão (apenas super_admin)
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Permissão insuficiente'
      });
    }

    // Sincronizar licenças do banco principal
    db.syncLicencasFromMain();

    // Log da ação
    db.logAction(
      req.user.userId,
      'SYNC_LICENCAS',
      'system',
      null,
      { action: 'sync_from_main_db' },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      message: 'Licenças sincronizadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao sincronizar licenças:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
