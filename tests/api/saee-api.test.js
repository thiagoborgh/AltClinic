const request = require('supertest');
const app = require('../../src/app');

describe('🔧 API SAEE - Configurações', () => {
  
  describe('GET /api/configuracoes', () => {
    test('Deve retornar configurações básicas', async () => {
      const response = await request(app)
        .get('/api/configuracoes')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Object);
    });

    test('Deve incluir configurações obrigatórias', async () => {
      const response = await request(app)
        .get('/api/configuracoes')
        .expect(200);

      const configs = response.body.data;
      
      // Verificar se tem as seções principais
      expect(configs).toHaveProperty('smtp');
      expect(configs).toHaveProperty('whatsapp');
      expect(configs).toHaveProperty('sistema');
    });
  });

  describe('PUT /api/configuracoes', () => {
    test('Deve atualizar configuração SMTP', async () => {
      const smtpConfig = {
        section: 'smtp',
        config: {
          host: 'smtp.test.com',
          port: 587,
          user: 'test@test.com',
          password: 'testpass',
          secure: false
        }
      };

      const response = await request(app)
        .put('/api/configuracoes')
        .send(smtpConfig)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    test('Deve validar dados obrigatórios', async () => {
      const invalidConfig = {
        section: 'smtp',
        config: {
          // host obrigatório ausente
          port: 587
        }
      };

      const response = await request(app)
        .put('/api/configuracoes')
        .send(invalidConfig)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/configuracoes/sections', () => {
    test('Deve retornar todas as seções disponíveis', async () => {
      const response = await request(app)
        .get('/api/configuracoes/sections')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.sections).toBeInstanceOf(Array);
      expect(response.body.data.sections.length).toBeGreaterThan(0);
    });

    test('Seções devem ter estrutura correta', async () => {
      const response = await request(app)
        .get('/api/configuracoes/sections')
        .expect(200);

      const sections = response.body.data.sections;
      
      sections.forEach(section => {
        expect(section).toHaveProperty('key');
        expect(section).toHaveProperty('name');
        expect(section).toHaveProperty('description');
        expect(section).toHaveProperty('icon');
      });
    });
  });
});

describe('📱 API SAEE - WhatsApp', () => {
  
  describe('POST /api/whatsapp/qr', () => {
    test('Deve gerar QR Code', async () => {
      const response = await request(app)
        .post('/api/whatsapp/qr')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('qrCode');
      expect(response.body.data.qrCode).toMatch(/^data:image/);
    });
  });

  describe('GET /api/whatsapp/status', () => {
    test('Deve retornar status da conexão', async () => {
      const response = await request(app)
        .get('/api/whatsapp/status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('connected');
      expect(typeof response.body.data.connected).toBe('boolean');
    });
  });
});

describe('👥 API SAEE - Pacientes', () => {
  
  describe('GET /api/pacientes', () => {
    test('Deve retornar lista de pacientes', async () => {
      const response = await request(app)
        .get('/api/pacientes')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Deve suportar busca por nome', async () => {
      const response = await request(app)
        .get('/api/pacientes?search=test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/pacientes', () => {
    test('Deve criar novo paciente', async () => {
      const novoPaciente = {
        nome: 'Paciente Teste',
        email: 'teste@teste.com',
        telefone: '11999999999',
        cpf: '12345678901'
      };

      const response = await request(app)
        .post('/api/pacientes')
        .send(novoPaciente)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
    });

    test('Deve validar CPF', async () => {
      const pacienteInvalido = {
        nome: 'Paciente Teste',
        email: 'teste@teste.com',
        telefone: '11999999999',
        cpf: 'cpf-invalido'
      };

      const response = await request(app)
        .post('/api/pacientes')
        .send(pacienteInvalido)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

describe('📅 API SAEE - Agendamentos', () => {
  
  describe('GET /api/agendamentos', () => {
    test('Deve retornar agendamentos do dia', async () => {
      const response = await request(app)
        .get('/api/agendamentos')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Deve filtrar por data', async () => {
      const data = '2025-09-03';
      const response = await request(app)
        .get(`/api/agendamentos?data=${data}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/agendamentos', () => {
    test('Deve criar novo agendamento', async () => {
      const novoAgendamento = {
        paciente_id: 1,
        data: '2025-09-03',
        horario: '10:00',
        tipo: 'consulta',
        observacoes: 'Consulta de rotina'
      };

      const response = await request(app)
        .post('/api/agendamentos')
        .send(novoAgendamento)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
    });
  });
});
