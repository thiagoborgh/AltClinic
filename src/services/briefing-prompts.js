/**
 * briefing-prompts.js — monta prompts para o briefing diário IA do dashboard
 */

/**
 * Monta o prompt de briefing para Claude com base nos KPIs do dia.
 * @param {Object} kpis  — dados do dashboard (agendamentos, receita, alertas etc.)
 * @param {string} perfil — perfil do usuário ('admin','medico','recepcionista','financeiro')
 * @param {string} nomeClinica — nome da clínica
 * @returns {string} prompt pronto para enviar ao modelo
 */
function buildBriefingPrompt(kpis, perfil, nomeClinica) {
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const base = `Você é o assistente de gestão da clínica "${nomeClinica}". Hoje é ${hoje}.
Gere um briefing executivo conciso (máx. 200 palavras) para o perfil "${perfil}".
Seja direto, use linguagem profissional e destaque pontos de atenção.`;

  switch (perfil) {
    case 'admin': {
      const {
        agendamentos_hoje = 0,
        confirmados = 0,
        no_shows = 0,
        receita_mes = 0,
        meta_receita = 0,
        inadimplencia_valor = 0,
        alertas_criticos = 0
      } = kpis;
      const pct = meta_receita > 0 ? Math.round((receita_mes / meta_receita) * 100) : 0;
      return `${base}

Dados de hoje:
- Agendamentos: ${agendamentos_hoje} (${confirmados} confirmados, ${no_shows} no-shows)
- Receita do mês: R$ ${Number(receita_mes).toFixed(2)} de meta R$ ${Number(meta_receita).toFixed(2)} (${pct}%)
- Inadimplência em aberto: R$ ${Number(inadimplencia_valor).toFixed(2)}
- Alertas críticos: ${alertas_criticos}

Briefing:`;
    }

    case 'medico': {
      const {
        pacientes_hoje = 0,
        primeira_consulta = 0,
        retornos = 0,
        duracao_media_min = 0
      } = kpis;
      return `${base}

Agenda de hoje:
- Total de pacientes: ${pacientes_hoje} (${primeira_consulta} primeiras consultas, ${retornos} retornos)
- Duração média prevista por atendimento: ${duracao_media_min} minutos

Briefing:`;
    }

    case 'recepcionista': {
      const {
        agendamentos_hoje = 0,
        aguardando_confirmacao = 0,
        checkins_pendentes = 0,
        fila_atual = 0
      } = kpis;
      return `${base}

Situação atual:
- Agendamentos hoje: ${agendamentos_hoje}
- Aguardando confirmação: ${aguardando_confirmacao}
- Check-ins pendentes: ${checkins_pendentes}
- Na fila de espera agora: ${fila_atual}

Briefing:`;
    }

    case 'financeiro': {
      const {
        receita_mes = 0,
        meta_receita = 0,
        faturas_vencidas = 0,
        valor_vencido = 0,
        cobradas_hoje = 0
      } = kpis;
      const pct = meta_receita > 0 ? Math.round((receita_mes / meta_receita) * 100) : 0;
      return `${base}

Situação financeira:
- Receita do mês: R$ ${Number(receita_mes).toFixed(2)} / meta R$ ${Number(meta_receita).toFixed(2)} (${pct}%)
- Faturas vencidas: ${faturas_vencidas} (total R$ ${Number(valor_vencido).toFixed(2)})
- Cobranças enviadas hoje: ${cobradas_hoje}

Briefing:`;
    }

    default:
      return `${base}

Dados: ${JSON.stringify(kpis, null, 2)}

Briefing:`;
  }
}

module.exports = { buildBriefingPrompt };
