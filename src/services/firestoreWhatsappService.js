const firestoreService = require('./firestoreService');

/**
 * Serviço para gerenciar WhatsApp no Firestore
 * Estrutura:
 * - tenants/{tenantId}/whatsapp_sessions/{sessionId}
 * - tenants/{tenantId}/whatsapp_messages/{messageId}
 * - tenants/{tenantId}/whatsapp_contacts/{contactPhone}
 */
class FirestoreWhatsAppService {
  constructor() {
    this.db = firestoreService.db;
  }

  // ===================== SESSÕES =====================

  /**
   * Cria ou atualiza sessão do WhatsApp
   * @param {string} tenantId - ID do tenant
   * @param {Object} sessionData - Dados da sessão
   * @returns {Promise<Object>} - Sessão criada/atualizada
   */
  async saveSession(tenantId, sessionData) {
    try {
      const sessionRef = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .doc(sessionData.id || 'main');

      const data = {
        ...sessionData,
        tenantId,
        updatedAt: new Date().toISOString()
      };

      if (!sessionData.id) {
        data.createdAt = new Date().toISOString();
      }

      await sessionRef.set(data, { merge: true });

      return { id: sessionRef.id, ...data };
    } catch (error) {
      console.error('❌ Erro ao salvar sessão WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Busca sessão ativa do tenant
   * @param {string} tenantId - ID do tenant
   * @returns {Promise<Object|null>} - Sessão encontrada ou null
   */
  async getActiveSession(tenantId) {
    try {
      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .where('status', '==', 'connected')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Erro ao buscar sessão ativa:', error);
      throw error;
    }
  }

  /**
   * Atualiza status da sessão
   * @param {string} tenantId - ID do tenant
   * @param {string} sessionId - ID da sessão
   * @param {string} status - Novo status
   * @returns {Promise<void>}
   */
  async updateSessionStatus(tenantId, sessionId, status) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .doc(sessionId)
        .update({
          status,
          updatedAt: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Erro ao atualizar status da sessão:', error);
      throw error;
    }
  }

  /**
   * Remove sessão
   * @param {string} tenantId - ID do tenant
   * @param {string} sessionId - ID da sessão
   * @returns {Promise<void>}
   */
  async deleteSession(tenantId, sessionId) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_sessions')
        .doc(sessionId)
        .delete();
    } catch (error) {
      console.error('❌ Erro ao deletar sessão:', error);
      throw error;
    }
  }

  // ===================== MENSAGENS =====================

  /**
   * Salva mensagem no Firestore
   * @param {string} tenantId - ID do tenant
   * @param {Object} messageData - Dados da mensagem
   * @returns {Promise<Object>} - Mensagem salva
   */
  async saveMessage(tenantId, messageData) {
    try {
      const messageRef = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_messages')
        .doc();

      const data = {
        ...messageData,
        tenantId,
        createdAt: new Date().toISOString()
      };

      await messageRef.set(data);

      return { id: messageRef.id, ...data };
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  /**
   * Busca mensagens de um contato
   * @param {string} tenantId - ID do tenant
   * @param {string} contactPhone - Telefone do contato
   * @param {number} limit - Limite de mensagens
   * @returns {Promise<Array>} - Lista de mensagens
   */
  async getMessagesByContact(tenantId, contactPhone, limit = 50) {
    try {
      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_messages')
        .where('contactPhone', '==', contactPhone)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  /**
   * Busca mensagens recentes do tenant
   * @param {string} tenantId - ID do tenant
   * @param {number} limit - Limite de mensagens
   * @returns {Promise<Array>} - Lista de mensagens
   */
  async getRecentMessages(tenantId, limit = 100) {
    try {
      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_messages')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens recentes:', error);
      throw error;
    }
  }

  /**
   * Marca mensagem como lida
   * @param {string} tenantId - ID do tenant
   * @param {string} messageId - ID da mensagem
   * @returns {Promise<void>}
   */
  async markAsRead(tenantId, messageId) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_messages')
        .doc(messageId)
        .update({
          read: true,
          readAt: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Erro ao marcar mensagem como lida:', error);
      throw error;
    }
  }

  // ===================== CONTATOS =====================

  /**
   * Salva ou atualiza contato
   * @param {string} tenantId - ID do tenant
   * @param {Object} contactData - Dados do contato
   * @returns {Promise<Object>} - Contato salvo
   */
  async saveContact(tenantId, contactData) {
    try {
      const contactRef = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_contacts')
        .doc(contactData.phone);

      const existingDoc = await contactRef.get();
      
      const data = {
        ...contactData,
        tenantId,
        updatedAt: new Date().toISOString()
      };

      if (!existingDoc.exists) {
        data.createdAt = new Date().toISOString();
        data.firstContact = new Date().toISOString();
      }

      await contactRef.set(data, { merge: true });

      return { id: contactRef.id, ...data };
    } catch (error) {
      console.error('❌ Erro ao salvar contato:', error);
      throw error;
    }
  }

  /**
   * Busca contato por telefone
   * @param {string} tenantId - ID do tenant
   * @param {string} phone - Telefone do contato
   * @returns {Promise<Object|null>} - Contato encontrado ou null
   */
  async getContact(tenantId, phone) {
    try {
      const doc = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_contacts')
        .doc(phone)
        .get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Erro ao buscar contato:', error);
      throw error;
    }
  }

  /**
   * Lista todos os contatos do tenant
   * @param {string} tenantId - ID do tenant
   * @returns {Promise<Array>} - Lista de contatos
   */
  async listContacts(tenantId) {
    try {
      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_contacts')
        .orderBy('updatedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao listar contatos:', error);
      throw error;
    }
  }

  // ===================== CONFIGURAÇÃO =====================

  /**
   * Salva configuração do WhatsApp do tenant
   * @param {string} tenantId - ID do tenant
   * @param {Object} config - Configurações
   * @returns {Promise<Object>} - Configuração salva
   */
  async saveConfig(tenantId, config) {
    try {
      const configRef = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('settings')
        .doc('whatsapp');

      const data = {
        ...config,
        updatedAt: new Date().toISOString()
      };

      await configRef.set(data, { merge: true });

      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      throw error;
    }
  }

  /**
   * Busca configuração do WhatsApp do tenant
   * @param {string} tenantId - ID do tenant
   * @returns {Promise<Object|null>} - Configuração encontrada ou null
   */
  async getConfig(tenantId) {
    try {
      const doc = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('settings')
        .doc('whatsapp')
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data();
    } catch (error) {
      console.error('❌ Erro ao buscar configuração:', error);
      throw error;
    }
  }

  // ===================== WEBHOOKS =====================

  /**
   * Salva log de webhook recebido
   * @param {string} tenantId - ID do tenant
   * @param {Object} webhookData - Dados do webhook
   * @returns {Promise<Object>} - Log salvo
   */
  async logWebhook(tenantId, webhookData) {
    try {
      const logRef = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_webhooks')
        .doc();

      const data = {
        ...webhookData,
        tenantId,
        receivedAt: new Date().toISOString()
      };

      await logRef.set(data);

      return { id: logRef.id, ...data };
    } catch (error) {
      console.error('❌ Erro ao salvar log de webhook:', error);
      throw error;
    }
  }

  // ===================== LOG DE MENSAGENS =====================

  /**
   * Salva log de mensagem enviada
   * @param {string} tenantId - ID do tenant
   * @param {Object} logData - Dados do log
   * @returns {Promise<Object>} - Log salvo
   */
  async saveMessageLog(tenantId, logData) {
    try {
      const logRef = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('mensagens_log')
        .doc();

      const data = {
        ...logData,
        tenantId,
        createdAt: new Date().toISOString()
      };

      await logRef.set(data);

      return { id: logRef.id, ...data };
    } catch (error) {
      console.error('❌ Erro ao salvar log de mensagem:', error);
      throw error;
    }
  }

  /**
   * Busca logs de mensagens com filtros
   * @param {string} tenantId - ID do tenant
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Array>} - Lista de logs
   */
  async getMessageLogs(tenantId, filters = {}) {
    try {
      let query = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('mensagens_log')
        .orderBy('dataEnvio', 'desc');

      // Aplicar filtros
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.tipo) {
        query = query.where('tipo', '==', filters.tipo);
      }

      if (filters.pacienteId) {
        query = query.where('pacienteId', '==', filters.pacienteId);
      }

      if (filters.profissionalId) {
        query = query.where('profissionalId', '==', filters.profissionalId);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100); // limite padrão
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar logs de mensagens:', error);
      throw error;
    }
  }
  async countMessages(tenantId, startDate, endDate) {
    try {
      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('whatsapp_messages')
        .where('createdAt', '>=', startDate.toISOString())
        .where('createdAt', '<=', endDate.toISOString())
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('❌ Erro ao contar mensagens:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas do WhatsApp
   * @param {string} tenantId - ID do tenant
   * @returns {Promise<Object>} - Estatísticas
   */
  async getStats(tenantId) {
    try {
      const [messagesSnapshot, contactsSnapshot, sessionSnapshot] = await Promise.all([
        this.db
          .collection('tenants')
          .doc(tenantId)
          .collection('whatsapp_messages')
          .get(),
        this.db
          .collection('tenants')
          .doc(tenantId)
          .collection('whatsapp_contacts')
          .get(),
        this.db
          .collection('tenants')
          .doc(tenantId)
          .collection('whatsapp_sessions')
          .where('status', '==', 'connected')
          .get()
      ]);

      return {
        totalMessages: messagesSnapshot.size,
        totalContacts: contactsSnapshot.size,
        hasActiveSession: !sessionSnapshot.empty
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}

module.exports = new FirestoreWhatsAppService();
