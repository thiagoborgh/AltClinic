const multiTenantDb = require('../models/MultiTenantDatabase');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Inicializa o primeiro tenant e usuário admin em produção
 */
class ProductionInitializer {

  /**
   * Verifica se já existe algum tenant no sistema
   */
  static async hasExistingTenants() {
    try {
      const masterDb = multiTenantDb.getMasterDb();
      const row = await masterDb.get('SELECT COUNT(*) AS count FROM tenants');
      return parseInt(row?.count ?? 0, 10) > 0;
    } catch (error) {
      console.error('❌ Erro ao verificar tenants existentes:', error.message);
      return false;
    }
  }

  /**
   * Cria o primeiro tenant e usuário admin
   */
  static async createFirstAccess() {
    try {
      console.log('🚀 Iniciando configuração de primeiro acesso...');

      const masterDb = multiTenantDb.getMasterDb();

      const tenantId   = crypto.randomUUID();
      const tenantSlug = 'demo-clinic';
      const trialExpire = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      // Inserir tenant no banco master (PostgreSQL)
      await masterDb.run(
        `INSERT INTO tenants
          (id, slug, nome, email, plano, status, trial_expire_at, schema_name, config, billing, theme)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (slug) DO NOTHING`,
        [
          tenantId, tenantSlug, 'Clínica Demo', 'admin@clinica.com',
          'trial', 'active', trialExpire.toISOString(),
          `clinica_demo_clinic`,
          JSON.stringify({ maxUsuarios: 5, maxPacientes: 1000, whatsappEnabled: true }),
          JSON.stringify({ proximoVencimento: null, valor: 0 }),
          JSON.stringify({ primaryColor: '#1976d2' })
        ]
      );

      console.log('✅ Tenant inicial criado:', tenantSlug);

      // Provisionar schema do tenant via MultiTenantPostgres
      await multiTenantDb.createTenantSchema(tenantId, tenantSlug);
      console.log('✅ Schema do tenant criado');

      // Criar usuário admin no schema do tenant
      const tenantDb = multiTenantDb.getTenantDb(tenantId, tenantSlug);
      const hashedPassword = await bcrypt.hash('123456', 12);

      const adminRow = await tenantDb.run(
        `INSERT INTO usuarios (tenant_id, nome, email, senha_hash, role, status, email_verified_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [tenantId, 'Administrador', 'admin@clinica.com', hashedPassword, 'owner', 'active']
      );

      console.log('✅ Usuário admin criado com ID:', adminRow.lastID);

      // Criar entrada no master_users
      await masterDb.run(
        `INSERT INTO master_users (tenant_id, email, name, role, senha_hash)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email, tenant_id) DO NOTHING`,
        [tenantId, 'admin@clinica.com', 'Administrador', 'owner', hashedPassword]
      );

      console.log('✅ Entrada master_users criada');

      // Criar alguns dados de exemplo
      await this.createSampleData(tenantDb, tenantId);

      console.log('🎉 Primeiro acesso configurado com sucesso!');
      console.log('📧 Email: admin@clinica.com');
      console.log('🔑 Senha: 123456');
      console.log('🏢 Tenant: demo-clinic');

      return {
        tenantId,
        tenantSlug,
        adminEmail: 'admin@clinica.com',
        adminPassword: '123456'
      };

    } catch (error) {
      console.error('❌ Erro ao criar primeiro acesso:', error.message);
      throw error;
    }
  }

  /**
   * Cria dados de exemplo para demonstração
   */
  static async createSampleData(tenantDb, tenantId) {
    try {
      const services = [
        ['Limpeza de Pele',       'Limpeza profunda com extração',              60, 80.00],
        ['Peeling Químico',       'Renovação celular com ácidos',               45, 120.00],
        ['Hidratação Facial',     'Hidratação profunda da pele',                50, 90.00],
        ['Consulta Dermatológica','Avaliação e orientação dermatológica',        30, 150.00],
      ];

      for (const [nome, descricao, duracao, valor] of services) {
        await tenantDb.run(
          'INSERT INTO servicos (tenant_id, nome, descricao, duracao, valor) VALUES ($1,$2,$3,$4,$5)',
          [tenantId, nome, descricao, duracao, valor]
        );
      }

      console.log('✅ Serviços de exemplo criados');

      await tenantDb.run(
        'INSERT INTO pacientes (tenant_id, nome, email, telefone, observacoes) VALUES ($1,$2,$3,$4,$5)',
        [tenantId, 'Maria Silva', 'maria.silva@email.com', '(11) 99999-9999', 'Paciente exemplo']
      );

      console.log('✅ Paciente de exemplo criado');

    } catch (error) {
      console.error('⚠️ Erro ao criar dados de exemplo:', error.message);
    }
  }

  /**
   * Verifica e executa inicialização se necessário
   */
  static async checkAndInitialize() {
    try {
      if (process.env.NODE_ENV === 'production') {
        if (!(await this.hasExistingTenants())) {
          console.log('🔍 Nenhum tenant encontrado em produção. Criando primeiro acesso...');
          await this.createFirstAccess();
        } else {
          console.log('✅ Tenants já existem. Pulando inicialização.');
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação de inicialização:', error.message);
    }
  }
}

module.exports = ProductionInitializer;
