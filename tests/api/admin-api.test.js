const request = require('supertest');
const app = require('../../admin/backend/server');

describe('🏢 INTRANET ADMIN - Autenticação', () => {
  
  describe('POST /api/admin/auth/login', () => {
    test('Deve fazer login com credenciais corretas', async () => {
      const credentials = {
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      };

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', credentials.email);
    });

    test('Deve rejeitar credenciais inválidas', async () => {
      const credentials = {
        email: 'admin@altclinic.com',
        password: 'senha-errada'
      };

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('Deve validar formato de email', async () => {
      const credentials = {
        email: 'email-invalido',
        password: 'Admin123!'
      };

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/auth/me', () => {
    let token;

    beforeAll(async () => {
      // Fazer login para obter token
      const loginResponse = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: 'admin@altclinic.com',
          password: 'Admin123!'
        });
      
      token = loginResponse.body.token;
    });

    test('Deve retornar dados do usuário logado', async () => {
      const response = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('role');
    });

    test('Deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

describe('🏢 INTRANET ADMIN - Licenças', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });
    
    token = loginResponse.body.token;
  });

  describe('GET /api/admin/licencas', () => {
    test('Deve retornar lista de licenças', async () => {
      const response = await request(app)
        .get('/api/admin/licencas')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('licencas');
      expect(response.body.data.licencas).toBeInstanceOf(Array);
    });

    test('Deve suportar paginação', async () => {
      const response = await request(app)
        .get('/api/admin/licencas?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    test('Deve suportar busca', async () => {
      const response = await request(app)
        .get('/api/admin/licencas?search=clinica')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/admin/licencas', () => {
    test('Deve criar nova licença', async () => {
      const novaLicenca = {
        id: 'lic_test_001',
        nome_clinica: 'Clínica Teste',
        email: 'teste@clinicateste.com',
        plano: 'basic',
        data_inicio: '2025-09-01',
        data_vencimento: '2026-09-01',
        valor_mensal: 199.90
      };

      const response = await request(app)
        .post('/api/admin/licencas')
        .set('Authorization', `Bearer ${token}`)
        .send(novaLicenca)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', novaLicenca.id);
    });

    test('Deve validar dados obrigatórios', async () => {
      const licencaInvalida = {
        // id obrigatório ausente
        nome_clinica: 'Clínica Teste'
      };

      const response = await request(app)
        .post('/api/admin/licencas')
        .set('Authorization', `Bearer ${token}`)
        .send(licencaInvalida)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

describe('🏢 INTRANET ADMIN - Dashboard', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });
    
    token = loginResponse.body.token;
  });

  describe('GET /api/admin/dashboard/stats', () => {
    test('Deve retornar estatísticas gerais', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalLicencas');
      expect(response.body.data).toHaveProperty('licencasAtivas');
      expect(response.body.data).toHaveProperty('faturamentoMensal');
      expect(typeof response.body.data.totalLicencas).toBe('number');
    });
  });

  describe('GET /api/admin/dashboard/alerts', () => {
    test('Deve retornar alertas do sistema', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/alerts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data.alerts).toBeInstanceOf(Array);
    });
  });
});

describe('🏢 INTRANET ADMIN - Configurações', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });
    
    token = loginResponse.body.token;
  });

  describe('GET /api/admin/configuracoes/:licencaId', () => {
    test('Deve retornar configurações de uma licença', async () => {
      const licencaId = 'lic_001';
      
      const response = await request(app)
        .get(`/api/admin/configuracoes/${licencaId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('licencaId', licencaId);
      expect(response.body.data).toHaveProperty('configuracoes');
    });
  });

  describe('PUT /api/admin/configuracoes/:licencaId', () => {
    test('Deve atualizar configurações de uma licença', async () => {
      const licencaId = 'lic_001';
      const novaConfig = {
        section: 'smtp',
        config: {
          host: 'smtp.updated.com',
          port: 587,
          user: 'updated@test.com',
          password: 'newpass'
        }
      };

      const response = await request(app)
        .put(`/api/admin/configuracoes/${licencaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(novaConfig)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});

describe('🏢 INTRANET ADMIN - WhatsApp', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@altclinic.com',
        password: 'Admin123!'
      });
    
    token = loginResponse.body.token;
  });

  describe('GET /api/admin/whatsapp/global-status', () => {
    test('Deve retornar status global do WhatsApp', async () => {
      const response = await request(app)
        .get('/api/admin/whatsapp/global-status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('sessions');
    });
  });

  describe('POST /api/admin/whatsapp/:licencaId/qr', () => {
    test('Deve gerar QR Code para licença específica', async () => {
      const licencaId = 'lic_001';
      
      const response = await request(app)
        .post(`/api/admin/whatsapp/${licencaId}/qr`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('qrCode');
    });
  });
});
