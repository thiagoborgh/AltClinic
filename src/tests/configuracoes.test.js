const request = require('supertest');
const path = require('path');

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(__dirname, '..', 'test.db');

const app = require('../src/app');

describe('API de Configurações', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Criar usuário de teste e fazer login
    const userData = {
      email: 'admin@teste.com',
      password: 'senha123',
      nome: 'Admin Teste',
      tipo: 'admin'
    };

    // Registrar usuário
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Fazer login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    authToken = loginResponse.body.token;
    testUser = loginResponse.body.user;
  });

  describe('GET /api/configuracoes', () => {
    test('deve retornar configurações padrão', async () => {
      const response = await request(app)
        .get('/api/configuracoes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('integracoes');
      expect(response.body).toHaveProperty('clinica');
      expect(response.body).toHaveProperty('templates');
      expect(response.body).toHaveProperty('seguranca');

      // Verificar estrutura das integrações
      expect(response.body.integracoes).toHaveProperty('whatsapp');
      expect(response.body.integracoes).toHaveProperty('pix');
      expect(response.body.integracoes).toHaveProperty('gemini');
      expect(response.body.integracoes).toHaveProperty('mailchimp');
    });

    test('deve retornar erro 401 sem autenticação', async () => {
      await request(app)
        .get('/api/configuracoes')
        .expect(401);
    });
  });

  describe('POST /api/configuracoes', () => {
    test('deve salvar configurações com sucesso', async () => {
      const configuracoes = {
        clinica: {
          informacoes: {
            nome: 'Clínica Teste',
            cnpj: '12345678000100',
            email: 'contato@clinicateste.com',
            telefone: '11999999999'
          }
        },
        integracoes: {
          whatsapp: {
            token: 'test_token_123',
            phone_number_id: '123456789',
            ativo: true
          }
        }
      };

      const response = await request(app)
        .post('/api/configuracoes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(configuracoes)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sucesso');
    });

    test('deve retornar erro para dados inválidos', async () => {
      const configuracoes = {
        clinica: {
          informacoes: {
            email: 'email-invalido' // Email inválido
          }
        }
      };

      const response = await request(app)
        .post('/api/configuracoes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(configuracoes)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/configuracoes/testar/:tipo', () => {
    test('deve testar integração WhatsApp', async () => {
      const dadosWhatsApp = {
        token: 'test_token',
        phone_number_id: '123456789'
      };

      const response = await request(app)
        .post('/api/configuracoes/testar/whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosWhatsApp)
        .expect(200);

      expect(response.body).toHaveProperty('sucesso');
      expect(response.body).toHaveProperty('mensagem');
    });

    test('deve testar PIX', async () => {
      const dadosPix = {
        chave: 'test@email.com',
        tipo_chave: 'email',
        titular: 'Teste Silva',
        banco: 'Banco Teste'
      };

      const response = await request(app)
        .post('/api/configuracoes/testar/pix')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosPix)
        .expect(200);

      expect(response.body).toHaveProperty('sucesso');
      expect(response.body).toHaveProperty('codigo');
    });

    test('deve retornar erro para tipo inválido', async () => {
      await request(app)
        .post('/api/configuracoes/testar/tipo_invalido')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/configuracoes/whatsapp/qr', () => {
    test('deve gerar QR Code', async () => {
      const response = await request(app)
        .post('/api/configuracoes/whatsapp/qr')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.qrCode).toMatch(/^data:image/);
    });
  });

  describe('GET /api/configuracoes/backup/status', () => {
    test('deve retornar status do backup', async () => {
      const response = await request(app)
        .get('/api/configuracoes/backup/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ultimo');
      expect(response.body).toHaveProperty('proximo');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('tamanho');
    });
  });

  describe('POST /api/configuracoes/backup/manual', () => {
    test('deve iniciar backup manual', async () => {
      const response = await request(app)
        .post('/api/configuracoes/backup/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('backup');
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    // (implementar limpeza se necessário)
  });
});

describe('Utilitários de Auditoria', () => {
  const { mascararDados, validarConfiguracoes } = require('../src/utils/auditoria');

  describe('mascararDados', () => {
    test('deve mascarar email corretamente', () => {
      const email = 'usuario@exemplo.com';
      const mascarado = mascararDados(email, 'email');
      expect(mascarado).toBe('u***@exemplo.com');
    });

    test('deve mascarar telefone corretamente', () => {
      const telefone = '11987654321';
      const mascarado = mascararDados(telefone, 'telefone');
      expect(mascarado).toBe('(11) 98765-****');
    });

    test('deve mascarar CPF corretamente', () => {
      const cpf = '12345678901';
      const mascarado = mascararDados(cpf, 'cpf');
      expect(mascarado).toBe('123.***. 901-**');
    });

    test('deve mascarar token corretamente', () => {
      const token = 'abcdefghijklmnop';
      const mascarado = mascararDados(token, 'token');
      expect(mascarado).toBe('abcd***mnop');
    });
  });

  describe('validarConfiguracoes', () => {
    test('deve validar configurações válidas', () => {
      const config = {
        clinica: {
          informacoes: {
            email: 'contato@clinica.com',
            telefone: '11999999999',
            cnpj: '12345678000100'
          }
        },
        integracoes: {
          pix: {
            chave: 'contato@clinica.com',
            tipo_chave: 'email'
          }
        }
      };

      const erros = validarConfiguracoes(config);
      expect(erros).toHaveLength(0);
    });

    test('deve detectar email inválido', () => {
      const config = {
        clinica: {
          informacoes: {
            email: 'email-invalido'
          }
        }
      };

      const erros = validarConfiguracoes(config);
      expect(erros).toContain('Formato de email inválido nas informações da clínica');
    });

    test('deve detectar PIX inválido', () => {
      const config = {
        integracoes: {
          pix: {
            chave: 'cpf-invalido',
            tipo_chave: 'cpf'
          }
        }
      };

      const erros = validarConfiguracoes(config);
      expect(erros).toContain('Formato de CPF inválido para chave PIX');
    });

    test('deve detectar horários inválidos', () => {
      const config = {
        clinica: {
          horarios: {
            funcionamento: {
              segunda: {
                ativo: true,
                inicio: '18:00',
                fim: '08:00' // Fim antes do início
              }
            }
          }
        }
      };

      const erros = validarConfiguracoes(config);
      expect(erros).toContain('Horário de início deve ser menor que o fim em segunda');
    });
  });
});
