const express = require('express');
const router = express.Router();
const { extractTenant } = require('../middleware/tenant');
const { authenticateToken } = require('../middleware/auth');
const { registerSSEClient, emitFilaEvent } = require('../utils/sseEmitter');

// ── GET /api/fila/events — SSE (deve vir ANTES de /:id) ─────────────────────
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

  const profissionalId = req.query.profissional_id
    ? parseInt(req.query.profissional_id)
    : null;

  const tenantId = req.tenantId || req.usuario?.tenant_slug;
  registerSSEClient(tenantId, res, { profissionalId });

  res.on('close', () => clearInterval(heartbeat));
});

// ── GET /api/fila ────────────────────────────────────────────────────────────
router.get('/', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { profissional_id, data, incluir_finalizados } = req.query;
    const dataRef = data || new Date().toISOString().slice(0, 10);
    const limiteAlerta = req.tenant?.config?.limite_alerta_espera_minutos || 30;

    const params = [dataRef];
    const statusExcluidos = incluir_finalizados === 'true'
      ? ['cancelado']
      : ['finalizado', 'cancelado'];

    const placeholders = statusExcluidos.map((_, i) => `$${params.length + i + 1}`).join(', ');
    params.push(...statusExcluidos);

    let whereProfissional = '';
    if (profissional_id) {
      params.push(profissional_id);
      whereProfissional = `AND f.profissional_id = $${params.length}`;
    }

    const rows = await db.all(`
      SELECT
        f.id                    AS fila_id,
        f.checkin_id,
        f.status,
        f.posicao,
        f.chamado_em,
        f.atendimento_inicio,
        f.atendimento_fim,
        f.criado_em,
        c.paciente_id,
        p.nome                  AS paciente_nome,
        p.data_nascimento       AS paciente_data_nascimento,
        f.profissional_id,
        pr.nome                 AS profissional_nome,
        a.procedimento,
        a.data_hora             AS horario_marcado,
        c.hora_chegada,
        EXTRACT(EPOCH FROM (now() - c.hora_chegada)) / 60 AS tempo_espera_minutos,
        CASE WHEN EXTRACT(EPOCH FROM (now() - c.hora_chegada)) / 60 > $1::int
             THEN true ELSE false END AS alerta_espera_longa,
        t.pressao,
        t.peso,
        t.temperatura,
        t.saturacao,
        t.queixa_principal
      FROM fila_espera f
      JOIN checkins c          ON c.id = f.checkin_id
      JOIN pacientes p         ON p.id = c.paciente_id
      JOIN profissionais pr    ON pr.id = f.profissional_id
      LEFT JOIN agendamentos_lite a ON a.id = c.agendamento_id
      LEFT JOIN triagens t     ON t.fila_espera_id = f.id
      WHERE DATE(f.criado_em) = $2
        AND f.status NOT IN (${placeholders})
        ${whereProfissional}
      ORDER BY f.posicao ASC, f.criado_em ASC
    `, [limiteAlerta, ...params]);

    const dataFormatada = rows.map(row => ({
      fila_id:                  row.fila_id,
      checkin_id:               row.checkin_id,
      paciente_id:              row.paciente_id,
      paciente_nome:            row.paciente_nome,
      paciente_data_nascimento: row.paciente_data_nascimento,
      profissional_id:          row.profissional_id,
      profissional_nome:        row.profissional_nome,
      procedimento:             row.procedimento,
      horario_marcado:          row.horario_marcado,
      hora_chegada:             row.hora_chegada,
      posicao:                  row.posicao,
      status:                   row.status,
      chamado_em:               row.chamado_em,
      atendimento_inicio:       row.atendimento_inicio,
      atendimento_fim:          row.atendimento_fim,
      tempo_espera_minutos:     Math.floor(row.tempo_espera_minutos || 0),
      alerta_espera_longa:      row.alerta_espera_longa,
      triagem: row.queixa_principal ? {
        pressao:          row.pressao,
        peso:             row.peso,
        temperatura:      row.temperatura,
        saturacao:        row.saturacao,
        queixa_principal: row.queixa_principal,
      } : null,
    }));

    const emAtendimento = dataFormatada.find(r => r.status === 'em_atendimento') || null;

    return res.json({
      success: true,
      data:    dataFormatada,
      meta: {
        data:                  dataRef,
        profissional_id:       profissional_id ? parseInt(profissional_id) : null,
        em_atendimento:        emAtendimento,
        total_ativos:          dataFormatada.length,
        limite_alerta_minutos: limiteAlerta,
      },
    });
  } catch (err) {
    console.error('❌ GET /api/fila:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/fila/:id/triagem/chamar ───────────────────────────────────────
router.post('/:id/triagem/chamar', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { id } = req.params;
    const item = await db.get('SELECT * FROM fila_espera WHERE id = $1', [id]);

    if (!item) return res.status(404).json({ success: false, error: 'Item da fila não encontrado' });

    if (item.status !== 'aguardando_triagem') {
      return res.status(422).json({
        success: false,
        error:       'Paciente não está aguardando triagem',
        status_atual: item.status,
      });
    }

    await db.run(
      `UPDATE fila_espera SET status = 'em_triagem', updated_at = now() WHERE id = $1`,
      [id]
    );

    const paciente = await db.get(`
      SELECT p.nome FROM pacientes p
      JOIN checkins c ON c.paciente_id = p.id
      WHERE c.id = $1
    `, [item.checkin_id]);

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitFilaEvent(tenantId, {
      tipo:            'status_alterado',
      fila_id:         parseInt(id),
      status_anterior: 'aguardando_triagem',
      status_novo:     'em_triagem',
      profissional_id: item.profissional_id,
    });
    const io = req.app.get('io')
    if (io) io.to(tenantId).emit('fila:update', { tipo: 'status_alterado', fila_id: parseInt(id) })

    return res.json({
      success: true,
      data: {
        fila_id:       parseInt(id),
        paciente_nome: paciente?.nome,
        status:        'em_triagem',
      },
    });
  } catch (err) {
    console.error('❌ POST /api/fila/:id/triagem/chamar:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/fila/:id/chamar ────────────────────────────────────────────────
router.post('/:id/chamar', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { id } = req.params;
    const item = await db.get('SELECT * FROM fila_espera WHERE id = $1', [id]);

    if (!item) return res.status(404).json({ success: false, error: 'Item da fila não encontrado' });

    const statusPermitidos = ['aguardando_triagem', 'aguardando_atendimento'];
    if (!statusPermitidos.includes(item.status)) {
      return res.status(422).json({
        success: false,
        error:       'Paciente não está aguardando atendimento',
        status_atual: item.status,
      });
    }

    // Verificar conflito: outro paciente já em atendimento com o mesmo profissional
    const emAndamento = await db.get(`
      SELECT f.id, p.nome AS paciente_nome
      FROM fila_espera f
      JOIN checkins c ON c.id = f.checkin_id
      JOIN pacientes p ON p.id = c.paciente_id
      WHERE f.profissional_id = $1
        AND f.status = 'em_atendimento'
        AND f.id != $2
        AND DATE(f.criado_em) = CURRENT_DATE
    `, [item.profissional_id, id]);

    if (emAndamento) {
      return res.status(409).json({
        success: false,
        error:         'Já existe um paciente em atendimento',
        paciente_atual: emAndamento.paciente_nome,
        fila_id_atual:  emAndamento.id,
      });
    }

    // Optimistic lock via updated_at
    const { rows: [atualizado] } = await db.query(`
      UPDATE fila_espera
      SET status = 'em_atendimento',
          chamado_em = now(),
          atendimento_inicio = now(),
          updated_at = now()
      WHERE id = $1 AND updated_at = $2
      RETURNING id, status, chamado_em, atendimento_inicio
    `, [id, item.updated_at]);

    if (!atualizado) {
      return res.status(409).json({
        success: false,
        error: 'Conflito de atualização — tente novamente',
      });
    }

    const paciente = await db.get(`
      SELECT p.nome FROM pacientes p
      JOIN checkins c ON c.paciente_id = p.id
      WHERE c.id = $1
    `, [item.checkin_id]);

    await db.run(
      `UPDATE checkins SET status = 'em_atendimento', updated_at = now() WHERE id = $1`,
      [item.checkin_id]
    );

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitFilaEvent(tenantId, {
      tipo:            'status_alterado',
      fila_id:         parseInt(id),
      status_anterior: item.status,
      status_novo:     'em_atendimento',
      profissional_id: item.profissional_id,
    });
    const io = req.app.get('io')
    if (io) io.to(tenantId).emit('fila:update', { tipo: 'status_alterado', fila_id: parseInt(id) })

    return res.json({
      success: true,
      data: {
        fila_id:            parseInt(id),
        paciente_nome:      paciente?.nome,
        status:             'em_atendimento',
        chamado_em:         atualizado.chamado_em,
        atendimento_inicio: atualizado.atendimento_inicio,
      },
    });
  } catch (err) {
    console.error('❌ POST /api/fila/:id/chamar:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/fila/:id/finalizar ─────────────────────────────────────────────
router.post('/:id/finalizar', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { id } = req.params;
    const item = await db.get('SELECT * FROM fila_espera WHERE id = $1', [id]);

    if (!item) return res.status(404).json({ success: false, error: 'Item não encontrado' });

    if (item.status !== 'em_atendimento') {
      return res.status(422).json({
        success: false,
        error:       'Paciente não está em atendimento',
        status_atual: item.status,
      });
    }

    await db.transaction(async (client) => {
      await client.query(`
        UPDATE fila_espera
        SET status = 'finalizado', atendimento_fim = now(), updated_at = now()
        WHERE id = $1
      `, [id]);

      await client.query(`
        UPDATE checkins SET status = 'finalizado', updated_at = now() WHERE id = $1
      `, [item.checkin_id]);
    });

    const proximo = await db.get(`
      SELECT f.id AS fila_id, p.nome AS paciente_nome, f.posicao
      FROM fila_espera f
      JOIN checkins c ON c.id = f.checkin_id
      JOIN pacientes p ON p.id = c.paciente_id
      WHERE f.profissional_id = $1
        AND f.status IN ('aguardando_triagem', 'aguardando_atendimento')
        AND DATE(f.criado_em) = CURRENT_DATE
      ORDER BY f.posicao ASC
      LIMIT 1
    `, [item.profissional_id]);

    const inicio = item.atendimento_inicio ? new Date(item.atendimento_inicio) : null;
    const duracaoMinutos = inicio ? Math.round((Date.now() - inicio.getTime()) / 60000) : null;

    const paciente = await db.get(`
      SELECT p.nome FROM pacientes p
      JOIN checkins c ON c.paciente_id = p.id
      WHERE c.id = $1
    `, [item.checkin_id]);

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitFilaEvent(tenantId, {
      tipo:            'atendimento_finalizado',
      fila_id:         parseInt(id),
      profissional_id: item.profissional_id,
      proximo_fila_id: proximo?.fila_id || null,
    });
    const io = req.app.get('io')
    if (io) io.to(tenantId).emit('fila:update', { tipo: 'atendimento_finalizado', fila_id: parseInt(id) })

    return res.json({
      success: true,
      data: {
        fila_id:         parseInt(id),
        paciente_nome:   paciente?.nome,
        status:          'finalizado',
        atendimento_fim: new Date().toISOString(),
        duracao_minutos: duracaoMinutos,
        proximo:         proximo || null,
      },
    });
  } catch (err) {
    console.error('❌ POST /api/fila/:id/finalizar:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ── POST /api/triagens ────────────────────────────────────────────────────────
router.post('/triagens', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const {
      fila_espera_id, pressao, peso, temperatura,
      saturacao, queixa_principal, observacoes,
    } = req.body;

    if (!fila_espera_id || !queixa_principal) {
      return res.status(422).json({ success: false, error: 'fila_espera_id e queixa_principal são obrigatórios' });
    }

    const item = await db.get('SELECT * FROM fila_espera WHERE id = $1', [fila_espera_id]);
    if (!item) return res.status(404).json({ success: false, error: 'Item da fila não encontrado' });

    const existente = await db.get('SELECT id FROM triagens WHERE fila_espera_id = $1', [fila_espera_id]);
    if (existente) return res.status(409).json({ success: false, error: 'Triagem já registrada para este paciente' });

    const enfermeiraId = req.usuario?.id || req.user?.id;

    const triagem = await db.transaction(async (client) => {
      const { rows: [t] } = await client.query(`
        INSERT INTO triagens
          (fila_espera_id, checkin_id, enfermeira_id, pressao, peso, temperatura, saturacao, queixa_principal, observacoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        fila_espera_id, item.checkin_id, enfermeiraId,
        pressao || null, peso || null, temperatura || null,
        saturacao || null, queixa_principal, observacoes || null,
      ]);

      await client.query(`
        UPDATE fila_espera SET status = 'aguardando_atendimento', updated_at = now() WHERE id = $1
      `, [fila_espera_id]);

      return t;
    });

    const tenantId = req.tenantId || req.usuario?.tenant_slug;
    emitFilaEvent(tenantId, {
      tipo:            'triagem_registrada',
      fila_id:         fila_espera_id,
      fila_espera_id,
      profissional_id: item.profissional_id,
    });
    const io = req.app.get('io')
    if (io) io.to(tenantId).emit('fila:update', { tipo: 'status_alterado', fila_id: parseInt(fila_espera_id) })

    return res.status(201).json({
      success: true,
      data: {
        triagem_id:             triagem.id,
        fila_espera_id,
        status_fila_atualizado: 'aguardando_atendimento',
      },
    });
  } catch (err) {
    console.error('❌ POST /api/triagens:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

module.exports = router;
