-- Migration: WhatsApp Central de Atendimento (schema por tenant)

-- ─── CONVERSAS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_conversas (
  id                  BIGSERIAL   PRIMARY KEY,
  tenant_id           TEXT        NOT NULL,
  paciente_id         BIGINT      REFERENCES pacientes(id) ON DELETE SET NULL,
  numero              TEXT        NOT NULL,
  atendente_id        BIGINT      REFERENCES usuarios(id) ON DELETE SET NULL,
  status              TEXT        NOT NULL DEFAULT 'aberta'
                        CHECK (status IN ('aberta','aguardando','encerrada')),
  tag                 TEXT        CHECK (tag IN ('agendamento','cobranca','crm','duvida','outro','bot')),
  origem              TEXT        NOT NULL DEFAULT 'paciente'
                        CHECK (origem IN ('paciente','bot','sistema')),
  nao_lidas           INTEGER     NOT NULL DEFAULT 0,
  ultima_mensagem_em  TIMESTAMPTZ,
  ultima_mensagem_pre TEXT,
  sem_resposta_alerta BOOLEAN     NOT NULL DEFAULT false,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_tenant_status ON whatsapp_conversas(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_wc_paciente      ON whatsapp_conversas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_wc_numero        ON whatsapp_conversas(numero);
CREATE INDEX IF NOT EXISTS idx_wc_ultima_msg    ON whatsapp_conversas(ultima_mensagem_em DESC);

-- ─── MENSAGENS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id              BIGSERIAL   PRIMARY KEY,
  conversa_id     BIGINT      NOT NULL REFERENCES whatsapp_conversas(id) ON DELETE CASCADE,
  direcao         TEXT        NOT NULL CHECK (direcao IN ('entrada','saida')),
  tipo            TEXT        NOT NULL DEFAULT 'texto'
                    CHECK (tipo IN ('texto','audio','imagem','documento','sticker','sistema')),
  conteudo        TEXT,
  midia_url       TEXT,
  midia_mime      TEXT,
  origem          TEXT        NOT NULL DEFAULT 'humano'
                    CHECK (origem IN ('humano','bot','sistema','template')),
  provider_msg_id TEXT,
  enviado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lido_em         TIMESTAMPTZ,
  erro            TEXT
);

CREATE INDEX IF NOT EXISTS idx_wm_conversa    ON whatsapp_mensagens(conversa_id, enviado_em DESC);
CREATE INDEX IF NOT EXISTS idx_wm_provider_id ON whatsapp_mensagens(provider_msg_id);

-- ─── TEMPLATES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id          BIGSERIAL   PRIMARY KEY,
  tenant_id   TEXT        NOT NULL,
  nome        TEXT        NOT NULL,
  texto       TEXT        NOT NULL,
  variaveis   JSONB       NOT NULL DEFAULT '[]',
  categoria   TEXT        CHECK (categoria IN ('agendamento','cobranca','crm','geral')),
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wt_tenant_nome ON whatsapp_templates(tenant_id, nome);

-- ─── VÍNCULO NÚMERO → PACIENTE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_numero_paciente (
  id            BIGSERIAL   PRIMARY KEY,
  tenant_id     TEXT        NOT NULL,
  numero        TEXT        NOT NULL,
  paciente_id   BIGINT      NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  vinculado_por BIGINT      REFERENCES usuarios(id),
  vinculado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, numero)
);
