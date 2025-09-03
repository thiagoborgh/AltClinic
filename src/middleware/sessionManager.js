// 🛡️ Sistema Inteligente de Controle de Sessões
// Permite acesso ilimitado do mesmo IP, oferece opção de deslogar outros IPs

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class SessionManager {
  constructor() {
    // Armazenamento em memória das sessões ativas
    // Em produção, considere usar Redis ou banco de dados
    this.activeSessions = new Map();
    
    // Cleanup automático de sessões expiradas (a cada 1 hora)
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  /**
   * Cria uma nova sessão ou verifica se já existe
   * @param {number} userId - ID do usuário
   * @param {string} userIP - IP do usuário
   * @param {string} userAgent - User Agent do navegador
   * @returns {Object} - Resultado da verificação de sessão
   */
  async createOrCheckSession(userId, userIP, userAgent) {
    const sessionKey = `user_${userId}`;
    const currentTime = Date.now();
    
    // Buscar sessões existentes do usuário
    const existingSessions = this.activeSessions.get(sessionKey) || [];
    
    // Limpar sessões expiradas
    const validSessions = existingSessions.filter(session => 
      session.expiresAt > currentTime
    );

    // Verificar se já existe uma sessão ativa do mesmo IP
    const sameIPSession = validSessions.find(session => 
      session.ip === userIP
    );

    if (sameIPSession) {
      // Mesmo IP: Permitir acesso, atualizar sessão
      sameIPSession.lastActivity = currentTime;
      sameIPSession.userAgent = userAgent;
      
      this.activeSessions.set(sessionKey, validSessions);
      
      return {
        success: true,
        action: 'same_ip_access',
        message: 'Acesso permitido do mesmo IP',
        sessionId: sameIPSession.sessionId
      };
    }

    // Verificar se existem sessões de outros IPs
    const otherIPSessions = validSessions.filter(session => 
      session.ip !== userIP
    );

    if (otherIPSessions.length > 0) {
      // Existem sessões de outros IPs
      return {
        success: false,
        action: 'other_ip_detected',
        message: 'Já existe uma sessão ativa em outro dispositivo',
        otherSessions: otherIPSessions.map(session => ({
          ip: this.maskIP(session.ip),
          lastActivity: new Date(session.lastActivity).toLocaleString('pt-BR'),
          userAgent: this.getUserAgentInfo(session.userAgent),
          sessionId: session.sessionId
        })),
        currentIP: this.maskIP(userIP)
      };
    }

    // Primeira sessão ou não há conflitos: Criar nova sessão
    const newSessionId = this.generateSessionId();
    const newSession = {
      sessionId: newSessionId,
      ip: userIP,
      userAgent: userAgent,
      createdAt: currentTime,
      lastActivity: currentTime,
      expiresAt: currentTime + (24 * 60 * 60 * 1000) // 24 horas
    };

    validSessions.push(newSession);
    this.activeSessions.set(sessionKey, validSessions);

    return {
      success: true,
      action: 'new_session_created',
      message: 'Nova sessão criada com sucesso',
      sessionId: newSessionId
    };
  }

  /**
   * Desloga sessões específicas ou todas as outras sessões
   * @param {number} userId - ID do usuário
   * @param {string} currentSessionId - ID da sessão atual (para manter)
   * @param {Array} sessionIdsToRemove - IDs das sessões para remover (opcional)
   * @returns {Object} - Resultado da operação
   */
  async logoutOtherSessions(userId, currentSessionId, sessionIdsToRemove = null) {
    const sessionKey = `user_${userId}`;
    const existingSessions = this.activeSessions.get(sessionKey) || [];
    
    let remainingSessions;
    let removedCount = 0;

    if (sessionIdsToRemove && sessionIdsToRemove.length > 0) {
      // Remover sessões específicas
      remainingSessions = existingSessions.filter(session => {
        if (sessionIdsToRemove.includes(session.sessionId)) {
          removedCount++;
          return false;
        }
        return true;
      });
    } else {
      // Remover todas as outras sessões, manter apenas a atual
      remainingSessions = existingSessions.filter(session => {
        if (session.sessionId !== currentSessionId) {
          removedCount++;
          return false;
        }
        return true;
      });
    }

    this.activeSessions.set(sessionKey, remainingSessions);

    return {
      success: true,
      message: `${removedCount} sessão(ões) encerrada(s) com sucesso`,
      removedCount
    };
  }

  /**
   * Valida se uma sessão está ativa
   * @param {number} userId - ID do usuário
   * @param {string} sessionId - ID da sessão
   * @returns {boolean} - Se a sessão é válida
   */
  isSessionValid(userId, sessionId) {
    const sessionKey = `user_${userId}`;
    const sessions = this.activeSessions.get(sessionKey) || [];
    
    const session = sessions.find(s => s.sessionId === sessionId);
    
    if (!session) return false;
    if (session.expiresAt <= Date.now()) return false;
    
    // Atualizar última atividade
    session.lastActivity = Date.now();
    
    return true;
  }

  /**
   * Lista todas as sessões ativas de um usuário
   * @param {number} userId - ID do usuário
   * @returns {Array} - Lista de sessões ativas
   */
  getUserSessions(userId) {
    const sessionKey = `user_${userId}`;
    const sessions = this.activeSessions.get(sessionKey) || [];
    const currentTime = Date.now();
    
    // Filtrar sessões válidas
    const validSessions = sessions.filter(session => 
      session.expiresAt > currentTime
    );

    return validSessions.map(session => ({
      sessionId: session.sessionId,
      ip: this.maskIP(session.ip),
      userAgent: this.getUserAgentInfo(session.userAgent),
      createdAt: new Date(session.createdAt).toLocaleString('pt-BR'),
      lastActivity: new Date(session.lastActivity).toLocaleString('pt-BR'),
      isActive: (currentTime - session.lastActivity) < (5 * 60 * 1000) // Ativo nos últimos 5 min
    }));
  }

  /**
   * Remove sessão específica (logout)
   * @param {number} userId - ID do usuário
   * @param {string} sessionId - ID da sessão
   */
  removeSession(userId, sessionId) {
    const sessionKey = `user_${userId}`;
    const sessions = this.activeSessions.get(sessionKey) || [];
    
    const filteredSessions = sessions.filter(session => 
      session.sessionId !== sessionId
    );
    
    this.activeSessions.set(sessionKey, filteredSessions);
  }

  /**
   * Limpa sessões expiradas
   */
  cleanupExpiredSessions() {
    const currentTime = Date.now();
    let totalCleaned = 0;

    for (const [sessionKey, sessions] of this.activeSessions.entries()) {
      const validSessions = sessions.filter(session => 
        session.expiresAt > currentTime
      );
      
      const cleanedCount = sessions.length - validSessions.length;
      totalCleaned += cleanedCount;
      
      if (validSessions.length === 0) {
        this.activeSessions.delete(sessionKey);
      } else {
        this.activeSessions.set(sessionKey, validSessions);
      }
    }

    if (totalCleaned > 0) {
      console.log(`🧹 Sessões limpas: ${totalCleaned} sessões expiradas removidas`);
    }
  }

  /**
   * Gera um ID único para a sessão
   * @returns {string} - ID da sessão
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Mascara o IP para exibição
   * @param {string} ip - IP original
   * @returns {string} - IP mascarado
   */
  maskIP(ip) {
    if (!ip) return 'IP desconhecido';
    
    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    
    // IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return `${parts[0]}:${parts[1]}:xxxx:xxxx`;
    }
    
    return 'IP mascarado';
  }

  /**
   * Extrai informações do User Agent
   * @param {string} userAgent - User Agent string
   * @returns {string} - Informações resumidas
   */
  getUserAgentInfo(userAgent) {
    if (!userAgent) return 'Navegador desconhecido';
    
    // Detectar navegador
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Outro navegador';
  }

  /**
   * Obtém estatísticas das sessões
   * @returns {Object} - Estatísticas
   */
  getStats() {
    let totalUsers = 0;
    let totalSessions = 0;
    let activeSessions = 0;
    const currentTime = Date.now();
    
    for (const [sessionKey, sessions] of this.activeSessions.entries()) {
      totalUsers++;
      
      const validSessions = sessions.filter(session => 
        session.expiresAt > currentTime
      );
      
      totalSessions += validSessions.length;
      
      activeSessions += validSessions.filter(session =>
        (currentTime - session.lastActivity) < (5 * 60 * 1000)
      ).length;
    }
    
    return {
      totalUsers,
      totalSessions,
      activeSessions,
      lastCleanup: new Date().toLocaleString('pt-BR')
    };
  }
}

// Instância global do gerenciador de sessões
const sessionManager = new SessionManager();

module.exports = sessionManager;
