-- Migration 016: Tabelas de pacientes por schema de tenant
-- Executar no schema clinica_{slug} de cada tenant.

CREATE TABLE IF NOT EXISTS pacientes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,
  nome          VARCHAR(255) NOT NULL,
  cpf           VARCHAR(14)  NOT NULL,
  data_nascimento DATE NOT NULL,
  sexo          VARCHAR(20)  NOT NULL
                  CHECK (sexo IN ('masculino','feminino','outro')),
  nome_social   VARCHAR(255),
  foto_url      TEXT,
  estado_civil  VARCHAR(50),
  profissao     VARCHAR(100),
  como_conheceu VARCHAR(50)
                  CHECK (como_conheceu IN ('indicacao','google','instagram','whatsapp','outro') OR como_conheceu IS NULL),
  telefone      VARCHAR(20)  NOT NULL,
  telefone_fixo VARCHAR(20),
  email         VARCHAR(255),
  contato_emergencia_nome     VARCHAR(255),
  contato_emergencia_telefone VARCHAR(20),
  convenio_id                 UUID,
  carteirinha_numero          VARCHAR(100),
  carteirinha_validade        DATE,
  profissional_referencia_id  UUID,
  observacoes   TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'ativo'
                  CHECK (status IN ('ativo','inativo')),
  consentimento_lgpd    BOOLEAN NOT NULL DEFAULT FALSE,
  consentimento_lgpd_em TIMESTAMPTZ,
  responsavel_nome     VARCHAR(255),
  responsavel_cpf      VARCHAR(14),
  responsavel_telefone VARCHAR(20),
  criado_por    TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_paciente_cpf_tenant UNIQUE (cpf, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_pacientes_tenant   ON pacientes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_nome     ON pacientes (tenant_id, nome);
CREATE INDEX IF NOT EXISTS idx_pacientes_status   ON pacientes (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone ON pacientes (tenant_id, telefone);
CREATE INDEX IF NOT EXISTS idx_pacientes_email    ON pacientes (tenant_id, email);

CREATE TABLE IF NOT EXISTS pacientes_dados_clinicos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id     UUID NOT NULL UNIQUE,
  tenant_id       TEXT NOT NULL,
  tipo_sanguineo  VARCHAR(5)
                    CHECK (tipo_sanguineo IN ('A+','A-','B+','B-','O+','O-','AB+','AB-') OR tipo_sanguineo IS NULL),
  alergias        TEXT,
  medicamentos    TEXT,
  condicoes       TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pac_clinicos_tenant ON pacientes_dados_clinicos (tenant_id);

CREATE TABLE IF NOT EXISTS pacientes_enderecos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id  UUID NOT NULL UNIQUE,
  tenant_id    TEXT NOT NULL,
  cep          VARCHAR(9),
  logradouro   VARCHAR(255),
  numero       VARCHAR(20),
  complemento  VARCHAR(100),
  bairro       VARCHAR(100),
  cidade       VARCHAR(100),
  estado       CHAR(2),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pac_enderecos_tenant ON pacientes_enderecos (tenant_id);
