/**
 * MultiTenantPostgres — Gerenciador de multi-tenancy com schema por tenant
 *
 * Substitui: src/models/MultiTenantDatabase.js (better-sqlite3 + arquivo por tenant)
 * Novo modelo: um banco PostgreSQL único com schemas separados por tenant
 *
 * Master schema (public):
 *   public.tenants, public.master_users, public.global_invites
 *
 * Tenant schema:
 *   clinica_{slug}.usuarios, clinica_{slug}.pacientes, etc.
 */
const pool = require('./postgres');
const { TenantDb, MasterDb } = require('./TenantDb');

const MASTER_SCHEMA = 'public';

class MultiTenantPostgresManager {
  constructor() {
    this._masterDb = new MasterDb(pool);
    // Cache de TenantDb por tenantId para evitar recriar a cada request
    this._tenantCache = new Map();
  }

  // ─── Master DB ────────────────────────────────────────────────────────────

  getMasterDb() {
    return this._masterDb;
  }

  // ─── Schema name helpers ──────────────────────────────────────────────────

  /** Gera o nome do schema PostgreSQL a partir do slug do tenant */
  static schemaName(slug) {
    // Normaliza: só letras minúsculas, números e underscore
    return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  // ─── Tenant DB ────────────────────────────────────────────────────────────

  /**
   * Retorna (ou cria se necessário) o TenantDb para o tenant.
   * @param {string} tenantId
   * @param {string} slug  — necessário na primeira vez para criar o schema
   */
  getTenantDb(tenantId, slug) {
    if (!this._tenantCache.has(tenantId)) {
      const schema = slug
        ? MultiTenantPostgresManager.schemaName(slug)
        : `clinica_${tenantId.replace(/-/g, '_')}`;
      this._tenantCache.set(tenantId, new TenantDb(pool, schema));
    }
    return this._tenantCache.get(tenantId);
  }

  // ─── Schema provisioning ──────────────────────────────────────────────────

  /** Cria as tabelas master no schema public (idempotente) */
  async initMasterSchema() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(MASTER_SCHEMA_SQL);
      await client.query('COMMIT');
      console.log('✅ Schema master (public) inicializado');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao inicializar schema master:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Provisiona o schema de um novo tenant (idempotente).
   * Chamado no onboarding de uma nova clínica.
   * @param {string} tenantId
   * @param {string} slug
   */
  async createTenantSchema(tenantId, slug) {
    const schema = MultiTenantPostgresManager.schemaName(slug);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Cria o schema se não existir
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      // Seta o search_path para o schema do tenant
      await client.query(`SET search_path = "${schema}", public`);
      // Cria todas as tabelas
      await client.query(TENANT_SCHEMA_SQL);
      await client.query('COMMIT');
      console.log(`✅ Schema do tenant criado: ${schema}`);
      return schema;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Erro ao criar schema do tenant ${slug}:`, err.message);
      throw err;
    } finally {
      try { await client.query('SET search_path = public'); } catch (_) {}
      client.release();
    }
  }

  /** Lista todos os tenants do banco master */
  async listTenants() {
    return this._masterDb.all('SELECT * FROM tenants ORDER BY created_at');
  }

  /** Fecha o pool (graceful shutdown) */
  async closeAll() {
    this._tenantCache.clear();
    await pool.end();
    console.log('🔒 Pool PostgreSQL fechado');
  }
}

// ─── SQL: Schema master (public) ─────────────────────────────────────────────

const MASTER_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tenants (
    id          TEXT PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL,
    telefone    TEXT,
    plano       TEXT DEFAULT 'trial',
    status      TEXT DEFAULT 'trial',
    trial_expire_at TIMESTAMPTZ,
    schema_name TEXT UNIQUE,
    config      JSONB DEFAULT '{}',
    billing     JSONB DEFAULT '{}',
    theme       JSONB DEFAULT '{}',
    cnpj_cpf    TEXT,
    chave_licenca TEXT UNIQUE,
    responsavel_nome  TEXT,
    responsavel_email TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS master_users (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    senha_hash  TEXT NOT NULL,
    role        TEXT DEFAULT 'owner',
    name        TEXT,
    first_access_completed BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, tenant_id)
  );

  CREATE TABLE IF NOT EXISTS global_invites (
    id           BIGSERIAL PRIMARY KEY,
    tenant_id    TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email        TEXT NOT NULL,
    invite_token TEXT UNIQUE NOT NULL,
    expire_at    TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_tenants_slug   ON tenants(slug);
  CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
`;

// ─── SQL: Schema tenant ──────────────────────────────────────────────────────

const TENANT_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    senha_hash  TEXT,
    role        TEXT DEFAULT 'medico',
    permissions JSONB DEFAULT '{}',
    avatar      TEXT,
    telefone    TEXT,
    crm         TEXT,
    especialidade TEXT,
    status      TEXT DEFAULT 'active',
    last_login  TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    invite_token      TEXT,
    invite_expire_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS pacientes (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       TEXT NOT NULL,
    nome            TEXT NOT NULL,
    email           TEXT,
    telefone        TEXT,
    cpf             TEXT,
    data_nascimento DATE,
    endereco        TEXT,
    observacoes     TEXT,
    status          TEXT DEFAULT 'ativo',
    foto            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS agendamentos (
    id               BIGSERIAL PRIMARY KEY,
    tenant_id        TEXT NOT NULL,
    paciente_id      BIGINT NOT NULL REFERENCES pacientes(id),
    medico_id        BIGINT REFERENCES usuarios(id),
    data_agendamento TIMESTAMPTZ NOT NULL,
    duracao          INTEGER DEFAULT 60,
    servico          TEXT,
    status           TEXT DEFAULT 'agendado',
    observacoes      TEXT,
    valor            DECIMAL(10,2),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS servicos (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    nome        TEXT NOT NULL,
    descricao   TEXT,
    duracao     INTEGER DEFAULT 60,
    valor       DECIMAL(10,2),
    ativo       BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS faturas (
    id               BIGSERIAL PRIMARY KEY,
    tenant_id        TEXT NOT NULL,
    paciente_id      BIGINT NOT NULL REFERENCES pacientes(id),
    agendamento_id   BIGINT REFERENCES agendamentos(id),
    numero_fatura    TEXT,
    descricao        TEXT NOT NULL,
    valor            DECIMAL(10,2) NOT NULL,
    vencimento       DATE NOT NULL,
    status           TEXT DEFAULT 'pendente',
    link_pagamento   TEXT,
    data_pagamento   TIMESTAMPTZ,
    metodo_pagamento TEXT,
    observacoes      TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS whatsapp_conversas (
    id               BIGSERIAL PRIMARY KEY,
    tenant_id        TEXT NOT NULL,
    paciente_id      BIGINT REFERENCES pacientes(id),
    telefone         TEXT NOT NULL,
    ultima_mensagem  TEXT,
    ultima_atividade TIMESTAMPTZ,
    status           TEXT DEFAULT 'ativa',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    conversa_id BIGINT NOT NULL REFERENCES whatsapp_conversas(id),
    tipo        TEXT NOT NULL,
    conteudo    TEXT NOT NULL,
    status      TEXT DEFAULT 'enviada',
    webhook_id  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id           BIGSERIAL PRIMARY KEY,
    client_id    TEXT NOT NULL UNIQUE,
    instance_id  TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    status       TEXT DEFAULT 'pending',
    api_token    TEXT,
    api_url      TEXT,
    api_key      TEXT,
    webhook_url  TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS whatsapp_usage (
    id              BIGSERIAL PRIMARY KEY,
    client_id       TEXT NOT NULL,
    month           INTEGER NOT NULL,
    year            INTEGER NOT NULL,
    used_messages   INTEGER DEFAULT 0,
    limit_messages  INTEGER NOT NULL,
    plan_type       TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, month, year)
  );

  CREATE TABLE IF NOT EXISTS configuracoes (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    chave       TEXT NOT NULL UNIQUE,
    valor       TEXT,
    tipo        TEXT DEFAULT 'string',
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS automacoes (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id      TEXT NOT NULL,
    nome           TEXT NOT NULL,
    tipo           TEXT NOT NULL,
    trigger_evento TEXT NOT NULL,
    condicoes      JSONB,
    acoes          JSONB NOT NULL,
    ativo          BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS professional_schedules (
    id                BIGSERIAL PRIMARY KEY,
    tenant_id         TEXT NOT NULL,
    professional_id   BIGINT,
    professional_name TEXT NOT NULL,
    day_of_week       INTEGER NOT NULL,
    start_time        TEXT NOT NULL,
    end_time          TEXT NOT NULL,
    pause_start       TEXT,
    pause_end         TEXT,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS medicos (
    id           BIGSERIAL PRIMARY KEY,
    tenant_id    TEXT NOT NULL,
    nome         TEXT NOT NULL,
    crm          TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    telefone     TEXT NOT NULL,
    email        TEXT,
    observacoes  TEXT,
    status       TEXT DEFAULT 'ativo',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, crm)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    usuario_id  BIGINT,
    acao        TEXT NOT NULL,
    entidade    TEXT,
    entidade_id BIGINT,
    detalhes    JSONB,
    ip_address  TEXT,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  -- Índices de performance
  CREATE INDEX IF NOT EXISTS idx_pacientes_tenant        ON pacientes(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_agendamentos_tenant     ON agendamentos(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_agendamentos_data       ON agendamentos(data_agendamento);
  CREATE INDEX IF NOT EXISTS idx_faturas_tenant          ON faturas(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_faturas_vencimento      ON faturas(vencimento);
  CREATE INDEX IF NOT EXISTS idx_wa_conversas_tenant     ON whatsapp_conversas(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_wa_mensagens_conversa   ON whatsapp_mensagens(conversa_id);
  CREATE INDEX IF NOT EXISTS idx_wa_instances_client     ON whatsapp_instances(client_id);
  CREATE INDEX IF NOT EXISTS idx_wa_usage_client_month   ON whatsapp_usage(client_id, month, year);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant    ON activity_logs(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_usuarios_email          ON usuarios(email);
  CREATE INDEX IF NOT EXISTS idx_prof_schedules_tenant   ON professional_schedules(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_prof_schedules_prof     ON professional_schedules(professional_id);

  -- ── Prontuário Eletrônico ────────────────────────────────────────────────

  CREATE TABLE IF NOT EXISTS prontuario_registros (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id          BIGINT NOT NULL,
    profissional_id      BIGINT NOT NULL,
    agendamento_id       BIGINT,
    form_definition_id   UUID NOT NULL,
    data_registro        DATE NOT NULL DEFAULT CURRENT_DATE,
    data_json            JSONB NOT NULL DEFAULT '{}',
    assinado             BOOLEAN DEFAULT false,
    assinado_em          TIMESTAMPTZ,
    assinado_por         BIGINT,
    ref_registro_id      UUID REFERENCES prontuario_registros(id) ON DELETE SET NULL,
    tipo_registro        VARCHAR(20) DEFAULT 'registro'
                           CHECK (tipo_registro IN ('registro','addendum')),
    pep_origem_id        BIGINT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_pront_reg_paciente ON prontuario_registros(paciente_id);
  CREATE INDEX IF NOT EXISTS idx_pront_reg_data ON prontuario_registros(data_registro DESC);

  CREATE OR REPLACE FUNCTION block_signed_update()
  RETURNS TRIGGER AS $$
  BEGIN
    IF OLD.assinado = true AND NEW.assinado = true THEN
      RAISE EXCEPTION 'Registro assinado não pode ser editado. Crie um addendum.';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_block_signed_update ON prontuario_registros;
  CREATE TRIGGER trg_block_signed_update
  BEFORE UPDATE ON prontuario_registros
  FOR EACH ROW EXECUTE FUNCTION block_signed_update();

  CREATE TABLE IF NOT EXISTS prontuario_diagnosticos (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id      BIGINT NOT NULL,
    profissional_id  BIGINT NOT NULL,
    registro_id      UUID REFERENCES prontuario_registros(id) ON DELETE SET NULL,
    cid10_codigo     VARCHAR(10) NOT NULL,
    cid10_descricao  VARCHAR(255) NOT NULL,
    tipo             VARCHAR(20) DEFAULT 'principal' CHECK (tipo IN ('principal','secundario')),
    data_diagnostico DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_diag_cid10 ON prontuario_diagnosticos(cid10_codigo);
  CREATE INDEX IF NOT EXISTS idx_diag_paciente ON prontuario_diagnosticos(paciente_id);
  CREATE INDEX IF NOT EXISTS idx_diag_data ON prontuario_diagnosticos(data_diagnostico DESC);

  CREATE TABLE IF NOT EXISTS prontuario_prescricoes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id      BIGINT NOT NULL,
    profissional_id  BIGINT NOT NULL,
    registro_id      UUID REFERENCES prontuario_registros(id) ON DELETE SET NULL,
    itens_json       JSONB NOT NULL DEFAULT '[]',
    observacoes      TEXT,
    data_prescricao  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_prescricoes_paciente ON prontuario_prescricoes(paciente_id);

  CREATE TABLE IF NOT EXISTS prontuario_encaminhamentos (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id           BIGINT NOT NULL,
    profissional_id       BIGINT NOT NULL,
    registro_id           UUID REFERENCES prontuario_registros(id) ON DELETE SET NULL,
    especialidade_destino VARCHAR(255) NOT NULL,
    cid10_codigo          VARCHAR(10),
    cid10_descricao       VARCHAR(255),
    motivo                TEXT,
    data_encaminhamento   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at            TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_encam_paciente ON prontuario_encaminhamentos(paciente_id);

  CREATE TABLE IF NOT EXISTS prontuario_exames (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id     BIGINT NOT NULL,
    profissional_id BIGINT NOT NULL,
    registro_id     UUID REFERENCES prontuario_registros(id) ON DELETE SET NULL,
    tipo            VARCHAR(50) CHECK (tipo IN ('laboratorial','imagem','outro')),
    descricao       TEXT,
    resultado_json  JSONB,
    arquivo_url     VARCHAR(500),
    data_exame      DATE,
    created_at      TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_exames_paciente ON prontuario_exames(paciente_id);
`;

// Exporta singleton
const multiTenantPostgres = new MultiTenantPostgresManager();

module.exports = multiTenantPostgres;
module.exports.MultiTenantPostgresManager = MultiTenantPostgresManager;
module.exports.schemaName = MultiTenantPostgresManager.schemaName;
