const express = require('express');
const router = express.Router();
const AgendamentoModel = require('../models/Agendamento');
const PacienteModel = require('../models/Paciente');
const authUtil = require('../utils/auth');
const { sendWhatsAppMessage } = require('../utils/bot');
const aiService = require('../utils/ai');

/**
 * @route POST /agendamentos
 * @desc Cria novo agendamento
 */
router.post('/', authUtil.authenticate, async (req, res) => {
  try {
    const {
      paciente_id,
      procedimento_id,
      equipamento_id,
      data_hora,
      sessao_numero = 1,
      observacoes
    } = req.body;

    // Validações básicas
    if (!paciente_id || !procedimento_id || !equipamento_id || !data_hora) {
      return res.status(400).json({
        success: false,
        message: 'Paciente, procedimento, equipamento e data/hora são obrigatórios'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    // Buscar duração do procedimento para verificar disponibilidade
    const dbManager = require('../models/database');
    const db = dbManager.getDb();
    
    const procedimento = db.prepare('SELECT duracao_minutos FROM procedimento WHERE id = ?').get(procedimento_id);
    
    if (!procedimento) {
      return res.status(404).json({
        success: false,
        message: 'Procedimento não encontrado'
      });
    }

    // Verificar disponibilidade do equipamento
    const disponibilidade = AgendamentoModel.verificarDisponibilidade(
      equipamento_id,
      data_hora,
      procedimento.duracao_minutos
    );

    if (!disponibilidade.disponivel) {
      return res.status(409).json({
        success: false,
        message: disponibilidade.motivo
      });
    }

    // Criar agendamento
    const agendamento = AgendamentoModel.create({
      paciente_id,
      procedimento_id,
      equipamento_id,
      data_hora,
      sessao_numero,
      observacoes
    });

    // Atualizar último atendimento do paciente se for no futuro
    const dataAgendamento = new Date(data_hora);
    const agora = new Date();
    
    if (dataAgendamento >= agora) {
      PacienteModel.updateUltimoAtendimento(paciente_id, data_hora);
    }

    // Enviar mensagem de confirmação
    try {
      const paciente = PacienteModel.findById(paciente_id);
      const dataFormatada = dataAgendamento.toLocaleString('pt-BR');
      
      const mensagem = `🎉 *Agendamento Confirmado!*\n\n` +
                      `Olá ${paciente.nome}!\n\n` +
                      `Seu agendamento foi realizado com sucesso:\n` +
                      `📅 Data: ${dataFormatada}\n` +
                      `💆‍♀️ Procedimento: ${agendamento.procedimento_nome}\n` +
                      `📍 Local: ${agendamento.equipamento_nome}\n\n` +
                      `Nos vemos em breve! 😊`;

      await sendWhatsAppMessage(paciente.telefone, mensagem);
      
      // Registrar mensagem no CRM
      db.prepare(`
        INSERT INTO mensagem_crm (paciente_id, tipo, conteudo, status)
        VALUES (?, 'marcada', ?, 'enviada')
      `).run(paciente_id, mensagem);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem de confirmação:', error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Agendamento criado com sucesso',
      data: agendamento
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /agendamentos
 * @desc Lista agendamentos
 */
router.get('/', authUtil.authenticate, async (req, res) => {
  try {
    const {
      data_inicio,
      data_fim,
      status,
      equipamento_id,
      procedimento_id,
      page = 1,
      limit = 50
    } = req.query;

    let agendamentos;

    if (data_inicio && data_fim) {
      // Buscar por período
      agendamentos = AgendamentoModel.findByPeriodo(
        req.user.clinica_id,
        data_inicio,
        data_fim,
        { status, equipamento_id, procedimento_id }
      );
    } else if (data_inicio) {
      // Buscar por data específica
      agendamentos = AgendamentoModel.findByData(req.user.clinica_id, data_inicio);
    } else {
      // Buscar agendamentos do dia atual por padrão
      const hoje = new Date().toISOString().split('T')[0];
      agendamentos = AgendamentoModel.findByData(req.user.clinica_id, hoje);
    }

    // Paginação simples
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const agendamentosPaginados = agendamentos.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: agendamentosPaginados,
      pagination: {
        current_page: parseInt(page),
        total_items: agendamentos.length,
        items_per_page: parseInt(limit),
        total_pages: Math.ceil(agendamentos.length / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar agendamentos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /agendamentos/:id
 * @desc Busca agendamento por ID
 */
router.get('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const agendamento = AgendamentoModel.findById(id);

    if (!agendamento) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }

    // Verificar se pertence à clínica do usuário
    if (!PacienteModel.belongsToClinica(agendamento.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Agendamento não pertence à sua clínica'
      });
    }

    res.json({
      success: true,
      data: agendamento
    });

  } catch (error) {
    console.error('Erro ao buscar agendamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /agendamentos/:id
 * @desc Atualiza agendamento
 */
router.put('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { data_hora, procedimento_id, equipamento_id, observacoes } = req.body;

    const agendamento = AgendamentoModel.findById(id);

    if (!agendamento) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }

    // Verificar se pertence à clínica
    if (!PacienteModel.belongsToClinica(agendamento.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Agendamento não pertence à sua clínica'
      });
    }

    // Se mudando data/hora ou equipamento, verificar disponibilidade
    if ((data_hora && data_hora !== agendamento.data_hora) || 
        (equipamento_id && equipamento_id !== agendamento.equipamento_id)) {
      
      const dbManager = require('../models/database');
      const db = dbManager.getDb();
      
      const proc_id = procedimento_id || agendamento.procedimento_id;
      const procedimento = db.prepare('SELECT duracao_minutos FROM procedimento WHERE id = ?').get(proc_id);
      
      const disponibilidade = AgendamentoModel.verificarDisponibilidade(
        equipamento_id || agendamento.equipamento_id,
        data_hora || agendamento.data_hora,
        procedimento.duracao_minutos,
        parseInt(id) // Excluir o próprio agendamento da verificação
      );

      if (!disponibilidade.disponivel) {
        return res.status(409).json({
          success: false,
          message: disponibilidade.motivo
        });
      }
    }

    const agendamentoAtualizado = AgendamentoModel.update(id, {
      data_hora,
      procedimento_id,
      equipamento_id,
      observacoes
    });

    // Enviar mensagem de remarcação se data mudou
    if (data_hora && data_hora !== agendamento.data_hora) {
      try {
        const paciente = PacienteModel.findById(agendamento.paciente_id);
        const novaDataFormatada = new Date(data_hora).toLocaleString('pt-BR');
        
        const mensagem = `📅 *Agendamento Remarcado*\n\n` +
                        `Olá ${paciente.nome}!\n\n` +
                        `Seu agendamento foi remarcado:\n` +
                        `📅 Nova data: ${novaDataFormatada}\n` +
                        `💆‍♀️ Procedimento: ${agendamentoAtualizado.procedimento_nome}\n\n` +
                        `Nos vemos na nova data! 😊`;

        await sendWhatsAppMessage(paciente.telefone, mensagem);
        
        // Registrar mensagem no CRM
        const dbManager = require('../models/database');
        const db = dbManager.getDb();
        
        db.prepare(`
          INSERT INTO mensagem_crm (paciente_id, tipo, conteudo, status)
          VALUES (?, 'remarcada', ?, 'enviada')
        `).run(agendamento.paciente_id, mensagem);
        
      } catch (error) {
        console.error('Erro ao enviar mensagem de remarcação:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Agendamento atualizado com sucesso',
      data: agendamentoAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /agendamentos/:id/status
 * @desc Atualiza status do agendamento
 */
router.put('/:id/status', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;

    if (!status || !['agendado', 'confirmado', 'cancelado', 'realizado'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    const agendamento = AgendamentoModel.findById(id);

    if (!agendamento) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }

    // Verificar se pertence à clínica
    if (!PacienteModel.belongsToClinica(agendamento.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Agendamento não pertence à sua clínica'
      });
    }

    const agendamentoAtualizado = AgendamentoModel.updateStatus(id, status, observacoes);

    // Enviar mensagem baseada no status
    try {
      const paciente = PacienteModel.findById(agendamento.paciente_id);
      let mensagem = '';

      switch (status) {
        case 'confirmado':
          mensagem = `✅ *Agendamento Confirmado*\n\nOlá ${paciente.nome}!\n\nSeu agendamento foi confirmado. Nos vemos em breve! 😊`;
          break;
        case 'cancelado':
          mensagem = `❌ *Agendamento Cancelado*\n\nOlá ${paciente.nome}!\n\nSeu agendamento foi cancelado. Se precisar reagendar, estamos à disposição! 📅`;
          break;
        case 'realizado':
          mensagem = `🎉 *Atendimento Realizado*\n\nOlá ${paciente.nome}!\n\nObrigado por escolher nossa clínica! Esperamos vê-lo novamente em breve. ✨`;
          // Atualizar data do último atendimento
          PacienteModel.updateUltimoAtendimento(agendamento.paciente_id);
          break;
      }

      if (mensagem) {
        await sendWhatsAppMessage(paciente.telefone, mensagem);
        
        // Registrar mensagem no CRM
        const dbManager = require('../models/database');
        const db = dbManager.getDb();
        
        db.prepare(`
          INSERT INTO mensagem_crm (paciente_id, tipo, conteudo, status)
          VALUES (?, ?, ?, 'enviada')
        `).run(agendamento.paciente_id, status, mensagem);
      }
      
    } catch (error) {
      console.error('Erro ao enviar mensagem de status:', error.message);
    }

    res.json({
      success: true,
      message: 'Status do agendamento atualizado com sucesso',
      data: agendamentoAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route DELETE /agendamentos/:id
 * @desc Remove agendamento
 */
router.delete('/:id', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const agendamento = AgendamentoModel.findById(id);

    if (!agendamento) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }

    // Verificar se pertence à clínica
    if (!PacienteModel.belongsToClinica(agendamento.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Agendamento não pertence à sua clínica'
      });
    }

    const sucesso = AgendamentoModel.delete(id);

    if (!sucesso) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Agendamento removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover agendamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /agendamentos/estatisticas
 * @desc Obtém estatísticas dos agendamentos
 */
router.get('/estatisticas', authUtil.authenticate, async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    const estatisticas = AgendamentoModel.getEstatisticas(req.user.clinica_id, periodo);

    res.json({
      success: true,
      data: estatisticas
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /agendamentos/disponibilidade
 * @desc Verifica disponibilidade de horário
 */
router.get('/disponibilidade', authUtil.authenticate, async (req, res) => {
  try {
    const { equipamento_id, data_hora, procedimento_id } = req.query;

    if (!equipamento_id || !data_hora || !procedimento_id) {
      return res.status(400).json({
        success: false,
        message: 'Equipamento, data/hora e procedimento são obrigatórios'
      });
    }

    // Buscar duração do procedimento
    const dbManager = require('../models/database');
    const db = dbManager.getDb();
    
    const procedimento = db.prepare('SELECT duracao_minutos FROM procedimento WHERE id = ?').get(procedimento_id);
    
    if (!procedimento) {
      return res.status(404).json({
        success: false,
        message: 'Procedimento não encontrado'
      });
    }

    const disponibilidade = AgendamentoModel.verificarDisponibilidade(
      equipamento_id,
      data_hora,
      procedimento.duracao_minutos
    );

    res.json({
      success: true,
      data: disponibilidade
    });

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
