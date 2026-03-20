const express = require('express');
const router = express.Router();
const { extractTenant } = require('../middleware/tenant');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/check-permission');
const { registerSSEClient, emitCheckinEvent } = require('../utils/sseEmitter');

// ── GET /api/checkins/events — SSE (deve vir ANTES de /:id) ─────────────────
router.get('/events', extractTenant, authMiddleware, (req, res) => {
  res.set({
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
  });
  res.flushHeaders();
  res.write('data: {"tipo":"conectado"}\n\n');
  registerSSEClient(req.tenantId || req.usuario?.tenant_slug, res);
});

// ── GET /api/checkins ────────────────────────────────────────────────────────
router.get('/', extractTenant, authMiddleware, checkPermission('checkin', 'read'), async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { data, profissional_id, busca, status } = req.query;
    const dataRef = data || new Date().toISOString().slice(0, 10);

    const params = [dataRef];
    const whereClauses = ['DATE(a.data_hora) = $1'];

    if (profissional_id) {
      params.push(profissional_id);
      whereClauses.push(`a.profissional_id = $${params.length}`);
    }
    if (busca) {
      params.push(`%${busca}%`);
      whereClauses.push(
        `(p.nome ILIKE $${params.length} OR p.cpf ILIKE $${params.length} OR p.telefone ILIKE $${params.length})`
      );
    }
    if (status && status !== 'aguardando') {
      params.push(status);
      whereClauses.push(`c.status = $${params.length}`);
    } else if (status === 'aguardando') {
      whereClauses.push('c.id IS NULL');
    }

    const where = whereClauses.join(' AND ');

    // Tenta buscar de agendamentos_lite, com fallback para agendamentos
    let rows;
    try {
      rows = await db.all(`
        SELECT
          a.id              AS agendamento_id,
          a.data_hora       AS horario_marcado,
          a.procedimento,
          a.status           AS agendamento_status,
          p.id              AS paciente_id,
          p.nome            AS paciente_nome,
          p.cpf             AS paciente_cpf,
          p.telefone        AS paciente_telefone,
          p.data_nascimento AS paciente_data_nascimento,
          pr.id             AS profissional_id,
          pr.nome           AS profissional_nome,
          c.id              AS checkin_id,
          COALESCE(c.status, 'aguardando') AS checkin_status,
          c.hora_chegada,
          0                 AS fatura_aberta
        FROM agendamentos_lite a
        JOIN pacientes p      ON p.id = a.paciente_id
        JOIN profissionais pr  ON pr.id = a.profissional_id
        LEFT JOIN checkins c  ON c.agendamento_id = a.id
        WHERE ${where}
        ORDER BY a.data_hora ASC
      `, params);
    } catch (_) {
      // Fallback: sem agendamentos_lite
      rows = [];
    }

    return res.json({
      success: true,
      data: rows,
      meta: { total: rows.length, data: dataRef, profissional_id: profissional_id || null },
    });
  } catch (err) {
    console.error('❌ GET /api/checkins:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/checkins ───────────────────────────────────────────────────────
router.post('/', extractTenant, authMiddleware, checkPermission('checkin', 'create'), async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { agendamento_id, paciente_id, profissional_id, observacao } = req.body;

    if (!paciente_id || !profissional_id) {
      return res.status(422).json({ success: false, error: 'paciente_id e profissional_id são obrigatórios' });
    }

    // Verificar check-in duplicado
    if (agendamento_id) {
      const existente = await db.get(
        'SELECT id FROM checkins WHERE agendamento_id = $1',
        [agendamento_id]
      );
      if (existente) {
        return res.status(409).json({
          success: false,
          error: 'Check-in já realizado para este agendamento',
          checkin_id: existente.id,
        });
      }
    }

    // Coletar dados para alertas e posição na fila
    const usuarioId = req.usuario?.id || req.user?.id;

    let faturaAberta = 0;
    let diasSemVir = null;
    let posicaoAtual = 1;

    try {
      const [faturaRow, ultimoAtendRow, posicaoRow] = await Promise.all([
        db.get(
          `SELECT COALESCE(SUM(valor_aberto), 0) AS total
           FROM financeiro_faturas WHERE paciente_id = $1 AND status = 'aberta'`,
          [paciente_id]
        ).catch(() => ({ total: 0 })),
        db.get(
          `SELECT MAX(data_registro) AS ultima_data FROM prontuario_registros WHERE paciente_id = $1`,
          [paciente_id]
        ).catch(() => null),
        db.get(
          `SELECT COUNT(*) AS total FROM fila_espera
           WHERE profissional_id = $1 AND status NOT IN ('finalizado','cancelado')
           AND DATE(criado_em) = CURRENT_DATE`,
          [profissional_id]
        ).catch(() => ({ total: 0 })),
      ]);

      faturaAberta = parseFloat(faturaRow?.total || 0);
      const ultimaData = ultimoAtendRow?.ultima_data;
      diasSemVir = ultimaData
        ? Math.floor((Date.now() - new Date(ultimaData)) / 86_400_000)
        : null;
      posicaoAtual = parseInt(posicaoRow?.total || 0) + 1;
    } catch (_) {
      // Alertas são opcionais — não bloquear o check-in
    }

    // Transação: INSERT checkins + INSERT fila_espera
    const resultado = await db.transaction(async (client) => {
      const { rows: [checkin] } = await client.query(`
        INSERT INTO checkins
          (agendamento_id, paciente_id, profissional_id, observacao, criado_por)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, hora_chegada, status
      `, [agendamento_id || null, paciente_id, profissional_id, observacao || null, usuarioId]);

      let filaId = null;
      try {
        const { rows: [fila] } = await client.query(`
          INSERT INTO fila_espera
            (checkin_id, profissional_id, status, posicao, criado_em)
          VALUES ($1, $2, 'aguardando_triagem', $3, now())
          RETURNING id
        `, [checkin.id, profissional_id, posicaoAtual]);
        filaId = fila.id;
      } catch (_) {
        // fila_espera pode não existir ainda — não bloquear
      }

      return { checkin, fila_id: filaId };
    });

    const paciente = await db.get('SELECT nome FROM pacientes WHERE id = $1', [paciente_id]).catch(() => null);

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitCheckinEvent(tenantId, {
      tipo: 'novo_checkin',
      checkin_id:     resultado.checkin.id,
      paciente_id,
      paciente_nome:  paciente?.nome,
      profissional_id,
      posicao:        posicaoAtual,
    });

    return res.status(201).json({
      success: true,
      data: {
        checkin_id:             resultado.checkin.id,
        paciente_id,
        paciente_nome:          paciente?.nome,
        profissional_id,
        hora_chegada:           resultado.checkin.hora_chegada,
        status:                 resultado.checkin.status,
        fila_espera_id:         resultado.fila_id,
        posicao_fila:           posicaoAtual,
        alertas: {
          fatura_aberta:            faturaAberta,
          ultimo_atendimento_dias:  diasSemVir,
        },
      },
    });
  } catch (err) {
    console.error('❌ POST /api/checkins:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── DELETE /api/checkins/:id ─────────────────────────────────────────────────
router.delete('/:id', extractTenant, authMiddleware, checkPermission('checkin', 'delete'), async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const checkin = await db.get('SELECT id, status FROM checkins WHERE id = $1', [req.params.id]);
    if (!checkin) return res.status(404).json({ success: false, error: 'Check-in não encontrado' });

    await db.query(
      "UPDATE checkins SET status = 'cancelado', updated_at = now() WHERE id = $1",
      [req.params.id]
    );

    // Cancelar na fila se ainda não chamado
    try {
      await db.query(
        "UPDATE fila_espera SET status = 'cancelado', updated_at = now() WHERE checkin_id = $1 AND status = 'aguardando_triagem'",
        [req.params.id]
      );
    } catch (_) {}

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitCheckinEvent(tenantId, { tipo: 'checkin_cancelado', checkin_id: parseInt(req.params.id) });

    return res.json({ success: true, message: 'Check-in cancelado' });
  } catch (err) {
    console.error('❌ DELETE /api/checkins/:id:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

module.exports = router;
