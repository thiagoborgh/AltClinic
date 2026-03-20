/**
 * NoShowPrompts — builders de prompts para IA de relatório no-show
 */
function buildNoShowPrompt({ kpis, heatmap, reincidentes, porOrigem, periodo }) {
  const piorCelula = [...heatmap].sort((a, b) => b.taxa_pct - a.taxa_pct)[0];
  const melhorCelula = [...heatmap].sort((a, b) => a.taxa_pct - b.taxa_pct)[0];
  const origemMaiorNoShow = [...porOrigem].sort((a, b) => b.taxa_pct - a.taxa_pct)[0];
  const origemMenorNoShow = [...porOrigem].sort((a, b) => a.taxa_pct - b.taxa_pct)[0];
  const totalFaltasReincidentes = reincidentes.reduce((s, r) => s + parseInt(r.total_no_shows_6m || 0), 0);
  const pctFaltasReincidentes = parseInt(kpis.total_no_shows || 0) > 0
    ? Math.round(totalFaltasReincidentes / parseInt(kpis.total_no_shows) * 100) : 0;

  return `Você é um analista de gestão de clínicas médicas. Analise os dados de no-show abaixo e gere um relatório em linguagem natural, direta e acionável. Use no máximo 300 palavras. Estruture em:
1) Situação geral (1 parágrafo com os números principais)
2) Padrão mais crítico identificado (1 parágrafo — dia/turno/origem com pior taxa)
3) Causa mais provável (1 parágrafo — baseado na comparação confirmados vs. não confirmados)
4) Recomendações (3 itens numerados, cada um com estimativa de impacto em % de redução de no-show)

DADOS DO PERÍODO ${periodo.inicio} A ${periodo.fim}:
- Taxa de no-show: ${kpis.taxa_no_show_pct}%
- Total de faltas: ${kpis.total_no_shows} de ${kpis.total_agendamentos} agendamentos
- Impacto financeiro estimado: R$ ${kpis.impacto_financeiro}
- Variação vs. mês anterior: ${parseFloat(kpis.variacao_mes_anterior_pct || 0) > 0 ? '+' : ''}${kpis.variacao_mes_anterior_pct}%

HEATMAP (pior → melhor):
- Combinação com MAIOR no-show: ${piorCelula?.dia_semana_nome} ${piorCelula?.turno} (${piorCelula?.taxa_pct}% — ${piorCelula?.no_shows} faltas em ${piorCelula?.total} agendamentos)
- Combinação com MENOR no-show: ${melhorCelula?.dia_semana_nome} ${melhorCelula?.turno} (${melhorCelula?.taxa_pct}%)

POR ORIGEM:
- Origem com maior no-show: ${origemMaiorNoShow?.origem} (${origemMaiorNoShow?.taxa_pct}%)
- Origem com menor no-show: ${origemMenorNoShow?.origem} (${origemMenorNoShow?.taxa_pct}%)
- Diferença confirmados vs. não confirmados: ${porOrigem[0]?.taxa_confirmados_pct ?? 'N/D'}% vs. ${porOrigem[0]?.taxa_nao_confirmados_pct ?? 'N/D'}%

REINCIDENTES (últimos 6 meses, mínimo 3 no-shows):
- Total de pacientes reincidentes: ${reincidentes.length}
- Faltas causadas por reincidentes: ${totalFaltasReincidentes} (${pctFaltasReincidentes}% do total de faltas)
${reincidentes.slice(0, 3).map(r => `- ${r.paciente_nome}: ${r.total_no_shows_6m} no-shows nos últimos 6 meses`).join('\n')}

Responda em português brasileiro. Seja específico com os números. Não use jargões técnicos.`;
}

module.exports = { buildNoShowPrompt };
