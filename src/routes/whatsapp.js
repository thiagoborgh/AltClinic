const express = require('express');
const router = express.Router();
const firestoreWhatsappService = require('../services/firestoreWhatsappService');
const whatsappWebService = require('../services/whatsappWebService');
const twilioService = require('../utils/twilio');
const automationGuard = require('../services/automationGuard');

/**
 * Rotas para gerenciamento de WhatsApp com whatsapp-web.js (100% GRATUITO)
 */

// ===================== SESSÃO =====================

/**
 * GET /api/whatsapp/session/status
 * Verifica status da sessão WhatsApp do tenant
 */
router.get('/session/status', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const session = await firestoreWhatsappService.getActiveSession(tenantId);
    const isConnected = whatsappWebService.isConnected(tenantId);
    const qrCode = whatsappWebService.getQRCode(tenantId);
    const clientInfo = await whatsappWebService.getClientInfo(tenantId);

    // Twilio status (if configured)
    const twilioStatus = twilioService ? twilioService.getStatus() : { configured: false };

    res.json({
      success: true,
      connected: isConnected,
      session: session || null,
      clientInfo: clientInfo || null,
      qrCode: qrCode ? {
        qrDataUrl: qrCode.qrDataUrl,
        timestamp: qrCode.timestamp
      } : null,
      provider: 'whatsapp-web.js (opensource)',
      available: whatsappWebService.isAvailable(),
      twilio: twilioStatus,
      twilioConfigured: !!(twilioService && twilioService.isConfigured)
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status da sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status da sessão',
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/automation/status
 * Verifica status das automações WhatsApp do tenant
 */
router.get('/automation/status', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const automationStatus = await automationGuard.getAutomationStatus(tenantId);

    res.json({
      success: true,
      ...automationStatus
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status das automações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status das automações',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/session/connect
 * Inicia conexão com WhatsApp (gera QR Code)
 */
router.post('/session/connect', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Verificar se já está conectado
    if (whatsappWebService.isConnected(tenantId)) {
      return res.json({
        success: true,
        message: 'Já conectado',
        connected: true
      });
    }

    // Iniciar cliente (vai gerar QR Code)
    await whatsappWebService.startClient(tenantId);

    res.json({
      success: true,
      message: 'Cliente iniciado. Aguarde o QR Code...',
      instructions: 'Use GET /session/status para obter o QR Code'
    });

  } catch (error) {
    console.error('❌ Erro ao conectar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao conectar sessão',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/session/disconnect
 * Desconecta sessão WhatsApp
 */
router.post('/session/disconnect', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    await whatsappWebService.stopClient(tenantId);

    await firestoreWhatsappService.updateSessionStatus(tenantId, 'main', 'disconnected');

    res.json({
      success: true,
      message: 'Sessão desconectada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao desconectar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desconectar sessão',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/session/clear
 * Limpa sessão (para reconectar)
 */
router.post('/session/clear', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    await whatsappWebService.clearSession(tenantId);

    res.json({
      success: true,
      message: 'Sessão limpa. Você pode reconectar agora.'
    });

  } catch (error) {
    console.error('❌ Erro ao limpar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar sessão',
      error: error.message
    });
  }
});

// ===================== ENVIO DE MENSAGENS =====================

/**
 * POST /api/whatsapp/send
 * Envia mensagem via WhatsApp
 */
router.post('/send', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { phone, message, contactName } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Telefone e mensagem são obrigatórios'
      });
    }

    // Verificar se está conectado
    if (!whatsappWebService.isConnected(tenantId)) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não conectado. Conecte primeiro.'
      });
    }

    // Enviar via whatsapp-web.js
    const result = await whatsappWebService.sendMessage(tenantId, phone, message);

    // Salvar mensagem no Firestore
    const savedMessage = await firestoreWhatsappService.saveMessage(tenantId, {
      contactPhone: phone.replace(/\D/g, ''),
      contactName: contactName || phone,
      message,
      direction: 'outbound',
      status: 'sent',
      provider: 'whatsapp-web',
      messageId: result.messageId,
      sentAt: new Date().toISOString()
    });

    // Registrar log de envio
    await firestoreWhatsappService.saveMessageLog(tenantId, {
      pacienteId: req.body.pacienteId || null,
      pacienteNome: contactName || phone,
      profissionalId: req.body.profissionalId || null,
      profissionalNome: req.body.profissionalNome || null,
      telefone: phone.replace(/\D/g, ''),
      mensagem: message,
      tipo: req.body.tipo || 'manual',
      status: 'enviado',
      dataEnvio: new Date().toISOString(),
      dataAgendamento: req.body.dataAgendamento || null,
      erro: null,
      tentativas: 1
    });

    // Atualizar/criar contato
    await firestoreWhatsappService.saveContact(tenantId, {
      phone: phone.replace(/\D/g, ''),
      name: contactName || phone,
      lastMessage: message,
      lastMessageAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: savedMessage
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/send-media
 * Envia mídia via WhatsApp
 */
router.post('/send-media', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { phone, mediaUrl, caption, contactName } = req.body;

    if (!phone || !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Telefone e URL da mídia são obrigatórios'
      });
    }

    if (!whatsappWebService.isConnected(tenantId)) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não conectado'
      });
    }

    // Download da mídia
    const axios = require('axios');
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const mediaBuffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'];

    // Enviar mídia
    const result = await whatsappWebService.sendMedia(tenantId, phone, mediaBuffer, {
      mimetype: contentType,
      caption: caption || '',
      filename: mediaUrl.split('/').pop()
    });

    // Salvar no Firestore
    await firestoreWhatsappService.saveMessage(tenantId, {
      contactPhone: phone.replace(/\D/g, ''),
      contactName: contactName || phone,
      message: caption || '(mídia)',
      direction: 'outbound',
      status: 'sent',
      provider: 'whatsapp-web',
      hasMedia: true,
      mediaUrl,
      messageId: result.messageId,
      sentAt: new Date().toISOString()
    });

    // Registrar log de envio
    await firestoreWhatsappService.saveMessageLog(tenantId, {
      pacienteId: req.body.pacienteId || null,
      pacienteNome: contactName || phone,
      profissionalId: req.body.profissionalId || null,
      profissionalNome: req.body.profissionalNome || null,
      telefone: phone.replace(/\D/g, ''),
      mensagem: caption || '(mídia enviada)',
      tipo: req.body.tipo || 'manual',
      status: 'enviado',
      dataEnvio: new Date().toISOString(),
      dataAgendamento: req.body.dataAgendamento || null,
      erro: null,
      tentativas: 1
    });

    res.json({
      success: true,
      message: 'Mídia enviada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mídia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mídia',
      error: error.message
    });
  }
});

