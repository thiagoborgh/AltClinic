// Try to use SQLite, fallback to mock for production deployment
let Database;
let useMock = false;

try {
  Database = require('better-sqlite3');
  console.log('✅ SQLite (better-sqlite3) carregado com sucesso');
} catch (error) {
  console.log('⚠️ SQLite não disponível, usando mock database:', error.message);
  console.log('💡 Para produção, considere usar PostgreSQL ou MySQL');
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
      try {
        if (typeof this.db.close === 'function') {
          this.db.close();
        } else {
          console.warn('⚠️  Objeto de banco não possui método close(); ignorando.');
        }
      } catch (err) {
        console.error('❌ Erro ao fechar banco:', err.message || err);
      } finally {
        this.db = null;
        console.log('🔒 Conexão com banco fechada');
      }
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
