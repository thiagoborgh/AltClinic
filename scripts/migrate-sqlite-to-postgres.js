#!/usr/bin/env node
/**
 * migrate-sqlite-to-postgres.js
 *
 * Migra dados do SQLite (saee-master.db + saee-{slug}.db) para PostgreSQL.
 * Execute UMA VEZ após configurar DATABASE_URL no .env.
 *
 * Uso:
 *   node scripts/migrate-sqlite-to-postgres.js
 *
 * Pré-requisitos:
 *   - DATABASE_URL no .env apontando para o Supabase/PostgreSQL
 *   - better-sqlite3 ainda instalado
 *   - Banco PostgreSQL vazio (ou com schemas criados pelo init)
 */
require('dotenv').config();
const path = require('path');
const fs   = require('fs');

// ─── Valida DATABASE_URL ──────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL não definida. Configure o .env antes de rodar.');
  process.exit(1);
}

const Database = require('better-sqlite3');
const pool     = require('../src/database/postgres');
const multiTenantPostgres = require('../src/database/MultiTenantPostgres');

const MASTER_DB_PATH = path.join(__dirname, '../saee-master.db');
const DATA_DIR       = path.join(__dirname, '../data');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openSqlite(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.warn(`⚠️  SQLite não encontrado: ${dbPath}`);
    return null;
  }
  return new Database(dbPath, { readonly: true });
}

