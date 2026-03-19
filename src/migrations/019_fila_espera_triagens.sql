-- Migration 019: Triagens + atualizar fila_espera com novos campos

-- Adicionar colunas de tempo na fila_espera (se não existirem)
ALTER TABLE fila_espera
  ADD COLUMN IF NOT EXISTS chamado_em         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS atendimento_inicio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS atendimento_fim    TIMESTAMPTZ;

-- Atualizar CHECK constraint de status para incluir aguardando_atendimento
ALTER TABLE fila_espera
  DROP CONSTRAINT IF EXISTS fila_espera_status_check;

ALTER TABLE fila_espera
  ADD CONSTRAINT fila_espera_status_check
    CHECK (status IN (
      'aguardando_triagem',
      'em_triagem',
      'aguardando_atendimento',
      'em_atendimento',
      'finalizado',
      'cancelado'
    ));

-- Índice único por checkin (1 entrada de fila por check-in)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fila_checkin_unico
  ON fila_espera (checkin_id);

-- Índice composto por profissional + data
CREATE INDEX IF NOT EXISTS idx_fila_profissional_data
  ON fila_espera (profissional_id, DATE(criado_em));

-- Índice parcial nos status ativos
CREATE INDEX IF NOT EXISTS idx_fila_status
  ON fila_espera (status)
  WHERE status NOT IN ('finalizado', 'cancelado');

-- Tabela de triagens: 1:1 com fila_espera
CREATE TABLE IF NOT EXISTS triagens (
  id                BIGSERIAL PRIMARY KEY,
  fila_espera_id    BIGINT NOT NULL REFERENCES fila_espera(id) ON DELETE CASCADE,
  checkin_id        BIGINT NOT NULL,
  enfermeira_id     BIGINT NOT NULL,
  pressao           VARCHAR(10),
  peso              NUMERIC(5,2),
  temperatura       NUMERIC(4,1),
  saturacao         SMALLINT,
  queixa_principal  TEXT NOT NULL,
  observacoes       TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_triagem_fila_unico
  ON triagens (fila_espera_id);

CREATE INDEX IF NOT EXISTS idx_triagem_checkin
  ON triagens (checkin_id);
