/**
 * IAFinanceiroService — score de risco financeiro e insights via Claude API
 */
const pool      = require('../database/postgres');
const Anthropic = require('@anthropic-ai/sdk');
const { schemaFromSlug } = require('./CrmScoreService');

const FATORES_PESO = {
  historico_pagamentos:          0.30,
  tempo_medio_pagamento:         0.25,
  resposta_cobranca_whatsapp:    0.20,
  faturas_abertas_simultaneas:   0.10,
  valor_vs_ticket_medio:         0.10,
  tempo_relacionamento:          0.03,
  noshows_recentes:              0.02,
};

class IAFinanceiroService {
  constructor(tenantId, tenantSlug) {
    this.tenantId   = tenantId;
    this.tenantSlug = tenantSlug;
    this.schema     = schemaFromSlug(tenantSlug);
  }

  // ── Calcular fatores de risco para um paciente ─────────────────────────────
  async calcularFatores(pacienteId) {
    const schema    = this.schema;
    const tenantId  = this.tenantId;

    // 1. Histórico de pagamentos
    const hist = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN f.status = 'vencida'
                   OR (f.status IN ('paga','parcial')
                       AND p.data_recebimento > f.vencimento)
                 THEN 1 ELSE 0 END) AS atrasados
      FROM "${schema}".faturas f
      LEFT JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
      WHERE f.tenant_id = $1 AND f.paciente_id = $2
        AND f.status NOT IN ('cancelada')
    `, [tenantId, pacienteId]);
    const { total, atrasados } = hist.rows[0];
    const fatorHistorico = parseInt(total) > 0
      ? Math.round((parseInt(atrasados) / parseInt(total)) * 100) : 50;

    // 2. Tempo médio de pagamento
    const tempo = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (p.data_recebimento::timestamptz - f.criado_em)) / 86400) AS dias_medio
      FROM "${schema}".faturas f
      JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
      WHERE f.tenant_id = $1 AND f.paciente_id = $2 AND f.status = 'paga'
    `, [tenantId, pacienteId]);
    const diasMedio = parseFloat(tempo.rows[0]?.dias_medio);
    const fatorTempoPagamento = !isNaN(diasMedio)
      ? Math.min(100, Math.round((diasMedio / 30) * 100)) : 50;

    // 3. Faturas abertas
    const abertas = await pool.query(`
      SELECT COUNT(*) AS abertas
      FROM "${schema}".faturas
      WHERE tenant_id = $1 AND paciente_id = $2
        AND status IN ('aguardando','parcial','vencida')
    `, [tenantId, pacienteId]);
    const fatorAbertasSim = Math.min(100, parseInt(abertas.rows[0].abertas) * 33);

    // 4. Valor vs ticket médio
    const valRes = await pool.query(`
      SELECT
        (SELECT valor_liquido FROM "${schema}".faturas
         WHERE tenant_id = $1 AND paciente_id = $2
           AND status IN ('aguardando','parcial','vencida')
         ORDER BY criado_em DESC LIMIT 1) AS valor_atual,
        AVG(valor_liquido) AS ticket_medio
      FROM "${schema}".faturas
      WHERE tenant_id = $1 AND paciente_id = $2 AND status = 'paga'
    `, [tenantId, pacienteId]);
    const { valor_atual, ticket_medio } = valRes.rows[0];
    const razao = (parseFloat(ticket_medio) > 0 && valor_atual)
      ? parseFloat(valor_atual) / parseFloat(ticket_medio) : 1;
    const fatorValorVsTicket = Math.max(0, Math.min(100, Math.round((razao - 1) * 50)));

    // 5. Tempo de relacionamento
    const rel = await pool.query(`
      SELECT MIN(criado_em) AS primeiro FROM "${schema}".faturas
      WHERE tenant_id = $1 AND paciente_id = $2
    `, [tenantId, pacienteId]);
    const primeiro = rel.rows[0]?.primeiro;
    const anosRel = primeiro
      ? (Date.now() - new Date(primeiro).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
    const fatorRelacionamento = Math.max(0, 100 - Math.round(anosRel * 25));

    // 6. No-shows recentes
    const ns = await pool.query(`
      SELECT COUNT(*) AS noshows
      FROM "${schema}".agendamentos
      WHERE tenant_id = $1 AND paciente_id = $2
        AND status = 'nao_compareceu'
        AND data_hora >= NOW() - INTERVAL '90 days'
    `, [tenantId, pacienteId]).catch(() => ({ rows: [{ noshows: 0 }] }));
    const fatorNoshows = Math.min(100, parseInt(ns.rows[0].noshows) * 20);

    return {
      historico_pagamentos:        fatorHistorico,
      tempo_medio_pagamento:       fatorTempoPagamento,
      resposta_cobranca_whatsapp:  50, // placeholder
      faturas_abertas_simultaneas: fatorAbertasSim,
      valor_vs_ticket_medio:       fatorValorVsTicket,
      tempo_relacionamento:        fatorRelacionamento,
      noshows_recentes:            fatorNoshows,
    };
  }

  calcularScore(fatores) {
    const score = Math.round(
      fatores.historico_pagamentos        * FATORES_PESO.historico_pagamentos +
      fatores.tempo_medio_pagamento       * FATORES_PESO.tempo_medio_pagamento +
      fatores.resposta_cobranca_whatsapp  * FATORES_PESO.resposta_cobranca_whatsapp +
      fatores.faturas_abertas_simultaneas * FATORES_PESO.faturas_abertas_simultaneas +
      fatores.valor_vs_ticket_medio       * FATORES_PESO.valor_vs_ticket_medio +
      fatores.tempo_relacionamento        * FATORES_PESO.tempo_relacionamento +
      fatores.noshows_recentes            * FATORES_PESO.noshows_recentes
    );
    const s = Math.max(0, Math.min(100, score));
    const categoria = s <= 30 ? 'baixo' : s <= 60 ? 'medio' : 'alto';
    return { score: s, categoria };
  }

  // ── Calcular e persistir scores de todos os pacientes com fatura em aberto ─
  async calcularScoresTenant() {
    const { rows: pacientes } = await pool.query(`
      SELECT DISTINCT paciente_id FROM "${this.schema}".faturas
      WHERE tenant_id = $1 AND status IN ('aguardando','parcial','vencida')
    `, [this.tenantId]);

    let processados = 0;
    for (const { paciente_id } of pacientes) {
      try {
        const fatores   = await this.calcularFatores(paciente_id);
        const { score, categoria } = this.calcularScore(fatores);
        const fatoresJson = JSON.stringify(fatores);

        await pool.query(`
          INSERT INTO "${this.schema}".ia_scores_financeiros
            (tenant_id, paciente_id, score, categoria, fatores_json, calculado_em)
          VALUES ($1,$2,$3,$4,$5,NOW())
          ON CONFLICT (tenant_id, paciente_id) DO UPDATE SET
            score        = EXCLUDED.score,
            categoria    = EXCLUDED.categoria,
            fatores_json = EXCLUDED.fatores_json,
            calculado_em = NOW()
        `, [this.tenantId, paciente_id, score, categoria, fatoresJson]);

        await pool.query(`
          INSERT INTO "${this.schema}".ia_scores_historico
            (tenant_id, paciente_id, score, categoria, fatores_json)
          VALUES ($1,$2,$3,$4,$5)
        `, [this.tenantId, paciente_id, score, categoria, fatoresJson]);

        processados++;
      } catch (err) {
        console.error(`[IAFinanceiro] Erro paciente ${paciente_id}:`, err.message);
      }
    }

    await this.verificarAlertas();
    return processados;
  }

  // ── Coletar dados para insight mensal ─────────────────────────────────────
  async coletarDadosParaInsight(mesReferencia) {
    const schema   = this.schema;
    const tenantId = this.tenantId;

    const mesAnterior = (() => {
      const [ano, mes] = mesReferencia.split('-').map(Number);
      const d = new Date(ano, mes - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const [receita, receitaAnt, inadimplencia, topProcs, porProf] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(p.valor), 0)          AS total,
          COUNT(DISTINCT f.id)               AS num_faturas,
          COALESCE(AVG(f.valor_liquido), 0)  AS ticket_medio
        FROM "${schema}".faturas f
        JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
        WHERE f.tenant_id = $1
          AND TO_CHAR(p.data_recebimento, 'YYYY-MM') = $2
      `, [tenantId, mesReferencia]),

      pool.query(`
        SELECT COALESCE(SUM(p.valor), 0) AS total
        FROM "${schema}".faturas f
        JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
        WHERE f.tenant_id = $1
          AND TO_CHAR(p.data_recebimento, 'YYYY-MM') = $2
      `, [tenantId, mesAnterior]),

      pool.query(`
        SELECT COUNT(*) AS faturas_vencidas,
               COALESCE(SUM(valor_liquido - valor_pago), 0) AS valor_vencido
        FROM "${schema}".faturas
        WHERE tenant_id = $1 AND status = 'vencida'
          AND TO_CHAR(vencimento, 'YYYY-MM') = $2
      `, [tenantId, mesReferencia]),

      pool.query(`
        SELECT fi.descricao, COUNT(*) AS quantidade, SUM(fi.subtotal) AS receita_total
        FROM "${schema}".faturas f
        JOIN "${schema}".faturas_itens fi ON fi.fatura_id = f.id
        WHERE f.tenant_id = $1
          AND TO_CHAR(f.criado_em, 'YYYY-MM') = $2
          AND f.status IN ('paga','parcial')
        GROUP BY fi.descricao
        ORDER BY receita_total DESC LIMIT 5
      `, [tenantId, mesReferencia]),

      pool.query(`
        SELECT pr.nome,
               COUNT(DISTINCT f.id) AS atendimentos,
               COALESCE(SUM(p.valor), 0) AS receita_gerada
        FROM "${schema}".faturas f
        JOIN "${schema}".profissionais pr ON pr.id = f.profissional_id
        LEFT JOIN "${schema}".pagamentos p ON p.fatura_id = f.id
          AND TO_CHAR(p.data_recebimento, 'YYYY-MM') = $2
        WHERE f.tenant_id = $1
          AND TO_CHAR(f.criado_em, 'YYYY-MM') = $2
        GROUP BY f.profissional_id, pr.nome
        ORDER BY receita_gerada DESC
      `, [tenantId, mesReferencia]),
    ]);

    const receitaTotal    = parseFloat(receita.rows[0].total);
    const receitaAntTotal = parseFloat(receitaAnt.rows[0].total);
    return {
      mes_referencia: mesReferencia,
      receita: {
        ...receita.rows[0],
        variacao_pct: receitaAntTotal > 0
          ? Math.round(((receitaTotal - receitaAntTotal) / receitaAntTotal) * 100) : null,
      },
      inadimplencia: inadimplencia.rows[0],
      top_procedimentos: topProcs.rows,
      performance_profissionais: porProf.rows,
    };
  }

  // ── Gerar insight com Claude API ──────────────────────────────────────────
  async gerarInsightComClaude(dados, mesReferencia) {
    const client = new Anthropic();
    const prompt = `Você é um analista financeiro especializado em clínicas de saúde.
Analise os dados financeiros abaixo e gere um resumo executivo em português brasileiro.

O resumo deve conter:
1. Análise da receita com comparação ao mês anterior
2. Alertas sobre inadimplência (se > 5%)
3. Destaque do procedimento mais lucrativo
4. Destaque do profissional com melhor performance
5. Uma oportunidade de melhoria identificada nos dados

Seja direto, use linguagem natural (não técnica), use valores em R$ formatados.
Máximo 300 palavras. Formato markdown.

Dados do mês ${mesReferencia}:
${JSON.stringify(dados, null, 2)}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      conteudo:     response.content[0].text,
      tokensUsados: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  // ── Gerar e persistir insight mensal ─────────────────────────────────────
  async gerarInsightMensal(mesReferencia) {
    // Idempotência
    const existing = await pool.query(`
      SELECT id FROM "${this.schema}".ia_insights_financeiros
      WHERE tenant_id = $1 AND tipo = 'mensal' AND periodo_referencia = $2
    `, [this.tenantId, mesReferencia]);
    if (existing.rows.length) return existing.rows[0];

    const dados = await this.coletarDadosParaInsight(mesReferencia);
    const { conteudo, tokensUsados } = await this.gerarInsightComClaude(dados, mesReferencia);

    const { rows: [insight] } = await pool.query(`
      INSERT INTO "${this.schema}".ia_insights_financeiros
        (tenant_id, tipo, periodo_referencia, conteudo, dados_entrada_json, tokens_usados, modelo_claude)
      VALUES ($1,'mensal',$2,$3,$4,$5,'claude-haiku-4-5-20251001')
      ON CONFLICT (tenant_id, tipo, periodo_referencia) DO NOTHING
      RETURNING *
    `, [this.tenantId, mesReferencia, conteudo, JSON.stringify(dados), tokensUsados]);

    return insight;
  }

  // ── Calcular projeção de caixa (4 semanas) ────────────────────────────────
  async calcularProjecao() {
    const schema   = this.schema;
    const tenantId = this.tenantId;
    const semanas  = [];

    for (let s = 0; s < 4; s++) {
      const hoje = new Date();
      const ini  = new Date(hoje);
      ini.setDate(hoje.getDate() + s * 7);
      const fim  = new Date(ini);
      fim.setDate(ini.getDate() + 6);
      const iniStr = ini.toISOString().slice(0, 10);
      const fimStr = fim.toISOString().slice(0, 10);

      const [agend, taxaRes, fatPend] = await Promise.all([
        pool.query(`
          SELECT COUNT(*) AS total,
                 COALESCE(SUM(pp.valor_particular), 0) AS valor_estimado
          FROM "${schema}".agendamentos a
          LEFT JOIN "${schema}".procedimentos_precos pp
                 ON pp.procedimento_id = a.procedimento_id AND pp.tenant_id = a.tenant_id
          WHERE a.tenant_id = $1 AND a.status = 'confirmado'
            AND DATE(a.data_hora) BETWEEN $2 AND $3
        `, [tenantId, iniStr, fimStr]).catch(() => ({ rows: [{ total: 0, valor_estimado: 0 }] })),

        pool.query(`
          SELECT CAST(
            SUM(CASE WHEN status = 'realizado' THEN 1.0 ELSE 0 END) /
            NULLIF(COUNT(*), 0)
          AS NUMERIC) AS taxa
          FROM "${schema}".agendamentos
          WHERE tenant_id = $1
            AND data_hora >= NOW() - INTERVAL '56 days'
            AND status IN ('realizado','nao_compareceu','cancelado')
        `, [tenantId]).catch(() => ({ rows: [{ taxa: null }] })),

        pool.query(`
          SELECT COALESCE(SUM(
            (f.valor_liquido - f.valor_pago) * (1 - COALESCE(s.score, 50) / 100.0)
          ), 0) AS valor_ajustado_risco
          FROM "${schema}".faturas f
          LEFT JOIN "${schema}".ia_scores_financeiros s
                 ON s.paciente_id = f.paciente_id AND s.tenant_id = f.tenant_id
          WHERE f.tenant_id = $1
            AND f.status IN ('aguardando','parcial')
            AND f.vencimento BETWEEN $2 AND $3
        `, [tenantId, iniStr, fimStr]).catch(() => ({ rows: [{ valor_ajustado_risco: 0 }] })),
      ]);

      const taxa      = parseFloat(taxaRes.rows[0]?.taxa || 0.85);
      const projAgend = parseFloat(agend.rows[0].valor_estimado) * taxa;
      const projFat   = parseFloat(fatPend.rows[0].valor_ajustado_risco);
      const total     = Math.round((projAgend + projFat) * 100) / 100;

      semanas.push({
        semana: s + 1,
        inicio: iniStr,
        fim: fimStr,
        projecao: total,
        minimo: Math.round(total * 0.85 * 100) / 100,
        maximo: Math.round(total * 1.15 * 100) / 100,
        confianca: 0.75,
        agendamentos_confirmados: parseInt(agend.rows[0].total),
        taxa_comparecimento_historica: Math.round(taxa * 100),
      });
    }
    return semanas;
  }

  // ── Verificar e gerar alertas proativos ───────────────────────────────────
  async verificarAlertas() {
    const schema   = this.schema;
    const tenantId = this.tenantId;

    // Receita caindo > 15%
    const receitas = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN p.data_recebimento >= CURRENT_DATE - 7 THEN p.valor ELSE 0 END), 0) AS esta_semana,
        COALESCE(SUM(CASE WHEN p.data_recebimento BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE - 8 THEN p.valor ELSE 0 END), 0) AS semana_anterior
      FROM "${schema}".pagamentos p
      JOIN "${schema}".faturas f ON f.id = p.fatura_id
      WHERE f.tenant_id = $1
    `, [tenantId]).catch(() => ({ rows: [{ esta_semana: 0, semana_anterior: 0 }] }));

    const { esta_semana, semana_anterior } = receitas.rows[0];
    if (parseFloat(semana_anterior) > 0) {
      const queda = (parseFloat(semana_anterior) - parseFloat(esta_semana)) / parseFloat(semana_anterior);
      if (queda > 0.15) {
        await pool.query(`
          INSERT INTO "${schema}".ia_alertas
            (tenant_id, tipo_alerta, titulo, descricao, valor_gatilho, dados_json)
          VALUES ($1,'receita_caindo','Receita caindo',$2,$3,$4)
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          `Receita caiu ${Math.round(queda * 100)}% vs semana anterior`,
          queda,
          JSON.stringify({ esta_semana, semana_anterior }),
        ]).catch(() => {});
      }
    }

    // Inadimplência > 8%
    const inadimp = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'vencida' THEN 1 ELSE 0 END) AS vencidas
      FROM "${schema}".faturas
      WHERE tenant_id = $1
        AND TO_CHAR(criado_em, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM')
    `, [tenantId]).catch(() => ({ rows: [{ total: 0, vencidas: 0 }] }));

    const { total, vencidas } = inadimp.rows[0];
    if (parseInt(total) > 0) {
      const taxa = parseInt(vencidas) / parseInt(total);
      if (taxa > 0.08) {
        await pool.query(`
          INSERT INTO "${schema}".ia_alertas
            (tenant_id, tipo_alerta, titulo, descricao, valor_gatilho)
          VALUES ($1,'inadimplencia_crescendo','Inadimplência alta',$2,$3)
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          `Inadimplência em ${Math.round(taxa * 100)}% das faturas do mês`,
          taxa,
        ]).catch(() => {});
      }
    }
  }
}

module.exports = IAFinanceiroService;
