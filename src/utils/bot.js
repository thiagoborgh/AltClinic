// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const { Telegraf } = require('telegraf');
// const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const aiService = require('./ai'); // Nova integração com Gemini/HuggingFace
// const twilioService = require('./twilio');

class BotManager {
  constructor() {
    this.whatsappClient = null;
    this.telegramBot = null;
    this.isWhatsAppReady = false;
    this.isTelegramReady = false;
    this.useTwilio = process.env.TWILIO_ACCOUNT_SID ? true : false;
    
    this.sessionPath = process.env.WHATSAPP_SESSION_PATH || './whatsapp-session';
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    
    console.log(`🤖 Bot Manager iniciado - Twilio: ${this.useTwilio ? 'Sim' : 'Não'}`);
    
    if (!this.useTwilio) {
      this.setupWhatsApp();
    }
    this.setupTelegram();
  }

  /**
   * Configura cliente WhatsApp
   */
  setupWhatsApp() {
    try {
      this.whatsappClient = new Client({
        authStrategy: new LocalAuth({
          clientId: 'saee-bot',
          dataPath: this.sessionPath
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      this.whatsappClient.on('qr', (qr) => {
        console.log('📱 QR Code do WhatsApp:');
        qrcode.generate(qr, { small: true });
        console.log('Escaneie o QR Code com seu WhatsApp para conectar o bot');
      });

      this.whatsappClient.on('ready', () => {
        console.log('✅ WhatsApp Bot conectado e pronto!');
        this.isWhatsAppReady = true;
      });

      this.whatsappClient.on('authenticated', () => {
        console.log('🔐 WhatsApp Bot autenticado');
      });

      this.whatsappClient.on('auth_failure', (msg) => {
        console.error('❌ Falha na autenticação do WhatsApp:', msg);
        this.isWhatsAppReady = false;
      });

      this.whatsappClient.on('disconnected', (reason) => {
        console.log('🔌 WhatsApp Bot desconectado:', reason);
        this.isWhatsAppReady = false;
      });

      // Listener para mensagens recebidas
      this.whatsappClient.on('message', async (message) => {
        await this.handleWhatsAppMessage(message);
      });

      // Inicializar cliente apenas se habilitado
      if (process.env.WHATSAPP_AUTO_INIT !== 'false') {
        console.log('🔄 Inicializando WhatsApp Client...');
        this.whatsappClient.initialize();
      } else {
        console.log('⚠️  Inicialização automática do WhatsApp desabilitada');
      }
      
    } catch (error) {
      console.error('❌ Erro ao configurar WhatsApp:', error.message);
    }
  }

  /**
   * Configura bot do Telegram
   */
  setupTelegram() {
    if (!this.telegramToken) {
      console.warn('⚠️  Token do Telegram não configurado');
      return;
    }

    try {
      this.telegramBot = new Telegraf(this.telegramToken);

      this.telegramBot.start((ctx) => {
        ctx.reply('🤖 Olá! Sou o assistente da clínica. Como posso ajudar?');
      });

      this.telegramBot.help((ctx) => {
        ctx.reply(`
🆘 *Comandos disponíveis:*

/start - Iniciar conversa
/agendar - Fazer agendamento
/cancelar - Cancelar agendamento
/procedimentos - Ver procedimentos
/contato - Informações de contato
/help - Ver esta ajuda

Digite sua mensagem e eu te ajudo! 😊
        `);
      });

      // Listener para mensagens
      this.telegramBot.on('text', async (ctx) => {
        await this.handleTelegramMessage(ctx);
      });

      this.telegramBot.launch();
      console.log('✅ Telegram Bot configurado e rodando');
      this.isTelegramReady = true;

    } catch (error) {
      console.error('❌ Erro ao configurar Telegram:', error.message);
    }
  }

  /**
   * Processa mensagens do WhatsApp
   * @param {Object} message - Mensagem recebida
   */
  async handleWhatsAppMessage(message) {
    try {
      const chatId = message.from;
      const messageBody = message.body.trim();
      
      console.log(`📱 WhatsApp - ${chatId}: ${messageBody}`);
      
      // Evitar responder próprias mensagens
      if (message.fromMe) return;
      
      // Buscar paciente pelo telefone
      const telefone = this.formatPhone(chatId);
      // Aqui você integraria com seu banco de dados para buscar o paciente
      
      // Gerar resposta com IA
      const resposta = await this.generateResponse(messageBody, { telefone });
      
      // Enviar resposta
      await this.whatsappClient.sendMessage(chatId, resposta);
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem WhatsApp:', error.message);
    }
  }

  /**
   * Processa mensagens do Telegram
   * @param {Object} ctx - Contexto do Telegram
   */
  async handleTelegramMessage(ctx) {
    try {
      const chatId = ctx.chat.id;
      const messageText = ctx.message.text;
      
      console.log(`📱 Telegram - ${chatId}: ${messageText}`);
      
      // Gerar resposta com IA
      const resposta = await this.generateResponse(messageText, { 
        chatId,
        username: ctx.from.username 
      });
      
      // Enviar resposta
      await ctx.reply(resposta);
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem Telegram:', error.message);
    }
  }

  /**
   * Gera resposta usando IA ou fallbacks
   * @param {string} mensagem - Mensagem recebida
   * @param {Object} context - Contexto adicional
   * @returns {string} - Resposta gerada
   */
  async generateResponse(mensagem, context = {}) {
    try {
      // Usar nova integração de IA (Gemini/HuggingFace)
      const resposta = await aiService.gerarRespostaBot(mensagem, {
        nomeClinica: context.nomeClinica || 'Nossa Clínica',
        nomeCliente: context.nomeCliente || context.username || 'Cliente',
        ultimoAtendimento: context.ultimoAtendimento,
        procedimentos: context.procedimentos || ['Limpeza de Pele', 'Hidratação Facial', 'Massagem']
      });
      
      return resposta;
      
    } catch (error) {
      console.error('❌ Erro ao gerar resposta:', error.message);
      return this.getFallbackResponse(mensagem);
    }
  }

  /**
   * Resposta de fallback quando IA não está disponível
   * @param {string} mensagem - Mensagem original
   * @returns {string} - Resposta padrão
   */
  getFallbackResponse(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    
    if (mensagemLower.includes('agendar') || mensagemLower.includes('marcar')) {
      return '📅 Perfeito! Para agendar, preciso saber:\n\n' +
             '1️⃣ Qual procedimento deseja?\n' +
             '2️⃣ Qual dia prefere?\n' +
             '3️⃣ Qual horário?\n\n' +
             'Me informe esses dados e eu verifico a disponibilidade! 😊';
    }
    
    if (mensagemLower.includes('cancelar') || mensagemLower.includes('desmarcar')) {
      return '❌ Para cancelar um agendamento, me informe:\n\n' +
             '• Data e horário do agendamento\n' +
             '• Seu nome completo\n\n' +
             'Posso também reagendar para outra data se preferir! 🔄';
    }
    
    if (mensagemLower.includes('preço') || mensagemLower.includes('valor')) {
      return '💰 Nossos preços variam conforme o procedimento:\n\n' +
             '• Limpeza de Pele: R$ 80\n' +
             '• Hidratação Facial: R$ 120\n' +
             '• Massagem Relaxante: R$ 150\n\n' +
             'Temos promoções especiais! Qual procedimento te interessa? ✨';
    }
    
    if (mensagemLower.includes('procedimento') || mensagemLower.includes('tratamento')) {
      return '💆‍♀️ *Nossos Procedimentos:*\n\n' +
             '🧴 **Limpeza de Pele** (60min)\n' +
             '💧 **Hidratação Facial** (45min)\n' +
             '🤲 **Massagem Relaxante** (90min)\n' +
             '✨ **Peeling Químico** (30min)\n\n' +
             'Qual te interessa mais? Posso dar mais detalhes! 😊';
    }
    
    if (mensagemLower.includes('horário') || mensagemLower.includes('funcionamento')) {
      return '🕐 *Horário de Funcionamento:*\n\n' +
             'Segunda a Sexta: 8h às 18h\n' +
             'Sábado: 8h às 14h\n' +
             'Domingo: Fechado\n\n' +
             'Que dia gostaria de agendar? 📅';
    }
    
    return '👋 Olá! Obrigado pelo contato!\n\n' +
           'Posso ajudar você com:\n' +
           '📅 Agendamentos\n' +
           '❌ Cancelamentos\n' +
           '💰 Informações de preços\n' +
           '💆‍♀️ Nossos procedimentos\n\n' +
           'Como posso ajudar hoje? 😊';
  }

  /**
   * Envia mensagem via WhatsApp
   * @param {string} telefone - Número do telefone
   * @param {string} mensagem - Mensagem a enviar
   * @returns {boolean} - Sucesso no envio
   */
  async sendWhatsAppMessage(telefone, mensagem) {
    // Priorizar Twilio se configurado (mais confiável)
    if (this.useTwilio) {
      return await twilioService.sendWhatsAppMessage(telefone, mensagem);
    }
    
    // Fallback para WhatsApp Web.js
    if (!this.isWhatsAppReady) {
      console.warn('⚠️  WhatsApp Bot não está pronto');
      return false;
    }

    try {
      const chatId = this.formatPhone(telefone) + '@c.us';
      await this.whatsappClient.sendMessage(chatId, mensagem);
      console.log(`✅ Mensagem WhatsApp enviada para ${telefone}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Erro ao enviar WhatsApp para ${telefone}:`, error.message);
      return false;
    }
  }

  /**
   * Envia mensagem via Telegram
   * @param {string} chatId - ID do chat
   * @param {string} mensagem - Mensagem a enviar
   * @returns {boolean} - Sucesso no envio
   */
  async sendTelegramMessage(chatId, mensagem) {
    if (!this.isTelegramReady) {
      console.warn('⚠️  Telegram Bot não está pronto');
      return false;
    }

    try {
      await this.telegramBot.telegram.sendMessage(chatId, mensagem);
      console.log(`✅ Mensagem Telegram enviada para ${chatId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Erro ao enviar Telegram para ${chatId}:`, error.message);
      return false;
    }
  }

  /**
   * Formata número de telefone
   * @param {string} phone - Telefone a formatar
   * @returns {string} - Telefone formatado
   */
  formatPhone(phone) {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return '55' + cleaned;
    }
    
    if (cleaned.length === 10 && cleaned.startsWith('1')) {
      return '5511' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Para os bots graciosamente
   */
  async stop() {
    console.log('🛑 Parando bots...');
    
    if (this.whatsappClient) {
      await this.whatsappClient.destroy();
      console.log('🔴 WhatsApp Bot parado');
    }
    
    if (this.telegramBot) {
      this.telegramBot.stop('SIGTERM');
      console.log('🔴 Telegram Bot parado');
    }
  }

  /**
   * Status dos bots
   * @returns {Object} - Status atual
   */
  getStatus() {
    return {
      whatsapp: {
        ready: this.isWhatsAppReady,
        connected: this.whatsappClient ? true : false,
        twilio_enabled: this.useTwilio,
        twilio_status: twilioService.getStatus()
      },
      telegram: {
        ready: this.isTelegramReady,
        configured: this.telegramToken ? true : false
      },
      ai: aiService.getStatus()
    };
  }

  /**
   * Processa webhook do Twilio
   * @param {Object} req - Request object do Express
   * @returns {Object} - Dados processados
   */
  processTwilioWebhook(req) {
    return twilioService.processWebhook(req);
  }

  /**
   * Processa mensagem recebida via webhook
   * @param {Object} messageData - Dados da mensagem
   */
  async handleWebhookMessage(messageData) {
    try {
      const { phone, body, profileName, isWhatsApp } = messageData;
      
      console.log(`📱 ${isWhatsApp ? 'WhatsApp' : 'SMS'} - ${phone}: ${body}`);
      
      // Buscar contexto do paciente
      const PacienteModel = require('../models/Paciente');
      // Aqui você buscaria o paciente pelo telefone em todas as clínicas
      // Para simplificar, vamos usar contexto básico
      
      const context = {
        nomeCliente: profileName || 'Cliente',
        telefone: phone
      };
      
      // Gerar resposta com IA
      const resposta = await this.generateResponse(body, context);
      
      // Enviar resposta
      if (isWhatsApp) {
        await this.sendWhatsAppMessage(phone, resposta);
      } else {
        await twilioService.sendSMS(phone, resposta);
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem webhook:', error.message);
    }
  }
}

// Singleton instance
const botManager = new BotManager();

// Funções de conveniência para export
async function sendWhatsAppMessage(telefone, mensagem) {
  return await botManager.sendWhatsAppMessage(telefone, mensagem);
}

async function sendTelegramMessage(chatId, mensagem) {
  return await botManager.sendTelegramMessage(chatId, mensagem);
}

module.exports = {
  botManager,
  sendWhatsAppMessage,
  sendTelegramMessage
};
