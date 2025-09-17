const express = require('express');
const router = express.Router();
const authUtil = require('../utils/auth');
const { sendWhatsAppMessage } = require('../utils/bot');

// Mock data para desenvolvimento
let atendimentos = [];
let atendimentoIdCounter = 1;

/**
 * @route POST /api/atendimentos
 * @desc Iniciar novo atendimento
 */
router.post('/', authUtil.authenticate, async (req, res) => {
  try {
    const {
      pacienteId,
      profissionalId,
      agendamentoId,
      tipoAtendimento,
      prioridade,
      queixaPrincipal,
      sintomas,
      sinaisVitais,
      observacoes,
      dataInicio
    } = req.body;

    // Validações básicas
    if (!pacienteId || !profissionalId || !tipoAtendimento || !queixaPrincipal) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios não fornecidos'
      });
    }

    // Criar novo atendimento
    const novoAtendimento = {
      id: atendimentoIdCounter++,
      pacienteId,
      profissionalId,
      agendamentoId,
      tipoAtendimento,
      prioridade: prioridade || 'normal',
      queixaPrincipal,
      sintomas: sintomas || '',
      sinaisVitais: sinaisVitais || {},
      observacoes: observacoes || '',
      dataInicio: dataInicio || new Date().toISOString(),
      dataFim: null,
      status: 'em-andamento',
      evolucao: [],
      criadoPor: req.user.id,
      clinicaId: req.user.clinica_id
    };

    atendimentos.push(novoAtendimento);

    // Atualizar status do agendamento para "em-atendimento"
    // Aqui seria a lógica para atualizar o agendamento no banco

    res.status(201).json({
      success: true,
      message: 'Atendimento iniciado com sucesso',
      data: novoAtendimento
    });

  } catch (error) {
    console.error('Erro ao iniciar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /api/atendimentos/:id/finalizar
 * @desc Finalizar atendimento
 */
router.put('/:id/finalizar', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnostico,
      tratamento,
      prescricao,
      observacoesFinais,
      dataFim
    } = req.body;

    const atendimentoIndex = atendimentos.findIndex(a => a.id === parseInt(id));

    if (atendimentoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    // Atualizar atendimento
    atendimentos[atendimentoIndex] = {
      ...atendimentos[atendimentoIndex],
      diagnostico: diagnostico || '',
      tratamento: tratamento || '',
      prescricao: prescricao || '',
      observacoesFinais: observacoesFinais || '',
      dataFim: dataFim || new Date().toISOString(),
      status: 'finalizado'
    };

    // Atualizar status do agendamento para "realizado"
    // Aqui seria a lógica para atualizar o agendamento no banco

    res.json({
      success: true,
      message: 'Atendimento finalizado com sucesso',
      data: atendimentos[atendimentoIndex]
    });

  } catch (error) {
    console.error('Erro ao finalizar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/atendimentos/:id
 * @desc Buscar atendimento por ID
 */
router.get('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const atendimento = atendimentos.find(a => a.id === parseInt(id));

    if (!atendimento) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    // Verificar se o usuário tem acesso ao atendimento
    if (atendimento.clinicaId !== req.user.clinica_id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      data: atendimento
    });

  } catch (error) {
    console.error('Erro ao buscar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /api/atendimentos/:id
 * @desc Atualizar atendimento
 */
router.put('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    const atendimentoIndex = atendimentos.findIndex(a => a.id === parseInt(id));

    if (atendimentoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    // Verificar se o usuário tem acesso ao atendimento
    if (atendimentos[atendimentoIndex].clinicaId !== req.user.clinica_id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Atualizar atendimento
    atendimentos[atendimentoIndex] = {
      ...atendimentos[atendimentoIndex],
      ...dadosAtualizacao,
      atualizadoEm: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Atendimento atualizado com sucesso',
      data: atendimentos[atendimentoIndex]
    });

  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/atendimentos/profissional
 * @desc Buscar atendimentos do profissional
 */
router.get('/profissional', authUtil.authenticate, async (req, res) => {
  try {
    const { profissional_id, status, data_inicio, data_fim } = req.query;

    let atendimentosFiltrados = atendimentos.filter(a =>
      a.clinicaId === req.user.clinica_id &&
      a.profissionalId === parseInt(profissional_id)
    );

    // Aplicar filtros
    if (status) {
      atendimentosFiltrados = atendimentosFiltrados.filter(a => a.status === status);
    }

    if (data_inicio) {
      atendimentosFiltrados = atendimentosFiltrados.filter(a =>
        new Date(a.dataInicio) >= new Date(data_inicio)
      );
    }

    if (data_fim) {
      atendimentosFiltrados = atendimentosFiltrados.filter(a =>
        new Date(a.dataInicio) <= new Date(data_fim)
      );
    }

    res.json({
      success: true,
      data: atendimentosFiltrados
    });

  } catch (error) {
    console.error('Erro ao buscar atendimentos do profissional:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/atendimentos/paciente
 * @desc Buscar atendimentos do paciente
 */
router.get('/paciente', authUtil.authenticate, async (req, res) => {
  try {
    const { paciente_id, status, data_inicio, data_fim } = req.query;

    let atendimentosFiltrados = atendimentos.filter(a =>
      a.clinicaId === req.user.clinica_id &&
      a.pacienteId === parseInt(paciente_id)
    );

    // Aplicar filtros
    if (status) {
      atendimentosFiltrados = atendimentosFiltrados.filter(a => a.status === status);
    }

    if (data_inicio) {
      atendimentosFiltrados = atendimentosFiltrados.filter(a =>
        new Date(a.dataInicio) >= new Date(data_inicio)
      );
    }

    if (data_fim) {
      atendimentosFiltrados = atendimentosFiltrados.filter(a =>
        new Date(a.dataInicio) <= new Date(data_fim)
      );
    }

    res.json({
      success: true,
      data: atendimentosFiltrados
    });

  } catch (error) {
    console.error('Erro ao buscar atendimentos do paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/atendimentos/:id/evolucao
 * @desc Adicionar evolução ao atendimento
 */
router.post('/:id/evolucao', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      descricao,
      tipo,
      observacoes,
      data
    } = req.body;

    const atendimentoIndex = atendimentos.findIndex(a => a.id === parseInt(id));

    if (atendimentoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    // Verificar se o usuário tem acesso ao atendimento
    if (atendimentos[atendimentoIndex].clinicaId !== req.user.clinica_id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Adicionar evolução
    const novaEvolucao = {
      id: Date.now(),
      descricao,
      tipo: tipo || 'evolucao',
      observacoes: observacoes || '',
      data: data || new Date().toISOString(),
      criadoPor: req.user.id
    };

    if (!atendimentos[atendimentoIndex].evolucao) {
      atendimentos[atendimentoIndex].evolucao = [];
    }

    atendimentos[atendimentoIndex].evolucao.push(novaEvolucao);

    res.status(201).json({
      success: true,
      message: 'Evolução adicionada com sucesso',
      data: novaEvolucao
    });

  } catch (error) {
    console.error('Erro ao adicionar evolução:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;