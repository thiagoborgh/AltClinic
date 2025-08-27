const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    this.isConfigured = false;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.isConfigured = true;
      console.log('✅ Twilio WhatsApp configurado');
    } else {
      console.warn('⚠️  Twilio não configurado. Verifique TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN');
    }
  }

  /**
   * Envia mensagem via Twilio WhatsApp
   * @param {string} telefone - Número do telefone (formato: +5511999999999)
   * @param {string} mensagem - Mensagem a enviar
   * @returns {Promise<boolean>} - Sucesso no envio
   */
  async sendWhatsAppMessage(telefone, mensagem) {
    if (!this.isConfigured) {
      console.warn('⚠️  Twilio não configurado');
      return false;
    }

    try {
      // Formatar número para WhatsApp
      const whatsappTo = `whatsapp:${this.formatPhone(telefone)}`;
      
      const message = await this.client.messages.create({
        from: this.whatsappNumber,
        to: whatsappTo,
        body: mensagem
      });

      console.log(`✅ WhatsApp enviado via Twilio: ${message.sid}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao enviar WhatsApp via Twilio para ${telefone}:`, error.message);
      return false;
    }
  }

  /**
   * Envia SMS via Twilio
   * @param {string} telefone - Número do telefone
   * @param {string} mensagem - Mensagem a enviar
   * @returns {Promise<boolean>} - Sucesso no envio
   */
  async sendSMS(telefone, mensagem) {
    if (!this.isConfigured) {
      console.warn('⚠️  Twilio não configurado');
      return false;
    }

    try {
      const message = await this.client.messages.create({
        from: this.whatsappNumber.replace('whatsapp:', ''), // Usar número sem whatsapp: prefix
        to: this.formatPhone(telefone),
        body: mensagem
      });

      console.log(`✅ SMS enviado via Twilio: ${message.sid}`);
      return true;

    } catch (error) {
      console.error(`❌ Erro ao enviar SMS via Twilio para ${telefone}:`, error.message);
      return false;
    }
  }

  /**
   * Configura webhook para receber mensagens
   * @param {string} webhookUrl - URL do webhook
   * @returns {Promise<boolean>} - Sucesso na configuração
   */
  async configureWebhook(webhookUrl) {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // Configurar webhook para o número WhatsApp
      console.log(`📡 Configure o webhook manualmente no Twilio Console: ${webhookUrl}/webhook/twilio`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error.message);
      return false;
    }
  }

  /**
   * Processa webhook do Twilio
   * @param {Object} req - Request object
   * @returns {Object} - Dados da mensagem processada
   */
  processWebhook(req) {
    const { 
      From, 
      To, 
      Body, 
      MessageSid, 
      ProfileName,
      MediaUrl0,
      NumMedia 
    } = req.body;

    return {
      from: From,
      to: To,
      body: Body,
      messageSid: MessageSid,
      profileName: ProfileName,
      hasMedia: parseInt(NumMedia) > 0,
      mediaUrl: MediaUrl0,
      isWhatsApp: From.startsWith('whatsapp:'),
      phone: From.replace('whatsapp:', '').replace('+', '')
    };
  }

  /**
   * Formata número de telefone para padrão internacional
   * @param {string} phone - Telefone a formatar
   * @returns {string} - Telefone formatado
   */
  formatPhone(phone) {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se não tem código do país, adiciona +55 (Brasil)
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return '+55' + cleaned;
    }
    
    if (cleaned.length === 10 && cleaned.startsWith('1')) {
      return '+5511' + cleaned.substring(1);
    }
    
    // Se já tem +, retorna como está
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Se tem 13 dígitos, provavelmente já tem código do país
    if (cleaned.length === 13) {
      return '+' + cleaned;
    }
    
    return '+55' + cleaned;
  }

  /**
   * Status do serviço
   * @returns {Object} - Status atual
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      accountSid: !!this.accountSid,
      whatsappNumber: this.whatsappNumber
    };
  }

  /**
   * Testa conexão com Twilio
   * @returns {Promise<boolean>} - Sucesso na conexão
   */
  async testConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const account = await this.client.api.accounts(this.accountSid).fetch();
      console.log(`🟢 Twilio conectado: ${account.friendlyName}`);
      return true;

    } catch (error) {
      console.error('❌ Erro na conexão com Twilio:', error.message);
      return false;
    }
  }
}

module.exports = new TwilioService();
