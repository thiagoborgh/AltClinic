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
}

module.exports = {
  MockDatabase,
  MockMultiTenantDatabase
};
