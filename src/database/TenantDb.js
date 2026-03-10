/**
 * TenantDb — Wrapper de conexão com isolamento por schema PostgreSQL
 *
 * Cada instância representa a conexão de um tenant específico.
 * Toda query executada via este wrapper usa automaticamente o schema
 * correto (SET search_path = clinica_{slug}).
 *
 * Interface compatível com melhor migração incremental das rotas:
 *   await req.db.query(sql, params)   → { rows, rowCount }
 *   await req.db.get(sql, params)     → row | null
 *   await req.db.all(sql, params)     → row[]
 *   await req.db.run(sql, params)     → { lastID, changes }
 *   await req.db.transaction(fn)      → result de fn
 */
class TenantDb {
  /**
   * @param {import('pg').Pool} pool
   * @param {string} schemaName  ex: 'clinica_minha_clinica'
   */
  constructor(pool, schemaName) {
    this.pool = pool;
    this.schema = schemaName;
  }

  /**
   * Executa uma query no schema do tenant.
   * Cada chamada adquire um client, seta o search_path e libera.
   */
  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path = "${this.schema}", public`);
      return await client.query(sql, params);
    } finally {
      // Reseta search_path antes de devolver ao pool
      try { await client.query('SET search_path = public'); } catch (_) {}
      client.release();
    }
  }

  /** Retorna a primeira linha ou null */
  async get(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows[0] ?? null;
  }

  /** Retorna todas as linhas */
  async all(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Executa INSERT/UPDATE/DELETE.
   * Se a query terminar com RETURNING id, popula lastID.
   */
  async run(sql, params = []) {
    const result = await this.query(sql, params);
    return {
      lastID: result.rows[0]?.id ?? null,
      changes: result.rowCount,
    };
  }

  /**
   * Executa múltiplas operações em uma transação.
   * Passa um client já configurado para o callback.
   *
   * @param {(client: import('pg').PoolClient) => Promise<any>} callback
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path = "${this.schema}", public`);
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      try { await client.query('SET search_path = public'); } catch (_) {}
      client.release();
    }
  }
}

/**
 * MasterDb — Wrapper para o schema público (tabelas globais)
 * Usado pelo middleware de tenant para buscar tenants, master_users, etc.
 */
class MasterDb {
  /** @param {import('pg').Pool} pool */
  constructor(pool) {
    this.pool = pool;
  }

  async query(sql, params = []) {
    return this.pool.query(sql, params);
  }

  async get(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows[0] ?? null;
  }

  async all(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async run(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return {
      lastID: result.rows[0]?.id ?? null,
      changes: result.rowCount,
    };
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = { TenantDb, MasterDb };
