const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class AdminDatabase {
  constructor() {
    this.dbPath = process.env.ADMIN_DB_PATH || './database/admin.sqlite';
    this.mainDbPath = process.env.MAIN_DB_PATH || '../src/database/database.sqlite';
    
    // Garantir que o diretório existe
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    // Conexão readonly para o banco principal
    if (fs.existsSync(this.mainDbPath)) {
      this.mainDb = new Database(this.mainDbPath, { readonly: true });
    }
    
    this.initializeTables();
    this.createDefaultAdmin();
  }

  initializeTables() {
    // Tabela de usuários admin
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de licenças (cache/espelho do sistema principal)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS licencas (
        id TEXT PRIMARY KEY,
        cliente TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        plano TEXT NOT NULL,
        valor_mensal DECIMAL(10,2),
        data_inicio DATE,
        data_vencimento DATE,
        status TEXT DEFAULT 'ativa',
        clinica_id INTEGER,
        ultimo_acesso DATETIME,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de logs de ações admin
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
      )
    `);

    // Tabela de configurações admin
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_name TEXT UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_licencas_status ON licencas(status);
      CREATE INDEX IF NOT EXISTS idx_licencas_vencimento ON licencas(data_vencimento);
      CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
      CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);
    `);

    console.log('✅ Tabelas da intranet admin inicializadas');
  }

  createDefaultAdmin() {
    const bcrypt = require('bcrypt');
    
    // Verificar se já existe um admin
    const existingAdmin = this.db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
    
    if (existingAdmin.count === 0) {
      const defaultPassword = 'Admin123!';
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
      
      this.db.prepare(`
        INSERT INTO admin_users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `).run('Admin Altclinic', 'admin@altclinic.com', hashedPassword, 'super_admin');
      
      console.log(`
      🔐 Usuário admin padrão criado:
      📧 Email: admin@altclinic.com
      🔑 Senha: ${defaultPassword}
      
      ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!
      `);
    }
  }

  // Métodos para usuários admin
  getUserByEmail(email) {
    return this.db.prepare('SELECT * FROM admin_users WHERE email = ? AND is_active = 1').get(email);
  }

  getUserById(id) {
    return this.db.prepare('SELECT * FROM admin_users WHERE id = ? AND is_active = 1').get(id);
  }

  updateLastLogin(userId) {
    return this.db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
  }

  // Métodos para licenças
  getAllLicencas() {
    return this.db.prepare('SELECT * FROM licencas ORDER BY created_at DESC').all();
  }

  getLicencaById(id) {
    return this.db.prepare('SELECT * FROM licencas WHERE id = ?').get(id);
  }

  // Sincronizar licenças do banco principal
  syncLicencasFromMain() {
    if (!this.mainDb) return;

    try {
      // Buscar clínicas do banco principal
      const clinicas = this.mainDb.prepare('SELECT * FROM clinicas').all();
      
      // Limpar e repovoar tabela de licenças
      this.db.prepare('DELETE FROM licencas').run();
      
      const insertLicenca = this.db.prepare(`
        INSERT INTO licencas (
          id, cliente, email, telefone, plano, valor_mensal,
          data_inicio, data_vencimento, status, clinica_id, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      clinicas.forEach((clinica, index) => {
        const licencaId = `LIC${String(index + 1).padStart(3, '0')}`;
        
        insertLicenca.run(
          licencaId,
          clinica.nome || 'Cliente',
          clinica.email || 'email@example.com',
          clinica.telefone || '',
          'Premium', // Plano padrão
          8500, // Valor padrão
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano
          'ativa',
          clinica.id,
          'Sincronizado do sistema principal'
        );
      });

      console.log(`✅ Sincronizadas ${clinicas.length} licenças do sistema principal`);
    } catch (error) {
      console.error('❌ Erro ao sincronizar licenças:', error.message);
    }
  }

  // Métodos para logs
  logAction(adminUserId, action, resourceType, resourceId, details, ipAddress, userAgent) {
    return this.db.prepare(`
      INSERT INTO admin_logs (admin_user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(adminUserId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent);
  }

  getRecentLogs(limit = 100) {
    return this.db.prepare(`
      SELECT 
        al.*,
        au.name as admin_name,
        au.email as admin_email
      FROM admin_logs al
      JOIN admin_users au ON al.admin_user_id = au.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(limit);
  }

  // Métodos para configurações por licença
  getConfiguracoesByLicenca(licencaId) {
    if (!this.mainDb) return {};

    try {
      // Buscar clinica_id pela licença
      const licenca = this.getLicencaById(licencaId);
      if (!licenca || !licenca.clinica_id) return {};

      // Buscar configurações da clínica no banco principal
      const configuracoes = this.mainDb.prepare(
        'SELECT chave, valor, secao FROM configuracoes WHERE clinica_id = ?'
      ).all(licenca.clinica_id);

      // Converter para objeto plano
      const configObj = {};
      configuracoes.forEach(config => {
        configObj[config.chave] = config.valor;
      });

      return configObj;
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error.message);
      return {};
    }
  }

  // Método para estatísticas do dashboard
  getDashboardStats() {
    const stats = {};

    // Total de licenças
    stats.totalLicencas = this.db.prepare('SELECT COUNT(*) as count FROM licencas').get().count;
    
    // Licenças por status
    stats.licencasAtivas = this.db.prepare('SELECT COUNT(*) as count FROM licencas WHERE status = "ativa"').get().count;
    stats.licencasVencendo = this.db.prepare('SELECT COUNT(*) as count FROM licencas WHERE status = "vencendo"').get().count;
    stats.licencasVencidas = this.db.prepare('SELECT COUNT(*) as count FROM licencas WHERE status = "vencida"').get().count;

    // Faturamento estimado
    const faturamento = this.db.prepare('SELECT SUM(valor_mensal) as total FROM licencas WHERE status = "ativa"').get();
    stats.faturamentoMensal = faturamento.total || 0;

    return stats;
  }

  close() {
    this.db.close();
    if (this.mainDb) {
      this.mainDb.close();
    }
  }
}

module.exports = new AdminDatabase();
