-- Migration 031: Relatório de No-Show — view analítica, cache e ações CRM (schema por tenant)

CREATE OR REPLACE VIEW "%%SCHEMA%%".vw_no_shows AS
SELECT
  a.id                                              AS agendamento_id,
  a.tenant_id,
  a.data,
  a.horario,
  a.paciente_id,
  a.paciente                                        AS paciente_nome,
  a.profissional_id,
  p.nome                                            AS profissional_nome,
  a.procedimento_id,
  pr.nome                                           AS procedimento_nome,
  a.valor                                           AS valor_agendado,
  a.status,
  a.origem,
  a.cancelado_em,
  a.created_at                                      AS agendado_em,
  CASE
    WHEN c.id IS NOT NULL AND c.resposta = 'confirmado' THEN 1
    ELSE 0
  END                                               AS foi_confirmado,
  c.confirmado_em,
  CASE
    WHEN a.status = 'falta'
     AND (
       a.cancelado_em IS NULL
       OR (
         EXTRACT(EPOCH FROM (
           (a.data::DATE + a.horario::TIME) - a.cancelado_em
         )) / 3600.0 < 2.0
       )
     )
    THEN 1
    ELSE 0
  END                                               AS is_no_show,
  CASE
    WHEN a.horario < '12:00' THEN 'manha'
    WHEN a.horario < '18:00' THEN 'tarde'
    ELSE 'noite'
  END                                               AS turno,
  EXTRACT(DOW FROM a.data::DATE)::INTEGER           AS dia_semana_num,
  CASE EXTRACT(DOW FROM a.data::DATE)::INTEGER
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terca'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sabado'
  END                                               AS dia_semana_nome
FROM "%%SCHEMA%%".agendamentos_lite a
LEFT JOIN "%%SCHEMA%%".profissionais p
  ON p.id = a.profissional_id AND p.tenant_id = a.tenant_id
LEFT JOIN "%%SCHEMA%%".procedimentos pr
  ON pr.id = a.procedimento_id AND pr.tenant_id = a.tenant_id
LEFT JOIN "%%SCHEMA%%".confirmacoes_whatsapp c
  ON c.agendamento_id = a.id AND c.tenant_id = a.tenant_id
WHERE a.tenant_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS "%%SCHEMA%%".relatorio_cache (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  chave       TEXT NOT NULL,
  dados_json  TEXT NOT NULL,
  gerado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em   TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, tipo, chave)
);
CREATE INDEX IF NOT EXISTS idx_relatorio_cache_lookup
  ON "%%SCHEMA%%".relatorio_cache(tenant_id, tipo, chave, expira_em);

CREATE TABLE IF NOT EXISTS "%%SCHEMA%%".no_show_acoes_crm (
  id             BIGSERIAL PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  paciente_id    BIGINT NOT NULL,
  tipo_acao      TEXT NOT NULL,
  disparado_por  BIGINT NOT NULL,
  disparado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status         TEXT DEFAULT 'pendente'
);
CREATE INDEX IF NOT EXISTS idx_no_show_acoes_tenant
  ON "%%SCHEMA%%".no_show_acoes_crm(tenant_id, paciente_id, disparado_em DESC);

CREATE INDEX IF NOT EXISTS idx_agl_tenant_data
  ON "%%SCHEMA%%".agendamentos_lite(tenant_id, data);
CREATE INDEX IF NOT EXISTS idx_agl_tenant_profissional_data
  ON "%%SCHEMA%%".agendamentos_lite(tenant_id, profissional_id, data);
CREATE INDEX IF NOT EXISTS idx_agl_tenant_status_data
  ON "%%SCHEMA%%".agendamentos_lite(tenant_id, status, data);
CREATE INDEX IF NOT EXISTS idx_agl_tenant_paciente_status
  ON "%%SCHEMA%%".agendamentos_lite(tenant_id, paciente_id, status);
