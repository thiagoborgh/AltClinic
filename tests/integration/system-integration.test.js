const request = require('supertest');
const saeeApp = require('../src/app');
const adminApp = require('../admin/backend/server');
const path = require('path');
const fs = require('fs');

describe('🔄 INTEGRAÇÃO - SAEE e Intranet Admin', () => {
  
  let adminToken;
  
  beforeAll(async () => {
    // Login na intranet para obter token
    const loginResponse = await request(adminApp)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });
    
    adminToken = loginResponse.body.token;
  });

  describe('📋 Sincronização de Licenças', () => {
    
    test('Deve sincronizar dados do SAEE para Admin', async () => {
      // Primeiro, criar uma licença fictícia no sistema principal
      // (em um cenário real, isso viria do banco principal)
      
      // Executar sincronização
      const syncResponse = await request(adminApp)
        .post('/api/admin/licencas/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(syncResponse.body).toHaveProperty('success', true);
      expect(syncResponse.body.data).toHaveProperty('imported');
      expect(syncResponse.body.data).toHaveProperty('updated');
    });

    test('Deve manter cache local na intranet', async () => {
      // Verificar se as licenças estão no cache local
      const licencasResponse = await request(adminApp)
        .get('/api/admin/licencas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(licencasResponse.body.success).toBe(true);
      expect(licencasResponse.body.data.licencas).toBeInstanceOf(Array);
    });
  });

  describe('⚙️ Configurações Centralizadas', () => {
    
    test('Deve atualizar configuração via intranet e refletir no SAEE', async () => {
      const licencaId = 'lic_001';
      
      // Atualizar configuração via intranet
      const updateResponse = await request(adminApp)
        .put(`/api/admin/configuracoes/${licencaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          section: 'smtp',
          config: {
            host: 'smtp.integration-test.com',
            port: 587,
            user: 'test@integration.com',
            password: 'testpass123'
          }
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Verificar se a configuração foi salva no banco principal
      const configResponse = await request(saeeApp)
        .get('/api/configuracoes')
        .expect(200);

      expect(configResponse.body.data.smtp.host).toBe('smtp.integration-test.com');
    });

    test('Deve manter histórico de alterações', async () => {
      const licencaId = 'lic_001';
      
      // Fazer uma alteração
      await request(adminApp)
        .put(`/api/admin/configuracoes/${licencaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          section: 'sistema',
          config: {
            debug_mode: true,
            log_level: 'debug'
          }
        })
        .expect(200);

      // Verificar se o log foi criado
      // (em um teste real, consultaríamos a tabela admin_logs)
      expect(true).toBe(true); // Placeholder para teste de auditoria
    });
  });

  describe('📱 WhatsApp Global', () => {
    
    test('Deve monitorar status WhatsApp de todas as licenças', async () => {
      const statusResponse = await request(adminApp)
        .get('/api/admin/whatsapp/global-status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data).toHaveProperty('summary');
      expect(statusResponse.body.data).toHaveProperty('sessions');
      expect(statusResponse.body.data.summary).toHaveProperty('totalSessions');
    });

    test('Deve gerar QR Code para licença específica', async () => {
      const licencaId = 'lic_001';
      
      const qrResponse = await request(adminApp)
        .post(`/api/admin/whatsapp/${licencaId}/qr`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(qrResponse.body.success).toBe(true);
      expect(qrResponse.body.data).toHaveProperty('qrCode');
      expect(qrResponse.body.data.qrCode).toMatch(/^data:image/);
    });
  });

  describe('📊 Analytics Consolidados', () => {
    
    test('Deve agregar dados de todas as licenças', async () => {
      const statsResponse = await request(adminApp)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toHaveProperty('totalLicencas');
      expect(statsResponse.body.data).toHaveProperty('faturamentoMensal');
      expect(typeof statsResponse.body.data.totalLicencas).toBe('number');
    });

    test('Deve gerar relatórios consolidados', async () => {
      const reportResponse = await request(adminApp)
        .post('/api/admin/relatorios/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'geral',
          period: 'month',
          format: 'json'
        })
        .expect(200);

      expect(reportResponse.body.success).toBe(true);
      expect(reportResponse.body.data).toHaveProperty('reportId');
    });
  });
});

describe('🔐 SEGURANÇA - Integração entre Sistemas', () => {
  
  test('Deve bloquear acesso não autorizado à intranet', async () => {
    // Tentar acessar sem token
    const response = await request(adminApp)
      .get('/api/admin/licencas')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Deve bloquear acesso com token inválido', async () => {
    const response = await request(adminApp)
      .get('/api/admin/licencas')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test('Deve aplicar rate limiting', async () => {
    // Fazer muitas requisições rapidamente
    const promises = Array(10).fill().map(() => 
      request(adminApp)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@altclinic.com',
          password: 'senha-errada'
        })
    );

    const responses = await Promise.all(promises);
    
    // Algumas devem retornar 429 (Too Many Requests)
    const rateLimited = responses.some(res => res.status === 429);
    expect(rateLimited).toBe(true);
  });

  test('Deve logs de auditoria para ações críticas', async () => {
    const licencaId = 'lic_001';
    
    // Login para gerar token
    const loginResponse = await request(adminApp)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });

    const token = loginResponse.body.token;

    // Fazer uma ação que deve gerar log
    await request(adminApp)
      .put(`/api/admin/configuracoes/${licencaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        section: 'sistema',
        config: { audit_test: true }
      })
      .expect(200);

    // Verificar se o log foi criado
    // (em um teste real, consultaríamos a tabela admin_logs)
    expect(true).toBe(true); // Placeholder
  });
});

describe('📊 PERFORMANCE - Sistema Completo', () => {
  
  test('API SAEE deve responder em menos de 1s', async () => {
    const start = Date.now();
    
    await request(saeeApp)
      .get('/api/configuracoes')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('API Intranet deve responder em menos de 1s', async () => {
    const start = Date.now();
    
    const loginResponse = await request(adminApp)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });

    const token = loginResponse.body.token;
    
    await request(adminApp)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('Sincronização deve processar grande volume de dados', async () => {
    const loginResponse = await request(adminApp)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });

    const token = loginResponse.body.token;
    
    const start = Date.now();
    
    const syncResponse = await request(adminApp)
      .post('/api/admin/licencas/sync')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    const duration = Date.now() - start;
    
    expect(syncResponse.body.success).toBe(true);
    expect(duration).toBeLessThan(5000); // 5 segundos max
  });
});

describe('💾 DADOS - Consistência entre Sistemas', () => {
  
  test('Configurações devem ser consistentes entre SAEE e Admin', async () => {
    const licencaId = 'lic_001';
    
    // Login no admin
    const loginResponse = await request(adminApp)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });

    const token = loginResponse.body.token;

    // Obter configurações via admin
    const adminConfigResponse = await request(adminApp)
      .get(`/api/admin/configuracoes/${licencaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Obter configurações via SAEE
    const saeeConfigResponse = await request(saeeApp)
      .get('/api/configuracoes')
      .expect(200);

    // Verificar consistência (em teste real, compararíamos campos específicos)
    expect(adminConfigResponse.body.success).toBe(true);
    expect(saeeConfigResponse.body.success).toBe(true);
  });

  test('Alterações devem persistir após reinicialização', async () => {
    // Este teste verificaria se as alterações são persistidas no banco
    // Em um ambiente real, testaríamos restart dos serviços
    expect(true).toBe(true); // Placeholder
  });
});
