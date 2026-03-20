/**
 * ReceitaPrompts — prompts para insights financeiros de receita via Claude
 */

function buildReceitaPrompt({ kpis, porProfissional, porProcedimento, aging, mes }) {
  const topProc     = [...porProcedimento].sort((a, b) => b.receita_total - a.receita_total)[0];
  const procEmQueda = porProcedimento.find(p => parseFloat(p.variacao_3_meses) < -500);
  const faixa90Mais = aging.find(a => a.faixa_aging === '90+ dias');

  return `Você é um consultor financeiro especializado em clínicas médicas. Analise os dados de receita do mês ${mes} e gere um relatório executivo em linguagem natural, objetivo e acionável. Use no máximo 400 palavras. Estruture em:
1) Situação geral (1 parágrafo — receita, crescimento, comparativo)
2) Destaques positivos (1-2 itens com dados concretos)
3) Alertas e riscos (1-3 itens — inadimplência, queda, ticket médio)
4) Oportunidades para o próximo mês (2 itens com estimativa de receita em R$)

DADOS FINANCEIROS DE ${mes}:
- Receita bruta: R$ ${kpis.receita_bruta} (${parseFloat(kpis.var_mes_anterior_pct||0) > 0 ? '+' : ''}${kpis.var_mes_anterior_pct}% vs. mês anterior; ${parseFloat(kpis.var_ano_anterior_pct||0) > 0 ? '+' : ''}${kpis.var_ano_anterior_pct}% vs. ano anterior)
- Receita líquida: R$ ${kpis.receita_liquida}
- Ticket médio: R$ ${kpis.ticket_medio}
- Total de atendimentos: ${kpis.total_atendimentos} (${parseFloat(kpis.var_atendimentos_pct||0) > 0 ? '+' : ''}${kpis.var_atendimentos_pct}% vs. mês anterior)
- Taxa de inadimplência: ${kpis.taxa_inadimplencia_pct}% (${kpis.faturas_em_atraso} faturas em atraso de ${kpis.total_faturas} emitidas)
${faixa90Mais ? `- Dívidas acima de 90 dias: R$ ${faixa90Mais.valor_total} (${faixa90Mais.quantidade} faturas)` : '- Sem dívidas acima de 90 dias'}

PROFISSIONAIS — TOP 3:
${porProfissional.slice(0, 3).map((p, i) => `${i+1}. ${p.profissional_nome}: R$ ${p.receita_total} (${p.total_atendimentos} atend., ticket médio R$ ${p.ticket_medio}, ${p.pct_medio_do_total}% da receita total)`).join('\n')}

PROCEDIMENTOS:
- Maior receita: ${topProc?.procedimento_nome || 'N/D'} — R$ ${topProc?.receita_total || 0} (${topProc?.quantidade_total || 0} realizados)
${procEmQueda ? `- Em queda: ${procEmQueda.procedimento_nome} (queda de R$ ${Math.abs(procEmQueda.variacao_3_meses)})` : '- Sem procedimentos em queda significativa'}

INADIMPLÊNCIA POR FAIXA:
${aging.map(a => `- ${a.faixa_aging}: ${a.quantidade} faturas | R$ ${a.valor_total}`).join('\n')}

Seja específico com os números. Responda em português brasileiro.`;
}

module.exports = { buildReceitaPrompt };
