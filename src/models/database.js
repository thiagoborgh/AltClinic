/**
 * database.js — Shim de compatibilidade PostgreSQL
 *
 * Este arquivo existia como DatabaseManager (better-sqlite3).
 * Na migração para PostgreSQL, ele passa a re-exportar o pool
 * e o MultiTenantPostgresManager para manter compatibilidade com
 * qualquer código que ainda faça require('./database').
 *
 * Para novas implementações use diretamente:
 *   const multiTenantDb = require('../database/MultiTenantPostgres');
 *   const pool          = require('../database/postgres');
 */
const pool = require('../database/postgres');
const multiTenantDb = require('../database/MultiTenantPostgres');
const { MasterDb } = require('../database/TenantDb');

// Instância do MasterDb para acesso ao schema público
const masterDb = multiTenantDb.getMasterDb();

/**
 * Compatibilidade com código antigo que chamava dbManager.getDb()
 * Retorna o MasterDb (schema public).
 */
function getDb() {
  return masterDb;
}

module.exports = {
  pool,
  getDb,
  masterDb,
  multiTenantDb
};
