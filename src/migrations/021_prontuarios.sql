-- Migration 021: Prontuário Eletrônico (schema por tenant)

CREATE TABLE IF NOT EXISTS prontuarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL,
  paciente_id      BIGINT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  profissional_id  BIGINT NOT NULL REFERENCES profissionais(id) ON DELETE RESTRICT,
  atendimento_id   BIGINT,
  tipo_atendimento VARCHAR(30) NOT NULL DEFAULT 'consulta'
                     CHECK (tipo_atendimento IN ('consulta','retorno','procedimento','telemedicina')),
  status           VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','assinado')),
  triagem_json     JSONB,
  assinado_por     BIGINT REFERENCES profissionais(id),
  assinado_em      TIMESTAMPTZ,
  criado_por       BIGINT NOT NULL,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prontuarios_tenant        ON prontuarios (tenant_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente      ON prontuarios (tenant_id, paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_profissional  ON prontuarios (tenant_id, profissional_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_status        ON prontuarios (tenant_id, status);

-- Entradas por seção (uma por seção, exceto adendo que pode ser múltiplo)
CREATE TABLE IF NOT EXISTS prontuario_entradas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  secao         VARCHAR(30) NOT NULL
                  CHECK (secao IN ('anamnese','exame_fisico','hipotese_diagnostica',
                                   'conduta','procedimentos_realizados','adendo')),
  conteudo_json JSONB NOT NULL DEFAULT '{}',
  versao        INT NOT NULL DEFAULT 1,
  autor_id      BIGINT NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice parcial único: 1 entrada por seção (exceto adendo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pront_entradas_secao_unico
  ON prontuario_entradas (prontuario_id, secao)
  WHERE secao != 'adendo';

CREATE INDEX IF NOT EXISTS idx_pront_entradas_prontuario ON prontuario_entradas (prontuario_id);

-- Prescrições
CREATE TABLE IF NOT EXISTS prontuario_prescricoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  medicamento   VARCHAR(255) NOT NULL,
  dose          VARCHAR(100),
  frequencia    VARCHAR(100),
  duracao       VARCHAR(100),
  via           VARCHAR(50),
  observacoes   TEXT,
  ordem         INT NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pront_prescricoes_prontuario ON prontuario_prescricoes (prontuario_id);

-- CIDs
CREATE TABLE IF NOT EXISTS prontuario_cids (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  cid_codigo    VARCHAR(10) NOT NULL,
  cid_descricao VARCHAR(255) NOT NULL,
  tipo          VARCHAR(20) NOT NULL DEFAULT 'principal'
                  CHECK (tipo IN ('principal','secundario')),
  status_cid    VARCHAR(20) NOT NULL DEFAULT 'hipotese'
                  CHECK (status_cid IN ('hipotese','confirmado','descartado')),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pront_cids_prontuario ON prontuario_cids (prontuario_id);

-- Anexos
CREATE TABLE IF NOT EXISTS prontuario_anexos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  nome_arquivo  VARCHAR(255) NOT NULL,
  url           TEXT NOT NULL,
  tipo_mime     VARCHAR(100),
  tamanho_bytes INT,
  enviado_por   BIGINT NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pront_anexos_prontuario ON prontuario_anexos (prontuario_id);

-- Audit log
CREATE TABLE IF NOT EXISTS prontuario_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id UUID NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL,
  usuario_id    BIGINT NOT NULL,
  acao          VARCHAR(50) NOT NULL
                  CHECK (acao IN ('leitura','criacao','edicao','assinatura','exportacao_pdf','upload_anexo')),
  detalhes      JSONB,
  ip            VARCHAR(45),
  user_agent    TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_prontuario   ON prontuario_audit_log (prontuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_data  ON prontuario_audit_log (tenant_id, criado_em);

-- CID-10 (schema público — compartilhado entre todos os tenants)
CREATE TABLE IF NOT EXISTS public.cid10 (
  codigo     VARCHAR(10)  PRIMARY KEY,
  descricao  VARCHAR(500) NOT NULL,
  categoria  VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_cid10_descricao
  ON public.cid10 USING GIN (to_tsvector('portuguese', descricao));