// ===================== MENSAGENS =====================

/**
 * GET /api/whatsapp/messages
 * Lista mensagens recentes
 */
router.get('/messages', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { contactPhone, limit = 50 } = req.query;

    let messages;
    
    if (contactPhone) {
      messages = await firestoreWhatsappService.getMessagesByContact(
        tenantId, 
        contactPhone, 
        parseInt(limit)
      );
    } else {
      messages = await firestoreWhatsappService.getRecentMessages(
        tenantId, 
        parseInt(limit)
      );
    }

    res.json({
      success: true,
      count: messages.length,
      messages
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens',
      error: error.message
    });
  }
});

/**
 * PATCH /api/whatsapp/messages/:id/read
 * Marca mensagem como lida
 */
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    await firestoreWhatsappService.markAsRead(tenantId, id);

    res.json({
      success: true,
      message: 'Mensagem marcada como lida'
    });

  } catch (error) {
    console.error('❌ Erro ao marcar mensagem como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar mensagem como lida',
      error: error.message
    });
  }
});

// ===================== CONTATOS =====================

/**
 * GET /api/whatsapp/contacts
 * Lista contatos do WhatsApp
 */
router.get('/contacts', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const contacts = await firestoreWhatsappService.listContacts(tenantId);

    res.json({
      success: true,
      count: contacts.length,
      contacts
    });

  } catch (error) {
    console.error('❌ Erro ao listar contatos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar contatos',
      error: error.message
    });
  }
});

// ===================== LOG DE MENSAGENS =====================

/**
 * GET /api/whatsapp/logs
 * Lista logs de mensagens enviadas
 */
router.get('/logs', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { status, tipo, pacienteId, profissionalId, limit = 50 } = req.query;

    const filters = {
      status,
      tipo,
      pacienteId,
      profissionalId,
      limit: parseInt(limit)
    };

    const logs = await firestoreWhatsappService.getMessageLogs(tenantId, filters);

    res.json({
      success: true,
      count: logs.length,
      logs
    });

  } catch (error) {
    console.error('❌ Erro ao buscar logs de mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar logs de mensagens',
      error: error.message
    });
  }
});

