-- Migration 018: Tabela de check-ins por schema de tenant

CREATE TABLE IF NOT EXISTS checkins (
  id                BIGSERIAL PRIMARY KEY,
  agendamento_id    BIGINT,
  paciente_id       BIGINT NOT NULL,
  profissional_id   BIGINT NOT NULL,
  hora_chegada      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status            VARCHAR(30) NOT NULL DEFAULT 'presente'
                      CHECK (status IN ('presente', 'em_atendimento', 'finalizado', 'cancelado')),
  observacao        TEXT,
  criado_por        BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_data
  ON checkins (DATE(hora_chegada) DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_profissional
  ON checkins (profissional_id, DATE(hora_chegada));
CREATE INDEX IF NOT EXISTS idx_checkins_paciente
  ON checkins (paciente_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_agendamento_unico
  ON checkins (agendamento_id)
  WHERE agendamento_id IS NOT NULL;

-- Tabela fila_espera (referenciada pelo check-in)
CREATE TABLE IF NOT EXISTS fila_espera (
  id              BIGSERIAL PRIMARY KEY,
  checkin_id      BIGINT REFERENCES checkins(id) ON DELETE CASCADE,
  profissional_id BIGINT NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'aguardando_triagem'
                    CHECK (status IN ('aguardando_triagem', 'em_triagem', 'aguardando_medico', 'em_atendimento', 'finalizado', 'cancelado')),
  posicao         INTEGER NOT NULL DEFAULT 1,
  tempo_espera_min INTEGER,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fila_espera_profissional ON fila_espera(profissional_id);
CREATE INDEX IF NOT EXISTS idx_fila_espera_status ON fila_espera(status);
CREATE INDEX IF NOT EXISTS idx_fila_espera_data ON fila_espera(DATE(criado_em));
