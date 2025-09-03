// Try to use SQLite, fallback to mock for production deployment
let Database;
let useMock = false;

try {
  Database = require('better-sqlite3');
} catch (error) {
  console.log('🔄 SQLite not available, using mock database for deployment');
  const { MockDatabase } = require('../utils/mockDatabase');
  useMock = true;
}

const path = require('path');

class DatabaseManager {
  constructor() {
    if (useMock) {
      const { MockDatabase } = require('../utils/mockDatabase');
      this.db = new MockDatabase();
      return;
    }
    
    this.dbPath = process.env.DB_PATH || './saee.db';
    this.db = null;
    this.init();
  }

  init() {
    if (useMock) return;
    
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      console.log('✅ Conexão com banco de dados estabelecida');
    } catch (error) {
      console.error('❌ Erro ao conectar com banco:', error.message);
      throw error;
    }
  }

  getDb() {
    if (!this.db) {
      this.init();
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('🔒 Conexão com banco fechada');
    }
  }

  // Método para executar transações
  transaction(callback) {
    const db = this.getDb();
    const transaction = db.transaction(callback);
    return transaction;
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
