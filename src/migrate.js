/**
 * migrate.js — Runner de migrations PostgreSQL para AltClinic
 *
 * Uso:
 *   npm run migrate          → aplica migrations pendentes
 *   npm run migrate:status   → lista o status de cada migration
 *   npm run migrate:create   → (placeholder) cria arquivo numerado
 *
 * As migrations são arquivos .sql em src/migrations/,
 * nomeados com prefixo numérico: 001_..., 002_..., etc.
 *
 * O runner mantém a tabela public.schema_migrations para rastrear
 * quais migrations já foram aplicadas.
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ─── Conexão ─────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida. Verifique o arquivo .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 10000,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/** Garante que a tabela de controle existe */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

/** Retorna lista de filenames já aplicados */
async function appliedMigrations(client) {
  const { rows } = await client.query(
    'SELECT filename FROM public.schema_migrations ORDER BY filename'
  );
  return new Set(rows.map(r => r.filename));
}

/** Retorna todos os arquivos .sql ordenados */
function allMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

// ─── Comando: run ─────────────────────────────────────────────────────────────

async function runMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await appliedMigrations(client);
    const files   = allMigrationFiles();
    const pending = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      console.log('✅ Nenhuma migration pendente.');
      return;
    }

    console.log(`📦 ${pending.length} migration(s) pendente(s):`);
    for (const file of pending) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql      = fs.readFileSync(filePath, 'utf8');

      console.log(`  ▶ Aplicando: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO public.schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`  ✅ ${file} aplicada com sucesso`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Falha em ${file}:`, err.message);
        throw err;
      }
    }

    console.log('🎉 Todas as migrations aplicadas com sucesso.');
  } finally {
    client.release();
  }
}

// ─── Comando: status ──────────────────────────────────────────────────────────

async function statusMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await appliedMigrations(client);
    const files   = allMigrationFiles();

    console.log('\nStatus das migrations:\n');
    if (files.length === 0) {
      console.log('  (nenhum arquivo encontrado em src/migrations/)');
      return;
    }
    for (const file of files) {
      const status = applied.has(file) ? '✅ aplicada' : '⏳ pendente';
      console.log(`  ${status}  ${file}`);
    }
    console.log('');
  } finally {
    client.release();
  }
}

// ─── Comando: create ─────────────────────────────────────────────────────────

function createMigration(name) {
  const files  = allMigrationFiles();
  const last   = files.length > 0 ? parseInt(files[files.length - 1].split('_')[0], 10) : 0;
  const next   = String(last + 1).padStart(3, '0');
  const slug   = (name || 'migration').toLowerCase().replace(/\s+/g, '_');
  const filename = `${next}_${slug}.sql`;
  const dest   = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(MIGRATIONS_DIR)) fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  fs.writeFileSync(dest, `-- Migration ${next}: ${name || ''}\n`);
  console.log(`✅ Criado: src/migrations/${filename}`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const [,, command, ...args] = process.argv;

async function main() {
  try {
    switch (command) {
      case 'run':
        await runMigrations();
        break;
      case 'status':
        await statusMigrations();
        break;
      case 'create':
        createMigration(args.join(' '));
        break;
      default:
        console.log('Uso: node src/migrate.js [run|status|create <nome>]');
        break;
    }
  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
