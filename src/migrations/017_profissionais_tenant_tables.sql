-- Migration 017: Tabelas de profissionais por schema de tenant
-- Executar no schema clinica_{slug} de cada tenant.

CREATE TABLE IF NOT EXISTS profissionais (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id              UUID,
  nome                    TEXT NOT NULL,
  titulo                  TEXT NOT NULL CHECK(titulo IN ('Dr.', 'Dra.', 'Enf.', 'Fisio.', 'Nutricionista', 'Outro')),
  cpf                     TEXT NOT NULL UNIQUE,
  data_nascimento         DATE NOT NULL,
  sexo                    TEXT NOT NULL CHECK(sexo IN ('M', 'F', 'Outro')),
  foto_url                TEXT,
  telefone                TEXT NOT NULL,
  email                   TEXT NOT NULL,
  conselho                TEXT NOT NULL CHECK(conselho IN ('CRM', 'COREN', 'CRO', 'CFN', 'CREFITO', 'Outro')),
  registro_numero         TEXT NOT NULL,
  registro_uf             TEXT NOT NULL,
  registro_validade       DATE NOT NULL,
  especialidade_principal TEXT NOT NULL,
  rqe                     TEXT,
  assinatura_url          TEXT,
  carimbo_url             TEXT,
  tipo_vinculo            TEXT NOT NULL DEFAULT 'CLT' CHECK(tipo_vinculo IN ('CLT', 'PJ', 'Autonomo', 'Socio')),
  comissao_tipo           TEXT CHECK(comissao_tipo IN ('percentual', 'fixo')),
  comissao_valor          NUMERIC(10,2),
  status                  TEXT NOT NULL DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo', 'licenca')),
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profissionais_cpf ON profissionais(cpf);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON profissionais(status);
CREATE INDEX IF NOT EXISTS idx_profissionais_especialidade ON profissionais(especialidade_principal);
CREATE INDEX IF NOT EXISTS idx_profissionais_usuario ON profissionais(usuario_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_registro_validade ON profissionais(registro_validade);

CREATE TABLE IF NOT EXISTS profissionais_especialidades (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id   UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  especialidade     TEXT NOT NULL,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profissional_id, especialidade)
);

CREATE INDEX IF NOT EXISTS idx_prof_esp_profissional ON profissionais_especialidades(profissional_id);

CREATE TABLE IF NOT EXISTS profissionais_procedimentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id   UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  procedimento_id   UUID NOT NULL,
  duracao_minutos   INTEGER NOT NULL DEFAULT 30,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profissional_id, procedimento_id)
);

CREATE INDEX IF NOT EXISTS idx_prof_proc_profissional ON profissionais_procedimentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_prof_proc_procedimento ON profissionais_procedimentos(procedimento_id);

CREATE TABLE IF NOT EXISTS profissionais_disponibilidade (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id     UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  dia_semana          INTEGER NOT NULL CHECK(dia_semana BETWEEN 0 AND 6),
  hora_inicio         TEXT NOT NULL,
  hora_fim            TEXT NOT NULL,
  intervalo_minutos   INTEGER NOT NULL DEFAULT 15,
  max_pacientes       INTEGER,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profissional_id, dia_semana, hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_prof_disp_profissional ON profissionais_disponibilidade(profissional_id);
CREATE INDEX IF NOT EXISTS idx_prof_disp_dia ON profissionais_disponibilidade(dia_semana);

CREATE TABLE IF NOT EXISTS profissionais_bloqueios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id   UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  data_inicio       DATE NOT NULL,
  data_fim          DATE NOT NULL,
  hora_inicio       TEXT,
  hora_fim          TEXT,
  motivo            TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prof_bloq_profissional ON profissionais_bloqueios(profissional_id);
CREATE INDEX IF NOT EXISTS idx_prof_bloq_data ON profissionais_bloqueios(data_inicio, data_fim);

CREATE TABLE IF NOT EXISTS profissionais_documentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id   UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL CHECK(tipo IN ('diploma', 'especializacao', 'certificado', 'outro')),
  nome_arquivo      TEXT NOT NULL,
  url               TEXT NOT NULL,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prof_docs_profissional ON profissionais_documentos(profissional_id);

-- Trigger: atualiza atualizado_em automaticamente
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profissionais_atualizado_em ON profissionais;
CREATE TRIGGER trg_profissionais_atualizado_em
BEFORE UPDATE ON profissionais
FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
