-- Migration 014: Prontuário — tabelas por tenant (prontuario_*)
-- Aplicada a todos os schemas tenant existentes via DO block
-- Também adicionada ao createTenantSchema() para novos tenants

DO $$
DECLARE
  tenant_slug TEXT;
  schema_name TEXT;
BEGIN
  FOR tenant_slug IN SELECT slug FROM public.tenants LOOP
    schema_name := 'clinica_' || regexp_replace(lower(tenant_slug), '[^a-z0-9]', '_', 'g');

    -- prontuario_registros
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.prontuario_registros (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id          BIGINT NOT NULL,
        profissional_id      BIGINT NOT NULL,
        agendamento_id       BIGINT,
        form_definition_id   UUID NOT NULL,
        data_registro        DATE NOT NULL DEFAULT CURRENT_DATE,
        data_json            JSONB NOT NULL DEFAULT ''{}'' ,
        assinado             BOOLEAN DEFAULT false,
        assinado_em          TIMESTAMPTZ,
        assinado_por         BIGINT,
        ref_registro_id      UUID REFERENCES %I.prontuario_registros(id) ON DELETE SET NULL,
        tipo_registro        VARCHAR(20) DEFAULT ''registro''
                               CHECK (tipo_registro IN (''registro'',''addendum'')),
        pep_origem_id        BIGINT,
        created_at           TIMESTAMPTZ DEFAULT now(),
        updated_at           TIMESTAMPTZ DEFAULT now()
      )
    ', schema_name, schema_name);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_pront_reg_paciente ON %I.prontuario_registros(paciente_id)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_pront_reg_data ON %I.prontuario_registros(data_registro DESC)', schema_name);

    -- trigger function (schema-scoped)
    EXECUTE format('
      CREATE OR REPLACE FUNCTION %I.block_signed_update()
      RETURNS TRIGGER AS $fn$
      BEGIN
        IF OLD.assinado = true AND NEW.assinado = true THEN
          RAISE EXCEPTION ''Registro assinado não pode ser editado. Crie um addendum.'';
        END IF;
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql
    ', schema_name);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_block_signed_update ON %I.prontuario_registros', schema_name);
    EXECUTE format('
      CREATE TRIGGER trg_block_signed_update
      BEFORE UPDATE ON %I.prontuario_registros
      FOR EACH ROW EXECUTE FUNCTION %I.block_signed_update()
    ', schema_name, schema_name);

    -- prontuario_diagnosticos
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.prontuario_diagnosticos (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id      BIGINT NOT NULL,
        profissional_id  BIGINT NOT NULL,
        registro_id      UUID REFERENCES %I.prontuario_registros(id) ON DELETE SET NULL,
        cid10_codigo     VARCHAR(10) NOT NULL,
        cid10_descricao  VARCHAR(255) NOT NULL,
        tipo             VARCHAR(20) DEFAULT ''principal'' CHECK (tipo IN (''principal'',''secundario'')),
        data_diagnostico DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at       TIMESTAMPTZ DEFAULT now()
      )
    ', schema_name, schema_name);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_diag_cid10 ON %I.prontuario_diagnosticos(cid10_codigo)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_diag_paciente ON %I.prontuario_diagnosticos(paciente_id)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_diag_data ON %I.prontuario_diagnosticos(data_diagnostico DESC)', schema_name);

    -- prontuario_prescricoes
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.prontuario_prescricoes (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id      BIGINT NOT NULL,
        profissional_id  BIGINT NOT NULL,
        registro_id      UUID REFERENCES %I.prontuario_registros(id) ON DELETE SET NULL,
        itens_json       JSONB NOT NULL DEFAULT ''[]'',
        observacoes      TEXT,
        data_prescricao  DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at       TIMESTAMPTZ DEFAULT now()
      )
    ', schema_name, schema_name);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_prescricoes_paciente ON %I.prontuario_prescricoes(paciente_id)', schema_name);

    -- prontuario_encaminhamentos
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.prontuario_encaminhamentos (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id           BIGINT NOT NULL,
        profissional_id       BIGINT NOT NULL,
        registro_id           UUID REFERENCES %I.prontuario_registros(id) ON DELETE SET NULL,
        especialidade_destino VARCHAR(255) NOT NULL,
        cid10_codigo          VARCHAR(10),
        cid10_descricao       VARCHAR(255),
        motivo                TEXT,
        data_encaminhamento   DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at            TIMESTAMPTZ DEFAULT now()
      )
    ', schema_name, schema_name);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_encam_paciente ON %I.prontuario_encaminhamentos(paciente_id)', schema_name);

    -- prontuario_exames
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.prontuario_exames (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id     BIGINT NOT NULL,
        profissional_id BIGINT NOT NULL,
        registro_id     UUID REFERENCES %I.prontuario_registros(id) ON DELETE SET NULL,
        tipo            VARCHAR(50) CHECK (tipo IN (''laboratorial'',''imagem'',''outro'')),
        descricao       TEXT,
        resultado_json  JSONB,
        arquivo_url     VARCHAR(500),
        data_exame      DATE,
        created_at      TIMESTAMPTZ DEFAULT now()
      )
    ', schema_name, schema_name);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_exames_paciente ON %I.prontuario_exames(paciente_id)', schema_name);

  END LOOP;
END;
$$;