// ===================== CONFIGURAÇÃO =====================

/**
 * GET /api/whatsapp/config
 * Busca configuração do WhatsApp
 */
router.get('/config', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const config = await firestoreWhatsappService.getConfig(tenantId);

    res.json({
      success: true,
      config: config || {}
    });

  } catch (error) {
    console.error('❌ Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configuração',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/config
 * Atualiza configuração do WhatsApp
 */
router.post('/config', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const config = req.body;

    const savedConfig = await firestoreWhatsappService.saveConfig(tenantId, config);

    res.json({
      success: true,
      message: 'Configuração salva com sucesso',
      config: savedConfig
    });

  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configuração',
      error: error.message
    });
  }
});

// ===================== ESTATÍSTICAS =====================

/**
 * GET /api/whatsapp/stats
 * Busca estatísticas do WhatsApp
 */
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const stats = await firestoreWhatsappService.getStats(tenantId);
    const activeClients = whatsappWebService.getActiveClients();

    res.json({
      success: true,
      stats: {
        ...stats,
        activeConnections: activeClients.length,
        isConnected: activeClients.includes(tenantId)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

module.exports = router;

/**
 * Rotas para gerenciamento de WhatsApp integrado ao Firestore
 */

// ===================== SESSÃO =====================

/**
 * GET /api/whatsapp/session/status
 * Verifica status da sessão WhatsApp do tenant
 */
router.get('/session/status', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const session = await firestoreWhatsappService.getActiveSession(tenantId);
    const config = await firestoreWhatsappService.getConfig(tenantId);

    res.json({
      success: true,
      session: session ? {
        id: session.id,
        status: session.status,
        phone: session.phone,
        connectedAt: session.connectedAt
      } : null,
      config: config || {},
      twilioConfigured: twilioService.isConfigured
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status da sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status da sessão',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/session/connect
 * Inicia conexão com WhatsApp
 */
router.post('/session/connect', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { provider } = req.body; // 'twilio', 'evolution', 'baileys'

    // Por enquanto, suportamos apenas Twilio
    if (provider !== 'twilio') {
      return res.status(400).json({
        success: false,
        message: 'Provider não suportado ainda. Use "twilio".'
      });
    }

    if (!twilioService.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Twilio não configurado. Verifique as variáveis de ambiente.'
      });
    }

    // Criar sessão no Firestore
    const session = await firestoreWhatsappService.saveSession(tenantId, {
      id: 'main',
      provider: 'twilio',
      status: 'connected',
      phone: twilioService.whatsappNumber,
      connectedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Sessão conectada com sucesso',
      session
    });

  } catch (error) {
    console.error('❌ Erro ao conectar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao conectar sessão',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/session/disconnect
 * Desconecta sessão WhatsApp
 */
router.post('/session/disconnect', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const session = await firestoreWhatsappService.getActiveSession(tenantId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma sessão ativa encontrada'
      });
    }

    await firestoreWhatsappService.updateSessionStatus(tenantId, session.id, 'disconnected');

    res.json({
      success: true,
      message: 'Sessão desconectada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao desconectar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desconectar sessão',
      error: error.message
    });
  }
});

// ===================== ENVIO DE MENSAGENS =====================

/**
 * POST /api/whatsapp/send
 * Envia mensagem via WhatsApp
 */
router.post('/send', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { phone, message, contactName } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Telefone e mensagem são obrigatórios'
      });
    }

    // Verificar sessão ativa
    const session = await firestoreWhatsappService.getActiveSession(tenantId);
    
    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma sessão WhatsApp ativa. Conecte primeiro.'
      });
    }

    // Enviar via Twilio
    const sent = await twilioService.sendWhatsAppMessage(phone, message);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar mensagem via Twilio'
      });
    }

    // Salvar mensagem no Firestore
    const savedMessage = await firestoreWhatsappService.saveMessage(tenantId, {
      contactPhone: phone.replace(/\D/g, ''),
      contactName: contactName || phone,
      message,
      direction: 'outbound',
      status: 'sent',
      provider: 'twilio',
      sentAt: new Date().toISOString()
    });

    // Atualizar/criar contato
    await firestoreWhatsappService.saveContact(tenantId, {
      phone: phone.replace(/\D/g, ''),
      name: contactName || phone,
      lastMessage: message,
      lastMessageAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: savedMessage
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message
    });
  }
});

