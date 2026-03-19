-- Migration 024: CRM Sugestões IA (schema por tenant)

CREATE TABLE IF NOT EXISTS crm_sugestoes_ia (
  id              BIGSERIAL PRIMARY KEY,
  paciente_id     BIGINT        NOT NULL REFERENCES pacientes(id),
  tipo            TEXT          NOT NULL CHECK (tipo IN (
                    'retorno_programado',
                    'indicado_nao_realizado',
                    'paciente_inativo',
                    'upgrade_procedimento',
                    'sazonal',
                    'recontato_perda_preco'
                  )),
  procedimento_id BIGINT        REFERENCES procedimentos(id),
  descricao       TEXT          NOT NULL,
  valor_estimado  NUMERIC(12,2),
  prioridade      TEXT          NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
  status          TEXT          NOT NULL DEFAULT 'pendente' CHECK (status IN (
                    'pendente','convertida','ignorada','adiada'
                  )),
  adiado_ate      TIMESTAMPTZ,
  oportunidade_id BIGINT        REFERENCES crm_oportunidades(id),
  metadata        TEXT,
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Deduplicação: linhas com procedimento_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_sugestoes_unique_proc
  ON crm_sugestoes_ia (paciente_id, tipo, procedimento_id)
  WHERE procedimento_id IS NOT NULL;

-- Deduplicação: linhas sem procedimento_id (ex: paciente_inativo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sugestoes_unique_no_proc
  ON crm_sugestoes_ia (paciente_id, tipo)
  WHERE procedimento_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sugestoes_status   ON crm_sugestoes_ia (status);
CREATE INDEX IF NOT EXISTS idx_sugestoes_paciente ON crm_sugestoes_ia (paciente_id);
CREATE INDEX IF NOT EXISTS idx_sugestoes_tipo     ON crm_sugestoes_ia (tipo);
CREATE INDEX IF NOT EXISTS idx_sugestoes_adiado   ON crm_sugestoes_ia (adiado_ate) WHERE adiado_ate IS NOT NULL;

-- Configuração por tenant (editável pelo admin)
CREATE TABLE IF NOT EXISTS crm_sugestoes_config (
  id                       BIGSERIAL PRIMARY KEY,
  dias_inatividade         INTEGER       NOT NULL DEFAULT 90,
  dias_recontato_perda     INTEGER       NOT NULL DEFAULT 60,
  ticket_minimo_upgrade    NUMERIC(12,2) NOT NULL DEFAULT 500.00,
  procedimentos_excluidos  TEXT          NOT NULL DEFAULT '[]',
  ativo                    INTEGER       NOT NULL DEFAULT 1,
  atualizado_em            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Seed de configuração padrão
INSERT INTO crm_sugestoes_config (id, dias_inatividade, dias_recontato_perda, ticket_minimo_upgrade)
VALUES (1, 90, 60, 500.00)
ON CONFLICT (id) DO NOTHING;

-- Coluna de retorno no catálogo de procedimentos (se ainda não existir)
ALTER TABLE procedimentos ADD COLUMN IF NOT EXISTS janela_retorno_dias INTEGER;
ALTER TABLE procedimentos ADD COLUMN IF NOT EXISTS categoria TEXT;
