const SessionManager = require('../../src/middleware/sessionManager');

describe('🔐 Sistema Inteligente de Sessões', () => {
  let sessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    // Limpar todas as sessões após cada teste
    sessionManager.sessions.clear();
    sessionManager.userSessions.clear();
    sessionManager.ipSessions.clear();
  });

  describe('✅ Acesso Ilimitado - Mesmo IP', () => {
    test('Deve permitir múltiplas sessões no mesmo IP automaticamente', () => {
      const userId = 'user123';
      const ip = '192.168.1.100';
      const deviceInfo1 = { userAgent: 'Chrome 118', browser: 'Chrome' };
      const deviceInfo2 = { userAgent: 'Firefox 119', browser: 'Firefox' };

      // Primeira sessão no IP
      const session1 = sessionManager.createOrCheckSession(userId, ip, deviceInfo1);
      expect(session1.status).toBe('success');
      expect(session1.sessionId).toBeDefined();

      // Segunda sessão no MESMO IP - deve permitir automaticamente
      const session2 = sessionManager.createOrCheckSession(userId, ip, deviceInfo2);
      expect(session2.status).toBe('success');
      expect(session2.sessionId).toBeDefined();
      expect(session2.sessionId).not.toBe(session1.sessionId);

      // Verificar que ambas as sessões estão ativas
      const userSessions = sessionManager.getUserSessions(userId);
      expect(userSessions).toHaveLength(2);
    });

    test('Deve reconhecer "queda de internet" como mesmo IP', () => {
      const userId = 'user123';
      const ip = '192.168.1.100';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      // Primeira sessão (antes da queda)
      const session1 = sessionManager.createOrCheckSession(userId, ip, deviceInfo);
      expect(session1.status).toBe('success');

      // Simular "queda de internet" - mesmo IP, mesmo device
      const session2 = sessionManager.createOrCheckSession(userId, ip, deviceInfo);
      expect(session2.status).toBe('success');
      expect(session2.message).toContain('Mesmo IP detectado');
    });
  });

  describe('🤔 Conflito de IP - Opções Inteligentes', () => {
    test('Deve detectar conflito quando IPs são diferentes', () => {
      const userId = 'user123';
      const ip1 = '192.168.1.100'; // Casa
      const ip2 = '177.123.45.67'; // Celular 4G
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      // Primeira sessão em casa
      const session1 = sessionManager.createOrCheckSession(userId, ip1, deviceInfo);
      expect(session1.status).toBe('success');

      // Tentar segunda sessão no celular - deve detectar conflito
      const session2 = sessionManager.createOrCheckSession(userId, ip2, deviceInfo);
      expect(session2.status).toBe('conflict');
      expect(session2.requireConfirmation).toBe(true);
      expect(session2.existingSessions).toHaveLength(1);
      expect(session2.existingSessions[0].ip).toBe('192.168.xxx.xxx'); // IP mascarado
    });

    test('Deve fornecer opções de resolução de conflito', () => {
      const userId = 'user123';
      const ip1 = '192.168.1.100';
      const ip2 = '177.123.45.67';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      // Criar sessão inicial
      sessionManager.createOrCheckSession(userId, ip1, deviceInfo);

      // Detectar conflito
      const conflictResult = sessionManager.createOrCheckSession(userId, ip2, deviceInfo);
      
      expect(conflictResult.options).toEqual([
        'login_anyway',
        'logout_specific',
        'logout_all_others'
      ]);
    });
  });

  describe('🎯 Sempre Permite Login', () => {
    test('Nunca deve bloquear o usuário - sempre oferece opções', () => {
      const userId = 'user123';
      const ips = ['192.168.1.100', '177.123.45.67', '10.0.0.1', '203.45.67.89'];
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      for (let i = 0; i < ips.length; i++) {
        const result = sessionManager.createOrCheckSession(userId, ips[i], deviceInfo);
        
        // Mesmo com múltiplos IPs, nunca deve haver bloqueio total
        expect(result.status).toMatch(/^(success|conflict)$/);
        expect(result.status).not.toBe('blocked');
        expect(result.status).not.toBe('denied');
      }
    });

    test('Deve permitir login forçado removendo sessões específicas', () => {
      const userId = 'user123';
      const ip1 = '192.168.1.100';
      const ip2 = '177.123.45.67';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      // Criar primeira sessão
      const session1 = sessionManager.createOrCheckSession(userId, ip1, deviceInfo);
      const sessionId1 = session1.sessionId;

      // Forçar login removendo sessão específica
      const forceResult = sessionManager.createSessionWithForce(
        userId, 
        ip2, 
        deviceInfo, 
        [sessionId1]
      );

      expect(forceResult.status).toBe('success');
      expect(sessionManager.isSessionActive(sessionId1)).toBe(false);
      expect(sessionManager.getUserSessions(userId)).toHaveLength(1);
    });

    test('Deve permitir login mantendo todas as sessões existentes', () => {
      const userId = 'user123';
      const ip1 = '192.168.1.100';
      const ip2 = '177.123.45.67';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      // Criar primeira sessão
      sessionManager.createOrCheckSession(userId, ip1, deviceInfo);

      // Login forçado sem remover outras sessões
      const forceResult = sessionManager.createSessionWithForce(
        userId, 
        ip2, 
        deviceInfo, 
        [] // Não remove nenhuma sessão
      );

      expect(forceResult.status).toBe('success');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(2);
    });
  });

  describe('🛡️ Segurança e Privacidade', () => {
    test('Deve mascarar IPs para privacidade', () => {
      const userId = 'user123';
      const ip = '192.168.1.100';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      sessionManager.createOrCheckSession(userId, ip, deviceInfo);
      
      const sessions = sessionManager.getUserSessions(userId);
      expect(sessions[0].ip).toBe('192.168.xxx.xxx');
      expect(sessions[0].ip).not.toBe('192.168.1.100');
    });

    test('Deve detectar diferentes tipos de dispositivos', () => {
      const userId = 'user123';
      const ip = '192.168.1.100';
      
      const devices = [
        { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0', browser: 'Chrome' },
        { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', browser: 'Safari' },
        { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/119.0', browser: 'Firefox' }
      ];

      devices.forEach(device => {
        const result = sessionManager.createOrCheckSession(userId, ip, device);
        expect(result.status).toBe('success');
      });

      const sessions = sessionManager.getUserSessions(userId);
      expect(sessions).toHaveLength(3);
      expect(sessions.map(s => s.browser)).toEqual(['Chrome', 'Safari', 'Firefox']);
    });

    test('Deve limpar sessões expiradas automaticamente', () => {
      const userId = 'user123';
      const ip = '192.168.1.100';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      // Criar sessão
      const session = sessionManager.createOrCheckSession(userId, ip, deviceInfo);
      const sessionId = session.sessionId;

      // Simular expiração manualmente
      const sessionData = sessionManager.sessions.get(sessionId);
      sessionData.expiresAt = Date.now() - 1000; // Expirou há 1 segundo

      // Executar limpeza
      sessionManager.cleanupExpiredSessions();

      // Verificar se foi removida
      expect(sessionManager.isSessionActive(sessionId)).toBe(false);
    });
  });

  describe('📊 Monitoramento e Estatísticas', () => {
    test('Deve fornecer estatísticas de sessões', () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const ip = '192.168.1.100';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      // Criar algumas sessões
      sessionManager.createOrCheckSession(userId1, ip, deviceInfo);
      sessionManager.createOrCheckSession(userId2, ip, deviceInfo);

      const stats = sessionManager.getSessionStats();
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.uniqueIPs).toBe(1);
      expect(stats.activeSessions).toBe(2);
    });

    test('Deve rastrear última atividade das sessões', () => {
      const userId = 'user123';
      const ip = '192.168.1.100';
      const deviceInfo = { userAgent: 'Chrome 118', browser: 'Chrome' };

      const session = sessionManager.createOrCheckSession(userId, ip, deviceInfo);
      const sessionId = session.sessionId;

      const initialActivity = sessionManager.sessions.get(sessionId).lastActivity;
      
      // Simular atividade após algum tempo
      setTimeout(() => {
        sessionManager.updateSessionActivity(sessionId);
        const updatedActivity = sessionManager.sessions.get(sessionId).lastActivity;
        expect(updatedActivity).toBeGreaterThan(initialActivity);
      }, 10);
    });
  });

  describe('🎉 Cenários do Mundo Real', () => {
    test('Cenário: Usuário em casa + celular no 4G', () => {
      const userId = 'joao123';
      const ipCasa = '192.168.0.50';
      const ipCelular = '177.45.123.89';
      
      // Login em casa no computador
      const sessaoCasa = sessionManager.createOrCheckSession(
        userId, 
        ipCasa, 
        { userAgent: 'Chrome/118 Desktop', browser: 'Chrome' }
      );
      expect(sessaoCasa.status).toBe('success');

      // Tentativa de login no celular (4G)
      const tentativaCelular = sessionManager.createOrCheckSession(
        userId, 
        ipCelular, 
        { userAgent: 'Safari/17 Mobile', browser: 'Safari' }
      );
      
      expect(tentativaCelular.status).toBe('conflict');
      expect(tentativaCelular.requireConfirmation).toBe(true);
      expect(tentativaCelular.message).toContain('Sessão ativa detectada em outro IP');

      // Usuário escolhe "manter ambas"
      const loginForcado = sessionManager.createSessionWithForce(
        userId, 
        ipCelular, 
        { userAgent: 'Safari/17 Mobile', browser: 'Safari' },
        [] // Não remove nenhuma sessão
      );

      expect(loginForcado.status).toBe('success');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(2);
    });

    test('Cenário: Queda de internet e reconexão', () => {
      const userId = 'maria456';
      const ip = '192.168.1.200';
      const deviceInfo = { userAgent: 'Firefox/119', browser: 'Firefox' };

      // Login inicial
      const loginInicial = sessionManager.createOrCheckSession(userId, ip, deviceInfo);
      expect(loginInicial.status).toBe('success');

      // Simular "queda de internet" - mesmo IP e device
      const reconexao = sessionManager.createOrCheckSession(userId, ip, deviceInfo);
      expect(reconexao.status).toBe('success');
      expect(reconexao.message).toContain('Mesmo IP detectado');
    });

    test('Cenário: Funcionário troca de computador na empresa', () => {
      const userId = 'funcionario789';
      const ipEmpresa = '10.0.1.100'; // Mesmo IP da empresa
      
      // Login no computador 1
      const pc1 = sessionManager.createOrCheckSession(
        userId, 
        ipEmpresa, 
        { userAgent: 'Chrome/118 Windows', browser: 'Chrome' }
      );
      expect(pc1.status).toBe('success');

      // Login no computador 2 (mesmo IP da empresa)
      const pc2 = sessionManager.createOrCheckSession(
        userId, 
        ipEmpresa, 
        { userAgent: 'Edge/118 Windows', browser: 'Edge' }
      );
      
      // Deve permitir automaticamente (mesmo IP)
      expect(pc2.status).toBe('success');
      expect(sessionManager.getUserSessions(userId)).toHaveLength(2);
    });
  });
});
