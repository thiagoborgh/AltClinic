const request = require('supertest');
const app = require('../app');

// Aumentar timeout para operações de criação/seed do tenant
jest.setTimeout(20000);

describe('Caminho feliz - Criar licença TRIAL', () => {
  it('deve criar uma licença trial e retornar dados esperados', async () => {
    const slug = 'trialtest' + Date.now();
    const res = await request(app)
      .post('/api/tenants/register')
      .send({
        clinicaNome: 'Clínica Teste Trial',
        slug,
        ownerNome: 'Dra. Teste',
        ownerEmail: `trial${Date.now()}@test.com`,
        ownerSenha: 'SenhaSegura123',
        telefone: '(11) 99999-0000',
        plano: 'trial'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('tenant');
    expect(res.body.tenant.status).toBe('trial');
    expect(res.body.tenant.nome).toBe('Clínica Teste Trial');
    expect(res.body.tenant.slug).toBe(slug);
    expect(res.body.owner.nome).toBe('Dra. Teste');
    expect(res.body.owner.email).toBeDefined();
    expect(res.body.emailSent).toBe(true);
    expect(res.body).toHaveProperty('loginInstructions');
    expect(res.body).toHaveProperty('onboarding');

    // Validar que o tenant foi criado no banco
    const multiTenantDb = require('../src/models/MultiTenantDatabase');
    const masterDb = multiTenantDb.getMasterDb();
    const tenantCheck = masterDb.prepare('SELECT id FROM tenants WHERE slug = ?').get(slug);
    expect(tenantCheck).toBeTruthy();
    expect(tenantCheck.id).toBe(res.body.tenant.id);

    console.log('✅ Licença trial criada com sucesso:', slug);
  });
});
