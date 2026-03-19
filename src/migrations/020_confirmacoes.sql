-- Migration 020: Tabela de confirmações de agendamentos por schema de tenant

CREATE TABLE IF NOT EXISTS confirmacoes (
  id                      BIGSERIAL PRIMARY KEY,
  agendamento_id          BIGINT NOT NULL UNIQUE,
  status                  VARCHAR(20) NOT NULL DEFAULT 'pendente'
                            CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'sem_resposta', 'whatsapp_enviado')),
  canal                   VARCHAR(20)
                            CHECK (canal IN ('whatsapp', 'telefone', 'presencial', 'sistema')),
  enviado_em              TIMESTAMPTZ,
  respondido_em           TIMESTAMPTZ,
  motivo_cancelamento     TEXT,
  contexto_whatsapp_id    VARCHAR(255),
  criado_por              BIGINT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_confirmacoes_agendamento
  ON confirmacoes (agendamento_id);

CREATE INDEX IF NOT EXISTS idx_confirmacoes_status
  ON confirmacoes (status);

CREATE INDEX IF NOT EXISTS idx_confirmacoes_whatsapp_id
  ON confirmacoes (contexto_whatsapp_id)
  WHERE contexto_whatsapp_id IS NOT NULL;
