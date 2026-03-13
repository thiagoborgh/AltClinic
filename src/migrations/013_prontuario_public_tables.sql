-- Migration 013: Prontuário — tabelas públicas (form_definitions + cid10)
-- Tabelas no schema PUBLIC (compartilhadas entre todos os tenants)

CREATE TABLE IF NOT EXISTS public.form_definitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID,
  name         VARCHAR(255) NOT NULL,
  type         VARCHAR(50) NOT NULL CHECK (type IN (
                 'anamnese','evolucao','laudo','formulario','ordem_servico'
               )),
  specialty    VARCHAR(100),
  fields_json  JSONB NOT NULL DEFAULT '[]',
  is_system    BOOLEAN DEFAULT false,
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_definitions_tenant
  ON public.form_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_definitions_type
  ON public.form_definitions(type);
CREATE INDEX IF NOT EXISTS idx_form_definitions_specialty
  ON public.form_definitions(specialty);

CREATE TABLE IF NOT EXISTS public.cid10 (
  codigo    VARCHAR(10) PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(150),
  capitulo  VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_cid10_fts
  ON public.cid10 USING gin(to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_cid10_descricao_like
  ON public.cid10 (descricao varchar_pattern_ops);
