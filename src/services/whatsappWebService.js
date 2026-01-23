const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const firestoreService = require('./firestoreService');

/**
 * Serviço para gerenciar WhatsApp usando whatsapp-web.js (100% GRATUITO)
 * 
 * IMPORTANTE: whatsapp-web.js não pode rodar diretamente em Cloud Functions
 * devido ao uso de Puppeteer/Chrome. Existem 3 opções:
 * 
 * 1. Rodar em Cloud Run (container Docker com Chrome)
 * 2. Rodar em VM do GCP (Compute Engine free tier)
 * 3. Rodar localmente e expor via ngrok/cloudflare tunnel
 * 
 * Para produção, recomendamos Cloud Run com Docker.
 */

// Nota: whatsapp-web.js será carregado dinamicamente quando necessário
// para evitar erros se não estiver instalado ainda
let Client, LocalAuth;

class WhatsAppWebService {
  constructor() {
    this.clients = new Map(); // Map<tenantId, client>
    this.qrCodes = new Map(); // Map<tenantId, qrCodeData>
    this.initialized = false;
    this.sessionPath = path.join(__dirname, '../../.wwebjs_auth');
  }

  /**
   * Inicializa o serviço (carrega whatsapp-web.js)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Tentar carregar whatsapp-web.js
      const wwebjs = require('whatsapp-web.js');
      Client = wwebjs.Client;
      LocalAuth = wwebjs.LocalAuth;
      
      console.log('✅ whatsapp-web.js carregado com sucesso');
      this.initialized = true;

      // Criar diretório de sessões se não existir
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

    } catch (error) {
      console.warn('⚠️ whatsapp-web.js não instalado. Execute: npm install whatsapp-web.js');
      this.initialized = false;
    }
  }

  /**
   * Verifica se o serviço está disponível
   */
  isAvailable() {
    return this.initialized;
  }

