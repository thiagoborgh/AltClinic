-- Migration 026: WhatsApp Bot de Agendamento (schema por tenant)

-- Estados possíveis da sessão
-- inicial, menu_principal, agendamento_especialidade, agendamento_profissional,
-- agendamento_periodo, agendamento_horario, agendamento_dados_nome,
-- agendamento_dados_cpf, agendamento_confirmacao, cancelamento_busca,
-- cancelamento_confirmacao, faq_respondido, transferido_humano, encerrado

CREATE TABLE IF NOT EXISTS whatsapp_bot_sessoes (
  id                BIGSERIAL    PRIMARY KEY,
  tenant_id         TEXT         NOT NULL,
  numero            TEXT         NOT NULL,
  conversa_id       BIGINT       REFERENCES whatsapp_conversas(id) ON DELETE SET NULL,
  estado            TEXT         NOT NULL DEFAULT 'inicial',
  contexto          JSONB        NOT NULL DEFAULT '{}',
  tentativas_falha  INTEGER      NOT NULL DEFAULT 0,
  paciente_id       BIGINT       REFERENCES pacientes(id) ON DELETE SET NULL,
  ultima_interacao  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_bot_sessoes_tenant ON whatsapp_bot_sessoes(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_bot_sessoes_inativo ON whatsapp_bot_sessoes(ultima_interacao) WHERE estado NOT IN ('encerrado','transferido_humano');

-- FAQ / Base de conhecimento
CREATE TABLE IF NOT EXISTS whatsapp_bot_faq (
  id             BIGSERIAL    PRIMARY KEY,
  tenant_id      TEXT         NOT NULL,
  pergunta       TEXT         NOT NULL,
  resposta       TEXT         NOT NULL,
  palavras_chave JSONB        NOT NULL DEFAULT '[]',
  categoria      TEXT,
  ativo          BOOLEAN      NOT NULL DEFAULT true,
  uso_count      INTEGER      NOT NULL DEFAULT 0,
  criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_faq_tenant ON whatsapp_bot_faq(tenant_id, ativo);

-- Configuração por tenant
CREATE TABLE IF NOT EXISTS whatsapp_bot_config (
  id              BIGSERIAL    PRIMARY KEY,
  tenant_id       TEXT         NOT NULL UNIQUE,
  ativo           BOOLEAN      NOT NULL DEFAULT false,
  nome_bot        TEXT         NOT NULL DEFAULT 'Assistente',
  foto_url        TEXT,
  horario_inicio  INTEGER      NOT NULL DEFAULT 7,
  horario_fim     INTEGER      NOT NULL DEFAULT 22,
  dias_semana     JSONB        NOT NULL DEFAULT '[1,2,3,4,5,6]',
  sla_inatividade INTEGER      NOT NULL DEFAULT 30,
  max_tentativas  INTEGER      NOT NULL DEFAULT 3,
  mensagens       JSONB        NOT NULL DEFAULT '{}',
  atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Adicionar campo origem na tabela agendamentos_lite (se não existir)
ALTER TABLE agendamentos_lite ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'humano';