function toTimestamp(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function toJson(val) {
  if (!val) return '{}';
  if (typeof val === 'object') return JSON.stringify(val);
  try { JSON.parse(val); return val; } catch { return '{}'; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Iniciando migração SQLite → PostgreSQL\n');

  // 1. Inicializa schema master no PostgreSQL
  await multiTenantPostgres.initMasterSchema();

  // 2. Lê master.db do SQLite
  const masterDb = openSqlite(MASTER_DB_PATH);
  if (!masterDb) {
    console.error('❌  saee-master.db não encontrado. Abortando.');
    process.exit(1);
  }

  const tenants = masterDb.prepare('SELECT * FROM tenants').all();
  console.log(`📋 ${tenants.length} tenant(s) encontrado(s) no SQLite\n`);

  // 3. Migra tenants
  for (const t of tenants) {
    console.log(`\n── Tenant: ${t.slug} (${t.id}) ──`);

    // Insere ou atualiza tenant no PostgreSQL
    await pool.query(
      `INSERT INTO tenants
         (id, slug, nome, email, telefone, plano, status, trial_expire_at,
          schema_name, config, billing, theme, cnpj_cpf, chave_licenca,
          responsavel_nome, responsavel_email, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (id) DO UPDATE SET
         slug=EXCLUDED.slug, nome=EXCLUDED.nome, status=EXCLUDED.status,
         updated_at=EXCLUDED.updated_at`,
      [
        t.id, t.slug, t.nome, t.email, t.telefone ?? null,
        t.plano ?? 'trial', t.status ?? 'trial',
        toTimestamp(t.trial_expire_at),
        multiTenantPostgres.constructor.schemaName
          ? multiTenantPostgres.constructor.schemaName(t.slug)
          : `clinica_${t.slug.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
        toJson(t.config), toJson(t.billing), toJson(t.theme),
        t.cnpj_cpf ?? null, t.chave_licenca ?? null,
        t.responsavel_nome ?? null, t.responsavel_email ?? null,
        toTimestamp(t.created_at) ?? new Date().toISOString(),
        toTimestamp(t.updated_at) ?? new Date().toISOString(),
      ]
    );
    console.log(`  ✅ Tenant inserido no PostgreSQL`);

    // Cria schema do tenant no PostgreSQL
    await multiTenantPostgres.createTenantSchema(t.id, t.slug);

    // Abre banco SQLite do tenant
    const dbFileName = t.database_name?.endsWith('.db') ? t.database_name : `${t.database_name}.db`;
    const tenantDbPath = path.join(DATA_DIR, dbFileName);
    const tenantSqlite = openSqlite(tenantDbPath);

    if (!tenantSqlite) {
      console.warn(`  ⚠️  Banco SQLite do tenant não encontrado: ${tenantDbPath} — pulando dados`);
      continue;
    }

    const tenantDb = multiTenantPostgres.getTenantDb(t.id, t.slug);

    // ── Migra cada tabela ──────────────────────────────────────────────────

    await migratePacientes(tenantSqlite, tenantDb);
    await migrateUsuarios(tenantSqlite, tenantDb);
    await migrateServicos(tenantSqlite, tenantDb);
    await migrateAgendamentos(tenantSqlite, tenantDb);
    await migrateFaturas(tenantSqlite, tenantDb);
    await migrateWhatsAppInstances(tenantSqlite, tenantDb);
    await migrateConfiguracoes(tenantSqlite, tenantDb);
    await migrateAutomacoes(tenantSqlite, tenantDb);
    await migrateMedicos(tenantSqlite, tenantDb);
    await migrateProfessionalSchedules(tenantSqlite, tenantDb);

    tenantSqlite.close();
    console.log(`  ✅ Migração completa para tenant ${t.slug}`);
  }

  // 4. Migra master_users e global_invites
  await migrateMasterUsers(masterDb);
  await migrateGlobalInvites(masterDb);

  masterDb.close();

  console.log('\n🎉 Migração concluída com sucesso!');
  console.log('   Próximo passo: configurar DATABASE_URL no Railway e testar o backend.');
  await pool.end();
}

// ─── Funções de migração por tabela ──────────────────────────────────────────

async function migratePacientes(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM pacientes');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO pacientes
         (id, tenant_id, nome, email, telefone, cpf, data_nascimento,
          endereco, observacoes, status, foto, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.tenant_id, r.nome, r.email ?? null, r.telefone ?? null,
       r.cpf ?? null, r.data_nascimento ?? null, r.endereco ?? null,
       r.observacoes ?? null, r.status ?? 'ativo', r.foto ?? null,
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  // Reseta sequence para evitar conflito de ID
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('pacientes','id'), COALESCE(MAX(id),0)+1, false) FROM pacientes`);
  console.log(`    pacientes: ${rows.length} linhas`);
}

async function migrateUsuarios(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM usuarios');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO usuarios
         (id, tenant_id, nome, email, senha_hash, role, permissions, avatar,
          telefone, crm, especialidade, status, last_login, email_verified_at,
          invite_token, invite_expire_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (email) DO NOTHING`,
      [r.id, r.tenant_id, r.nome, r.email, r.senha_hash ?? null,
       r.role ?? 'medico', toJson(r.permissions), r.avatar ?? null,
       r.telefone ?? null, r.crm ?? null, r.especialidade ?? null,
       r.status ?? 'active', toTimestamp(r.last_login),
       toTimestamp(r.email_verified_at), r.invite_token ?? null,
       toTimestamp(r.invite_expire_at),
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('usuarios','id'), COALESCE(MAX(id),0)+1, false) FROM usuarios`);
  console.log(`    usuarios: ${rows.length} linhas`);
}

async function migrateServicos(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM servicos');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO servicos (id, tenant_id, nome, descricao, duracao, valor, ativo, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.tenant_id, r.nome, r.descricao ?? null,
       r.duracao ?? 60, r.valor ?? null, r.ativo !== 0,
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('servicos','id'), COALESCE(MAX(id),0)+1, false) FROM servicos`);
  console.log(`    servicos: ${rows.length} linhas`);
}

async function migrateAgendamentos(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM agendamentos');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO agendamentos
         (id, tenant_id, paciente_id, medico_id, data_agendamento,
          duracao, servico, status, observacoes, valor, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.tenant_id, r.paciente_id, r.medico_id ?? null,
       toTimestamp(r.data_agendamento), r.duracao ?? 60, r.servico ?? null,
       r.status ?? 'agendado', r.observacoes ?? null, r.valor ?? null,
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('agendamentos','id'), COALESCE(MAX(id),0)+1, false) FROM agendamentos`);
  console.log(`    agendamentos: ${rows.length} linhas`);
}

async function migrateFaturas(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM faturas');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO faturas
         (id, tenant_id, paciente_id, agendamento_id, numero_fatura,
          descricao, valor, vencimento, status, link_pagamento,
          data_pagamento, metodo_pagamento, observacoes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.tenant_id, r.paciente_id, r.agendamento_id ?? null,
       r.numero_fatura ?? null, r.descricao, r.valor, r.vencimento,
       r.status ?? 'pendente', r.link_pagamento ?? null,
       toTimestamp(r.data_pagamento), r.metodo_pagamento ?? null,
       r.observacoes ?? null,
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('faturas','id'), COALESCE(MAX(id),0)+1, false) FROM faturas`);
  console.log(`    faturas: ${rows.length} linhas`);
}

async function migrateWhatsAppInstances(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM whatsapp_instances');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO whatsapp_instances
         (id, client_id, instance_id, phone_number, status,
          api_token, api_url, api_key, webhook_url, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (instance_id) DO NOTHING`,
      [r.id, r.client_id, r.instance_id, r.phone_number ?? null,
       r.status ?? 'pending', r.api_token ?? null, r.api_url ?? null,
       r.api_key ?? null, r.webhook_url ?? null,
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('whatsapp_instances','id'), COALESCE(MAX(id),0)+1, false) FROM whatsapp_instances`);
  console.log(`    whatsapp_instances: ${rows.length} linhas`);
}

async function migrateConfiguracoes(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM configuracoes');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO configuracoes (id, tenant_id, chave, valor, tipo, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (chave) DO NOTHING`,
      [r.id, r.tenant_id, r.chave, r.valor ?? null,
       r.tipo ?? 'string', toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('configuracoes','id'), COALESCE(MAX(id),0)+1, false) FROM configuracoes`);
  console.log(`    configuracoes: ${rows.length} linhas`);
}

async function migrateAutomacoes(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM automacoes');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO automacoes
         (id, tenant_id, nome, tipo, trigger_evento, condicoes, acoes, ativo, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.tenant_id, r.nome, r.tipo, r.trigger_evento,
       toJson(r.condicoes), toJson(r.acoes), r.ativo !== 0,
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('automacoes','id'), COALESCE(MAX(id),0)+1, false) FROM automacoes`);
  console.log(`    automacoes: ${rows.length} linhas`);
}

async function migrateMedicos(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM medicos');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO medicos
         (id, tenant_id, nome, crm, especialidade, telefone, email,
          observacoes, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (tenant_id, crm) DO NOTHING`,
      [r.id, r.tenant_id, r.nome, r.crm, r.especialidade, r.telefone,
       r.email ?? null, r.observacoes ?? null, r.status ?? 'ativo',
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('medicos','id'), COALESCE(MAX(id),0)+1, false) FROM medicos`);
  console.log(`    medicos: ${rows.length} linhas`);
}

async function migrateProfessionalSchedules(sqlite, pgDb) {
  const rows = tryAll(sqlite, 'SELECT * FROM professional_schedules');
  if (!rows.length) return;
  for (const r of rows) {
    await pgDb.run(
      `INSERT INTO professional_schedules
         (id, tenant_id, professional_id, professional_name,
          day_of_week, start_time, end_time, pause_start, pause_end,
          is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.tenant_id, r.professional_id ?? null, r.professional_name,
       r.day_of_week, r.start_time, r.end_time,
       r.pause_start ?? null, r.pause_end ?? null, r.is_active !== 0,
       toTimestamp(r.created_at), toTimestamp(r.updated_at)]
    );
  }
  await pgDb.run(`SELECT setval(pg_get_serial_sequence('professional_schedules','id'), COALESCE(MAX(id),0)+1, false) FROM professional_schedules`);
  console.log(`    professional_schedules: ${rows.length} linhas`);
}

async function migrateMasterUsers(masterDb) {
  const rows = tryAll(masterDb, 'SELECT * FROM master_users');
  if (!rows.length) { console.log('\n  master_users: 0 linhas'); return; }
  for (const r of rows) {
    await pool.query(
      `INSERT INTO master_users
         (id, tenant_id, email, senha_hash, role, name, first_access_completed, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (email, tenant_id) DO NOTHING`,
      [r.id, r.tenant_id, r.email, r.senha_hash,
       r.role ?? 'owner', r.name ?? null,
       r.firstAccessCompleted === 1,
       toTimestamp(r.created_at)]
    );
  }
  await pool.query(`SELECT setval(pg_get_serial_sequence('master_users','id'), COALESCE(MAX(id),0)+1, false) FROM master_users`);
  console.log(`\n  master_users: ${rows.length} linhas`);
}

async function migrateGlobalInvites(masterDb) {
  const rows = tryAll(masterDb, 'SELECT * FROM global_invites');
  if (!rows.length) { console.log('  global_invites: 0 linhas'); return; }
  for (const r of rows) {
    await pool.query(
      `INSERT INTO global_invites (id, tenant_id, email, invite_token, expire_at, used_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (invite_token) DO NOTHING`,
      [r.id, r.tenant_id, r.email, r.invite_token,
       toTimestamp(r.expire_at), toTimestamp(r.used_at), toTimestamp(r.created_at)]
    );
  }
  await pool.query(`SELECT setval(pg_get_serial_sequence('global_invites','id'), COALESCE(MAX(id),0)+1, false) FROM global_invites`);
  console.log(`  global_invites: ${rows.length} linhas`);
}

/** Tenta ler uma tabela SQLite, retorna [] se não existir */
function tryAll(db, sql) {
  try { return db.prepare(sql).all(); }
  catch { return []; }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('\n❌ Migração falhou:', err.message);
  console.error(err.stack);
  process.exit(1);
});
