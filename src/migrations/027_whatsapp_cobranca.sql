-- Migration 027: WhatsApp Cobranças e Lembretes Financeiros

CREATE TABLE IF NOT EXISTS cobrancas_whatsapp (
  id                  BIGSERIAL    PRIMARY KEY,
  tenant_id           TEXT         NOT NULL,
  fatura_id           BIGINT       NOT NULL,
  paciente_id         BIGINT       NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo                TEXT         NOT NULL
                        CHECK (tipo IN (
                          'pos_atendimento','lembrete_venc','inadimplencia_d1',
                          'inadimplencia_d7','inadimplencia_d15','confirmacao_pag','manual'
                        )),
  mensagem            TEXT         NOT NULL,
  status              TEXT         NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','enviado','falha','cancelado','expirado')),
  qr_code_url         TEXT,
  qr_code_payload     TEXT,
  qr_code_expira_em   TIMESTAMPTZ,
  gateway_charge_id   TEXT,
  agendado_para       TIMESTAMPTZ,
  enviado_em          TIMESTAMPTZ,
  erro                TEXT,
  disparado_por       BIGINT       REFERENCES usuarios(id),
  criado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cw_tenant_status  ON cobrancas_whatsapp(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cw_fatura         ON cobrancas_whatsapp(fatura_id);
CREATE INDEX IF NOT EXISTS idx_cw_paciente       ON cobrancas_whatsapp(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cw_agendado_para  ON cobrancas_whatsapp(agendado_para) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_cw_gateway_charge ON cobrancas_whatsapp(gateway_charge_id);

CREATE TABLE IF NOT EXISTS cobrancas_config (
  id                            BIGSERIAL    PRIMARY KEY,
  tenant_id                     TEXT         NOT NULL UNIQUE,
  ativo                         BOOLEAN      NOT NULL DEFAULT true,
  envio_auto_pos_atendimento    BOOLEAN      NOT NULL DEFAULT true,
  delay_pos_atendimento_min     INTEGER      NOT NULL DEFAULT 30,
  dias_lembrete_antes_venc      INTEGER      NOT NULL DEFAULT 3,
  sequencia_inadimplencia       TEXT         NOT NULL DEFAULT '[1,7,15]',
  horario_inicio_envio          TEXT         NOT NULL DEFAULT '08:00',
  horario_fim_envio             TEXT         NOT NULL DEFAULT '20:00',
  max_cobrancas_por_fatura      INTEGER      NOT NULL DEFAULT 4,
  chave_pix                     TEXT,
  tipo_chave_pix                TEXT         CHECK (tipo_chave_pix IN ('cpf','cnpj','email','telefone','aleatoria')),
  telefone_clinica              TEXT,
  tom_mensagem                  TEXT         NOT NULL DEFAULT 'amigavel'
                                  CHECK (tom_mensagem IN ('amigavel','neutro','formal')),
  ia_tom_adaptativo             BOOLEAN      NOT NULL DEFAULT false,
  atualizado_em                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cobrancas_optout (
  id          BIGSERIAL    PRIMARY KEY,
  tenant_id   TEXT         NOT NULL,
  paciente_id BIGINT       NOT NULL REFERENCES pacientes(id),
  motivo      TEXT,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, paciente_id)
);

-- Add column to faturas if missing
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS atendimento_id BIGINT;
