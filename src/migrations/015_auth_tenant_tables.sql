-- Migration 015: Auth tables per tenant schema (usuarios, refresh_tokens, tokens_senha, audit_log)
-- Estas tabelas vivem no schema clinica_{slug} de cada tenant.
-- Executar via MultiTenantPostgres.runMigration() ou manualmente por schema.

CREATE TABLE IF NOT EXISTS usuarios (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  senha_hash      TEXT,
  role            TEXT NOT NULL DEFAULT 'medico'
                    CHECK(role IN ('admin', 'recepcionista', 'enfermeira', 'medico', 'financeiro')),
  permissions     JSONB DEFAULT '{}',
  avatar          TEXT,
  telefone        TEXT,
  crm             TEXT,
  especialidade   TEXT,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE,
  tentativas_login INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate   TIMESTAMPTZ,
  ultimo_acesso   TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  invite_token    TEXT,
  invite_expire_at TIMESTAMPTZ,
  status          TEXT DEFAULT 'active',
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            BIGSERIAL PRIMARY KEY,
  usuario_id    BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  expira_em     TIMESTAMPTZ NOT NULL,
  revogado      BOOLEAN NOT NULL DEFAULT FALSE,
  ip_origem     TEXT,
  user_agent    TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expira ON refresh_tokens(expira_em);

CREATE TABLE IF NOT EXISTS tokens_senha (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  tipo        TEXT NOT NULL CHECK(tipo IN ('primeiro_acesso', 'recuperacao')),
  expira_em   TIMESTAMPTZ NOT NULL,
  usado       BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_senha_hash ON tokens_senha(token_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_senha_usuario ON tokens_senha(usuario_id);

-- Audit log: leitura/escrita de dados sensíveis (LGPD)
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  BIGINT NOT NULL,
  acao        TEXT NOT NULL,       -- 'read', 'create', 'update', 'delete'
  recurso     TEXT NOT NULL,       -- 'prontuario', 'paciente', etc.
  recurso_id  TEXT,
  ip          TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_recurso ON audit_log(recurso, recurso_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_criado ON audit_log(criado_em);
