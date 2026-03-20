/**
 * alertas-detectores.js — 12 detectores de alertas proativos para o dashboard IA
 * detectarAlertas(pool, tenantId, schema) — chamado pelo job alertas-engine a cada 5min
 */
const { emitirAlertaInstantaneo } = require('../websocket/alertas');

function getHoje() {
  return new Date().toISOString().slice(0, 10);
}

function getAmanha() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Detector 1: Agendamentos sem confirmação (D-1) ────────────────────────────
async function detectarSemConfirmacao(pool, tenantId, schema) {
  try {
    const amanha = getAmanha();
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM "${schema}".agendamentos_lite
       WHERE tenant_id = $1
         AND data = $2
         AND status IN ('agendado','pendente')`,
      [tenantId, amanha]
    ).catch(() => ({ rows: [{ total: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    if (total > 0) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'recepcionista', 'sem_confirmacao', 'alta',
        `${total} agendamento(s) amanhã sem confirmação`,
        `Você tem ${total} agendamento(s) para amanhã ainda não confirmados. Entre em contato com os pacientes.`,
        { total, data: amanha },
        '/agenda'
      );
    }
  } catch (err) {
    console.error('[Detector sem_confirmacao]', err.message);
  }
}

// ── Detector 2: Taxa de no-show alta hoje ─────────────────────────────────────
async function detectarNoShowAlto(pool, tenantId, schema) {
  try {
    const hoje = getHoje();
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('realizado','no_show','cancelado')) AS total,
         COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
       FROM "${schema}".agendamentos_lite
       WHERE tenant_id = $1 AND data = $2`,
      [tenantId, hoje]
    ).catch(() => ({ rows: [{ total: 0, no_shows: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    const noShows = parseInt(rows[0]?.no_shows || 0);
    if (total >= 5 && noShows / total >= 0.25) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'admin', 'no_show_alto', 'alta',
        `Taxa de no-show hoje: ${Math.round((noShows / total) * 100)}%`,
        `${noShows} de ${total} atendimentos resultaram em no-show hoje. Considere reforçar confirmações.`,
        { total, no_shows: noShows, taxa: noShows / total },
        '/relatorios/no-show'
      );
    }
  } catch (err) {
    console.error('[Detector no_show_alto]', err.message);
  }
}

// ── Detector 3: Fatura vencendo hoje ─────────────────────────────────────────
async function detectarFaturasVencendoHoje(pool, tenantId, schema) {
  try {
    const hoje = getHoje();
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(valor),0) AS valor
       FROM "${schema}".faturas
       WHERE tenant_id = $1
         AND status = 'aguardando'
         AND vencimento::date = $2`,
      [tenantId, hoje]
    ).catch(() => ({ rows: [{ total: 0, valor: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    const valor = parseFloat(rows[0]?.valor || 0);
    if (total > 0) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'financeiro', 'fatura_vencendo_hoje', 'alta',
        `${total} fatura(s) vencem hoje`,
        `Total de R$ ${valor.toFixed(2)} em faturas com vencimento hoje ainda em aberto.`,
        { total, valor },
        '/financeiro/faturas'
      );
    }
  } catch (err) {
    console.error('[Detector fatura_vencendo_hoje]', err.message);
  }
}

// ── Detector 4: Alta inadimplência (> 20% das faturas do mês) ────────────────
async function detectarInadimplenciaAlta(pool, tenantId, schema) {
  try {
    const mesAtual = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'vencida') AS vencidas,
         COALESCE(SUM(valor) FILTER (WHERE status = 'vencida'), 0) AS valor_vencido
       FROM "${schema}".faturas
       WHERE tenant_id = $1
         AND to_char(criado_em, 'YYYY-MM') = $2
         AND status NOT IN ('cancelada')`,
      [tenantId, mesAtual]
    ).catch(() => ({ rows: [{ total: 0, vencidas: 0, valor_vencido: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    const vencidas = parseInt(rows[0]?.vencidas || 0);
    const valorVencido = parseFloat(rows[0]?.valor_vencido || 0);
    if (total >= 5 && vencidas / total >= 0.20) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'financeiro', 'inadimplencia_alta', 'critica',
        `Inadimplência: ${Math.round((vencidas / total) * 100)}% das faturas do mês`,
        `${vencidas} de ${total} faturas deste mês estão vencidas. Valor em aberto: R$ ${valorVencido.toFixed(2)}.`,
        { total, vencidas, valor_vencido: valorVencido, taxa: vencidas / total },
        '/financeiro/inadimplencia'
      );
    }
  } catch (err) {
    console.error('[Detector inadimplencia_alta]', err.message);
  }
}

// ── Detector 5: Fila de espera longa (> 10 pacientes) ────────────────────────
async function detectarFilaLonga(pool, tenantId, schema) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM "${schema}".fila_espera
       WHERE tenant_id = $1 AND status = 'aguardando'`,
      [tenantId]
    ).catch(() => ({ rows: [{ total: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    if (total > 10) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'recepcionista', 'fila_longa', 'alta',
        `Fila de espera: ${total} pacientes`,
        `Há ${total} pacientes na fila de espera. Considere acionar mais profissionais ou reorganizar a agenda.`,
        { total },
        '/fila'
      );
    }
  } catch (err) {
    console.error('[Detector fila_longa]', err.message);
  }
}

// ── Detector 6: Meta de receita em risco (< 60% do mês a 70% do tempo) ───────
async function detectarMetaReceitaRisco(pool, tenantId, schema) {
  try {
    const hoje = new Date();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const diaAtual = hoje.getDate();
    const percTempo = diaAtual / diasNoMes;
    if (percTempo < 0.70) return; // Só alertar a partir de 70% do mês

    const mesAtual = hoje.toISOString().slice(0, 7);
    const [receitaRes, metaRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(f.valor), 0) AS receita
         FROM "${schema}".faturas f
         WHERE f.tenant_id = $1
           AND f.status = 'pago'
           AND to_char(f.criado_em, 'YYYY-MM') = $2`,
        [tenantId, mesAtual]
      ).catch(() => ({ rows: [{ receita: 0 }] })),
      pool.query(
        `SELECT valor_meta FROM "${schema}".metas_dashboard
         WHERE tenant_id = $1 AND tipo = 'receita' AND mes = $2`,
        [tenantId, mesAtual]
      ).catch(() => ({ rows: [] }))
    ]);
    const meta = parseFloat(metaRes.rows[0]?.valor_meta || 0);
    if (!meta) return;
    const receita = parseFloat(receitaRes.rows[0]?.receita || 0);
    const pctMeta = receita / meta;
    if (pctMeta < 0.60) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'admin', 'meta_receita_risco', 'critica',
        `Meta de receita em risco: ${Math.round(pctMeta * 100)}% atingida`,
        `Estamos a ${Math.round(percTempo * 100)}% do mês e a receita atingiu apenas ${Math.round(pctMeta * 100)}% da meta (R$ ${receita.toFixed(2)} de R$ ${meta.toFixed(2)}).`,
        { receita, meta, pct_meta: pctMeta, pct_tempo: percTempo },
        '/relatorios/receita'
      );
    }
  } catch (err) {
    console.error('[Detector meta_receita_risco]', err.message);
  }
}