  /**
   * Cria cliente WhatsApp para um tenant
   */
  async createClient(tenantId) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      throw new Error('WhatsApp Web não disponível. Instale: npm install whatsapp-web.js');
    }

    // Se já existe cliente, retornar
    if (this.clients.has(tenantId)) {
      return this.clients.get(tenantId);
    }

    console.log(`📱 Criando cliente WhatsApp para tenant: ${tenantId}`);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: tenantId,
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
          '--disable-gpu'
        ]
      }
    });

    // Event: QR Code gerado
    client.on('qr', async (qr) => {
      console.log(`📱 QR Code gerado para ${tenantId}`);
      
      // Converter QR para base64
      const qrDataUrl = await qrcode.toDataURL(qr);
      this.qrCodes.set(tenantId, { qr, qrDataUrl, timestamp: Date.now() });

      // Salvar no Firestore
      await firestoreService.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .doc('main')
        .set({
          status: 'qr_generated',
          qrCode: qr,
          qrDataUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true });
    });

    // Event: Cliente pronto
    client.on('ready', async () => {
      console.log(`✅ WhatsApp conectado para ${tenantId}`);

      const info = client.info;
      
      // Salvar sessão no Firestore
      await firestoreService.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .doc('main')
        .set({
          status: 'connected',
          phone: info.wid.user,
          pushname: info.pushname,
          platform: info.platform,
          connectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

      this.qrCodes.delete(tenantId);
    });

    // Event: Autenticação bem-sucedida
    client.on('authenticated', () => {
      console.log(`🔐 Autenticado: ${tenantId}`);
    });

    // Event: Falha na autenticação
    client.on('auth_failure', async (msg) => {
      console.error(`❌ Falha na autenticação ${tenantId}:`, msg);
      
      await firestoreService.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .doc('main')
        .set({
          status: 'auth_failed',
          error: msg,
          updatedAt: new Date().toISOString()
        }, { merge: true });
    });

    // Event: Desconectado
    client.on('disconnected', async (reason) => {
      console.log(`🔌 Desconectado ${tenantId}:`, reason);
      
      await firestoreService.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .doc('main')
        .set({
          status: 'disconnected',
          reason,
          updatedAt: new Date().toISOString()
        }, { merge: true });

      this.clients.delete(tenantId);
    });

    // Event: Mensagem recebida
    client.on('message', async (message) => {
      await this.handleIncomingMessage(tenantId, message);
    });

    this.clients.set(tenantId, client);
    return client;
  }

  /**
   * Inicia cliente WhatsApp
   */
  async startClient(tenantId) {
    const client = await this.createClient(tenantId);
    
    if (!client.pupBrowser) {
      await client.initialize();
    }

    return client;
  }

  /**
   * Para cliente WhatsApp
   */
  async stopClient(tenantId) {
    const client = this.clients.get(tenantId);
    
    if (client) {
      await client.destroy();
      this.clients.delete(tenantId);
      this.qrCodes.delete(tenantId);
    }
  }

  /**
   * Obtém QR Code do tenant
   */
  getQRCode(tenantId) {
    return this.qrCodes.get(tenantId);
  }

  /**
   * Verifica se tenant está conectado
   */
  isConnected(tenantId) {
    const client = this.clients.get(tenantId);
    return client && client.info;
  }

  /**
   * Envia mensagem
   */
  async sendMessage(tenantId, phone, message) {
    const client = this.clients.get(tenantId);
    
    if (!client) {
      throw new Error('Cliente WhatsApp não conectado');
    }

    // Formatar número (remover caracteres especiais)
    const formattedPhone = phone.replace(/\D/g, '');
    const chatId = `${formattedPhone}@c.us`;

    try {
      const sentMessage = await client.sendMessage(chatId, message);
      
      console.log(`✅ Mensagem enviada para ${phone}`);
      
      return {
        success: true,
        messageId: sentMessage.id.id,
        timestamp: sentMessage.timestamp
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  /**
   * Envia mídia (imagem, vídeo, documento)
   */
  async sendMedia(tenantId, phone, mediaBuffer, options = {}) {
    const client = this.clients.get(tenantId);
    
    if (!client) {
      throw new Error('Cliente WhatsApp não conectado');
    }

    const formattedPhone = phone.replace(/\D/g, '');
    const chatId = `${formattedPhone}@c.us`;

    const { MessageMedia } = require('whatsapp-web.js');
    
    const media = new MessageMedia(
      options.mimetype || 'image/jpeg',
      mediaBuffer.toString('base64'),
      options.filename || 'file'
    );

    try {
      const sentMessage = await client.sendMessage(chatId, media, {
        caption: options.caption || ''
      });

      return {
        success: true,
        messageId: sentMessage.id.id,
        timestamp: sentMessage.timestamp
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar mídia:`, error);
      throw error;
    }
  }

  /**
   * Processa mensagem recebida
   */
  async handleIncomingMessage(tenantId, message) {
    try {
      const contact = await message.getContact();
      const chat = await message.getChat();

      // Extrair dados da mensagem
      const messageData = {
        messageId: message.id.id,
        from: message.from,
        contactPhone: contact.number,
        contactName: contact.pushname || contact.name || contact.number,
        body: message.body,
        hasMedia: message.hasMedia,
        timestamp: message.timestamp,
        isGroup: chat.isGroup
      };

      // Ignorar mensagens de grupos
      if (messageData.isGroup) {
        return;
      }

      console.log(`📥 Mensagem recebida de ${messageData.contactName}`);

      // Salvar no Firestore
      const firestoreWhatsappService = require('./firestoreWhatsappService');
      
      await firestoreWhatsappService.saveMessage(tenantId, {
        contactPhone: messageData.contactPhone,
        contactName: messageData.contactName,
        message: messageData.body,
        direction: 'inbound',
        status: 'received',
        provider: 'whatsapp-web',
        hasMedia: messageData.hasMedia,
        messageId: messageData.messageId,
        receivedAt: new Date(messageData.timestamp * 1000).toISOString()
      });

      // Atualizar contato
      await firestoreWhatsappService.saveContact(tenantId, {
        phone: messageData.contactPhone,
        name: messageData.contactName,
        lastMessage: messageData.body,
        lastMessageAt: new Date(messageData.timestamp * 1000).toISOString()
      });

      // Processar mídia se existir
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        
        if (media) {
          // Fazer upload da mídia para Cloud Storage
          const storageService = require('./storageService');
          const buffer = Buffer.from(media.data, 'base64');
          
          const uploadResult = await storageService.uploadWhatsAppMedia(
            tenantId,
            buffer,
            media.filename || `${messageData.messageId}.${media.mimetype.split('/')[1]}`,
            media.mimetype
          );

          console.log(`📎 Mídia salva: ${uploadResult.url}`);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error);
    }
  }

  /**
   * Obtém informações do cliente
   */
  async getClientInfo(tenantId) {
    const client = this.clients.get(tenantId);
    
    if (!client || !client.info) {
      return null;
    }

    return {
      phone: client.info.wid.user,
      pushname: client.info.pushname,
      platform: client.info.platform,
      connected: true
    };
  }

  /**
   * Lista todos os clientes ativos
   */
  getActiveClients() {
    return Array.from(this.clients.keys());
  }

  /**
   * Limpa sessão (para reconectar)
   */
  async clearSession(tenantId) {
    // Parar cliente
    await this.stopClient(tenantId);

    // Remover pasta de sessão
    const sessionDir = path.join(this.sessionPath, `session-${tenantId}`);
    
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(`🧹 Sessão limpa para ${tenantId}`);
    }
  }
}

module.exports = new WhatsAppWebService();
