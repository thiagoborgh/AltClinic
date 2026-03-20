-- Migration 032: Relatório de Receita — views analíticas, insights IA, índices de performance

-- View: vw_receita_mensal
CREATE OR REPLACE VIEW "%%SCHEMA%%".vw_receita_mensal AS
SELECT
  f.tenant_id,
  TO_CHAR(p.data_recebimento, 'YYYY-MM')              AS mes,
  EXTRACT(YEAR FROM p.data_recebimento)::INTEGER       AS ano,
  EXTRACT(MONTH FROM p.data_recebimento)::INTEGER      AS mes_num,
  COUNT(DISTINCT f.id)                                 AS total_atendimentos,
  COALESCE(SUM(p.valor), 0)                           AS receita_bruta,
  COALESCE(SUM(p.valor) - SUM(COALESCE(f.valor_desconto, 0)), 0) AS receita_liquida,
  AVG(p.valor)                                         AS ticket_medio,
  p.forma                                              AS forma_pagamento
FROM "%%SCHEMA%%".faturas f
JOIN "%%SCHEMA%%".pagamentos p ON p.fatura_id = f.id
WHERE f.status IN ('paga','parcial')
GROUP BY f.tenant_id, TO_CHAR(p.data_recebimento, 'YYYY-MM'), p.forma;

-- View: vw_receita_por_profissional
CREATE OR REPLACE VIEW "%%SCHEMA%%".vw_receita_por_profissional AS
SELECT
  f.tenant_id,
  f.profissional_id,
  pr.nome                                               AS profissional_nome,
  TO_CHAR(p.data_recebimento, 'YYYY-MM')               AS mes,
  COUNT(DISTINCT f.id)                                  AS total_atendimentos,
  COALESCE(SUM(p.valor), 0)                            AS receita_bruta,
  AVG(p.valor)                                          AS ticket_medio,
  SUM(p.valor) * 100.0 / NULLIF(SUM(SUM(p.valor)) OVER (
    PARTITION BY f.tenant_id, TO_CHAR(p.data_recebimento, 'YYYY-MM')
  ), 0)                                                 AS pct_do_total,
  SUM(p.valor) * COALESCE(pr.percentual_repasse, 0) / 100.0 AS comissao_calculada
FROM "%%SCHEMA%%".faturas f
JOIN "%%SCHEMA%%".pagamentos p ON p.fatura_id = f.id
JOIN "%%SCHEMA%%".profissionais pr ON pr.id = f.profissional_id AND pr.tenant_id = f.tenant_id
WHERE f.status IN ('paga','parcial')
GROUP BY f.tenant_id, f.profissional_id, pr.nome, TO_CHAR(p.data_recebimento, 'YYYY-MM');

-- View: vw_receita_por_procedimento
CREATE OR REPLACE VIEW "%%SCHEMA%%".vw_receita_por_procedimento AS
SELECT
  f.tenant_id,
  fi.procedimento_id,
  fi.descricao                                          AS procedimento_nome,
  TO_CHAR(p.data_recebimento, 'YYYY-MM')               AS mes,
  COUNT(*)                                              AS quantidade,
  COALESCE(SUM(fi.subtotal), 0)                        AS receita_total,
  AVG(fi.subtotal)                                      AS ticket_medio,
  SUM(fi.subtotal) * 100.0 / NULLIF(SUM(SUM(fi.subtotal)) OVER (
    PARTITION BY f.tenant_id, TO_CHAR(p.data_recebimento, 'YYYY-MM')
  ), 0)                                                 AS pct_do_total,
  SUM(fi.subtotal) - LAG(SUM(fi.subtotal), 3) OVER (
    PARTITION BY f.tenant_id, fi.procedimento_id
    ORDER BY TO_CHAR(p.data_recebimento, 'YYYY-MM')
  )                                                     AS variacao_3_meses
FROM "%%SCHEMA%%".faturas f
JOIN "%%SCHEMA%%".pagamentos p ON p.fatura_id = f.id
JOIN "%%SCHEMA%%".faturas_itens fi ON fi.fatura_id = f.id
WHERE f.status IN ('paga','parcial')
GROUP BY f.tenant_id, fi.procedimento_id, fi.descricao, TO_CHAR(p.data_recebimento, 'YYYY-MM');

-- Tabela de insights IA financeiros de receita (separada da TDD18 para evitar conflito de UNIQUE)
CREATE TABLE IF NOT EXISTS "%%SCHEMA%%".ia_insights_financeiros_receita (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  mes             TEXT NOT NULL,
  texto_insight   TEXT NOT NULL,
  dados_contexto  JSONB NOT NULL,
  modelo_ia       TEXT NOT NULL DEFAULT 'claude-opus-4-5',
  tokens_usados   INTEGER,
  gerado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gerado_por_job  INTEGER NOT NULL DEFAULT 1,
  UNIQUE(tenant_id, mes)
);
CREATE INDEX IF NOT EXISTS idx_ia_insights_receita_tenant_mes
  ON "%%SCHEMA%%".ia_insights_financeiros_receita(tenant_id, mes DESC);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_faturas_tenant_status_vencimento
  ON "%%SCHEMA%%".faturas(tenant_id, status, vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_receb
  ON "%%SCHEMA%%".pagamentos(fatura_id, data_recebimento);
