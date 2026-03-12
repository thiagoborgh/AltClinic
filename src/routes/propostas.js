const express = require('express');
const router = express.Router();
const PacienteModel = require('../models/Paciente');
const authUtil = require('../utils/auth');
const { sendWhatsAppMessage } = require('../utils/bot');

/**
 * @route POST /propostas
 * @desc Cria nova proposta e agenda itens automaticamente
 */
router.post('/', authUtil.authenticate, async (req, res) => {
  try {
    const {
      paciente_id,
      itens, // Array de {procedimento_id, sessoes, valor_unitario, datas_agendamento}
      contrato_texto,
      observacoes
    } = req.body;

    if (!paciente_id || !itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Paciente e itens são obrigatórios'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    // Calcular valor total
    let valorTotal = 0;
    for (const item of itens) {
      valorTotal += (item.valor_unitario || 0) * (item.sessoes || 1);
    }

    // Criar proposta
    const propostaResult = await req.db.run(
      `INSERT INTO proposta (paciente_id, contrato_texto, itens, valor_total)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        paciente_id,
        contrato_texto || 'Contrato padrão da clínica',
        JSON.stringify(itens),
        valorTotal
      ]
    );

    const propostaId = propostaResult.lastID;

    // Buscar dados do paciente para mensagem
    const paciente = PacienteModel.findById(paciente_id);

    // Gerar mensagem da proposta
    let mensagemProposta = `💰 *Nova Proposta de Tratamento*\n\n`;
    mensagemProposta += `Olá ${paciente.nome}!\n\n`;
    mensagemProposta += `Preparamos uma proposta especial para você:\n\n`;

    for (const item of itens) {
      const procedimento = await req.db.get(
        'SELECT nome FROM procedimento WHERE id = $1',
        [item.procedimento_id]
      );
      mensagemProposta += `💆‍♀️ ${procedimento.nome}\n`;
      mensagemProposta += `   • ${item.sessoes} sessão(ões)\n`;
      mensagemProposta += `   • R$ ${item.valor_unitario.toFixed(2)} por sessão\n\n`;
    }

    mensagemProposta += `💵 *Valor Total: R$ ${valorTotal.toFixed(2)}*\n\n`;
    mensagemProposta += `Responda *ACEITO* para confirmar ou *DÚVIDAS* se tiver questões! 😊`;

    // Enviar proposta via WhatsApp
    try {
      await sendWhatsAppMessage(paciente.telefone, mensagemProposta, req.user.clinica_id);

      // Registrar envio
      await req.db.run(
        `INSERT INTO mensagem_crm (paciente_id, tipo, conteudo, status)
         VALUES ($1, 'proposta', $2, 'enviada')`,
        [paciente_id, mensagemProposta]
      );

    } catch (error) {
      console.error('Erro ao enviar proposta:', error.message);
    }

    // Buscar dados completos da proposta
    const proposta = await req.db.get(
      `SELECT p.*, pac.nome as paciente_nome, pac.telefone as paciente_telefone
       FROM proposta p
       LEFT JOIN paciente pac ON p.paciente_id = pac.id
       WHERE p.id = $1`,
      [propostaId]
    );

    res.status(201).json({
      success: true,
      message: 'Proposta criada e enviada com sucesso',
      data: {
        ...proposta,
        itens: JSON.parse(proposta.itens)
      }
    });

  } catch (error) {
    console.error('Erro ao criar proposta:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /propostas/:id/aceitar
 * @desc Aceita proposta e agenda itens automaticamente
 */
router.put('/:id/aceitar', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { datas_agendamento, equipamento_id } = req.body;

    const proposta = await req.db.get(
      `SELECT p.*, pac.nome as paciente_nome, pac.telefone as paciente_telefone
       FROM proposta p
       LEFT JOIN paciente pac ON p.paciente_id = pac.id
       WHERE p.id = $1`,
      [id]
    );

    if (!proposta) {
      return res.status(404).json({
        success: false,
        message: 'Proposta não encontrada'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(proposta.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Proposta não pertence à sua clínica'
      });
    }

    if (proposta.status !== 'enviada') {
      return res.status(400).json({
        success: false,
        message: 'Proposta já foi processada'
      });
    }

    const itens = JSON.parse(proposta.itens);
    const agendamentosCriados = [];

    // Criar agendamentos automaticamente
    const AgendamentoModel = require('../models/Agendamento');

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];

      for (let sessao = 1; sessao <= item.sessoes; sessao++) {
        const dataAgendamento = datas_agendamento?.[`${item.procedimento_id}_${sessao}`];

        if (dataAgendamento) {
          try {
            // Verificar disponibilidade
            const procedimento = await req.db.get(
              'SELECT duracao_minutos FROM procedimento WHERE id = $1',
              [item.procedimento_id]
            );

            const disponibilidade = AgendamentoModel.verificarDisponibilidade(
              equipamento_id,
              dataAgendamento,
              procedimento.duracao_minutos
            );

            if (disponibilidade.disponivel) {
              const agendamento = AgendamentoModel.create({
                paciente_id: proposta.paciente_id,
                procedimento_id: item.procedimento_id,
                equipamento_id: equipamento_id,
                data_hora: dataAgendamento,
                sessao_numero: sessao,
                observacoes: `Proposta #${id} - Sessão ${sessao}/${item.sessoes}`
              });

              agendamentosCriados.push(agendamento);
            }

          } catch (error) {
            console.error(`Erro ao agendar sessão ${sessao} do procedimento ${item.procedimento_id}:`, error.message);
          }
        }
      }
    }

    // Atualizar status da proposta
    await req.db.run(
      `UPDATE proposta
       SET status = 'aceita', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // Criar conta a receber
    await req.db.run(
      `INSERT INTO conta_receber (proposta_id, valor_pago, recibo_texto)
       VALUES ($1, 0, $2)`,
      [id, `Proposta #${id} aceita - Valor: R$ ${proposta.valor_total}`]
    );

    // Enviar mensagem de confirmação
    try {
      let mensagemConfirmacao = `🎉 *Proposta Aceita!*\n\n`;
      mensagemConfirmacao += `Olá ${proposta.paciente_nome}!\n\n`;
      mensagemConfirmacao += `Sua proposta foi aceita com sucesso!\n\n`;

      if (agendamentosCriados.length > 0) {
        mensagemConfirmacao += `📅 *Agendamentos criados:*\n`;
        agendamentosCriados.forEach((ag, index) => {
          const data = new Date(ag.data_hora).toLocaleString('pt-BR');
          mensagemConfirmacao += `${index + 1}. ${data} - ${ag.procedimento_nome}\n`;
        });
      }

      mensagemConfirmacao += `\nObrigado por escolher nossa clínica! ✨`;

      await sendWhatsAppMessage(proposta.paciente_telefone, mensagemConfirmacao, req.user.clinica_id);

      // Registrar mensagem
      await req.db.run(
        `INSERT INTO mensagem_crm (paciente_id, tipo, conteudo, status)
         VALUES ($1, 'proposta_aceita', $2, 'enviada')`,
        [proposta.paciente_id, mensagemConfirmacao]
      );

    } catch (error) {
      console.error('Erro ao enviar confirmação:', error.message);
    }

    res.json({
      success: true,
      message: 'Proposta aceita e agendamentos criados',
      data: {
        proposta_id: id,
        agendamentos_criados: agendamentosCriados.length,
        agendamentos: agendamentosCriados
      }
    });

  } catch (error) {
    console.error('Erro ao aceitar proposta:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /propostas
 * @desc Lista propostas da clínica
 */
router.get('/', authUtil.authenticate, async (req, res) => {
  try {
    const { status, paciente_id, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT p.*, pac.nome as paciente_nome, pac.telefone as paciente_telefone
      FROM proposta p
      LEFT JOIN paciente pac ON p.paciente_id = pac.id
      WHERE pac.clinica_id = $1
    `;

    const params = [req.user.clinica_id];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (paciente_id) {
      query += ` AND p.paciente_id = $${paramIndex}`;
      params.push(paciente_id);
      paramIndex++;
    }

    query += ' ORDER BY p.created_at DESC';

    // Paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const propostas = await req.db.all(query, params);

    // Parse dos itens JSON
    const propostasFormatadas = propostas.map(p => ({
      ...p,
      itens: JSON.parse(p.itens)
    }));

    res.json({
      success: true,
      data: propostasFormatadas,
      pagination: {
        current_page: parseInt(page),
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar propostas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /propostas/:id
 * @desc Busca proposta por ID
 */
router.get('/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const proposta = await req.db.get(
      `SELECT p.*, pac.nome as paciente_nome, pac.telefone as paciente_telefone, pac.email as paciente_email
       FROM proposta p
       LEFT JOIN paciente pac ON p.paciente_id = pac.id
       WHERE p.id = $1`,
      [id]
    );

    if (!proposta) {
      return res.status(404).json({
        success: false,
        message: 'Proposta não encontrada'
      });
    }

    // Verificar se pertence à clínica
    if (!PacienteModel.belongsToClinica(proposta.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Proposta não pertence à sua clínica'
      });
    }

    // Buscar conta a receber relacionada
    const contaReceber = await req.db.get(
      'SELECT * FROM conta_receber WHERE proposta_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...proposta,
        itens: JSON.parse(proposta.itens),
        conta_receber: contaReceber
      }
    });

  } catch (error) {
    console.error('Erro ao buscar proposta:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /propostas/:id/rejeitar
 * @desc Rejeita proposta
 */
router.put('/:id/rejeitar', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const proposta = await req.db.get(
      `SELECT p.*, pac.nome as paciente_nome, pac.telefone as paciente_telefone
       FROM proposta p
       LEFT JOIN paciente pac ON p.paciente_id = pac.id
       WHERE p.id = $1`,
      [id]
    );

    if (!proposta) {
      return res.status(404).json({
        success: false,
        message: 'Proposta não encontrada'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(proposta.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Proposta não pertence à sua clínica'
      });
    }

    // Atualizar status
    await req.db.run(
      `UPDATE proposta
       SET status = 'rejeitada', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // Enviar mensagem
    try {
      let mensagem = `💔 Proposta não aceita\n\n`;
      mensagem += `Olá ${proposta.paciente_nome}!\n\n`;
      mensagem += `Entendemos que nossa proposta não atendeu suas expectativas no momento.\n\n`;

      if (motivo) {
        mensagem += `Motivo informado: ${motivo}\n\n`;
      }

      mensagem += `Estamos sempre dispostos a criar novas propostas que se adequem melhor às suas necessidades. `;
      mensagem += `Entre em contato conosco! 😊`;

      await sendWhatsAppMessage(proposta.paciente_telefone, mensagem, req.user.clinica_id);

    } catch (error) {
      console.error('Erro ao enviar mensagem de rejeição:', error.message);
    }

    res.json({
      success: true,
      message: 'Proposta rejeitada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao rejeitar proposta:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /propostas/:id/recibo
 * @desc Gera recibo para proposta
 */
router.post('/:id/recibo', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { valor_pago, forma_pagamento = 'Dinheiro' } = req.body;

    if (!valor_pago || valor_pago <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor pago deve ser maior que zero'
      });
    }

    const proposta = await req.db.get(
      `SELECT p.*, pac.nome as paciente_nome, pac.telefone as paciente_telefone
       FROM proposta p
       LEFT JOIN paciente pac ON p.paciente_id = pac.id
       WHERE p.id = $1`,
      [id]
    );

    if (!proposta) {
      return res.status(404).json({
        success: false,
        message: 'Proposta não encontrada'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(proposta.paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Proposta não pertence à sua clínica'
      });
    }

    // Gerar texto do recibo
    const dataAtual = new Date().toLocaleString('pt-BR');
    const reciboTexto = `
🧾 *RECIBO DE PAGAMENTO*

📅 Data: ${dataAtual}
👤 Cliente: ${proposta.paciente_nome}
💰 Valor: R$ ${valor_pago.toFixed(2)}
💳 Forma: ${forma_pagamento}
📋 Referente: Proposta #${id}

Contrato: ${proposta.contrato_texto}

Obrigado pela preferência! ✨
    `.trim();

    // Atualizar conta a receber
    const contaExistente = await req.db.get(
      'SELECT id FROM conta_receber WHERE proposta_id = $1',
      [id]
    );

    if (contaExistente) {
      await req.db.run(
        `UPDATE conta_receber
         SET valor_pago = valor_pago + $1, data_pagamento = NOW(), recibo_texto = $2, updated_at = NOW()
         WHERE proposta_id = $3`,
        [valor_pago, reciboTexto, id]
      );
    } else {
      await req.db.run(
        `INSERT INTO conta_receber (proposta_id, valor_pago, data_pagamento, recibo_texto)
         VALUES ($1, $2, NOW(), $3)`,
        [id, valor_pago, reciboTexto]
      );
    }

    // Enviar recibo via WhatsApp
    try {
      await sendWhatsAppMessage(proposta.paciente_telefone, reciboTexto, req.user.clinica_id);
    } catch (error) {
      console.error('Erro ao enviar recibo:', error.message);
    }

    res.json({
      success: true,
      message: 'Recibo gerado e enviado com sucesso',
      data: {
        recibo_texto: reciboTexto,
        valor_pago,
        data_pagamento: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao gerar recibo:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
