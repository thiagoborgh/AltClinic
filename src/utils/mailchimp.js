const mailchimp = require('@mailchimp/mailchimp_marketing');

class MailchimpService {
  constructor() {
    this.apiKey = process.env.MAILCHIMP_API_KEY;
    this.serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';
    this.listId = process.env.MAILCHIMP_LIST_ID;
    
    this.isConfigured = false;
    
    if (this.apiKey && this.listId) {
      this.configure();
    } else {
      console.warn('⚠️  Mailchimp não configurado. Verifique as variáveis de ambiente.');
    }
  }

  /**
   * Configura o cliente Mailchimp
   */
  configure() {
    try {
      mailchimp.setConfig({
        apiKey: this.apiKey,
        server: this.serverPrefix
      });
      
      this.isConfigured = true;
      console.log('✅ Mailchimp configurado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao configurar Mailchimp:', error.message);
    }
  }

  /**
   * Adiciona ou atualiza contato na lista
   * @param {Object} contactData - Dados do contato
   * @returns {boolean} - Sucesso na operação
   */
  async addOrUpdateContact(contactData) {
    if (!this.isConfigured) {
      console.warn('⚠️  Mailchimp não configurado');
      return false;
    }

    const { email, nome, telefone, tags = [], status = 'subscribed' } = contactData;

    try {
      const subscriberHash = this.getSubscriberHash(email);
      
      const memberData = {
        email_address: email,
        status: status,
        merge_fields: {
          FNAME: nome.split(' ')[0],
          LNAME: nome.split(' ').slice(1).join(' ') || '',
          PHONE: telefone || ''
        }
      };

      // Tags do Mailchimp (se suportado pelo plano)
      if (tags.length > 0) {
        memberData.tags = tags;
      }

      const response = await mailchimp.lists.setListMember(
        this.listId,
        subscriberHash,
        memberData
      );

      console.log(`✅ Contato ${email} adicionado/atualizado no Mailchimp`);
      return true;

    } catch (error) {
      if (error.status === 400) {
        console.warn(`⚠️  Email ${email} já existe ou é inválido`);
      } else {
        console.error('❌ Erro ao adicionar contato no Mailchimp:', error.message);
      }
      return false;
    }
  }

