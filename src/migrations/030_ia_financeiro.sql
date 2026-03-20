-- Migration 030: IA Financeira — Score de Risco e Insights (schema por tenant)

CREATE TABLE IF NOT EXISTS "%%SCHEMA%%".ia_scores_financeiros (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  paciente_id     BIGINT NOT NULL,
  score           INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  categoria       TEXT NOT NULL CHECK (categoria IN ('baixo','medio','alto')),
  fatores_json    JSONB NOT NULL,
  calculado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, paciente_id)
);
CREATE INDEX IF NOT EXISTS idx_ia_scores_tenant    ON "%%SCHEMA%%".ia_scores_financeiros (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ia_scores_categoria ON "%%SCHEMA%%".ia_scores_financeiros (categoria);
CREATE INDEX IF NOT EXISTS idx_ia_scores_score     ON "%%SCHEMA%%".ia_scores_financeiros (score DESC);

CREATE TABLE IF NOT EXISTS "%%SCHEMA%%".ia_scores_historico (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  paciente_id     BIGINT NOT NULL,
  score           INTEGER NOT NULL,
  categoria       TEXT NOT NULL,
  fatores_json    JSONB NOT NULL,
  calculado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ia_hist_paciente ON "%%SCHEMA%%".ia_scores_historico (tenant_id, paciente_id, calculado_em DESC);

CREATE TABLE IF NOT EXISTS "%%SCHEMA%%".ia_insights_financeiros (
  id                BIGSERIAL PRIMARY KEY,
  tenant_id         TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('mensal','semanal','alerta')),
  periodo_referencia TEXT NOT NULL,
  conteudo          TEXT NOT NULL,
  dados_entrada_json JSONB NOT NULL,
  tokens_usados     INTEGER,
  modelo_claude     TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lido_em           TIMESTAMPTZ,
  UNIQUE(tenant_id, tipo, periodo_referencia)
);
CREATE INDEX IF NOT EXISTS idx_ia_insights_tenant ON "%%SCHEMA%%".ia_insights_financeiros (tenant_id, tipo, criado_em DESC);

CREATE TABLE IF NOT EXISTS "%%SCHEMA%%".ia_alertas (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  tipo_alerta     TEXT NOT NULL CHECK (tipo_alerta IN (
    'receita_caindo','inadimplencia_crescendo','caixa_critico',
    'queda_producao_profissional','procedimento_lucrativo'
  )),
  titulo          TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  valor_gatilho   NUMERIC(10,4),
  dados_json      JSONB,
  lido_em         TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ia_alertas_tenant ON "%%SCHEMA%%".ia_alertas (tenant_id, lido_em, criado_em DESC);
