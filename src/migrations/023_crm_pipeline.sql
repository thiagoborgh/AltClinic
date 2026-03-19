-- Migration 023: CRM Pipeline de Leads (schema por tenant)

CREATE TABLE IF NOT EXISTS crm_etapas_config (
  id          BIGSERIAL PRIMARY KEY,
  ordem       INTEGER     NOT NULL,
  nome        TEXT        NOT NULL,
  cor         TEXT        NOT NULL DEFAULT '#6B7280',
  alerta_dias INTEGER     NOT NULL DEFAULT 5,
  ativo       INTEGER     NOT NULL DEFAULT 1,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ordem)
);

-- Seed de etapas padrão
INSERT INTO crm_etapas_config (id, ordem, nome, cor, alerta_dias) VALUES
  (1, 1, 'Novo Lead',        '#3B82F6', 5),
  (2, 2, 'Contato Feito',    '#8B5CF6', 5),
  (3, 3, 'Proposta Enviada', '#F59E0B', 5),
  (4, 4, 'Agendado',         '#10B981', 3),
  (5, 5, 'Convertido',       '#059669', 999),
  (6, 6, 'Perdido',          '#EF4444', 999)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS crm_oportunidades (
  id                BIGSERIAL PRIMARY KEY,
  paciente_id       BIGINT      NOT NULL REFERENCES pacientes(id),
  procedimento_id   BIGINT,
  etapa_id          BIGINT      NOT NULL REFERENCES crm_etapas_config(id),
  valor_estimado    NUMERIC(12,2),
  origem            TEXT        NOT NULL
                      CHECK (origem IN (
                        'indicacao','whatsapp','instagram','site',
                        'profissional_indicou','paciente_inativo','ia','manual'
                      )),
  responsavel_id    BIGINT      NOT NULL REFERENCES usuarios(id),
  score_ia          INTEGER     CHECK (score_ia BETWEEN 0 AND 100),
  score_ia_em       TIMESTAMPTZ,
  motivo_perda      TEXT        CHECK (motivo_perda IN (
                      'preco','concorrente','sem_interesse','sem_resposta','outro'
                    )),
  observacoes       TEXT,
  proxima_acao_em   TIMESTAMPTZ,
  proxima_acao_desc TEXT,
  prontuario_id     BIGINT,
  agendamento_id    BIGINT,
  ativo             INTEGER     NOT NULL DEFAULT 1,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_op_paciente    ON crm_oportunidades (paciente_id);
CREATE INDEX IF NOT EXISTS idx_crm_op_etapa       ON crm_oportunidades (etapa_id);
CREATE INDEX IF NOT EXISTS idx_crm_op_responsavel ON crm_oportunidades (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_crm_op_ativo       ON crm_oportunidades (ativo);

CREATE TABLE IF NOT EXISTS crm_atividades (
  id              BIGSERIAL PRIMARY KEY,
  oportunidade_id BIGINT      NOT NULL REFERENCES crm_oportunidades(id),
  tipo            TEXT        NOT NULL
                    CHECK (tipo IN (
                      'criacao','mudanca_etapa','mensagem_whatsapp',
                      'ligacao','observacao','proposta','score_ia','conversao','perda'
                    )),
  descricao       TEXT        NOT NULL,
  metadata        TEXT,
  usuario_id      BIGINT      REFERENCES usuarios(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_atv_oportunidade ON crm_atividades (oportunidade_id);