  /**
   * Envia email usando Mailchimp (template básico)
   * @param {string} email - Email do destinatário
   * @param {string} subject - Assunto do email
   * @param {string} content - Conteúdo do email
   * @returns {boolean} - Sucesso no envio
   */
  async sendEmail(email, subject, content) {
    if (!this.isConfigured) {
      console.warn('⚠️  Mailchimp não configurado');
      return false;
    }

    try {
      // Para envio de emails transacionais, normalmente usa-se Mandrill
      // ou o Mailchimp Transactional API (pago)
      // Aqui simularemos adicionando à lista e enviando campanha
      
      // Primeiro, adicionar/atualizar contato
      await this.addOrUpdateContact({
        email,
        nome: 'Cliente',
        tags: ['email-automatico']
      });

      // Em produção, você criaria uma campanha automatizada
      // ou usaria templates específicos
      console.log(`📧 Email simulado enviado para ${email}: ${subject}`);
      
      // TODO: Implementar envio real usando Mailchimp Transactional
      // ou integrar com outro serviço de email transacional gratuito
      
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error.message);
      return false;
    }
  }

  /**
   * Cria segmento de pacientes inativos
   * @param {Array} emails - Lista de emails inativos
   * @returns {string|null} - ID do segmento criado
   */
  async createInactiveSegment(emails) {
    if (!this.isConfigured || emails.length === 0) {
      return null;
    }

    try {
      const segmentData = {
        name: `Pacientes Inativos - ${new Date().toLocaleDateString('pt-BR')}`,
        static_segment: emails.map(email => ({ email_address: email }))
      };

      const response = await mailchimp.lists.createListSegment(
        this.listId,
        segmentData
      );

      console.log(`✅ Segmento criado: ${response.id}`);
      return response.id;

    } catch (error) {
      console.error('❌ Erro ao criar segmento:', error.message);
      return null;
    }
  }

  /**
   * Sincroniza pacientes com Mailchimp
   * @param {Array} pacientes - Lista de pacientes
   * @returns {Object} - Resultado da sincronização
   */
  async syncPatients(pacientes) {
    if (!this.isConfigured) {
      return { success: 0, errors: 0 };
    }

    let success = 0;
    let errors = 0;

    console.log(`🔄 Sincronizando ${pacientes.length} pacientes...`);

    for (const paciente of pacientes) {
      if (!paciente.email) continue;

      const resultado = await this.addOrUpdateContact({
        email: paciente.email,
        nome: paciente.nome,
        telefone: paciente.telefone,
        tags: ['paciente-clinica'],
        status: 'subscribed'
      });

      if (resultado) {
        success++;
      } else {
        errors++;
      }

      // Delay para evitar rate limiting
      await this.sleep(100);
    }

    console.log(`✅ Sincronização concluída: ${success} sucessos, ${errors} erros`);
    
    return { success, errors };
  }

  /**
   * Obtém estatísticas da lista
   * @returns {Object|null} - Estatísticas da lista
   */
  async getListStats() {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const response = await mailchimp.lists.getList(this.listId);
      
      return {
        total_members: response.stats.member_count,
        subscribed: response.stats.member_count,
        unsubscribed: response.stats.unsubscribe_count,
        cleaned: response.stats.cleaned_count,
        last_sync: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error.message);
      return null;
    }
  }

  /**
   * Envia campanha para pacientes inativos
   * @param {Array} pacientesInativos - Lista de pacientes inativos
   * @param {string} mensagem - Mensagem da campanha
   * @returns {boolean} - Sucesso no envio
   */
  async sendInactiveCampaign(pacientesInativos, mensagem) {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // Primeiro, sincronizar pacientes inativos
      const pacientesComEmail = pacientesInativos.filter(p => p.email);
      
      if (pacientesComEmail.length === 0) {
        console.log('📧 Nenhum paciente inativo com email');
        return true;
      }

      // Adicionar tag especial para pacientes inativos
      for (const paciente of pacientesComEmail) {
        await this.addOrUpdateContact({
          email: paciente.email,
          nome: paciente.nome,
          telefone: paciente.telefone,
          tags: ['paciente-inativo'],
          status: 'subscribed'
        });
      }

      // Criar segmento
      const emails = pacientesComEmail.map(p => p.email);
      const segmentId = await this.createInactiveSegment(emails);

      console.log(`📧 Campanha preparada para ${emails.length} pacientes inativos`);
      
      // Em produção, você criaria e enviaria uma campanha real
      // const campaignId = await this.createCampaign(segmentId, mensagem);
      // await this.sendCampaign(campaignId);
      
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar campanha de inativos:', error.message);
      return false;
    }
  }

  /**
   * Gera hash do subscriber para API
   * @param {string} email - Email do subscriber
   * @returns {string} - Hash MD5 do email
   */
  getSubscriberHash(email) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }

  /**
   * Delay helper
   * @param {number} ms - Milissegundos
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Testa conexão com Mailchimp
   * @returns {boolean} - Sucesso na conexão
   */
  async testConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await mailchimp.ping.get();
      console.log('🟢 Conexão com Mailchimp OK');
      return true;

    } catch (error) {
      console.error('❌ Erro na conexão com Mailchimp:', error.message);
      return false;
    }
  }

  /**
   * Status do serviço
   * @returns {Object} - Status atual
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      apiKey: !!this.apiKey,
      listId: !!this.listId,
      serverPrefix: this.serverPrefix
    };
  }
}

// Singleton instance
const mailchimpService = new MailchimpService();

// Função de conveniência para export
async function sendEmail(email, subject, content) {
  return await mailchimpService.sendEmail(email, subject, content);
}

module.exports = {
  mailchimpService,
  sendEmail
};
