const whatsappWebService = require('./whatsappWebService');
const firestoreWhatsappService = require('./firestoreWhatsappService');

/**
 * Serviço de proteção para automações WhatsApp
 * Garante que automações só sejam executadas quando WhatsApp estiver conectado
 */
class AutomationGuard {
  constructor() {
    this.blockedAttempts = new Map(); // Cache de tentativas bloqueadas por tenant
  }

  /**
   * Verifica se uma automação pode ser executada
   * @param {string} tenantId - ID do tenant
   * @param {string} automationType - Tipo da automação (ex: 'appointment_reminder')
   * @param {string} eventId - ID do evento (opcional, para evitar duplicatas)
   * @returns {Promise<Object>} - { canSend: boolean, reason?: string }
   */
  async canSendAutomation(tenantId, automationType, eventId = null) {
    try {
      console.log(`🔍 Verificando permissão para automação ${automationType} do tenant ${tenantId}`);

      // 1. Verificar se WhatsApp está conectado
      const isConnected = whatsappWebService.isConnected(tenantId);

      if (!isConnected) {
        console.log(`🚫 Automação ${automationType} bloqueada: WhatsApp desconectado para tenant ${tenantId}`);

        // Registrar tentativa bloqueada
        await this.logBlockedAttempt(tenantId, automationType, eventId, 'whatsapp_disconnected');

        // Notificar desconexão (se ainda não notificado recentemente)
        await this.notifyDisconnection(tenantId);

        return {
          canSend: false,
          reason: 'whatsapp_disconnected',
          message: 'WhatsApp desconectado - automação bloqueada'
        };
      }

      // 2. Verificar se não é uma duplicata recente (se eventId fornecido)
      if (eventId) {
        const isDuplicate = await this.checkDuplicateAttempt(tenantId, automationType, eventId);
        if (isDuplicate) {
          console.log(`🚫 Automação ${automationType} bloqueada: tentativa duplicada para evento ${eventId}`);
          return {
            canSend: false,
            reason: 'duplicate_attempt',
            message: 'Tentativa duplicada - automação já executada recentemente'
          };
        }
      }

      console.log(`✅ Automação ${automationType} permitida para tenant ${tenantId}`);
      return { canSend: true };

    } catch (error) {
      console.error(`❌ Erro ao verificar automação ${automationType}:`, error);
      return {
        canSend: false,
        reason: 'error',
        message: 'Erro interno ao verificar automação'
      };
    }
  }

  /**
   * Registra uma tentativa bloqueada de automação
   * @param {string} tenantId - ID do tenant
   * @param {string} automationType - Tipo da automação
   * @param {string} eventId - ID do evento
   * @param {string} reason - Motivo do bloqueio
   */
  async logBlockedAttempt(tenantId, automationType, eventId, reason) {
    try {
      const blockedData = {
        tenantId,
        automationType,
        eventId,
        reason,
        blockedAt: new Date().toISOString(),
        eventType: 'automation_blocked'
      };

      // Salvar no log de mensagens (reutilizando a estrutura)
      await firestoreWhatsappService.saveMessageLog(tenantId, {
        pacienteId: null,
        pacienteNome: 'Sistema',
        profissionalId: null,
        profissionalNome: 'Automação',
        telefone: null,
        mensagem: `Automação bloqueada: ${automationType} - ${reason}`,
        tipo: 'sistema',
        status: 'bloqueado',
        dataEnvio: new Date().toISOString(),
        dataAgendamento: null,
        erro: reason,
        tentativas: 0
      });

      console.log(`📝 Tentativa bloqueada registrada: ${automationType} - ${reason}`);

    } catch (error) {
      console.error('❌ Erro ao registrar tentativa bloqueada:', error);
    }
  }

  /**
   * Verifica se é uma tentativa duplicada recente
   * @param {string} tenantId - ID do tenant
   * @param {string} automationType - Tipo da automação
   * @param {string} eventId - ID do evento
   * @returns {Promise<boolean>} - True se for duplicata
   */
  async checkDuplicateAttempt(tenantId, automationType, eventId) {
    try {
      const cacheKey = `${tenantId}_${automationType}_${eventId}`;
      const now = Date.now();
      const recentAttempts = this.blockedAttempts.get(cacheKey) || [];

      // Filtrar tentativas das últimas 5 minutos
      const recentBlocks = recentAttempts.filter(timestamp => now - timestamp < 5 * 60 * 1000);

      if (recentBlocks.length > 0) {
        // Atualizar cache
        this.blockedAttempts.set(cacheKey, recentBlocks);
        return true;
      }

      // Adicionar nova tentativa ao cache
      recentBlocks.push(now);
      this.blockedAttempts.set(cacheKey, recentBlocks);

      return false;

    } catch (error) {
      console.error('❌ Erro ao verificar duplicata:', error);
      return false; // Em caso de erro, permitir a automação
    }
  }

  /**
   * Notifica o usuário sobre desconexão do WhatsApp
   * @param {string} tenantId - ID do tenant
   */
  async notifyDisconnection(tenantId) {
    try {
      // Aqui podemos implementar notificações push, email, etc.
      // Por enquanto, apenas log
      console.warn(`⚠️ WhatsApp desconectado para tenant ${tenantId} - automações pausadas`);

      // TODO: Implementar notificação visual no frontend
      // - Toast de aviso
      // - Badge no header
      // - Email de alerta

    } catch (error) {
      console.error('❌ Erro ao notificar desconexão:', error);
    }
  }

  /**
   * Obtém status das automações para um tenant
   * @param {string} tenantId - ID do tenant
   * @returns {Promise<Object>} - Status das automações
   */
  async getAutomationStatus(tenantId) {
    try {
      const isConnected = whatsappWebService.isConnected(tenantId);
      const blockedCount = await this.getBlockedAttemptsCount(tenantId);

      return {
        whatsappConnected: isConnected,
        automationsEnabled: isConnected,
        blockedAttempts: blockedCount,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao obter status das automações:', error);
      return {
        whatsappConnected: false,
        automationsEnabled: false,
        blockedAttempts: 0,
        error: error.message
      };
    }
  }

  /**
   * Conta tentativas bloqueadas recentes para um tenant
   * @param {string} tenantId - ID do tenant
   * @returns {Promise<number>} - Número de tentativas bloqueadas
   */
  async getBlockedAttemptsCount(tenantId) {
    try {
      // Buscar logs de mensagens bloqueadas das últimas 24h
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const logs = await firestoreWhatsappService.getMessageLogs(tenantId, {
        status: 'bloqueado',
        limit: 1000
      });

      return logs.filter(log =>
        log.status === 'bloqueado' &&
        new Date(log.dataEnvio) > yesterday
      ).length;

    } catch (error) {
      console.error('❌ Erro ao contar tentativas bloqueadas:', error);
      return 0;
    }
  }

  /**
   * Limpa cache de tentativas bloqueadas (para testes)
   */
  clearCache() {
    this.blockedAttempts.clear();
    console.log('🧹 Cache de tentativas bloqueadas limpo');
  }
}

module.exports = new AutomationGuard();