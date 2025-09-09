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
    expect(res.body.owner.nome).toBe('Dra. Teste');
    expect(res.body.auth).toHaveProperty('token');

    // Validar seed inicial
    const tenantId = res.body.tenant.id;
    const token = res.body.auth.token;
    // Consulta rápida de status
    const statusRes = await request(app)
      .get(`/api/t/${slug}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.stats.usuarios).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.stats.pacientes).toBeGreaterThanOrEqual(3);
    expect(statusRes.body.stats.agendamentosHoje).toBeGreaterThanOrEqual(0);
  });
});
