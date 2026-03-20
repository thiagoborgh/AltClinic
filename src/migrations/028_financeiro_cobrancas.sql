-- Migration 028: Financeiro Cobranças e Pagamentos (schema por tenant)

CREATE TABLE IF NOT EXISTS procedimentos_precos (
  id               BIGSERIAL    PRIMARY KEY,
  tenant_id        TEXT         NOT NULL,
  procedimento_id  BIGINT,
  descricao        TEXT         NOT NULL,
  valor_particular NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo            BOOLEAN      NOT NULL DEFAULT true,
  criado_em        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, procedimento_id)
);

CREATE TABLE IF NOT EXISTS faturas (
  id                  BIGSERIAL    PRIMARY KEY,
  tenant_id           TEXT         NOT NULL,
  numero              TEXT         NOT NULL,
  atendimento_id      BIGINT       UNIQUE,
  paciente_id         BIGINT       NOT NULL,
  profissional_id     BIGINT       NOT NULL,
  valor_total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_desconto      NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_liquido       NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_pago          NUMERIC(10,2) NOT NULL DEFAULT 0,
  status              TEXT         NOT NULL DEFAULT 'aguardando'
                        CHECK (status IN ('aguardando','parcial','paga','vencida','cancelada')),
  vencimento          DATE         NOT NULL,
  desconto_motivo     TEXT,
  desconto_usuario_id BIGINT,
  cancelado_por       BIGINT,
  cancelado_em        TIMESTAMPTZ,
  criado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faturas_tenant       ON faturas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_faturas_paciente     ON faturas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_faturas_profissional ON faturas (profissional_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status       ON faturas (status);
CREATE INDEX IF NOT EXISTS idx_faturas_vencimento   ON faturas (vencimento);

CREATE TABLE IF NOT EXISTS faturas_itens (
  id              BIGSERIAL    PRIMARY KEY,
  fatura_id       BIGINT       NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
  procedimento_id BIGINT,
  descricao       TEXT         NOT NULL,
  quantidade      INTEGER      NOT NULL DEFAULT 1,
  valor_unitario  NUMERIC(10,2) NOT NULL,
  desconto        NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal        NUMERIC(10,2) NOT NULL,
  criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faturas_itens_fatura ON faturas_itens (fatura_id);

CREATE TABLE IF NOT EXISTS pagamentos (
  id                 BIGSERIAL    PRIMARY KEY,
  fatura_id          BIGINT       NOT NULL REFERENCES faturas(id) ON DELETE RESTRICT,
  valor              NUMERIC(10,2) NOT NULL,
  forma              TEXT         NOT NULL
                       CHECK (forma IN ('pix','debito','credito','dinheiro','convenio','transferencia')),
  parcelas           INTEGER      DEFAULT 1,
  bandeira           TEXT,
  data_recebimento   DATE         NOT NULL,
  usuario_id         BIGINT       NOT NULL,
  observacao         TEXT,
  referencia_externa TEXT,
  origem             TEXT         NOT NULL DEFAULT 'manual'
                       CHECK (origem IN ('manual','webhook_pix','webhook_stripe')),
  idempotency_key    TEXT         UNIQUE,
  criado_em          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_fatura ON pagamentos (fatura_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data   ON pagamentos (data_recebimento);

CREATE TABLE IF NOT EXISTS caixa_movimentos (
  id           BIGSERIAL    PRIMARY KEY,
  tenant_id    TEXT         NOT NULL,
  data         DATE         NOT NULL,
  tipo         TEXT         NOT NULL
                 CHECK (tipo IN ('entrada','saida','abertura','fechamento','sangria')),
  valor        NUMERIC(10,2) NOT NULL,
  descricao    TEXT         NOT NULL,
  forma        TEXT         CHECK (forma IN ('pix','debito','credito','dinheiro','convenio','transferencia')),
  fatura_id    BIGINT       REFERENCES faturas(id),
  pagamento_id BIGINT       REFERENCES pagamentos(id),
  usuario_id   BIGINT       NOT NULL,
  criado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caixa_tenant_data ON caixa_movimentos (tenant_id, data);

CREATE TABLE IF NOT EXISTS repasses (
  id                  BIGSERIAL    PRIMARY KEY,
  tenant_id           TEXT         NOT NULL,
  profissional_id     BIGINT       NOT NULL,
  mes_referencia      TEXT         NOT NULL,
  valor_bruto         NUMERIC(10,2) NOT NULL DEFAULT 0,
  percentual          NUMERIC(5,4),
  valor_fixo_por_proc NUMERIC(10,2),
  valor_calculado     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status              TEXT         NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','pago')),
  pago_em             TIMESTAMPTZ,
  comprovante_url     TEXT,
  calculado_em        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, profissional_id, mes_referencia)
);

CREATE INDEX IF NOT EXISTS idx_repasses_tenant_mes ON repasses (tenant_id, mes_referencia);
