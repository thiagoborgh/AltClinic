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
  static hasExistingTenants() {
    try {
      const masterDb = multiTenantDb.getMasterDb();
      const tenantCount = masterDb.prepare('SELECT COUNT(*) as count FROM tenants').get();
      return tenantCount.count > 0;
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
      
      // Configurações do tenant inicial
      const tenantData = {
        id: crypto.randomUUID(),
        slug: 'demo-clinic',
        nome: 'Clínica Demo',
        email: 'admin@clinica.com',
        telefone: null,
        plano: 'trial',
        status: 'active',
        trial_expire_at: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)), // 15 dias
        database_name: `tenant_demo-clinic_${Date.now()}`,
        config: JSON.stringify({
          maxUsuarios: 5,
          maxPacientes: 1000,
          whatsappEnabled: true,
          telemedicina: false,
          customBranding: false,
          apiAccess: false
        }),
        billing: JSON.stringify({
          proximoVencimento: null,
          valor: 0,
          customerId: null,
          subscriptionId: null
        }),
        theme: JSON.stringify({
          primaryColor: '#1976d2',
          logo: null,
          favicon: null,
          customDomain: null
        })
      };

      // Inserir tenant no banco master
      const insertTenant = masterDb.prepare(`
        INSERT INTO tenants (
          id, slug, nome, email, telefone, plano, status, trial_expire_at,
          database_name, config, billing, theme, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      insertTenant.run(
        tenantData.id,
        tenantData.slug,
        tenantData.nome,
        tenantData.email,
        tenantData.telefone,
        tenantData.plano,
        tenantData.status,
        tenantData.trial_expire_at.toISOString(),
        tenantData.database_name,
        tenantData.config,
        tenantData.billing,
        tenantData.theme
      );

      console.log('✅ Tenant inicial criado:', tenantData.slug);

      // Criar banco do tenant
      const tenantDb = multiTenantDb.getTenantDb(tenantData.id);

      // Schema do tenant
      const schema = `
        -- Usuários do tenant
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT NOT NULL DEFAULT '${tenantData.id}',
          nome TEXT NOT NULL,
          email TEXT NOT NULL,
          senha_hash TEXT,
          role TEXT DEFAULT 'medico',
          permissions TEXT DEFAULT '{}',
          avatar TEXT,
          telefone TEXT,
          crm TEXT,
          especialidade TEXT,
          status TEXT DEFAULT 'active',
          last_login DATETIME,
          email_verified_at DATETIME,
          invite_token TEXT,
          invite_expire_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(email)
        );

        -- Pacientes
        CREATE TABLE IF NOT EXISTS pacientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT NOT NULL DEFAULT '${tenantData.id}',
          nome TEXT NOT NULL,
          email TEXT,
          telefone TEXT,
          cpf TEXT,
          data_nascimento DATE,
          endereco TEXT,
          observacoes TEXT,
          status TEXT DEFAULT 'ativo',
          foto TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Agendamentos
        CREATE TABLE IF NOT EXISTS agendamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT NOT NULL DEFAULT '${tenantData.id}',
          paciente_id INTEGER NOT NULL,
          medico_id INTEGER,
          data_agendamento DATETIME NOT NULL,
          duracao INTEGER DEFAULT 60,
          servico TEXT,
          status TEXT DEFAULT 'agendado',
          observacoes TEXT,
          valor DECIMAL(10,2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
          FOREIGN KEY (medico_id) REFERENCES usuarios(id)
        );

        -- Serviços
        CREATE TABLE IF NOT EXISTS servicos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id TEXT NOT NULL DEFAULT '${tenantData.id}',
          nome TEXT NOT NULL,
          descricao TEXT,
          duracao INTEGER DEFAULT 60,
          valor DECIMAL(10,2),
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      tenantDb.exec(schema);
      console.log('✅ Schema do tenant criado');

      // Criar usuário admin
      const hashedPassword = bcrypt.hashSync('123456', 12);
      const insertAdmin = tenantDb.prepare(`
        INSERT INTO usuarios (tenant_id, nome, email, senha_hash, role, status, email_verified_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      const adminResult = insertAdmin.run(
        tenantData.id,
        'Administrador',
        'admin@clinica.com',
        hashedPassword,
        'owner',
        'active'
      );

      console.log('✅ Usuário admin criado com ID:', adminResult.lastInsertRowid);

      // Criar entrada no master_users
      const insertMasterUser = masterDb.prepare(`
        INSERT OR IGNORE INTO master_users (
          id, tenant_id, email, name, role, status, firstAccessCompleted, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      insertMasterUser.run(
        crypto.randomUUID(),
        tenantData.id,
        'admin@clinica.com',
        'Administrador',
        'owner',
        'active',
        1
      );

      console.log('✅ Entrada master_users criada');

      // Criar alguns dados de exemplo
      await this.createSampleData(tenantDb, tenantData.id);

      console.log('🎉 Primeiro acesso configurado com sucesso!');
      console.log('📧 Email: admin@clinica.com');
      console.log('🔑 Senha: 123456');
      console.log('🏢 Tenant: demo-clinic');

      return {
        tenantId: tenantData.id,
        tenantSlug: tenantData.slug,
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
      // Criar alguns serviços de exemplo
      const insertService = tenantDb.prepare(`
        INSERT INTO servicos (tenant_id, nome, descricao, duracao, valor, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const services = [
        ['Limpeza de Pele', 'Limpeza profunda com extração', 60, 80.00],
        ['Peeling Químico', 'Renovação celular com ácidos', 45, 120.00],
        ['Hidratação Facial', 'Hidratação profunda da pele', 50, 90.00],
        ['Consulta Dermatológica', 'Avaliação e orientação dermatológica', 30, 150.00]
      ];

      services.forEach(([nome, descricao, duracao, valor]) => {
        insertService.run(tenantId, nome, descricao, duracao, valor, 1);
      });

      console.log('✅ Serviços de exemplo criados');

      // Criar um paciente de exemplo
      const insertPatient = tenantDb.prepare(`
        INSERT INTO pacientes (tenant_id, nome, email, telefone, observacoes)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertPatient.run(
        tenantId,
        'Maria Silva',
        'maria.silva@email.com',
        '(11) 99999-9999',
        'Paciente exemplo para demonstração do sistema'
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
        if (!this.hasExistingTenants()) {
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
