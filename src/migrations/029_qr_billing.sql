-- Migration 029: QR Billing Pix (schema por tenant)

CREATE TABLE IF NOT EXISTS qr_codes (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  fatura_id       BIGINT NOT NULL REFERENCES faturas(id) ON DELETE RESTRICT,
  txid            TEXT NOT NULL UNIQUE,
  valor           NUMERIC(10,2) NOT NULL,
  qr_code_base64  TEXT,
  copia_cola      TEXT,
  status          TEXT NOT NULL DEFAULT 'ativo'
                  CHECK (status IN ('ativo','expirado','pago','cancelado')),
  canal           TEXT NOT NULL DEFAULT 'presencial'
                  CHECK (canal IN ('presencial','whatsapp','email')),
  expira_em       TIMESTAMPTZ NOT NULL,
  pago_em         TIMESTAMPTZ,
  tentativa       INTEGER NOT NULL DEFAULT 1,
  webhook_payload JSONB,
  loc_id          TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_tenant   ON qr_codes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_fatura   ON qr_codes (fatura_id);
CREATE INDEX IF NOT EXISTS idx_qr_txid     ON qr_codes (txid);
CREATE INDEX IF NOT EXISTS idx_qr_status   ON qr_codes (status);
CREATE INDEX IF NOT EXISTS idx_qr_expira   ON qr_codes (expira_em);

CREATE TABLE IF NOT EXISTS pix_config (
  id                        BIGSERIAL PRIMARY KEY,
  tenant_id                 TEXT NOT NULL UNIQUE,
  client_id_enc             TEXT NOT NULL,
  client_secret_enc         TEXT NOT NULL,
  chave_pix                 TEXT NOT NULL,
  tipo_chave                TEXT NOT NULL CHECK (tipo_chave IN ('cnpj','cpf','email','telefone','aleatoria')),
  ambiente                  TEXT NOT NULL DEFAULT 'producao' CHECK (ambiente IN ('producao','homologacao')),
  validade_presencial_seg   INTEGER NOT NULL DEFAULT 600,
  validade_remoto_seg       INTEGER NOT NULL DEFAULT 86400,
  ativo                     BOOLEAN NOT NULL DEFAULT true,
  criado_em                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
