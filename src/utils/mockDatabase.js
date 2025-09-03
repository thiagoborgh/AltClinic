/**
 * Mock Database para Deploy sem SQLite
 * Sistema em memória para testes e ambiente gratuito
 */

class MockDatabase {
  constructor() {
    this.tenants = new Map();
    this.users = new Map();
    this.sessions = new Map();
    this.trials = new Map();
    this.nextId = 1;
    this.isConnected = true;
  }

  // Database lifecycle methods
  close() {
    console.log('🔄 Mock database closed');
    this.isConnected = false;
    return this;
  }

  pragma(command) {
    console.log('🔄 Mock pragma:', command);
    return this;
  }

  // Tenant operations
  createTenant(data) {
    const id = this.nextId++;
    const tenant = {
      id,
      nome: data.nome,
      dominio: data.dominio,
      status: data.status || 'trial',
      created_at: new Date().toISOString(),
      ...data
    };
    this.tenants.set(id, tenant);
    return { lastInsertRowid: id };
  }

  getTenant(id) {
    return this.tenants.get(id);
  }

  getTenantByDomain(domain) {
    for (let tenant of this.tenants.values()) {
      if (tenant.dominio === domain) {
        return tenant;
      }
    }
    return null;
  }

  // User operations
  createUser(data) {
    const id = this.nextId++;
    const user = {
      id,
      tenant_id: data.tenant_id,
      nome: data.nome,
      email: data.email,
      senha_hash: data.senha_hash,
      role: data.role || 'user',
      status: data.status || 'ativo',
      created_at: new Date().toISOString(),
      ...data
    };
    this.users.set(id, user);
    return { lastInsertRowid: id };
  }

  getUserByEmail(email, tenantId) {
    for (let user of this.users.values()) {
      if (user.email === email && user.tenant_id === tenantId) {
        return user;
      }
    }
    return null;
  }

  // Session operations
  createSession(data) {
    const id = this.nextId++;
    const session = {
      id,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      token: data.token,
      expires_at: data.expires_at,
      created_at: new Date().toISOString(),
      ...data
    };
    this.sessions.set(id, session);
    return { lastInsertRowid: id };
  }

  getSessionByToken(token) {
    for (let session of this.sessions.values()) {
      if (session.token === token) {
        return session;
      }
    }
    return null;
  }

  deleteSession(token) {
    for (let [id, session] of this.sessions.entries()) {
      if (session.token === token) {
        this.sessions.delete(id);
        return true;
      }
    }
    return false;
  }

  // Trial operations
  createTrial(data) {
    const id = this.nextId++;
    const trial = {
      id,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      empresa: data.empresa,
      tenant_id: data.tenant_id,
      status: data.status || 'ativo',
      expires_at: data.expires_at,
      created_at: new Date().toISOString(),
      ...data
    };
    this.trials.set(id, trial);
    return { lastInsertRowid: id };
  }

  getTrialByEmail(email) {
    for (let trial of this.trials.values()) {
      if (trial.email === email) {
        return trial;
      }
    }
    return null;
  }

  // Generic prepare method for compatibility
  prepare(sql) {
    return {
      run: (...params) => {
        console.log('Mock SQL:', sql, params);
        return { lastInsertRowid: this.nextId++ };
      },
      get: (...params) => {
        console.log('Mock SQL GET:', sql, params);
        return null;
      },
      all: (...params) => {
        console.log('Mock SQL ALL:', sql, params);
        return [];
      }
    };
  }

  exec(sql) {
    console.log('Mock SQL EXEC:', sql);
    return this;
  }

  transaction(fn) {
    return () => {
      try {
        return fn();
      } catch (error) {
        console.error('Mock transaction error:', error);
        throw error;
      }
    };
  }
}

// Mock MultiTenantDatabase
class MockMultiTenantDatabase {
  constructor() {
    this.databases = new Map();
    this.mainDb = new MockDatabase();
    this.setupInitialData();
  }

