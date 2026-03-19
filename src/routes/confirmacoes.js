const express = require('express');
const router = express.Router();
const { extractTenant } = require('../middleware/tenant');
const { authenticateToken } = require('../middleware/auth');
const { registerSSEClient, emitConfirmacaoEvent } = require('../utils/sseEmitter');
const {
  enviarWhatsAppConfirmacao,
  processarRespostaWhatsApp,
  enviarEmMassa,
} = require('../services/ConfirmacaoService');

// ── GET /api/confirmacoes/events — SSE (deve vir ANTES de /:id) ──────────────
router.get('/events', extractTenant, authenticateToken, (req, res) => {
  res.set({
    'Content-Type':      'text/event-stream',
    'Cache-Control':     'no-cache',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('data: {"tipo":"conectado"}\n\n');

  const heartbeat = setInterval(() => {
    res.write('data: {"tipo":"heartbeat"}\n\n');
  }, 25_000);

  const tenantId = req.tenantId || req.usuario?.tenant_slug;
  registerSSEClient(tenantId, res);
  res.on('close', () => clearInterval(heartbeat));
});

// ── GET /api/confirmacoes ─────────────────────────────────────────────────────
router.get('/', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataDefault = amanha.toISOString().slice(0, 10);

    const { data = dataDefault, profissional_id, status } = req.query;

    const params = [data];
    const whereClauses = ['DATE(a.data_hora) = $1'];

    if (profissional_id) {
      params.push(profissional_id);
      whereClauses.push(`a.profissional_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`COALESCE(c.status, 'pendente') = $${params.length}`);
    }

    const where = whereClauses.join(' AND ');

    const rows = await db.all(`
      SELECT
        a.id              AS agendamento_id,
        a.data_hora       AS horario,
        a.procedimento,
        p.id              AS paciente_id,
        p.nome            AS paciente_nome,
        p.telefone        AS paciente_telefone,
        pr.id             AS profissional_id,
        pr.nome           AS profissional_nome,
        c.id              AS confirmacao_id,
        COALESCE(c.status, 'pendente') AS status,
        c.canal,
        c.enviado_em,
        c.respondido_em
      FROM agendamentos_lite a
      JOIN pacientes p      ON p.id = a.paciente_id
      JOIN profissionais pr  ON pr.id = a.profissional_id
      LEFT JOIN confirmacoes c ON c.agendamento_id = a.id
      WHERE ${where}
      ORDER BY a.data_hora ASC
    `, params);

    const resumo = rows.reduce((acc, r) => {
      acc.total++;
      const key = r.status === 'confirmado' ? 'confirmados'
        : r.status === 'cancelados' ? 'cancelados'
        : r.status === 'pendente' ? 'pendentes'
        : r.status === 'whatsapp_enviado' ? 'whatsapp_enviado'
        : r.status === 'sem_resposta' ? 'sem_resposta'
        : r.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { total: 0, confirmados: 0, cancelados: 0, pendentes: 0, whatsapp_enviado: 0, sem_resposta: 0 });

    resumo.taxa_confirmacao = resumo.total > 0
      ? `${((resumo.confirmados / resumo.total) * 100).toFixed(1)}%`
      : '0%';

    return res.json({ success: true, data: rows, resumo });
  } catch (err) {
    console.error('❌ GET /api/confirmacoes:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/confirmacoes/enviar-whatsapp-em-massa ───────────────────────────
router.post('/enviar-whatsapp-em-massa', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { data, profissional_id } = req.body;
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataRef = data || amanha.toISOString().slice(0, 10);

    // Contar pendentes antes de disparar
    const params = [dataRef];
    let whereExtra = '';
    if (profissional_id) {
      params.push(profissional_id);
      whereExtra = `AND a.profissional_id = $${params.length}`;
    }
    const contagem = await db.get(`
      SELECT COUNT(*) AS total
      FROM agendamentos_lite a
      LEFT JOIN confirmacoes c ON c.agendamento_id = a.id
      WHERE DATE(a.data_hora) = $1
        AND COALESCE(c.status, 'pendente') = 'pendente'
        ${whereExtra}
    `, params).catch(() => ({ total: 0 }));

    const totalPendentes = parseInt(contagem?.total || 0);
    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    const userId = req.usuario?.id || req.user?.id;
    const jobId = `massa_${new Date().toISOString().slice(0, 10)}_tenant_${tenantId}_prof_${profissional_id || 'todos'}`;

    // Processar em background sem bloquear resposta
    setImmediate(async () => {
      try {
        const resultado = await enviarEmMassa(db, tenantId, dataRef, profissional_id || null, userId);
        emitConfirmacaoEvent(tenantId, {
          tipo:    'massa_concluida',
          job_id:  jobId,
          ...resultado,
        });
      } catch (err) {
        console.error('❌ Erro no envio em massa:', err.message);
      }
    });

    return res.json({
      success: true,
      message: `Disparo iniciado para ${totalPendentes} agendamentos pendentes`,
      job_id:  jobId,
    });
  } catch (err) {
    console.error('❌ POST /api/confirmacoes/enviar-whatsapp-em-massa:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/confirmacoes/webhook-whatsapp ───────────────────────────────────
router.post('/webhook-whatsapp', extractTenant, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { whatsapp_message_id, texto_resposta } = req.body;
    const tenantId = req.tenantId || req.body.tenant_id;

    const resultado = await processarRespostaWhatsApp(db, tenantId, whatsapp_message_id, texto_resposta);

    if (resultado.ignorado) {
      return res.json({ success: true, ignorado: true, motivo: resultado.motivo });
    }

    return res.json({ success: true, acao: resultado.acao, agendamento_id: resultado.agendamento_id });
  } catch (err) {
    console.error('❌ POST /api/confirmacoes/webhook-whatsapp:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/confirmacoes/:agendamento_id/confirmar ─────────────────────────
router.post('/:agendamento_id/confirmar', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { agendamento_id } = req.params;
    const { canal = 'presencial' } = req.body;
    const userId = req.usuario?.id || req.user?.id;

    const agendamento = await db.get(
      'SELECT id FROM agendamentos_lite WHERE id = $1',
      [agendamento_id]
    );
    if (!agendamento) return res.status(404).json({ success: false, error: 'Agendamento não encontrado' });

    const { rows: [confirmacao] } = await db.query(`
      INSERT INTO confirmacoes
        (agendamento_id, status, canal, respondido_em, criado_por)
      VALUES ($1, 'confirmado', $2, now(), $3)
      ON CONFLICT (agendamento_id) DO UPDATE SET
        status = 'confirmado',
        canal = EXCLUDED.canal,
        respondido_em = now(),
        updated_at = now()
      RETURNING id, respondido_em
    `, [agendamento_id, canal, userId]);

    await db.run(
      `UPDATE agendamentos_lite SET status = 'confirmado', updated_at = now() WHERE id = $1`,
      [agendamento_id]
    );

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitConfirmacaoEvent(tenantId, {
      tipo:           'confirmacao_atualizada',
      agendamento_id: parseInt(agendamento_id),
      status:         'confirmado',
      canal,
    });

    return res.json({
      success: true,
      data: {
        confirmacao_id:  confirmacao.id,
        agendamento_id:  parseInt(agendamento_id),
        status:          'confirmado',
        canal,
        respondido_em:   confirmacao.respondido_em,
      },
    });
  } catch (err) {
    console.error('❌ POST /api/confirmacoes/:id/confirmar:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/confirmacoes/:agendamento_id/cancelar ──────────────────────────
router.post('/:agendamento_id/cancelar', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { agendamento_id } = req.params;
    const { motivo = 'outro', observacao } = req.body;
    const userId = req.usuario?.id || req.user?.id;

    const agendamento = await db.get(
      'SELECT id, data_hora FROM agendamentos_lite WHERE id = $1',
      [agendamento_id]
    );
    if (!agendamento) return res.status(404).json({ success: false, error: 'Agendamento não encontrado' });

    const motivo_cancelamento = observacao ? `${motivo}: ${observacao}` : motivo;

    const { rows: [confirmacao] } = await db.query(`
      INSERT INTO confirmacoes
        (agendamento_id, status, canal, respondido_em, motivo_cancelamento, criado_por)
      VALUES ($1, 'cancelado', 'sistema', now(), $2, $3)
      ON CONFLICT (agendamento_id) DO UPDATE SET
        status = 'cancelado',
        respondido_em = now(),
        motivo_cancelamento = EXCLUDED.motivo_cancelamento,
        updated_at = now()
      RETURNING id
    `, [agendamento_id, motivo_cancelamento, userId]);

    await db.run(
      `UPDATE agendamentos_lite SET status = 'cancelado', updated_at = now() WHERE id = $1`,
      [agendamento_id]
    );

    const dt = agendamento.data_hora ? new Date(agendamento.data_hora) : null;
    const horarioLiberado = dt
      ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : null;
    const dataLiberada = dt ? dt.toISOString().slice(0, 10) : null;

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitConfirmacaoEvent(tenantId, {
      tipo:           'confirmacao_atualizada',
      agendamento_id: parseInt(agendamento_id),
      status:         'cancelado',
    });

    return res.json({
      success: true,
      data: {
        confirmacao_id:      confirmacao.id,
        agendamento_id:      parseInt(agendamento_id),
        status:              'cancelado',
        motivo_cancelamento: motivo_cancelamento,
        horario_liberado:    horarioLiberado,
        data:                dataLiberada,
      },
    });
  } catch (err) {
    console.error('❌ POST /api/confirmacoes/:id/cancelar:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/confirmacoes/:agendamento_id/enviar-whatsapp ───────────────────
router.post('/:agendamento_id/enviar-whatsapp', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { agendamento_id } = req.params;
    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    const userId = req.usuario?.id || req.user?.id;

    const resultado = await enviarWhatsAppConfirmacao(db, tenantId, agendamento_id, userId);

    return res.json({
      success: true,
      data: {
        confirmacao_id:      resultado.confirmacao_id,
        agendamento_id:      parseInt(agendamento_id),
        status:              'whatsapp_enviado',
        enviado_em:          new Date().toISOString(),
        whatsapp_message_id: resultado.message_id,
      },
    });
  } catch (err) {
    const status = err.status || 500;
    console.error('❌ POST /api/confirmacoes/:id/enviar-whatsapp:', err);
    return res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
