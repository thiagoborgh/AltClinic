-- Migration 034: Admin Master — Planos, Audit Log, Impersonação, Feature Flags

-- Planos disponíveis na plataforma
CREATE TABLE IF NOT EXISTS public.planos (
  id              BIGSERIAL PRIMARY KEY,
  nome            TEXT NOT NULL UNIQUE,
  preco_mensal    NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_usuarios    INTEGER,
  max_pacientes   INTEGER,
  max_armazenamento_mb INTEGER,
  features_json   JSONB NOT NULL DEFAULT '{}',
  stripe_price_id TEXT,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir planos padrão (idempotente)
INSERT INTO public.planos (nome, preco_mensal, max_usuarios, max_pacientes, features_json)
VALUES
  ('trial',      0,     2,   500,  '{"whatsapp_ativo":false,"crm_ativo":false,"ia_basica":false,"ia_completa":false,"qr_billing":false,"relatorios_avancados":false,"max_profissionais":2,"api_access":false}'::jsonb),
  ('starter',    197,   5,   2000, '{"whatsapp_ativo":true,"crm_ativo":false,"ia_basica":false,"ia_completa":false,"qr_billing":true,"relatorios_avancados":false,"max_profissionais":5,"api_access":false}'::jsonb),
  ('pro',        497,   15,  null, '{"whatsapp_ativo":true,"crm_ativo":true,"ia_basica":true,"ia_completa":false,"qr_billing":true,"relatorios_avancados":true,"max_profissionais":15,"api_access":false}'::jsonb),
  ('enterprise', 997,   null,null, '{"whatsapp_ativo":true,"crm_ativo":true,"ia_basica":true,"ia_completa":true,"qr_billing":true,"relatorios_avancados":true,"max_profissionais":null,"api_access":true}'::jsonb)
ON CONFLICT (nome) DO NOTHING;

-- Usuários do painel admin (time AltClinic) — separado de master_users
CREATE TABLE IF NOT EXISTS public.admin_usuarios (
  id            BIGSERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  senha_hash    TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'suporte'
                  CHECK (role IN ('super_admin','suporte','cs','financeiro')),
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_acesso TIMESTAMPTZ
);

-- Audit log de ações admin
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            BIGSERIAL PRIMARY KEY,
  admin_id      BIGINT NOT NULL DEFAULT 0,
  tenant_slug   TEXT,
  acao          TEXT NOT NULL,
  detalhes_json JSONB,
  ip            TEXT,
  user_agent    TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin    ON public.admin_audit_log (admin_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tenant   ON public.admin_audit_log (tenant_slug, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_acao     ON public.admin_audit_log (acao);

-- Sessões de impersonação
CREATE TABLE IF NOT EXISTS public.impersonacao_sessoes (
  id            BIGSERIAL PRIMARY KEY,
  admin_id      BIGINT NOT NULL,
  tenant_slug   TEXT NOT NULL,
  motivo        TEXT NOT NULL,
  token_sessao  TEXT NOT NULL UNIQUE,
  inicio        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fim           TIMESTAMPTZ,
  ip            TEXT
);

CREATE INDEX IF NOT EXISTS idx_imp_admin  ON public.impersonacao_sessoes (admin_id);
CREATE INDEX IF NOT EXISTS idx_imp_token  ON public.impersonacao_sessoes (token_sessao);

-- Histórico de mudanças de plano
CREATE TABLE IF NOT EXISTS public.tenant_planos_historico (
  id             BIGSERIAL PRIMARY KEY,
  tenant_slug    TEXT NOT NULL,
  plano_anterior TEXT,
  plano_novo     TEXT NOT NULL,
  motivo         TEXT,
  admin_id       BIGINT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas novas na tabela tenants existente (idempotente)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS email_admin         TEXT,
  ADD COLUMN IF NOT EXISTS plano_id            BIGINT REFERENCES public.planos(id),
  ADD COLUMN IF NOT EXISTS stripe_customer_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS trial_inicio        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_fim           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plano_ativo_desde   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proximo_ciclo       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS uso_pacientes       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uso_usuarios        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uso_armazenamento_mb INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_acesso       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
  ADD COLUMN IF NOT EXISTS atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_tenants_plano ON public.tenants (plano_id);
CREATE INDEX IF NOT EXISTS idx_tenants_trial ON public.tenants (trial_fim);