// ===================== MENSAGENS =====================

/**
 * GET /api/whatsapp/messages
 * Lista mensagens recentes
 */
router.get('/messages', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { contactPhone, limit = 50 } = req.query;

    let messages;
    
    if (contactPhone) {
      messages = await firestoreWhatsappService.getMessagesByContact(
        tenantId, 
        contactPhone, 
        parseInt(limit)
      );
    } else {
      messages = await firestoreWhatsappService.getRecentMessages(
        tenantId, 
        parseInt(limit)
      );
    }

    res.json({
      success: true,
      count: messages.length,
      messages
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens',
      error: error.message
    });
  }
});

/**
 * PATCH /api/whatsapp/messages/:id/read
 * Marca mensagem como lida
 */
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    await firestoreWhatsappService.markAsRead(tenantId, id);

    res.json({
      success: true,
      message: 'Mensagem marcada como lida'
    });

  } catch (error) {
    console.error('❌ Erro ao marcar mensagem como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar mensagem como lida',
      error: error.message
    });
  }
});

// ===================== CONTATOS =====================

/**
 * GET /api/whatsapp/contacts
 * Lista contatos do WhatsApp
 */
router.get('/contacts', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const contacts = await firestoreWhatsappService.listContacts(tenantId);

    res.json({
      success: true,
      count: contacts.length,
      contacts
    });

  } catch (error) {
    console.error('❌ Erro ao listar contatos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar contatos',
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/contacts/:phone
 * Busca contato específico
 */
router.get('/contacts/:phone', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { phone } = req.params;

    const contact = await firestoreWhatsappService.getContact(tenantId, phone);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contato não encontrado'
      });
    }

    res.json({
      success: true,
      contact
    });

  } catch (error) {
    console.error('❌ Erro ao buscar contato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contato',
      error: error.message
    });
  }
});

// ===================== CONFIGURAÇÃO =====================

/**
 * GET /api/whatsapp/config
 * Busca configuração do WhatsApp
 */
router.get('/config', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const config = await firestoreWhatsappService.getConfig(tenantId);

    res.json({
      success: true,
      config: config || {}
    });

  } catch (error) {
    console.error('❌ Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configuração',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/config
 * Atualiza configuração do WhatsApp
 */
router.post('/config', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const config = req.body;

    const savedConfig = await firestoreWhatsappService.saveConfig(tenantId, config);

    res.json({
      success: true,
      message: 'Configuração salva com sucesso',
      config: savedConfig
    });

  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configuração',
      error: error.message
    });
  }
});

// ===================== ESTATÍSTICAS =====================

/**
 * GET /api/whatsapp/stats
 * Busca estatísticas do WhatsApp
 */
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const stats = await firestoreWhatsappService.getStats(tenantId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

// ===================== WEBHOOK =====================

/**
 * POST /api/whatsapp/webhook/twilio
 * Recebe webhooks do Twilio
 */
router.post('/webhook/twilio', async (req, res) => {
  try {
    // Processar dados do webhook
    const webhookData = twilioService.processWebhook(req);

    console.log('📥 Webhook recebido:', webhookData);

    // Identificar tenant pelo número de telefone
    // TODO: Implementar lógica para identificar tenant
    const tenantId = req.query.tenantId || 'default';

    // Salvar log do webhook
    await firestoreWhatsappService.logWebhook(tenantId, webhookData);

    // Se for mensagem de WhatsApp, salvar no Firestore
    if (webhookData.isWhatsApp && webhookData.body) {
      await firestoreWhatsappService.saveMessage(tenantId, {
        contactPhone: webhookData.phone,
        contactName: webhookData.profileName || webhookData.phone,
        message: webhookData.body,
        direction: 'inbound',
        status: 'received',
        provider: 'twilio',
        messageSid: webhookData.messageSid,
        hasMedia: webhookData.hasMedia,
        mediaUrl: webhookData.mediaUrl,
        receivedAt: new Date().toISOString()
      });

      // Atualizar contato
      await firestoreWhatsappService.saveContact(tenantId, {
        phone: webhookData.phone,
        name: webhookData.profileName || webhookData.phone,
        lastMessage: webhookData.body,
        lastMessageAt: new Date().toISOString()
      });
    }

    // Responder ao Twilio
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Mensagem recebida com sucesso!</Message>
</Response>`);

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).send('Erro ao processar webhook');
  }
});

module.exports = router;
