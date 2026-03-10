const express = require('express');
const router = express.Router();
const authUtil = require('../utils/auth');

/**
 * @route GET /models/procedimentos
 * @desc Lista procedimentos da clínica
 */
router.get('/procedimentos', authUtil.authenticate, async (req, res) => {
  try {
    const procedimentos = await req.db.all(
      `SELECT * FROM procedimento WHERE clinica_id = $1 ORDER BY nome`,
      [req.user.clinica_id]
    );

    res.json({
      success: true,
      data: procedimentos
    });

  } catch (error) {
    console.error('Erro ao listar procedimentos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /models/procedimentos
 * @desc Cria novo procedimento
 */
router.post('/procedimentos', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const { nome, duracao_minutos, preco, preparo_texto } = req.body;

    if (!nome || !duracao_minutos || !preco) {
      return res.status(400).json({
        success: false,
        message: 'Nome, duração e preço são obrigatórios'
      });
    }

    const result = await req.db.run(
      `INSERT INTO procedimento (clinica_id, nome, duracao_minutos, preco, preparo_texto)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user.clinica_id, nome, duracao_minutos, preco, preparo_texto]
    );

    const procedimento = await req.db.get(
      'SELECT * FROM procedimento WHERE id = $1',
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'Procedimento criado com sucesso',
      data: procedimento
    });

  } catch (error) {
    console.error('Erro ao criar procedimento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /models/equipamentos
 * @desc Lista equipamentos da clínica
 */
router.get('/equipamentos', authUtil.authenticate, async (req, res) => {
  try {
    const equipamentos = await req.db.all(
      `SELECT * FROM equipamento WHERE clinica_id = $1 ORDER BY nome`,
      [req.user.clinica_id]
    );

    res.json({
      success: true,
      data: equipamentos
    });

  } catch (error) {
    console.error('Erro ao listar equipamentos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /models/equipamentos
 * @desc Cria novo equipamento
 */
router.post('/equipamentos', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const { nome, capacidade, descricao } = req.body;

    if (!nome || !capacidade) {
      return res.status(400).json({
        success: false,
        message: 'Nome e capacidade são obrigatórios'
      });
    }

    const result = await req.db.run(
      `INSERT INTO equipamento (clinica_id, nome, capacidade, descricao)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.user.clinica_id, nome, capacidade, descricao]
    );

    const equipamento = await req.db.get(
      'SELECT * FROM equipamento WHERE id = $1',
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'Equipamento criado com sucesso',
      data: equipamento
    });

  } catch (error) {
    console.error('Erro ao criar equipamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /models/pacientes
 * @desc Lista pacientes da clínica
 */
router.get('/pacientes', authUtil.authenticate, async (req, res) => {
  try {
    const PacienteModel = require('../models/Paciente');
    const { nome, telefone, inativos, limit, offset } = req.query;

    const filters = {
      nome,
      telefone,
      inativos: inativos === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    const pacientes = PacienteModel.findByClinica(req.user.clinica_id, filters);

    res.json({
      success: true,
      data: pacientes
    });

  } catch (error) {
    console.error('Erro ao listar pacientes:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /models/pacientes
 * @desc Cria novo paciente
 */
router.post('/pacientes', authUtil.authenticate, async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({
        success: false,
        message: 'Nome e telefone são obrigatórios'
      });
    }

    const PacienteModel = require('../models/Paciente');

    const paciente = PacienteModel.create({
      clinica_id: req.user.clinica_id,
      nome,
      telefone,
      email
    });

    res.status(201).json({
      success: true,
      message: 'Paciente criado com sucesso',
      data: paciente
    });

  } catch (error) {
    console.error('Erro ao criar paciente:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /models/pacientes/:id
 * @desc Busca paciente por ID
 */
router.get('/pacientes/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const PacienteModel = require('../models/Paciente');

    const paciente = PacienteModel.findById(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Verificar se pertence à clínica
    if (!PacienteModel.belongsToClinica(id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    res.json({
      success: true,
      data: paciente
    });

  } catch (error) {
    console.error('Erro ao buscar paciente:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /models/pacientes/:id
 * @desc Atualiza dados do paciente
 */
router.put('/pacientes/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;

    const PacienteModel = require('../models/Paciente');

    // Verificar se pertence à clínica
    if (!PacienteModel.belongsToClinica(id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    const pacienteAtualizado = PacienteModel.update(id, {
      nome,
      telefone,
      email
    });

    res.json({
      success: true,
      message: 'Paciente atualizado com sucesso',
      data: pacienteAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar paciente:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
