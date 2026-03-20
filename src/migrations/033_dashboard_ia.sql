-- Migration 033: Dashboard IA — cache, alertas, config e metas
-- Placeholder %%SCHEMA%% será substituído pelo runner de migrations

CREATE TABLE IF NOT EXISTS %%SCHEMA%%.dashboard_cache (
  id           BIGSERIAL PRIMARY KEY,
  tenant_id    TEXT        NOT NULL,
  perfil       TEXT        NOT NULL,
  contexto_id  TEXT,
  tipo         TEXT        NOT NULL,
  dados_json   JSONB       NOT NULL,
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em    TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, perfil, contexto_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_dash_cache_lookup
  ON %%SCHEMA%%.dashboard_cache(tenant_id, perfil, contexto_id, tipo, expira_em);

CREATE INDEX IF NOT EXISTS idx_dashcache_tenant_tipo_expira
  ON %%SCHEMA%%.dashboard_cache(tenant_id, tipo, expira_em);

CREATE TABLE IF NOT EXISTS %%SCHEMA%%.alertas_proativos (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     TEXT        NOT NULL,
  usuario_id    INTEGER,
  perfil_alvo   TEXT,
  tipo          TEXT        NOT NULL,
  prioridade    TEXT        NOT NULL DEFAULT 'normal'
                  CHECK (prioridade IN ('baixa','normal','alta','critica')),
  titulo        TEXT        NOT NULL,
  mensagem      TEXT        NOT NULL,
  dados_json    JSONB,
  acao_url      TEXT,
  lido          BOOLEAN     NOT NULL DEFAULT false,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lido_em       TIMESTAMPTZ,
  expira_em     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alertas_tenant_usuario
  ON %%SCHEMA%%.alertas_proativos(tenant_id, usuario_id, lido, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_alertas_tenant_perfil
  ON %%SCHEMA%%.alertas_proativos(tenant_id, perfil_alvo, lido, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_alertas_tenant_tipo_criado
  ON %%SCHEMA%%.alertas_proativos(tenant_id, tipo, criado_em DESC);

CREATE TABLE IF NOT EXISTS %%SCHEMA%%.dashboard_config (
  id                  BIGSERIAL PRIMARY KEY,
  usuario_id          INTEGER     NOT NULL UNIQUE,
  tenant_id           TEXT        NOT NULL,
  layout_json         JSONB       NOT NULL DEFAULT '{}',
  alertas_config_json JSONB       NOT NULL DEFAULT '{}',
  horario_briefing    TEXT        NOT NULL DEFAULT '07:00',
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_config_tenant
  ON %%SCHEMA%%.dashboard_config(tenant_id, usuario_id);

CREATE TABLE IF NOT EXISTS %%SCHEMA%%.metas_dashboard (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT           NOT NULL,
  tipo        TEXT           NOT NULL
                CHECK (tipo IN ('receita','atendimentos','no_show_max','inadimplencia_max')),
  valor_meta  NUMERIC(10,2)  NOT NULL,
  mes         TEXT           NOT NULL,
  criado_por  INTEGER        NOT NULL,
  criado_em   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, tipo, mes)
);

CREATE INDEX IF NOT EXISTS idx_metas_tenant_mes
  ON %%SCHEMA%%.metas_dashboard(tenant_id, mes);

-- Index for agendamentos_lite used by KPI engine
CREATE INDEX IF NOT EXISTS idx_agl_tenant_data_status
  ON %%SCHEMA%%.agendamentos_lite(tenant_id, data, status);