// ── Detector 7: Paciente de alto risco financeiro sem cobrança ────────────────
async function detectarAltoRiscoSemCobranca(pool, tenantId, schema) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM "${schema}".faturas f
       LEFT JOIN "${schema}".ia_scores_financeiros s ON s.paciente_id = f.paciente_id AND s.tenant_id = f.tenant_id
       WHERE f.tenant_id = $1
         AND f.status = 'vencida'
         AND s.score_risco >= 70
         AND NOT EXISTS (
           SELECT 1 FROM "${schema}".cobrancas_whatsapp c
           WHERE c.fatura_id = f.id AND c.enviado_em > NOW() - INTERVAL '3 days'
         )`,
      [tenantId]
    ).catch(() => ({ rows: [{ total: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    if (total > 0) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'financeiro', 'alto_risco_sem_cobranca', 'alta',
        `${total} paciente(s) de alto risco sem cobrança recente`,
        `${total} fatura(s) de pacientes com alto risco financeiro estão vencidas sem cobrança nos últimos 3 dias.`,
        { total },
        '/financeiro/inadimplencia'
      );
    }
  } catch (err) {
    console.error('[Detector alto_risco_sem_cobranca]', err.message);
  }
}

// ── Detector 8: Oportunidades CRM sem follow-up (> 7 dias) ───────────────────
async function detectarOportunidadesSemFollowup(pool, tenantId, schema) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM "${schema}".crm_oportunidades
       WHERE tenant_id = $1
         AND status NOT IN ('fechado_ganho','fechado_perdido')
         AND (ultimo_contato IS NULL OR ultimo_contato < NOW() - INTERVAL '7 days')`,
      [tenantId]
    ).catch(() => ({ rows: [{ total: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    if (total > 0) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'admin', 'oportunidades_sem_followup', 'normal',
        `${total} oportunidade(s) CRM sem follow-up há mais de 7 dias`,
        `${total} oportunidades ativas no CRM estão sem contato há mais de 7 dias e podem esfriar.`,
        { total },
        '/crm'
      );
    }
  } catch (err) {
    console.error('[Detector oportunidades_sem_followup]', err.message);
  }
}

// ── Detector 9: Muitas mensagens WhatsApp não respondidas (> 5) ───────────────
async function detectarWhatsAppNaoRespondido(pool, tenantId, schema) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT conversa_id) AS total
       FROM "${schema}".whatsapp_inbox
       WHERE tenant_id = $1
         AND respondido = false
         AND criado_em < NOW() - INTERVAL '2 hours'`,
      [tenantId]
    ).catch(() => ({ rows: [{ total: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    if (total >= 5) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'recepcionista', 'whatsapp_nao_respondido', 'alta',
        `${total} conversa(s) WhatsApp sem resposta há mais de 2h`,
        `Há ${total} conversas no WhatsApp aguardando resposta há mais de 2 horas.`,
        { total },
        '/whatsapp'
      );
    }
  } catch (err) {
    console.error('[Detector whatsapp_nao_respondido]', err.message);
  }
}

// ── Detector 10: Profissional sem agendamentos amanhã (agenda vazia) ──────────
async function detectarAgendaVaziaAmanha(pool, tenantId, schema) {
  try {
    const amanha = getAmanha();
    const { rows } = await pool.query(
      `SELECT p.id, p.nome,
         COUNT(a.id) AS agendamentos
       FROM "${schema}".profissionais p
       LEFT JOIN "${schema}".agendamentos_lite a
         ON a.profissional_id = p.id AND a.data = $2 AND a.tenant_id = $1
       WHERE p.tenant_id = $1 AND p.ativo = true
       GROUP BY p.id, p.nome
       HAVING COUNT(a.id) = 0`,
      [tenantId, amanha]
    ).catch(() => ({ rows: [] }));
    if (rows.length > 0) {
      const nomes = rows.map(r => r.nome).join(', ');
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'admin', 'agenda_vazia_amanha', 'baixa',
        `${rows.length} profissional(is) sem agenda amanhã`,
        `Os seguintes profissionais não têm agendamentos para amanhã: ${nomes}.`,
        { profissionais: rows.map(r => ({ id: r.id, nome: r.nome })) },
        '/agenda'
      );
    }
  } catch (err) {
    console.error('[Detector agenda_vazia_amanha]', err.message);
  }
}

// ── Detector 11: Paciente retorno atrasado (> 90 dias sem voltar) ─────────────
async function detectarRetornoAtrasado(pool, tenantId, schema) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT paciente_id) AS total
       FROM "${schema}".agendamentos_lite
       WHERE tenant_id = $1
         AND status = 'realizado'
         AND paciente_id NOT IN (
           SELECT DISTINCT paciente_id
           FROM "${schema}".agendamentos_lite
           WHERE tenant_id = $1
             AND data > (CURRENT_DATE - INTERVAL '90 days')
         )
         AND data = (
           SELECT MAX(data)
           FROM "${schema}".agendamentos_lite a2
           WHERE a2.paciente_id = agendamentos_lite.paciente_id
             AND a2.tenant_id = $1
             AND a2.status = 'realizado'
         )
         AND data < (CURRENT_DATE - INTERVAL '90 days')
         AND data > (CURRENT_DATE - INTERVAL '180 days')`,
      [tenantId]
    ).catch(() => ({ rows: [{ total: 0 }] }));
    const total = parseInt(rows[0]?.total || 0);
    if (total >= 10) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'admin', 'retorno_atrasado', 'normal',
        `${total} paciente(s) sem retorno há mais de 90 dias`,
        `${total} pacientes que realizaram consulta estão há mais de 90 dias sem novo agendamento. Considere campanhas de reativação.`,
        { total },
        '/pacientes'
      );
    }
  } catch (err) {
    console.error('[Detector retorno_atrasado]', err.message);
  }
}

