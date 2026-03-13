// src/routes/prontuario-medico.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireProntuarioRole } = require('../middleware/prontuarioRoles');
const multiTenantPostgres = require('../database/MultiTenantPostgres');

// ── GET /cid10/buscar?q=asma ──────────────────────────────────────────────
router.get('/cid10/buscar', authenticateToken, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ success: true, results: [] });
  }
  try {
    const masterDb = multiTenantPostgres.getMasterDb();
    const term = q.trim();
    const results = await masterDb.all(
      `SELECT codigo, descricao, categoria, capitulo
       FROM public.cid10
       WHERE codigo ILIKE $1
          OR to_tsvector('portuguese', descricao) @@ plainto_tsquery('portuguese', $2)
       ORDER BY
         CASE WHEN codigo ILIKE $1 THEN 0 ELSE 1 END,
         length(descricao)
       LIMIT 15`,
      [`${term}%`, term]
    );
    res.json({ success: true, results });
  } catch (err) {
    console.error('[prontuario] CID-10 busca:', err.message);
    res.status(500).json({ success: false, error: 'Erro ao buscar CID-10' });
  }
});

// ── GET /formularios ──────────────────────────────────────────────────────
router.get('/formularios', authenticateToken, requireProntuarioRole('ver'), async (req, res) => {
  try {
    const masterDb = multiTenantPostgres.getMasterDb();
    const { type, specialty } = req.query;
    let query = `SELECT id, name, type, specialty, fields_json, is_system, created_at
                 FROM public.form_definitions
                 WHERE (tenant_id = $1 OR tenant_id IS NULL)`;
    const params = [req.tenantId];
    if (type) { query += ` AND type = $${params.length + 1}`; params.push(type); }
    if (specialty) { query += ` AND (specialty = $${params.length + 1} OR specialty IS NULL)`; params.push(specialty); }
    query += ' ORDER BY is_system DESC, name ASC';
    const formularios = await masterDb.all(query, params);
    res.json({ success: true, formularios });
  } catch (err) {
    console.error('[prontuario] formularios list:', err.message);
    res.status(500).json({ success: false, error: 'Erro ao listar formulários' });
  }
});

// ── POST /formularios ─────────────────────────────────────────────────────
router.post('/formularios', authenticateToken, requireProntuarioRole('gerir_templates'), async (req, res) => {
  const { name, type, specialty, fields_json } = req.body;
  const validTypes = ['anamnese','evolucao','laudo','formulario','ordem_servico'];
  if (!name || !type || !fields_json) {
    return res.status(400).json({ error: 'name, type e fields_json são obrigatórios' });
  }
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type inválido. Use: ${validTypes.join(', ')}` });
  }
  try {
    const masterDb = multiTenantPostgres.getMasterDb();
    const result = await masterDb.get(
      `INSERT INTO public.form_definitions (tenant_id, name, type, specialty, fields_json, is_system, created_by)
       VALUES ($1, $2, $3, $4, $5, false, $6)
       RETURNING id, name, type, specialty, fields_json, is_system, created_at`,
      [req.tenantId, name, type, specialty || null, JSON.stringify(fields_json), req.user?.id || null]
    );
    res.status(201).json({ success: true, formulario: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar formulário' });
  }
});

// ── POST /formularios/:id/copiar ──────────────────────────────────────────
router.post('/formularios/:id/copiar', authenticateToken, requireProntuarioRole('gerir_templates'), async (req, res) => {
  try {
    const masterDb = multiTenantPostgres.getMasterDb();
    const original = await masterDb.get(
      'SELECT * FROM public.form_definitions WHERE id=$1 AND (tenant_id=$2 OR tenant_id IS NULL)',
      [req.params.id, req.tenantId]
    );
    if (!original) return res.status(404).json({ error: 'Template não encontrado' });
    const copy = await masterDb.get(
      `INSERT INTO public.form_definitions (tenant_id, name, type, specialty, fields_json, is_system, created_by)
       VALUES ($1, $2, $3, $4, $5, false, $6)
       RETURNING id, name, type, specialty, fields_json, is_system, created_at`,
      [req.tenantId, `${original.name} (cópia)`, original.type, original.specialty,
       JSON.stringify(original.fields_json), req.user?.id || null]
    );
    res.status(201).json({ success: true, formulario: copy });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao copiar template' });
  }
});

// ── PUT /formularios/:id ──────────────────────────────────────────────────
router.put('/formularios/:id', authenticateToken, requireProntuarioRole('gerir_templates'), async (req, res) => {
  const { name, specialty, fields_json } = req.body;
  try {
    const masterDb = multiTenantPostgres.getMasterDb();
    const existing = await masterDb.get(
      'SELECT * FROM public.form_definitions WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!existing) return res.status(404).json({ error: 'Template não encontrado ou não editável' });
    const updated = await masterDb.get(
      `UPDATE public.form_definitions
       SET name=$1, specialty=$2, fields_json=$3, updated_at=now()
       WHERE id=$4 AND tenant_id=$5
       RETURNING id, name, type, specialty, fields_json, updated_at`,
      [name || existing.name, specialty ?? existing.specialty,
       JSON.stringify(fields_json || existing.fields_json), req.params.id, req.tenantId]
    );
    res.json({ success: true, formulario: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar template' });
  }
});

// ── DELETE /formularios/:id ───────────────────────────────────────────────
router.delete('/formularios/:id', authenticateToken, requireProntuarioRole('gerir_templates'), async (req, res) => {
  try {
    const masterDb = multiTenantPostgres.getMasterDb();
    const result = await masterDb.run(
      'DELETE FROM public.form_definitions WHERE id=$1 AND tenant_id=$2 AND is_system=false',
      [req.params.id, req.tenantId]
    );
    if (result?.rowCount === 0) return res.status(404).json({ error: 'Template não encontrado ou não removível' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao remover template' });
  }
});

// ── GET /registros/paciente/:id ───────────────────────────────────────────
router.get('/registros/paciente/:id', authenticateToken, requireProntuarioRole('ver'), async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const registros = await req.db.all(
      `SELECT r.*, u.nome AS profissional_nome
       FROM prontuario_registros r
       LEFT JOIN usuarios u ON u.id = r.profissional_id
       WHERE r.paciente_id = $1
       ORDER BY r.data_registro DESC, r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, parseInt(limit), offset]
    );
    res.json({ success: true, registros });
  } catch (err) {
    console.error('[prontuario] registros list:', err.message);
    res.status(500).json({ success: false, error: 'Erro ao listar registros' });
  }
});