  setupInitialData() {
    console.log('🔄 Setting up initial fake data...');
    
    // Criar tenant demo
    const demoTenant = this.mainDb.createTenant({
      nome: 'Alt Clinic Demo',
      dominio: 'demo',
      status: 'ativo',
      plano: 'premium',
      config: JSON.stringify({
        whatsappEnabled: true,
        emailEnabled: true,
        smsEnabled: true,
        features: ['agenda', 'crm', 'financeiro', 'prontuarios']
      }),
      trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    const tenantId = demoTenant.lastInsertRowid;
    
    // Criar usuário admin demo
    const bcryptjs = require('bcryptjs');
    const adminPassword = bcryptjs.hashSync('admin123', 10);
    
    this.mainDb.createUser({
      tenant_id: tenantId,
      nome: 'Admin Demo',
      email: 'admin@demo.com',
      senha_hash: adminPassword,
      role: 'admin',
      status: 'ativo'
    });

    // Criar database do tenant e popular com dados
    const tenantDb = this.getTenantDb(tenantId);
    this.populateTenantData(tenantDb, tenantId);
    
    console.log('✅ Initial data setup complete');
  }

  populateTenantData(tenantDb, tenantId) {
    // Pacientes demo
    const pacientes = [
      {
        nome: 'Maria Silva',
        email: 'maria@email.com',
        telefone: '(11) 99999-1111',
        data_nascimento: '1985-03-15',
        sexo: 'F',
        status: 'ativo'
      },
      {
        nome: 'João Santos',
        email: 'joao@email.com',
        telefone: '(11) 99999-2222',
        data_nascimento: '1978-07-22',
        sexo: 'M',
        status: 'ativo'
      },
      {
        nome: 'Ana Costa',
        email: 'ana@email.com',
        telefone: '(11) 99999-3333',
        data_nascimento: '1992-11-08',
        sexo: 'F',
        status: 'ativo'
      }
    ];

    pacientes.forEach(paciente => {
      tenantDb.prepare('INSERT INTO pacientes').run(paciente);
    });

    // Agendamentos demo
    const agendamentos = [
      {
        paciente_id: 1,
        servico: 'Limpeza de Pele',
        data_agendamento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'agendado',
        valor: 150.00
      },
      {
        paciente_id: 2,
        servico: 'Botox',
        data_agendamento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'agendado',
        valor: 800.00
      },
      {
        paciente_id: 3,
        servico: 'Preenchimento',
        data_agendamento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'agendado',
        valor: 600.00
      }
    ];

    agendamentos.forEach(agendamento => {
      tenantDb.prepare('INSERT INTO agendamentos').run(agendamento);
    });

    console.log('✅ Tenant data populated with demo records');
  }

  getTenantDb(tenantId) {
    if (!this.databases.has(tenantId)) {
      this.databases.set(tenantId, new MockDatabase());
    }
    return this.databases.get(tenantId);
  }

  getMainDb() {
    return this.mainDb;
  }

  // Methods for compatibility
  createTenant(data) {
    return this.mainDb.createTenant(data);
  }

  getTenantByDomain(domain) {
    return this.mainDb.getTenantByDomain(domain);
  }

  getTenant(id) {
    return this.mainDb.getTenant(id);
  }

  // Database lifecycle methods
  closeAll() {
    console.log('🔄 Closing all mock databases');
    this.mainDb.close();
    for (let db of this.databases.values()) {
      db.close();
    }
    this.databases.clear();
  }

  getMasterDb() {
    return this.mainDb;
  }

  // Compatibility methods
  createTenantDatabase(tenantId) {
    console.log('🔄 Mock: Creating tenant database for:', tenantId);
    this.getTenantDb(tenantId);
    return Promise.resolve();
  }
}

module.exports = {
  MockDatabase,
  MockMultiTenantDatabase
};
