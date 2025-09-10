const path = require('path');
const fs = require('fs');

// Try to use SQLite, fallback to mock for production deployment
let Database;
let useMock = false;

try {
  Database = require('better-sqlite3');
} catch (error) {
  console.log('🔄 SQLite not available, using mock database for deployment');
  const { MockMultiTenantDatabase } = require('../utils/mockDatabase');
  useMock = true;
}

class MultiTenantDatabaseManager {
  constructor() {
    if (useMock) {
      const { MockMultiTenantDatabase } = require('../utils/mockDatabase');
      return new MockMultiTenantDatabase();
    }
    
    this.masterDb = null;
    this.tenantConnections = new Map();
    this.databasesPath = path.join(__dirname, '../../databases');
    
    this.init();
  }

  /**
   * Inicializar sistema de databases
   */
  init() {
    // Criar diretório de databases se não existir
    if (!fs.existsSync(this.databasesPath)) {
      fs.mkdirSync(this.databasesPath, { recursive: true });
    }

    // Conectar ao database master
    this.masterDb = this.connectMasterDb();
    
    console.log('✅ Multi-tenant database manager iniciado');
  }

  /**
   * Conectar ao database master (gerencia tenants)
   */
  connectMasterDb() {
    const masterDbPath = path.join(__dirname, '../../saee-master.db');
    const db = new Database(masterDbPath);
    
    // Criar tabelas do sistema principal se não existirem
    this.createMasterTables(db);
    
    return db;
  }

