const express = require('express');
const router = express.Router();
const multiTenantDb = require('../models/MultiTenantDatabase');
const PacienteModel = require('../models/Paciente');
const authUtil = require('../utils/auth');
const { checkPacienteLimit } = require('../middleware/planLimits');
// const encryptionUtil = require('../utils/encryption');

// Dados mock para desenvolvimento
const mockPacientes = [
  {
    id: 1,
    nome: 'Maria Silva Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 99999-1234',
    cpf: '123.456.789-01',
    dataNascimento: '1985-03-15',
    endereco: JSON.stringify({
      logradouro: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567'
    }),
    estadoCivil: 'Casada',
    profissao: 'Engenheira',
    convenio: JSON.stringify({
      nome: 'Unimed',
      numero: '123456789'
    }),
    observacoes: 'Paciente regular, sem restrições',
    criadoEm: '2024-01-15T10:30:00Z',
    ultimoAtendimento: '2024-08-15T14:20:00Z',
    status: 'ativo'
  },
  {
    id: 2,
    nome: 'João Pedro Oliveira',
    email: 'joao.oliveira@email.com',
    telefone: '(11) 88888-5678',
    cpf: '987.654.321-09',
    dataNascimento: '1978-07-22',
    endereco: JSON.stringify({
      logradouro: 'Av. Paulista, 456',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100'
    }),
    estadoCivil: 'Solteiro',
    profissao: 'Advogado',
    convenio: JSON.stringify({
      nome: 'Bradesco Saúde',
      numero: '987654321'
    }),
    observacoes: 'Primeira consulta agendada',
    criadoEm: '2024-02-20T09:15:00Z',
    ultimoAtendimento: '2024-08-22T16:30:00Z',
    status: 'ativo'
  }
];

/**
 * @route GET /api/pacientes
 * @desc Lista todos os pacientes com filtros opcionais
 */
router.get('/', authUtil.authenticate, async (req, res) => {
  try {
    const tenant_id = req.tenant?.id;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const db = multiTenantDb.getTenantDb(tenant_id);
    const pacienteModel = new PacienteModel(db);

    // Extrair parâmetros de query
    const {
      search,
      status = 'ativo',
      page = 1,
      limit = 50,
      orderBy = 'nome',
      order = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Buscar pacientes reais do banco
    const result = await pacienteModel.listar({
      search,
      status,
      limit: parseInt(limit),
      offset,
      orderBy,
      order
    });

    const totalPages = Math.ceil(result.total / parseInt(limit));

    return res.json({
      success: true,
      pacientes: result.pacientes,
      total: result.total,
      page: parseInt(page),
      totalPages
    });
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/pacientes/:id
 * @desc Busca paciente por ID
 */
router.get('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pacienteModel = new PacienteModel(req.db);
    const paciente = await pacienteModel.buscarPorId(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    res.json({
      success: true,
      paciente: paciente
    });

  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/pacientes/test
 * @desc Cria novo paciente (sem autenticação - apenas para teste)
 */
router.post('/test', async (req, res) => {
  try {
    const tenant_id = req.tenant?.id || 'test-tenant-1'; // Usar tenant do header ou padrão para teste

    const db = multiTenantDb.getTenantDb(tenant_id);
    const pacienteModel = new PacienteModel(db);

    // Validar dados obrigatórios
    const { nome, email, telefone, cpf, dataNascimento } = req.body;

    if (!nome || !email || !telefone || !cpf || !dataNascimento) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email, telefone, CPF e data de nascimento são obrigatórios'
      });
    }

    // Criar paciente
    const pacienteData = {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento,
      tenant_id,
      created_at: new Date().toISOString(),
      status: 'ativo'
    };

    const pacienteId = await pacienteModel.create(pacienteData);

    return res.status(201).json({
      success: true,
      message: 'Paciente criado com sucesso',
      paciente: { id: pacienteId, ...pacienteData }
    });
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/pacientes
 * @desc Cria novo paciente
 */
router.post('/', authUtil.authenticate, checkPacienteLimit, async (req, res) => {
  try {
    const tenant_id = req.tenant?.id;
    const usuario_id = req.user?.id;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const db = multiTenantDb.getTenantDb(tenant_id);
    const pacienteModel = new PacienteModel(db);

    // Validar dados obrigatórios
    const { nome, email, telefone, cpf, dataNascimento } = req.body;

    if (!nome || !email || !telefone || !cpf || !dataNascimento) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: nome, email, telefone, cpf, dataNascimento'
      });
    }

    // Verificar se já existe paciente com mesmo CPF
    const pacienteExistente = await pacienteModel.buscarPorCpf(cpf);
    if (pacienteExistente) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um paciente cadastrado com este CPF'
      });
    }

    // Criar paciente
    const dadosPaciente = {
      ...req.body,
      tenant_id,
      criado_por: usuario_id,
      criado_em: new Date().toISOString()
    };

    const novoPaciente = await pacienteModel.criar(dadosPaciente);

    res.status(201).json({
      success: true,
      message: 'Paciente criado com sucesso',
      paciente: novoPaciente
    });

  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route PUT /api/pacientes/:id
 * @desc Atualiza paciente
 */
router.put('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant?.id;
    const usuario_id = req.user?.id;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const db = multiTenantDb.getTenantDb(tenant_id);
    const pacienteModel = new PacienteModel(db);

    // Verificar se paciente existe
    const pacienteExistente = await pacienteModel.buscarPorId(id);
    if (!pacienteExistente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Atualizar paciente
    const dadosAtualizacao = {
      ...req.body,
      atualizado_por: usuario_id,
      atualizado_em: new Date().toISOString()
    };

    const pacienteAtualizado = await pacienteModel.atualizar(id, dadosAtualizacao);

    res.json({
      success: true,
      message: 'Paciente atualizado com sucesso',
      paciente: pacienteAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/pacientes/:id
 * @desc Remove paciente (soft delete)
 */
router.delete('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant?.id;
    const usuario_id = req.user?.id;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const db = multiTenantDb.getTenantDb(tenant_id);
    const pacienteModel = new PacienteModel(db);

    // Verificar se paciente existe
    const pacienteExistente = await pacienteModel.buscarPorId(id);
    if (!pacienteExistente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Soft delete
    await pacienteModel.remover(id, usuario_id);

    res.json({
      success: true,
      message: 'Paciente removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/pacientes/:id/prontuario
 * @desc Busca prontuário do paciente
 */
router.get('/:id/prontuario', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant?.id;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const db = multiTenantDb.getTenantDb(tenant_id);
    const pacienteModel = new PacienteModel(db);

    const prontuario = await pacienteModel.obterProntuario(id);

    res.json({
      success: true,
      prontuario: prontuario || {}
    });

  } catch (error) {
    console.error('Erro ao buscar prontuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/pacientes/:id/atendimento
 * @desc Registra novo atendimento para o paciente
 */
router.post('/:id/atendimento', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant?.id;
    const usuario_id = req.user?.id;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const db = multiTenantDb.getTenantDb(tenant_id);
    const pacienteModel = new PacienteModel(db);

    // Verificar se paciente existe
    const pacienteExistente = await pacienteModel.buscarPorId(id);
    if (!pacienteExistente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    const dadosAtendimento = {
      ...req.body,
      paciente_id: id,
      realizado_por: usuario_id,
      realizado_em: new Date().toISOString()
    };

    const novoAtendimento = await pacienteModel.criarAtendimento(dadosAtendimento);

    res.status(201).json({
      success: true,
      message: 'Atendimento registrado com sucesso',
      atendimento: novoAtendimento
    });

  } catch (error) {
    console.error('Erro ao registrar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
