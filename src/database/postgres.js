/**
 * PostgreSQL connection pool
 * Substitui better-sqlite3 / saee.db
 */
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não definida — PostgreSQL não iniciado');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool PostgreSQL:', err.message);
});

pool.on('connect', () => {
  console.log('✅ Nova conexão PostgreSQL estabelecida');
});

module.exports = pool;
