-- Migration 022: Histórico de Atendimentos (schema por tenant)

CREATE TABLE IF NOT EXISTS historico_eventos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       BIGINT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL,
  tipo_evento       VARCHAR(50) NOT NULL,
  referencia_id     UUID,
  referencia_tabela VARCHAR(100),
  descricao         TEXT NOT NULL,
  categoria         VARCHAR(30) NOT NULL DEFAULT 'geral'
                      CHECK (categoria IN ('clinico','financeiro','whatsapp','agendamento','crm','geral')),
  usuario_id        BIGINT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hist_paciente
  ON historico_eventos (tenant_id, paciente_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_hist_tipo
  ON historico_eventos (tenant_id, paciente_id, tipo_evento);

CREATE INDEX IF NOT EXISTS idx_hist_categoria
  ON historico_eventos (tenant_id, paciente_id, categoria);

CREATE INDEX IF NOT EXISTS idx_hist_criado_em
  ON historico_eventos (tenant_id, criado_em DESC);
