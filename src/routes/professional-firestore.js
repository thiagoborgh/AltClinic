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

function buildSchedulesByDay(schedules) {
  const schedulesByDay = {};
  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  schedules.forEach(s => {
    const dayName = daysOfWeek[s.day_of_week] || 'Desconhecido';
    if (!schedulesByDay[dayName]) schedulesByDay[dayName] = [];
    schedulesByDay[dayName].push(s);
  });
  return schedulesByDay;
}

/**
 * ✅ ROTAS DE PROFISSIONAIS MÉDICOS - FIRESTORE (com fallback PostgreSQL)
 */

// GET /api/professional/medicos - Buscar todos os médicos
router.get('/medicos', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { nome, especialidade, crm, status } = req.query;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        let query = db.collection('tenants').doc(tenantId).collection('medicos');
        if (status) query = query.where('status', '==', status);
        const snapshot = await query.get();
        const medicos = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          let incluir = true;
          if (nome && !data.nome?.toLowerCase().includes(nome.toLowerCase())) incluir = false;
          if (crm && !data.crm?.toLowerCase().includes(crm.toLowerCase())) incluir = false;
          if (especialidade && data.especialidade !== especialidade) incluir = false;
          if (incluir) medicos.push({ id: doc.id, ...data });
        });
        return res.json({ success: true, data: medicos, message: medicos.length > 0 ? 'Médicos encontrados' : 'Nenhum médico cadastrado' });
      } catch (fsErr) {
        if (isAuthError(fsErr)) {
          markFirestoreUnavailable();
          console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback');
        } else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    console.log('📋 PostgreSQL GET medicos: tenantId:', tenantId);
    const pgDb = req.db;
    let sql = 'SELECT * FROM medicos WHERE tenant_id = $1';
    const params = [tenantId];
    let paramIndex = 2;
    if (status) { sql += ` AND status = $${paramIndex++}`; params.push(status); }
    sql += ' ORDER BY nome ASC';
    let rows = await pgDb.all(sql, params);
    if (nome) rows = rows.filter(r => r.nome?.toLowerCase().includes(nome.toLowerCase()));
    if (crm) rows = rows.filter(r => r.crm?.toLowerCase().includes(crm.toLowerCase()));
    if (especialidade) rows = rows.filter(r => r.especialidade === especialidade);
    return res.json({ success: true, data: rows, message: rows.length > 0 ? 'Médicos encontrados' : 'Nenhum médico cadastrado' });

  } catch (error) {
    console.error(`❌ Erro ao buscar médicos:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// GET /api/professional/medicos/:id - Buscar médico por ID
router.get('/medicos/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });

    if (!shouldUsePostgres()) {
      try {
        const doc = await db.collection('tenants').doc(tenantId).collection('medicos').doc(id).get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
        return res.json({ success: true, data: { id: doc.id, ...doc.data() } });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL'); }
        else { throw fsErr; }
      }
    }

    const row = await req.db.get('SELECT * FROM medicos WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!row) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
    return res.json({ success: true, data: row });

  } catch (error) {
    console.error(`❌ Erro ao buscar médico:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// POST /api/professional/medicos - Criar novo médico
router.post('/medicos', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { nome, crm, especialidade, telefone, email, observacoes } = req.body;

    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    if (!nome || !crm || !especialidade || !telefone) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: nome, crm, especialidade, telefone' });
    }

    if (!shouldUsePostgres()) {
      try {
        const crmQuery = await db.collection('tenants').doc(tenantId).collection('medicos').where('crm', '==', crm).get();
        if (!crmQuery.empty) return res.status(409).json({ success: false, message: 'CRM já cadastrado no sistema' });
        const medicoData = {
          nome, crm, especialidade, telefone,
          email: email || null, observacoes: observacoes || null,
          status: 'ativo',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        };
        const docRef = await db.collection('tenants').doc(tenantId).collection('medicos').add(medicoData);
        return res.status(201).json({ success: true, message: 'Médico cadastrado com sucesso', data: { id: docRef.id, ...medicoData } });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL'); }
        else { throw fsErr; }
      }
    }

    console.log('📋 PostgreSQL POST medico:', { nome, crm, especialidade, telefone });
    const existing = await req.db.get('SELECT id FROM medicos WHERE tenant_id = $1 AND crm = $2', [tenantId, crm]);
    if (existing) return res.status(409).json({ success: false, message: 'CRM já cadastrado no sistema' });
    const result = await req.db.run(
      `INSERT INTO medicos (tenant_id, nome, crm, especialidade, telefone, email, observacoes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ativo')
       RETURNING id`,
      [tenantId, nome, crm, especialidade, telefone, email || null, observacoes || null]
    );
    const row = await req.db.get('SELECT * FROM medicos WHERE id = $1', [result.lastID]);
    return res.status(201).json({ success: true, message: 'Médico cadastrado com sucesso', data: row });

  } catch (error) {
    console.error(`❌ Erro ao criar médico:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// PUT /api/professional/medicos/:id - Atualizar médico
router.put('/medicos/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { nome, crm, especialidade, telefone, email, observacoes } = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });

    if (!shouldUsePostgres()) {
      try {
        const docRef = db.collection('tenants').doc(tenantId).collection('medicos').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
        if (crm && crm !== doc.data().crm) {
          const crmQ = await db.collection('tenants').doc(tenantId).collection('medicos').where('crm', '==', crm).get();
          if (!crmQ.empty && crmQ.docs[0].id !== id) return res.status(409).json({ success: false, message: 'CRM já cadastrado para outro médico' });
        }
        const updateData = {
          ...(nome && { nome }), ...(crm && { crm }), ...(especialidade && { especialidade }),
          ...(telefone && { telefone }), ...(email !== undefined && { email: email || null }),
          ...(observacoes !== undefined && { observacoes: observacoes || null }),
          updated_at: new Date().toISOString()
        };
        await docRef.update(updateData);
        return res.json({ success: true, message: 'Médico atualizado com sucesso', data: { id, ...doc.data(), ...updateData } });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL'); }
        else { throw fsErr; }
      }
    }

    const existing = await req.db.get('SELECT * FROM medicos WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!existing) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
    if (crm && crm !== existing.crm) {
      const conflict = await req.db.get('SELECT id FROM medicos WHERE tenant_id = $1 AND crm = $2 AND id != $3', [tenantId, crm, id]);
      if (conflict) return res.status(409).json({ success: false, message: 'CRM já cadastrado para outro médico' });
    }
    const updates = []; const params = [];
    let paramIndex = 1;
    if (nome) { updates.push(`nome = $${paramIndex++}`); params.push(nome); }
    if (crm) { updates.push(`crm = $${paramIndex++}`); params.push(crm); }
    if (especialidade) { updates.push(`especialidade = $${paramIndex++}`); params.push(especialidade); }
    if (telefone) { updates.push(`telefone = $${paramIndex++}`); params.push(telefone); }
    if (email !== undefined) { updates.push(`email = $${paramIndex++}`); params.push(email || null); }
    if (observacoes !== undefined) { updates.push(`observacoes = $${paramIndex++}`); params.push(observacoes || null); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, tenantId);
    await req.db.run(`UPDATE medicos SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}`, params);
    const updated = await req.db.get('SELECT * FROM medicos WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Médico atualizado com sucesso', data: updated });

  } catch (error) {
    console.error(`❌ Erro ao atualizar médico:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// PATCH /api/professional/medico/:id/status - Ativar/Inativar médico
router.patch('/medico/:id/status', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { ativo } = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    const novoStatus = ativo ? 'ativo' : 'inativo';

    if (!shouldUsePostgres()) {
      try {
        const docRef = db.collection('tenants').doc(tenantId).collection('medicos').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
        await docRef.update({ status: novoStatus, updated_at: new Date().toISOString() });
        return res.json({ success: true, message: `Médico ${novoStatus} com sucesso`, data: { id, status: novoStatus } });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL'); }
        else { throw fsErr; }
      }
    }

    const existing = await req.db.get('SELECT id FROM medicos WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!existing) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
    await req.db.run('UPDATE medicos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3', [novoStatus, id, tenantId]);
    return res.json({ success: true, message: `Médico ${novoStatus} com sucesso`, data: { id, status: novoStatus } });

  } catch (error) {
    console.error(`❌ Erro ao alterar status:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// DELETE /api/professional/medicos/:id - Deletar médico
router.delete('/medicos/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });

    if (!shouldUsePostgres()) {
      try {
        const docRef = db.collection('tenants').doc(tenantId).collection('medicos').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
        await docRef.delete();
        return res.json({ success: true, message: 'Médico deletado com sucesso' });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL'); }
        else { throw fsErr; }
      }
    }

    const existing = await req.db.get('SELECT id FROM medicos WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!existing) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
    await req.db.run('DELETE FROM medicos WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return res.json({ success: true, message: 'Médico deletado com sucesso' });

  } catch (error) {
    console.error(`❌ Erro ao deletar médico:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// POST /api/professional/medicos/:id/enviar-convite - Enviar convite de acesso
router.post('/medicos/:id/enviar-convite', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { email } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email é obrigatório' });
    }

    console.log('📧 Enviando convite de acesso para:', email, 'medicoId:', id);

    // Buscar dados do médico (Firestore ou PostgreSQL)
    let medicoNome = 'Profissional';
    let medicoFound = false;

    if (!shouldUsePostgres()) {
      try {
        const doc = await db.collection('tenants').doc(tenantId).collection('medicos').doc(id).get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
        medicoNome = doc.data().nome;
        medicoFound = true;
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL'); }
        else { throw fsErr; }
      }
    }

    if (!medicoFound) {
      const row = await req.db.get('SELECT * FROM medicos WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
      if (!row) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
      medicoNome = row.nome;
    }

    // Gerar token de convite (válido por 7 dias)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { medicoId: id, tenantId, email, tipo: 'convite_profissional' },
      process.env.JWT_SECRET || 'secret-key-default',
      { expiresIn: '7d' }
    );

    // Salvar token (Firestore se disponível, senão só logar)
    if (!shouldUsePostgres()) {
      try {
        await db.collection('tenants').doc(tenantId).collection('convites_profissionais').add({
          medicoId: id, email, token,
          status: 'pendente',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — convite salvo apenas localmente'); }
        else { throw fsErr; }
      }
    }

    const linkConvite = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/aceitar-convite?token=${token}`;
    console.log('📧 Link do convite gerado:', linkConvite);
    console.log('📧 TODO: Implementar envio de email com o link');

    res.json({
      success: true,
      message: 'Convite gerado com sucesso',
      data: { email, linkConvite, expiresIn: '7 dias' }
    });

  } catch (error) {
    console.error(`❌ Erro ao enviar convite:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

/**
 * ✅ ROTAS DE GRADES DE HORÁRIOS PROFISSIONAIS - FIRESTORE (com fallback PostgreSQL)
 */

// GET /api/professional/schedule - Buscar horários
router.get('/schedule', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { professionalId } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        console.log('🔍 Firestore GET schedule: professionalId:', professionalId, 'tenantId:', tenantId);
        const schedules = await firestoreService.getProfessionalSchedules(tenantId, professionalId);
        console.log(`✅ Firestore: ${schedules.length} horários encontrados`);
        return res.json({
          success: true,
          message: schedules.length > 0 ? 'Horários encontrados com sucesso!' : 'Nenhum horário cadastrado',
          data: schedules,
          schedulesByDay: buildSchedulesByDay(schedules)
        });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback'); }
        else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    let sql = 'SELECT * FROM professional_schedules WHERE tenant_id = $1';
    const params = [tenantId];
    let paramIndex = 2;
    if (professionalId) { sql += ` AND professional_id = $${paramIndex++}`; params.push(parseInt(professionalId)); }
    sql += ' ORDER BY day_of_week ASC, start_time ASC';
    const rows = await req.db.all(sql, params);
    return res.json({
      success: true,
      message: rows.length > 0 ? 'Horários encontrados com sucesso!' : 'Nenhum horário cadastrado',
      data: rows,
      schedulesByDay: buildSchedulesByDay(rows)
    });

  } catch (error) {
    console.error(`❌ Erro ao buscar horários:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// POST /api/professional/schedule - Criar horário
router.post('/schedule', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      professional_id = 1,
      professional_name = 'Profissional Principal',
      day_of_week,
      start_time,
      end_time,
      is_available = true
    } = req.body;

    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Dados obrigatórios: day_of_week, start_time, end_time' });
    }

    const scheduleData = {
      professional_id: parseInt(professional_id),
      professional_name,
      day_of_week: parseInt(day_of_week),
      start_time,
      end_time,
      is_available
    };

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        const scheduleId = await firestoreService.createProfessionalSchedule(tenantId, scheduleData);
        return res.json({ success: true, message: 'Horário criado com sucesso', data: { id: scheduleId, ...scheduleData } });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback'); }
        else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    const result = await req.db.run(
      `INSERT INTO professional_schedules (tenant_id, professional_id, professional_name, day_of_week, start_time, end_time, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [tenantId, scheduleData.professional_id, scheduleData.professional_name, scheduleData.day_of_week, scheduleData.start_time, scheduleData.end_time, is_available ? true : false]
    );
    const row = await req.db.get('SELECT * FROM professional_schedules WHERE id = $1', [result.lastID]);
    return res.json({ success: true, message: 'Horário criado com sucesso', data: row });

  } catch (error) {
    console.error(`❌ Erro ao criar horário:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// PUT /api/professional/schedule/:id - Atualizar horário
router.put('/schedule/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const updateData = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });

    delete updateData.id;
    delete updateData.created_at;
    if (updateData.professional_id) updateData.professional_id = parseInt(updateData.professional_id);
    if (updateData.day_of_week !== undefined) updateData.day_of_week = parseInt(updateData.day_of_week);

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        await firestoreService.updateProfessionalSchedule(tenantId, id, updateData);
        return res.json({ success: true, message: 'Horário atualizado com sucesso', data: { id, ...updateData } });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback'); }
        else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    const existing = await req.db.get('SELECT id FROM professional_schedules WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!existing) return res.status(404).json({ success: false, message: 'Horário não encontrado' });
    const updates = []; const params = [];
    let paramIndex = 1;
    if (updateData.professional_id !== undefined) { updates.push(`professional_id = $${paramIndex++}`); params.push(updateData.professional_id); }
    if (updateData.professional_name !== undefined) { updates.push(`professional_name = $${paramIndex++}`); params.push(updateData.professional_name); }
    if (updateData.day_of_week !== undefined) { updates.push(`day_of_week = $${paramIndex++}`); params.push(updateData.day_of_week); }
    if (updateData.start_time !== undefined) { updates.push(`start_time = $${paramIndex++}`); params.push(updateData.start_time); }
    if (updateData.end_time !== undefined) { updates.push(`end_time = $${paramIndex++}`); params.push(updateData.end_time); }
    if (updateData.is_available !== undefined) { updates.push(`is_available = $${paramIndex++}`); params.push(updateData.is_available ? true : false); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, tenantId);
    await req.db.run(`UPDATE professional_schedules SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}`, params);
    const updated = await req.db.get('SELECT * FROM professional_schedules WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Horário atualizado com sucesso', data: updated });

  } catch (error) {
    console.error(`❌ Erro ao atualizar horário:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// DELETE /api/professional/schedule/:id - Deletar horário
router.delete('/schedule/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        await firestoreService.deleteProfessionalSchedule(tenantId, id);
        return res.json({ success: true, message: 'Horário removido com sucesso' });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback'); }
        else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    const existing = await req.db.get('SELECT id FROM professional_schedules WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!existing) return res.status(404).json({ success: false, message: 'Horário não encontrado' });
    await req.db.run('DELETE FROM professional_schedules WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return res.json({ success: true, message: 'Horário removido com sucesso' });

  } catch (error) {
    console.error(`❌ Erro ao deletar horário:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// POST /api/professional/schedule/bulk-update - Atualização em lote
router.post('/schedule/bulk-update', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { schedules = [] } = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    if (!Array.isArray(schedules)) return res.status(400).json({ success: false, message: 'schedules deve ser um array' });

    const processedSchedules = schedules.map(schedule => {
      const data = schedule.data || schedule;
      return {
        ...(schedule.id && { id: schedule.id }),
        professional_id: parseInt(data.professional_id || 1),
        professional_name: data.professional_name || 'Profissional Principal',
        day_of_week: parseInt(data.day_of_week || 0),
        start_time: data.start_time,
        end_time: data.end_time,
        is_available: data.is_available !== false
      };
    });

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        console.log('🔄 Firestore bulk-update: processando', schedules.length, 'horários');
        await firestoreService.bulkUpdateProfessionalSchedules(tenantId, processedSchedules);
        return res.json({ success: true, message: `Processados ${schedules.length} horários`, data: processedSchedules.length });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback'); }
        else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    console.log('📋 PostgreSQL bulk-update: processando', processedSchedules.length, 'horários');
    for (const s of processedSchedules) {
      if (s.id) {
        await req.db.run(
          `INSERT INTO professional_schedules (id, tenant_id, professional_id, professional_name, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             professional_id = EXCLUDED.professional_id,
             professional_name = EXCLUDED.professional_name,
             day_of_week = EXCLUDED.day_of_week,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             is_available = EXCLUDED.is_available,
             updated_at = CURRENT_TIMESTAMP`,
          [s.id, tenantId, s.professional_id, s.professional_name, s.day_of_week, s.start_time, s.end_time, s.is_available ? true : false]
        );
      } else {
        await req.db.run(
          `INSERT INTO professional_schedules (tenant_id, professional_id, professional_name, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [tenantId, s.professional_id, s.professional_name, s.day_of_week, s.start_time, s.end_time, s.is_available ? true : false]
        );
      }
    }
    return res.json({ success: true, message: `Processados ${processedSchedules.length} horários`, data: processedSchedules.length });

  } catch (error) {
    console.error(`❌ Erro no bulk-update:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// DELETE /api/professional/schedules/all - Deletar todos os horários de um profissional
router.delete('/schedules/all', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { professionalId } = req.query;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    if (!professionalId) return res.status(400).json({ success: false, message: 'professionalId é obrigatório' });

    // ── Tentar Firestore ──────────────────────────────────────────────────────
    if (!shouldUsePostgres()) {
      try {
        console.log('🗑️ Firestore: Deletando horários do profissional:', professionalId);
        const deletedCount = await firestoreService.deleteAllProfessionalSchedules(tenantId, professionalId);
        return res.json({ success: true, message: `${deletedCount} horários deletados com sucesso`, deletedCount });
      } catch (fsErr) {
        if (isAuthError(fsErr)) { markFirestoreUnavailable(); console.warn('📋 Firestore UNAUTHENTICATED — usando PostgreSQL fallback'); }
        else { throw fsErr; }
      }
    }

    // ── PostgreSQL fallback ───────────────────────────────────────────────────
    const result = await req.db.run('DELETE FROM professional_schedules WHERE tenant_id = $1 AND professional_id = $2', [tenantId, parseInt(professionalId)]);
    return res.json({ success: true, message: `${result.changes} horários deletados com sucesso`, deletedCount: result.changes });

  } catch (error) {
    console.error(`❌ Erro ao deletar todos os horários:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

module.exports = router;