// ── POST /registros ───────────────────────────────────────────────────────
router.post('/registros', authenticateToken, requireProntuarioRole('escrever'), async (req, res) => {
  const { paciente_id, form_definition_id, data_json, agendamento_id,
          data_registro, tipo_registro, ref_registro_id } = req.body;
  if (!paciente_id || !form_definition_id) {
    return res.status(400).json({ error: 'paciente_id e form_definition_id são obrigatórios' });
  }
  try {
    const registro = await req.db.get(
      `INSERT INTO prontuario_registros
         (paciente_id, profissional_id, agendamento_id, form_definition_id,
          data_registro, data_json, tipo_registro, ref_registro_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [paciente_id, req.user?.id || 0, agendamento_id || null, form_definition_id,
       data_registro || new Date().toISOString().split('T')[0],
       JSON.stringify(data_json || {}),
       tipo_registro || 'registro', ref_registro_id || null]
    );
    res.status(201).json({ success: true, registro });
  } catch (err) {
    console.error('[prontuario] registro create:', err.message);
    res.status(500).json({ success: false, error: 'Erro ao criar registro' });
  }
});

// ── PUT /registros/:id ────────────────────────────────────────────────────
router.put('/registros/:id', authenticateToken, requireProntuarioRole('escrever'), async (req, res) => {
  const { data_json } = req.body;
  try {
    const registro = await req.db.get(
      `UPDATE prontuario_registros SET data_json=$1, updated_at=now()
       WHERE id=$2 RETURNING *`,
      [JSON.stringify(data_json || {}), req.params.id]
    );
    if (!registro) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json({ success: true, registro });
  } catch (err) {
    if (err.message?.includes('assinado')) {
      return res.status(422).json({
        error: 'REGISTRO_ASSINADO',
        message: 'Registro assinado não pode ser editado. Crie um addendum.'
      });
    }
    res.status(500).json({ success: false, error: 'Erro ao atualizar registro' });
  }
});

// ── POST /registros/:id/assinar ───────────────────────────────────────────
router.post('/registros/:id/assinar', authenticateToken, requireProntuarioRole('assinar'), async (req, res) => {
  try {
    const registro = await req.db.get(
      `UPDATE prontuario_registros
       SET assinado=true, assinado_em=now(), assinado_por=$1, updated_at=now()
       WHERE id=$2 AND assinado=false
       RETURNING id, assinado, assinado_em`,
      [req.user?.id || 0, req.params.id]
    );
    if (!registro) return res.status(404).json({ error: 'Registro não encontrado ou já assinado' });
    res.json({ success: true, registro });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao assinar registro' });
  }
});

// ── POST /registros/:id/addendum ──────────────────────────────────────────
router.post('/registros/:id/addendum', authenticateToken, requireProntuarioRole('escrever'), async (req, res) => {
  const { data_json } = req.body;
  try {
    const original = await req.db.get(
      'SELECT * FROM prontuario_registros WHERE id=$1', [req.params.id]
    );
    if (!original) return res.status(404).json({ error: 'Registro original não encontrado' });
    const addendum = await req.db.get(
      `INSERT INTO prontuario_registros
         (paciente_id, profissional_id, form_definition_id, data_registro,
          data_json, tipo_registro, ref_registro_id)
       VALUES ($1, $2, $3, $4, $5, 'addendum', $6)
       RETURNING *`,
      [original.paciente_id, req.user?.id || 0, original.form_definition_id,
       new Date().toISOString().split('T')[0],
       JSON.stringify(data_json || {}), req.params.id]
    );
    res.status(201).json({ success: true, registro: addendum });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar addendum' });
  }
});

// ── GET /diagnosticos/paciente/:id ────────────────────────────────────────
router.get('/diagnosticos/paciente/:id', authenticateToken, requireProntuarioRole('ver'), async (req, res) => {
  try {
    const diags = await req.db.all(
      `SELECT * FROM prontuario_diagnosticos WHERE paciente_id=$1 ORDER BY data_diagnostico DESC`,
      [req.params.id]
    );
    res.json({ success: true, diagnosticos: diags });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar diagnósticos' });
  }
});

// ── POST /diagnosticos ────────────────────────────────────────────────────
router.post('/diagnosticos', authenticateToken, requireProntuarioRole('escrever'), async (req, res) => {
  const { paciente_id, cid10_codigo, cid10_descricao, tipo, data_diagnostico, registro_id } = req.body;
  if (!paciente_id || !cid10_codigo || !cid10_descricao) {
    return res.status(400).json({ error: 'paciente_id, cid10_codigo e cid10_descricao são obrigatórios' });
  }
  try {
    const diag = await req.db.get(
      `INSERT INTO prontuario_diagnosticos
         (paciente_id, profissional_id, registro_id, cid10_codigo, cid10_descricao, tipo, data_diagnostico)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [paciente_id, req.user?.id || 0, registro_id || null, cid10_codigo, cid10_descricao,
       tipo || 'principal', data_diagnostico || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json({ success: true, diagnostico: diag });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar diagnóstico' });
  }
});

// ── DELETE /diagnosticos/:id ──────────────────────────────────────────────
router.delete('/diagnosticos/:id', authenticateToken, requireProntuarioRole('escrever'), async (req, res) => {
  try {
    await req.db.run('DELETE FROM prontuario_diagnosticos WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao remover diagnóstico' });
  }
});

// ── GET /prescricoes/paciente/:id ─────────────────────────────────────────
router.get('/prescricoes/paciente/:id', authenticateToken, requireProntuarioRole('prescricoes'), async (req, res) => {
  try {
    const prescricoes = await req.db.all(
      `SELECT p.*, u.nome AS profissional_nome
       FROM prontuario_prescricoes p
       LEFT JOIN usuarios u ON u.id = p.profissional_id
       WHERE p.paciente_id=$1 ORDER BY p.data_prescricao DESC`,
      [req.params.id]
    );
    res.json({ success: true, prescricoes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao listar prescrições' });
  }
});

// ── POST /prescricoes ─────────────────────────────────────────────────────
router.post('/prescricoes', authenticateToken, requireProntuarioRole('prescricoes'), async (req, res) => {
  const { paciente_id, itens_json, observacoes, registro_id, data_prescricao } = req.body;
  if (!paciente_id || !itens_json || !Array.isArray(itens_json)) {
    return res.status(400).json({ error: 'paciente_id e itens_json (array) são obrigatórios' });
  }
  try {
    const prescricao = await req.db.get(
      `INSERT INTO prontuario_prescricoes
         (paciente_id, profissional_id, registro_id, itens_json, observacoes, data_prescricao)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [paciente_id, req.user?.id || 0, registro_id || null, JSON.stringify(itens_json),
       observacoes || null, data_prescricao || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json({ success: true, prescricao });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao criar prescrição' });
  }
});

module.exports = router;
