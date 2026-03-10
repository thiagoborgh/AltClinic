const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');
const admin = require('firebase-admin');
const { isFirestoreAvailable, markFirestoreUnavailable } = require('../utils/firestoreHealth');

// Obter referência do Firestore (safe — admin já inicializado pelo firestoreService)
let db;
try { db = admin.firestore(); } catch (_) { db = null; }

// ── helpers ───────────────────────────────────────────────────────────────────

function isAuthError(_err) {
  // Sempre usa PostgreSQL fallback quando Firestore falha por qualquer motivo
  // (credenciais inválidas, PERMISSION_DENIED, TypeError de db=null, etc.)
  return true;
}

function shouldUsePostgres() {
  return !isFirestoreAvailable() || !db;
}

/**
 * ✅ Endpoint simplificado para integração com AgendaLite - FIRESTORE (com fallback PostgreSQL)
 * Usa estrutura compatível com o frontend existente
 */

// Função auxiliar para formatar data
function formatDate(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// GET /api/agenda/agendamentos - Listar agendamentos
router.get('/', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        console.log(`📅 Firestore: Buscando agendamentos do tenant ${tenantId}`);
        const agendamentos = await firestoreService.getAgendamentos(tenantId, { data_inicio, data_fim });
        console.log(`📅 Firestore: Retornando ${agendamentos.length} agendamentos`);
        return res.json({ success: true, data: agendamentos });
      } catch (fsErr) {
        if (isAuthError(fsErr)) {
          markFirestoreUnavailable();
          console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback');
        } else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    console.log(`📋 PostgreSQL GET agendamentos: tenantId: ${tenantId}`);
    const tenantDb = req.db;
    let sql = 'SELECT * FROM agendamentos_lite WHERE tenant_id = $1';
    const params = [tenantId];
    if (data_inicio) { params.push(data_inicio); sql += ` AND data >= $${params.length}`; }
    if (data_fim) { params.push(data_fim); sql += ` AND data <= $${params.length}`; }
    sql += ' ORDER BY data ASC, horario ASC';
    const rows = await tenantDb.all(sql, params);
    return res.json({ success: true, data: rows });

  } catch (error) {
    console.error('❌ Erro ao listar agendamentos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar agendamentos', error: error.message });
  }
});

// POST /api/agenda/agendamentos - Criar agendamento
router.post('/', async (req, res) => {
  try {
    const agendamentoData = req.body;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    const dados = {
      horario: agendamentoData.horario,
      data: agendamentoData.data || formatDate(new Date()),
      paciente: agendamentoData.paciente || '',
      procedimento: agendamentoData.procedimento || 'Consulta',
      profissional: agendamentoData.profissional || '',
      convenio: agendamentoData.convenio || 'particular',
      status: agendamentoData.status || 'não confirmado',
      valor: parseFloat(agendamentoData.valor) || 0,
      observacoes: agendamentoData.observacoes || '',
      tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        console.log('📝 Firestore: Criando agendamento:', dados);
        const agendamentoId = await firestoreService.createAgendamento(tenantId, dados);
        const agendamentoCriado = { id: agendamentoId, ...dados };
        console.log('✅ Firestore: Agendamento criado:', agendamentoCriado);
        return res.status(201).json({ success: true, data: agendamentoCriado, message: 'Agendamento criado com sucesso' });
      } catch (fsErr) {
        if (isAuthError(fsErr)) {
          markFirestoreUnavailable();
          console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback');
        } else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    console.log('📋 PostgreSQL POST agendamento:', dados);
    const tenantDb = req.db;
    const result = await tenantDb.run(
      `INSERT INTO agendamentos_lite (tenant_id, horario, data, paciente, procedimento, profissional, convenio, status, valor, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [tenantId, dados.horario, dados.data, dados.paciente, dados.procedimento, dados.profissional, dados.convenio, dados.status, dados.valor, dados.observacoes || null]
    );
    const row = await tenantDb.get('SELECT * FROM agendamentos_lite WHERE id = $1', [result.lastID]);
    return res.status(201).json({ success: true, data: row, message: 'Agendamento criado com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar agendamento', error: error.message });
  }
});

// PUT /api/agenda/agendamentos/:id - Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agendamentoData = req.body;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    const dados = {
      horario: agendamentoData.horario,
      data: agendamentoData.data,
      paciente: agendamentoData.paciente || '',
      procedimento: agendamentoData.procedimento || 'Consulta',
      profissional: agendamentoData.profissional || '',
      convenio: agendamentoData.convenio || 'particular',
      status: agendamentoData.status || 'não confirmado',
      valor: parseFloat(agendamentoData.valor) || 0,
      observacoes: agendamentoData.observacoes || '',
      updated_at: new Date().toISOString()
    };

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        console.log(`📝 Firestore: Atualizando agendamento ${id}:`, dados);
        await firestoreService.updateAgendamento(tenantId, id, dados);
        const agendamentoAtualizado = { id, ...dados, tenantId };
        console.log('✅ Firestore: Agendamento atualizado:', agendamentoAtualizado);
        return res.json({ success: true, data: agendamentoAtualizado, message: 'Agendamento atualizado com sucesso' });
      } catch (fsErr) {
        if (isAuthError(fsErr)) {
          markFirestoreUnavailable();
          console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback');
        } else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    const tenantDb = req.db;
    const existing = await tenantDb.get(
      'SELECT id FROM agendamentos_lite WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    await tenantDb.run(
      `UPDATE agendamentos_lite SET horario = $1, data = $2, paciente = $3, procedimento = $4, profissional = $5,
       convenio = $6, status = $7, valor = $8, observacoes = $9, updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11`,
      [dados.horario, dados.data, dados.paciente, dados.procedimento, dados.profissional, dados.convenio, dados.status, dados.valor, dados.observacoes || null, id, tenantId]
    );
    const updated = await tenantDb.get('SELECT * FROM agendamentos_lite WHERE id = $1', [id]);
    return res.json({ success: true, data: updated, message: 'Agendamento atualizado com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao atualizar agendamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar agendamento', error: error.message });
  }
});

// DELETE /api/agenda/agendamentos/:id - Deletar agendamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        console.log(`🗑️ Firestore: Deletando agendamento ${id} do tenant ${tenantId}`);
        await firestoreService.deleteAgendamento(tenantId, id);
        console.log(`✅ Firestore: Agendamento ${id} deletado`);
        return res.json({ success: true, message: 'Agendamento deletado com sucesso' });
      } catch (fsErr) {
        if (isAuthError(fsErr)) {
          markFirestoreUnavailable();
          console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback');
        } else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    const tenantDb = req.db;
    const existing = await tenantDb.get(
      'SELECT id FROM agendamentos_lite WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    await tenantDb.run(
      'DELETE FROM agendamentos_lite WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return res.json({ success: true, message: 'Agendamento deletado com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao deletar agendamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar agendamento', error: error.message });
  }
});

module.exports = router;
