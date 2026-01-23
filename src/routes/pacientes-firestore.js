const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');
const { authenticateToken } = require('./auth');

/**
 * Middleware para extrair tenantId do JWT
 */
function extractTenantId(req, res, next) {
  const tenantId = req.user?.tenantId || req.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant não identificado'
    });
  }
  
  req.tenantId = tenantId;
  next();
}

/**
 * @route GET /api/pacientes
 * @desc Lista todos os pacientes com filtros opcionais usando Firestore
 */
router.get('/', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { search, status } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;

    const pacientes = await firestoreService.getPacientes(tenantId, filters);

    res.json({
      success: true,
      data: pacientes,
      total: pacientes.length,
      page: 1,
      totalPages: 1
    });

  } catch (error) {
    console.error('❌ Erro ao listar pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pacientes',
      error: error.message
    });
  }
});

/**
 * @route GET /api/pacientes-v2/buscar
 * @desc Buscar pacientes por termo
 */
router.get('/buscar', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { termo } = req.query;

    if (!termo) {
      return res.json({ success: true, data: [] });
    }

    const pacientes = await firestoreService.getPacientes(tenantId, { search: termo });

    res.json({
      success: true,
      data: pacientes
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pacientes',
      error: error.message
    });
  }
});

/**
 * @route GET /api/pacientes-v2/verificar-duplicatas
 * @desc Verificar se já existe paciente com CPF ou telefone
 */
router.get('/verificar-duplicatas', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { cpf, telefone } = req.query;

    const pacientes = await firestoreService.getPacientes(tenantId);
    
    const cpfDuplicado = cpf ? pacientes.some(p => p.cpf === cpf) : false;
    const telefoneDuplicado = telefone ? pacientes.some(p => p.telefone === telefone) : false;

    res.json({
      success: true,
      cpfDuplicado,
      telefoneDuplicado,
      exists: cpfDuplicado || telefoneDuplicado
    });

  } catch (error) {
    console.error('❌ Erro ao verificar duplicatas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar duplicatas',
      error: error.message
    });
  }
});

/**
 * @route GET /api/pacientes/:id
 * @desc Buscar paciente por ID
 */
router.get('/:id', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { id } = req.params;

    const paciente = await firestoreService.getPacienteById(tenantId, id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    res.json({
      success: true,
      data: paciente,
      paciente: paciente
    });

  } catch (error) {
    console.error('❌ Erro ao buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar paciente',
      error: error.message
    });
  }
});

/**
 * @route POST /api/pacientes
 * @desc Criar novo paciente
 */
router.post('/', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const pacienteData = {
      ...req.body,
      status: req.body.status || 'ativo',
      tenant_id: tenantId
    };

    // Validações básicas
    if (!pacienteData.nome && !pacienteData.nomeCompleto) {
      return res.status(400).json({
        success: false,
        message: 'Nome é obrigatório'
      });
    }

    if (!pacienteData.telefone) {
      return res.status(400).json({
        success: false,
        message: 'Telefone é obrigatório'
      });
    }

    const paciente = await firestoreService.createPaciente(tenantId, pacienteData);

    res.status(201).json({
      success: true,
      message: 'Paciente criado com sucesso',
      data: paciente,
      paciente: paciente
    });

  } catch (error) {
    console.error('❌ Erro ao criar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar paciente',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/pacientes/:id
 * @desc Atualizar paciente
 */
router.put('/:id', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { id } = req.params;
    const updates = req.body;

    // Verificar se paciente existe
    const paciente = await firestoreService.getPacienteById(tenantId, id);
    
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    await firestoreService.updatePaciente(tenantId, id, updates);

    // Buscar dados atualizados
    const pacienteAtualizado = await firestoreService.getPacienteById(tenantId, id);

    res.json({
      success: true,
      message: 'Paciente atualizado com sucesso',
      data: pacienteAtualizado,
      paciente: pacienteAtualizado
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar paciente',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/pacientes/:id
 * @desc Deletar paciente
 */
router.delete('/:id', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { id } = req.params;

    // Verificar se paciente existe
    const paciente = await firestoreService.getPacienteById(tenantId, id);
    
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    await firestoreService.deletePaciente(tenantId, id);

    res.json({
      success: true,
      message: 'Paciente deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar paciente',
      error: error.message
    });
  }
});

/**
 * @route PATCH /api/pacientes/:id/status
 * @desc Alterar status do paciente
 */
router.patch('/:id/status', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { id } = req.params;
    const { status } = req.body;

    if (!['ativo', 'inativo', 'bloqueado'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Use: ativo, inativo ou bloqueado'
      });
    }

    // Verificar se paciente existe
    const paciente = await firestoreService.getPacienteById(tenantId, id);
    
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    await firestoreService.updatePaciente(tenantId, id, { status });

    res.json({
      success: true,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/pacientes/:id/historico
 * @desc Buscar histórico de atendimentos do paciente
 */
router.get('/:id/historico', authenticateToken, extractTenantId, async (req, res) => {
  try {
    const { tenantId } = req;
    const { id } = req.params;

    // Verificar se paciente existe
    const paciente = await firestoreService.getPacienteById(tenantId, id);
    
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Buscar agendamentos do paciente (implementar quando converter agendamentos)
    // Por enquanto retorna array vazio
    const historico = [];

    res.json({
      success: true,
      data: historico
    });

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
});

module.exports = router;
