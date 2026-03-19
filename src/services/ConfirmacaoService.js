const UnifiedWhatsAppService = require('./UnifiedWhatsAppService');
const { emitConfirmacaoEvent } = require('../utils/sseEmitter');

const whatsAppService = new UnifiedWhatsAppService();

async function enviarWhatsAppConfirmacao(db, tenantId, agendamentoId, userId) {
  const agendamento = await db.get(`
    SELECT a.*, p.nome AS paciente_nome, p.telefone AS paciente_telefone,
           pr.nome AS profissional_nome, a.procedimento
    FROM agendamentos_lite a
    JOIN pacientes p      ON p.id = a.paciente_id
    JOIN profissionais pr ON pr.id = a.profissional_id
    WHERE a.id = $1
  `, [agendamentoId]);

  if (!agendamento) throw Object.assign(new Error('Agendamento não encontrado'), { status: 404 });

  const dataFormatada = new Date(agendamento.data_hora || agendamento.data)
    .toLocaleDateString('pt-BR');
  const horario = agendamento.horario ||
    new Date(agendamento.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const mensagem = [
    `Olá, ${agendamento.paciente_nome}!`,
    `Lembramos que você tem consulta em *${dataFormatada}* às *${horario}*`,
    `com *${agendamento.profissional_nome}* para *${agendamento.procedimento}*.`,
    `\nResponda *SIM* para confirmar ou *NÃO* para cancelar.`,
  ].join(' ');

  const resultado = await whatsAppService.sendMessage(
    tenantId,
    'confirmacao_agendamento',
    { to: agendamento.paciente_telefone, body: mensagem, agendamento_id: agendamentoId },
    { eventType: 'confirmacao_agendamento', eventId: agendamentoId }
  );

  if (!resultado.success) {
    throw Object.assign(
      new Error(resultado.message || 'Falha ao enviar WhatsApp'),
      { status: 503 }
    );
  }

  const { rows: [confirmacao] } = await db.query(`
    INSERT INTO confirmacoes
      (agendamento_id, status, canal, enviado_em, contexto_whatsapp_id, criado_por)
    VALUES ($1, 'whatsapp_enviado', 'whatsapp', now(), $2, $3)
    ON CONFLICT (agendamento_id) DO UPDATE SET
      status = 'whatsapp_enviado',
      enviado_em = now(),
      contexto_whatsapp_id = EXCLUDED.contexto_whatsapp_id,
      updated_at = now()
    RETURNING id
  `, [agendamentoId, resultado.message_id || null, userId || null]);

  return { confirmacao_id: confirmacao.id, message_id: resultado.message_id };
}

async function processarRespostaWhatsApp(db, tenantId, messageId, textoResposta) {
  const confirmacao = await db.get(`
    SELECT c.*, a.paciente_id, a.profissional_id
    FROM confirmacoes c
    JOIN agendamentos_lite a ON a.id = c.agendamento_id
    WHERE c.contexto_whatsapp_id = $1
  `, [messageId]);

  if (!confirmacao) return { ignorado: true, motivo: 'message_id não encontrado' };

  const respostaUpper = textoResposta.trim().toUpperCase();
  const isSim = ['SIM', 'S', 'YES', '1', 'CONFIRMO', 'CONFIRMAR'].includes(respostaUpper);
  const isNao = ['NAO', 'NÃO', 'N', 'NO', '2', 'CANCELO', 'CANCELAR'].includes(respostaUpper);

  if (!isSim && !isNao) {
    return { ignorado: true, motivo: 'Resposta não reconhecida como SIM/NÃO' };
  }

  const novoStatus = isSim ? 'confirmado' : 'cancelado';

  await db.transaction(async (client) => {
    await client.query(`
      UPDATE confirmacoes
      SET status = $1, respondido_em = now(), canal = 'whatsapp', updated_at = now()
      WHERE id = $2
    `, [novoStatus, confirmacao.id]);

    await client.query(`
      UPDATE agendamentos_lite SET status = $1, updated_at = now() WHERE id = $2
    `, [novoStatus, confirmacao.agendamento_id]);
  });

  emitConfirmacaoEvent(tenantId, {
    tipo:           'resposta_confirmacao',
    agendamento_id: confirmacao.agendamento_id,
    status:         novoStatus,
    canal:          'whatsapp',
  });

  return { acao: novoStatus, agendamento_id: confirmacao.agendamento_id };
}

async function enviarEmMassa(db, tenantId, data, profissionalId, userId) {
  const params = [data];
  let where = `DATE(a.data_hora) = $1 AND COALESCE(c.status, 'pendente') = 'pendente'`;

  if (profissionalId) {
    params.push(profissionalId);
    where += ` AND a.profissional_id = $${params.length}`;
  }

  const pendentes = await db.all(`
    SELECT a.id AS agendamento_id
    FROM agendamentos_lite a
    LEFT JOIN confirmacoes c ON c.agendamento_id = a.id
    WHERE ${where}
    ORDER BY a.data_hora ASC
  `, params);

  let enviados = 0;
  let erros = 0;

  for (const row of pendentes) {
    try {
      await enviarWhatsAppConfirmacao(db, tenantId, row.agendamento_id, userId);
      enviados++;
    } catch (err) {
      console.error(`❌ Erro ao enviar para agendamento ${row.agendamento_id}:`, err.message);
      erros++;
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return { total: pendentes.length, enviados, erros };
}

module.exports = { enviarWhatsAppConfirmacao, processarRespostaWhatsApp, enviarEmMassa };
