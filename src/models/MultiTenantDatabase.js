/**
 * MultiTenantDatabase.js — Compatibilidade retroativa
 *
 * Este módulo redirecionou de SQLite (better-sqlite3, arquivo por tenant)
 * para PostgreSQL (schema por tenant via MultiTenantPostgres).
 *
 * ADR-001: Migração SQLite → PostgreSQL
 * Issue: https://github.com/thiagoborgh/AltClinic/issues/1
 *
 * ATENÇÃO: Módulos que ainda usam a API síncrona do better-sqlite3
 * (.prepare().get() / .prepare().all() / .prepare().run()) devem ser
 * migrados para a API assíncrona do TenantDb (await req.db.get/all/run).
 * Rastreado em: https://github.com/thiagoborgh/AltClinic/issues/8
 */
const multiTenantPostgres = require('../database/MultiTenantPostgres');

module.exports = multiTenantPostgres;