// ── Detector 12: Receita do dia abaixo do esperado ────────────────────────────
async function detectarReceitaDiaAbaixo(pool, tenantId, schema) {
  try {
    const hoje = getHoje();
    const mesAtual = hoje.slice(0, 7);
    const [receitaHoje, metaRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(f.valor), 0) AS receita
         FROM "${schema}".faturas f
         WHERE f.tenant_id = $1
           AND f.status = 'pago'
           AND f.criado_em::date = $2`,
        [tenantId, hoje]
      ).catch(() => ({ rows: [{ receita: 0 }] })),
      pool.query(
        `SELECT valor_meta FROM "${schema}".metas_dashboard
         WHERE tenant_id = $1 AND tipo = 'receita' AND mes = $2`,
        [tenantId, mesAtual]
      ).catch(() => ({ rows: [] }))
    ]);
    const meta = parseFloat(metaRes.rows[0]?.valor_meta || 0);
    if (!meta) return;
    const diasNoMes = new Date(
      new Date().getFullYear(), new Date().getMonth() + 1, 0
    ).getDate();
    const metaDia = meta / diasNoMes;
    const receita = parseFloat(receitaHoje.rows[0]?.receita || 0);
    if (receita < metaDia * 0.5) {
      await emitirAlertaInstantaneo(
        tenantId, schema,
        'financeiro', 'receita_dia_abaixo', 'normal',
        `Receita de hoje abaixo do esperado`,
        `Receita de hoje: R$ ${receita.toFixed(2)}. Esperado (meta diária): R$ ${metaDia.toFixed(2)}. Abaixo de 50% da meta.`,
        { receita, meta_dia: metaDia },
        '/financeiro'
      );
    }
  } catch (err) {
    console.error('[Detector receita_dia_abaixo]', err.message);
  }
}

// ── Orquestrador principal ─────────────────────────────────────────────────────
async function detectarAlertas(pool, tenantId, schema) {
  await Promise.allSettled([
    detectarSemConfirmacao(pool, tenantId, schema),
    detectarNoShowAlto(pool, tenantId, schema),
    detectarFaturasVencendoHoje(pool, tenantId, schema),
    detectarInadimplenciaAlta(pool, tenantId, schema),
    detectarFilaLonga(pool, tenantId, schema),
    detectarMetaReceitaRisco(pool, tenantId, schema),
    detectarAltoRiscoSemCobranca(pool, tenantId, schema),
    detectarOportunidadesSemFollowup(pool, tenantId, schema),
    detectarWhatsAppNaoRespondido(pool, tenantId, schema),
    detectarAgendaVaziaAmanha(pool, tenantId, schema),
    detectarRetornoAtrasado(pool, tenantId, schema),
    detectarReceitaDiaAbaixo(pool, tenantId, schema),
  ]);
}

module.exports = { detectarAlertas };
