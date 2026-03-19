-- Migration 025: CRM Follow-up Automático via WhatsApp (schema por tenant)

-- Sequências de follow-up configuráveis por etapa
CREATE TABLE IF NOT EXISTS crm_sequencias (
  id        BIGSERIAL PRIMARY KEY,
  etapa_id  BIGINT      NOT NULL REFERENCES crm_etapas_config(id),
  nome      TEXT        NOT NULL,
  ativo     INTEGER     NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seq_etapa ON crm_sequencias (etapa_id, ativo);

-- Passos de cada sequência
CREATE TABLE IF NOT EXISTS crm_sequencias_passos (
  id                BIGSERIAL PRIMARY KEY,
  sequencia_id      BIGINT      NOT NULL REFERENCES crm_sequencias(id),
  ordem             INTEGER     NOT NULL,
  gatilho_tipo      TEXT        NOT NULL CHECK (gatilho_tipo IN ('entrada_etapa','dias_sem_resposta','manual')),
  gatilho_dias      INTEGER     NOT NULL DEFAULT 0,
  mensagem_template TEXT        NOT NULL,
  horario_inicio    INTEGER     NOT NULL DEFAULT 8,
  horario_fim       INTEGER     NOT NULL DEFAULT 20,
  modo              TEXT        NOT NULL DEFAULT 'semi_automatico'
                      CHECK (modo IN ('semi_automatico','automatico')),
  ativo             INTEGER     NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_passo_seq ON crm_sequencias_passos (sequencia_id, ordem);

-- Fila de mensagens agendadas/pendentes de aprovação
CREATE TABLE IF NOT EXISTS crm_followup_fila (
  id                   BIGSERIAL PRIMARY KEY,
  oportunidade_id      BIGINT      NOT NULL REFERENCES crm_oportunidades(id),
  passo_id             BIGINT      NOT NULL REFERENCES crm_sequencias_passos(id),
  mensagem_renderizada TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'pendente'
                         CHECK (status IN ('pendente','aprovado','enviado','cancelado','erro')),
  agendado_para        TIMESTAMPTZ NOT NULL,
  enviado_em           TIMESTAMPTZ,
  whatsapp_message_id  TEXT,
  tentativas           INTEGER     NOT NULL DEFAULT 0,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fila_status      ON crm_followup_fila (status);
CREATE INDEX IF NOT EXISTS idx_fila_agendado    ON crm_followup_fila (agendado_para, status);
CREATE INDEX IF NOT EXISTS idx_fila_oportunidade ON crm_followup_fila (oportunidade_id);

-- Opt-outs — pacientes que solicitaram parar de receber mensagens automáticas
CREATE TABLE IF NOT EXISTS crm_optouts (
  id          BIGSERIAL PRIMARY KEY,
  paciente_id BIGINT      NOT NULL UNIQUE REFERENCES pacientes(id),
  motivo      TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optout_paciente ON crm_optouts (paciente_id);
