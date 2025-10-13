const express = require('express');
const router = express.Router();
const ManyChatController = require('../controllers/ManyChatController');
const ManyChatService = require('../services/ManyChatService');

const manyChatController = new ManyChatController();
const manyChatService = new ManyChatService();

/**
 * @route POST /manychat/webhook
 * @desc Receber webhooks do ManyChat
 */
router.post('/webhook', async (req, res) => {
  await manyChatController.handleWebhook(req, res);
});

/**
 * @route POST /manychat/send-confirmation
 * @desc Enviar confirmação de agendamento
 */
router.post('/send-confirmation', async (req, res) => {
  try {
    const { subscriber_id, appointment_data } = req.body;
    
    if (!subscriber_id || !appointment_data) {
      return res.status(400).json({
        success: false,
        message: 'subscriber_id e appointment_data são obrigatórios'
      });
    }

    const result = await manyChatService.sendAppointmentConfirmation(subscriber_id, appointment_data);
    
    res.json({
      success: true,
      message: 'Confirmação enviada com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao enviar confirmação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /manychat/send-reminder
 * @desc Enviar lembrete de consulta
 */
router.post('/send-reminder', async (req, res) => {
  try {
    const { subscriber_id, appointment_data } = req.body;
    
    if (!subscriber_id || !appointment_data) {
      return res.status(400).json({
        success: false,
        message: 'subscriber_id e appointment_data são obrigatórios'
      });
    }

    const result = await manyChatService.sendAppointmentReminder(subscriber_id, appointment_data);
    
    res.json({
      success: true,
      message: 'Lembrete enviado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao enviar lembrete:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /manychat/send-payment
 * @desc Enviar cobrança de pagamento
 */
router.post('/send-payment', async (req, res) => {
  try {
    const { subscriber_id, payment_data } = req.body;
    
    if (!subscriber_id || !payment_data) {
      return res.status(400).json({
        success: false,
        message: 'subscriber_id e payment_data são obrigatórios'
      });
    }

    const result = await manyChatService.sendPaymentRequest(subscriber_id, payment_data);
    
    res.json({
      success: true,
      message: 'Cobrança enviada com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao enviar cobrança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /manychat/send-survey
 * @desc Enviar pesquisa de satisfação
 */
router.post('/send-survey', async (req, res) => {
  try {
    const { subscriber_id, appointment_data } = req.body;
    
    if (!subscriber_id || !appointment_data) {
      return res.status(400).json({
        success: false,
        message: 'subscriber_id e appointment_data são obrigatórios'
      });
    }

    const result = await manyChatService.sendSatisfactionSurvey(subscriber_id, appointment_data);
    
    res.json({
      success: true,
      message: 'Pesquisa enviada com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao enviar pesquisa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /manychat/send-text
 * @desc Enviar mensagem de texto simples
 */
router.post('/send-text', async (req, res) => {
  try {
    const { subscriber_id, message } = req.body;
    
    if (!subscriber_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'subscriber_id e message são obrigatórios'
      });
    }

    const result = await manyChatService.sendTextMessage(subscriber_id, message);
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /manychat/subscriber/:id
 * @desc Obter informações do subscriber
 */
router.get('/subscriber/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await manyChatService.getSubscriberInfo(id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao obter subscriber:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /manychat/add-tag
 * @desc Adicionar tag ao subscriber
 */
router.post('/add-tag', async (req, res) => {
  try {
    const { subscriber_id, tag_name } = req.body;
    
    if (!subscriber_id || !tag_name) {
      return res.status(400).json({
        success: false,
        message: 'subscriber_id e tag_name são obrigatórios'
      });
    }

    const result = await manyChatService.addTag(subscriber_id, tag_name);
    
    res.json({
      success: true,
      message: 'Tag adicionada com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar tag:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /manychat/set-field
 * @desc Definir campo personalizado
 */
router.post('/set-field', async (req, res) => {
  try {
    const { subscriber_id, field_name, field_value } = req.body;
    
    if (!subscriber_id || !field_name || field_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'subscriber_id, field_name e field_value são obrigatórios'
      });
    }

    const result = await manyChatService.setCustomField(subscriber_id, field_name, field_value);
    
    res.json({
      success: true,
      message: 'Campo personalizado definido com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro ao definir campo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /manychat/test
 * @desc Testar conexão com ManyChat
 */
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'ManyChat API configurada e funcionando',
      config: {
        pageId: manyChatService.pageId,
        baseUrl: manyChatService.baseUrl,
        hasToken: !!manyChatService.apiToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro na configuração do ManyChat',
      error: error.message
    });
  }
});

module.exports = router;