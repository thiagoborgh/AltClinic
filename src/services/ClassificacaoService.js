/**
 * ClassificacaoService — classificação de assunto e sentimento via Claude API
 * Chamado após persistência da mensagem — não bloqueia o webhook
 */
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TAGS_VALIDAS = ['agendamento', 'cobranca', 'crm', 'duvida', 'outro'];

function getIo() {
  try { return require('../server').io; } catch { return null; }
}

/** Classifica o assunto da conversa e atualiza a tag */
async function classificar(conversaId, texto, pool, tenantId, schema) {
  if (!texto || texto.trim().length < 3) return;

  const { rows: histRows } = await pool.query(`
    SELECT direcao, conteudo FROM "${schema}".whatsapp_mensagens
    WHERE conversa_id = $1
    ORDER BY id DESC LIMIT 5
  `, [conversaId]);

  const historico = histRows.reverse()
    .map(m => `${m.direcao === 'entrada' ? 'Paciente' : 'Atendente'}: ${m.conteudo}`)
    .join('\n');

  const prompt = `Você é um classificador de mensagens de uma clínica médica.
Analise a mensagem do paciente e retorne APENAS um JSON com o campo "tag".

Tags possíveis:
- "agendamento": marcar, cancelar, reagendar, confirmar consulta
- "cobranca": pagamento, boleto, pix, dívida, fatura, valor
- "crm": retorno, follow-up, resultado de exame, pós-consulta
- "duvida": perguntas gerais, informações, horário, endereço
- "outro": qualquer outra coisa

Histórico recente da conversa:
${historico}

Última mensagem do paciente:
"${texto}"

Responda APENAS com JSON válido: {"tag": "<valor>"}`;

  let tag = 'outro';
  try {
    const response = await anthropic.messages.create({
      model:       'claude-haiku-4-5-20251001',
      max_tokens:  50,
      temperature: 0,
      messages:    [{ role: 'user', content: prompt }],
    });
    const resultado = JSON.parse(response.content[0].text);
    if (TAGS_VALIDAS.includes(resultado.tag)) tag = resultado.tag;
  } catch (err) {
    console.error('[Classificacao] Erro Claude API:', err.message);
  }

  await pool.query(
    `UPDATE "${schema}".whatsapp_conversas SET tag = $1, atualizado_em = NOW() WHERE id = $2`,
    [tag, conversaId]
  );

  const io = getIo();
  if (io) io.to(`tenant:${tenantId}`).emit('conversa_classificada', { conversa_id: conversaId, tag });

  analisarSentimento(conversaId, texto, pool, tenantId, schema).catch(console.error);
}

/** Análise de sentimento — emite alerta_sentimento se negativo e urgente */
async function analisarSentimento(conversaId, texto, pool, tenantId, schema) {
  const prompt = `Analise o sentimento desta mensagem de paciente em uma clínica.
Responda APENAS com JSON: {"sentimento": "positivo"|"neutro"|"negativo", "urgente": true|false}

Mensagem: "${texto}"`;

  try {
    const response = await anthropic.messages.create({
      model:       'claude-haiku-4-5-20251001',
      max_tokens:  60,
      temperature: 0,
      messages:    [{ role: 'user', content: prompt }],
    });
    const { sentimento, urgente } = JSON.parse(response.content[0].text);

    if (sentimento === 'negativo' && urgente === true) {
      const io = getIo();
      if (io) {
        const { rows } = await pool.query(
          `SELECT numero FROM "${schema}".whatsapp_conversas WHERE id = $1`,
          [conversaId]
        );
        io.to(`tenant:${tenantId}`).emit('alerta_sentimento', {
          conversa_id: conversaId, numero: rows[0]?.numero, preview: texto.slice(0, 120),
        });
      }
    }
  } catch {
    // Falha silenciosa
  }
}

/** Gera sugestão de resposta via Claude para o atendente */
async function sugerirResposta(conversaId, pool, schema) {
  const { rows: convRows } = await pool.query(`
    SELECT wc.*, p.nome AS paciente_nome
    FROM "${schema}".whatsapp_conversas wc
    LEFT JOIN "${schema}".pacientes p ON p.id = wc.paciente_id
    WHERE wc.id = $1
  `, [conversaId]);

  const conversa = convRows[0];
  if (!conversa) throw new Error('Conversa não encontrada');

  const { rows: histRows } = await pool.query(`
    SELECT direcao, conteudo FROM "${schema}".whatsapp_mensagens
    WHERE conversa_id = $1 ORDER BY id DESC LIMIT 10
  `, [conversaId]);

  const historico = histRows.reverse()
    .map(m => `${m.direcao === 'entrada' ? 'Paciente' : 'Atendente'}: ${m.conteudo}`)
    .join('\n');

  let proximaConsulta = 'sem consulta agendada';
  let saldoDevedor    = '0,00';
  if (conversa.paciente_id) {
    const { rows: agRows } = await pool.query(`
      SELECT data_hora FROM "${schema}".agendamentos_lite
      WHERE paciente_id = $1 AND data_hora > NOW() AND status != 'cancelado'
      ORDER BY data_hora LIMIT 1
    `, [conversa.paciente_id]).catch(() => ({ rows: [] }));
    if (agRows.length) proximaConsulta = new Date(agRows[0].data_hora).toLocaleString('pt-BR');
  }

  const prompt = `Você é um assistente de atendimento de clínica médica.
Tom: profissional, cordial, objetivo. Máximo 3 frases. Sem emojis excessivos.

Dados do paciente:
- Nome: ${conversa.paciente_nome || 'desconhecido'}
- Próxima consulta: ${proximaConsulta}
- Saldo devedor: R$ ${saldoDevedor}

Histórico da conversa (últimas 10 mensagens):
${historico}

Sugira UMA resposta curta e adequada para o atendente enviar.
Responda apenas com o texto da mensagem sugerida, sem aspas.`;

  const response = await anthropic.messages.create({
    model:       'claude-sonnet-4-6',
    max_tokens:  200,
    temperature: 0.3,
    messages:    [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

module.exports = { classificar, sugerirResposta };