  /**
   * Criar tabelas do sistema master
   */
  createMasterTables(db) {
    // Tabela de tenants
    db.exec(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        plano TEXT DEFAULT 'trial',
        status TEXT DEFAULT 'trial',
        trial_expire_at TEXT,
        database_name TEXT UNIQUE NOT NULL,
        config TEXT DEFAULT '{}',
        billing TEXT DEFAULT '{}',
        theme TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de usuários master (para login inicial)
    db.exec(`
      CREATE TABLE IF NOT EXISTS master_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        senha_hash TEXT NOT NULL,
        role TEXT DEFAULT 'owner',
        name TEXT,
        firstAccessCompleted BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        UNIQUE(email, tenant_id)
      )
    `);

    // Tabela de convites globais
    db.exec(`
      CREATE TABLE IF NOT EXISTS global_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        invite_token TEXT UNIQUE NOT NULL,
        expire_at DATETIME NOT NULL,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);

    console.log('✅ Tabelas master criadas/verificadas');
  }

  /**
   * Obter conexão do database master
   */
  getMasterDb() {
    return this.masterDb;
  }

  /**
   * Criar database para um tenant
   */
  async createTenantDatabase(tenantId, databaseName) {
    try {
      const dbPath = path.join(this.databasesPath, `${databaseName}.db`);
      
      if (fs.existsSync(dbPath)) {
        console.log(`⚠️ Database já existe: ${databaseName}`);
        return dbPath;
      }

      // Criar novo database
      const db = new Database(dbPath);
      
      // Executar schema do tenant
      await this.createTenantSchema(db, tenantId);
      
      // Fechar conexão inicial
      db.close();
      
      console.log(`✅ Database criado para tenant ${tenantId}: ${databaseName}`);
      return dbPath;
      
    } catch (error) {
      console.error(`❌ Erro ao criar database do tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Criar schema do tenant
   */
  async createTenantSchema(db, tenantId) {
    // Schema completo para cada tenant
    const schema = `
      -- Usuários do tenant
      CREATE TABLE usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
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
      CREATE TABLE pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
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
      CREATE TABLE agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
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
      CREATE TABLE servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
        nome TEXT NOT NULL,
        descricao TEXT,
        duracao INTEGER DEFAULT 60,
        valor DECIMAL(10,2),
        ativo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Financeiro - Faturas
      CREATE TABLE faturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
        paciente_id INTEGER NOT NULL,
        agendamento_id INTEGER,
        numero_fatura TEXT,
        descricao TEXT NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        vencimento DATE NOT NULL,
        status TEXT DEFAULT 'pendente',
        link_pagamento TEXT,
        data_pagamento DATETIME,
        metodo_pagamento TEXT,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id)
      );

      -- WhatsApp - Conversas
      CREATE TABLE whatsapp_conversas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
        paciente_id INTEGER,
        telefone TEXT NOT NULL,
        ultima_mensagem TEXT,
        ultima_atividade DATETIME,
        status TEXT DEFAULT 'ativa',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
      );

      -- WhatsApp - Mensagens
      CREATE TABLE whatsapp_mensagens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
        conversa_id INTEGER NOT NULL,
        tipo TEXT NOT NULL, -- enviada, recebida
        conteudo TEXT NOT NULL,
        status TEXT DEFAULT 'enviada', -- enviada, entregue, lida, erro
        webhook_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversa_id) REFERENCES whatsapp_conversas(id)
      );

      -- Configurações do tenant
      CREATE TABLE configuracoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
        chave TEXT NOT NULL,
        valor TEXT,
        tipo TEXT DEFAULT 'string',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chave)
      );

      -- Automações
      CREATE TABLE automacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL, -- lembrete, cobranca, follow_up
        trigger_evento TEXT NOT NULL,
        condicoes TEXT, -- JSON
        acoes TEXT NOT NULL, -- JSON
        ativo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Logs de atividades
      CREATE TABLE activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${tenantId}',
        usuario_id INTEGER,
        acao TEXT NOT NULL,
        entidade TEXT, -- paciente, agendamento, etc
        entidade_id INTEGER,
        detalhes TEXT, -- JSON
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );

      -- Índices para performance
      CREATE INDEX idx_pacientes_tenant ON pacientes(tenant_id);
      CREATE INDEX idx_agendamentos_tenant ON agendamentos(tenant_id);
      CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendamento);
      CREATE INDEX idx_faturas_tenant ON faturas(tenant_id);
      CREATE INDEX idx_faturas_vencimento ON faturas(vencimento);
      CREATE INDEX idx_whatsapp_conversas_tenant ON whatsapp_conversas(tenant_id);
      CREATE INDEX idx_whatsapp_mensagens_conversa ON whatsapp_mensagens(conversa_id);
      CREATE INDEX idx_activity_logs_tenant ON activity_logs(tenant_id);
      CREATE INDEX idx_usuarios_email ON usuarios(email);
    `;

    db.exec(schema);
    console.log(`✅ Schema criado para tenant: ${tenantId}`);
  }

  /**
   * Obter conexão do database do tenant
   */
  getTenantDb(tenantId) {
    if (!this.tenantConnections.has(tenantId)) {
      // Buscar informações do tenant
      const tenant = this.masterDb.prepare(`
        SELECT database_name FROM tenants WHERE id = ?
      `).get(tenantId);
      
      if (!tenant) {
        throw new Error(`Tenant não encontrado: ${tenantId}`);
      }
      
      const dbPath = path.join(this.databasesPath, `${tenant.database_name}.db`);
      
      if (!fs.existsSync(dbPath)) {
        throw new Error(`Database do tenant não encontrado: ${dbPath}`);
      }
      
      const db = new Database(dbPath);
      this.tenantConnections.set(tenantId, db);
      
      console.log(`🔗 Conexão estabelecida com tenant: ${tenantId}`);
    }
    
    return this.tenantConnections.get(tenantId);
  }

  /**
   * Fechar todas as conexões
   */
  closeAll() {
    // Fechar conexões dos tenants
    for (const [tenantId, db] of this.tenantConnections) {
      try {
        if (db && typeof db.close === 'function') {
          db.close();
        }
        console.log(`🔒 Conexão fechada para tenant: ${tenantId}`);
      } catch (error) {
        console.error(`❌ Erro ao fechar conexão do tenant ${tenantId}:`, error);
      }
    }
    this.tenantConnections.clear();
    
    // Fechar conexão master
    if (this.masterDb) {
      try {
        if (typeof this.masterDb.close === 'function') {
          this.masterDb.close();
        }
        console.log('🔒 Conexão master fechada');
      } catch (error) {
        console.error('❌ Erro ao fechar conexão master:', error);
      }
    }
  }

  /**
   * Executar migração em todos os tenants
   */
  async runMigrationOnAllTenants(migrationSql) {
    const tenants = this.masterDb.prepare('SELECT id, database_name FROM tenants').all();
    
    for (const tenant of tenants) {
      try {
        const tenantDb = this.getTenantDb(tenant.id);
        tenantDb.exec(migrationSql);
        console.log(`✅ Migração executada no tenant: ${tenant.id}`);
      } catch (error) {
        console.error(`❌ Erro na migração do tenant ${tenant.id}:`, error);
      }
    }
  }

  /**
   * Backup de todos os databases
   */
  async backupAllDatabases() {
    const backupDir = path.join(__dirname, '../../backups', new Date().toISOString().split('T')[0]);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup master
    const masterBackupPath = path.join(backupDir, 'master.db');
    fs.copyFileSync(path.join(__dirname, '../../saee-master.db'), masterBackupPath);
    
    // Backup tenants
    const tenants = this.masterDb.prepare('SELECT id, database_name FROM tenants').all();
    
    for (const tenant of tenants) {
      const sourcePath = path.join(this.databasesPath, `${tenant.database_name}.db`);
      const backupPath = path.join(backupDir, `${tenant.database_name}.db`);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 Backup criado para tenant: ${tenant.id}`);
      }
    }
    
    console.log(`📦 Backup completo salvo em: ${backupDir}`);
    return backupDir;
  }
}

// Instância singleton
const multiTenantDb = new MultiTenantDatabaseManager();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Fechando conexões do database...');
  multiTenantDb.closeAll();
  process.exit(0);
});

module.exports = multiTenantDb;
