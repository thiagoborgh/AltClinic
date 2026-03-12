/**
 * PEP — Prontuário Eletrônico de Paciente
 * Issue #26 — conformidade CFM 1821/2007
 *
 * Campos obrigatórios: anamnese, diagnóstico (CID-10), conduta/prescrição,
 * histórico cronológico, exportação PDF (via endpoint dedicado).
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

async function ensureTables(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS prontuarios_pep (
      id BIGSERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      paciente_id BIGINT NOT NULL,
      medico_id BIGINT,
      agendamento_id BIGINT,

      -- Anamnese
      queixa_principal TEXT,
      historia_doenca_atual TEXT,
      antecedentes_pessoais TEXT,
      antecedentes_familiares TEXT,
      medicamentos_em_uso TEXT,
      alergias TEXT,
      habitos TEXT,                  -- tabagismo, etilismo, atividade física

      -- Exame físico
      pressao_arterial TEXT,
      frequencia_cardiaca INT,
      temperatura NUMERIC(4,1),
      peso NUMERIC(5,2),
      altura NUMERIC(4,2),
      outros_sinais_vitais TEXT,
      exame_fisico TEXT,

      -- Diagnóstico
      cid10_principal TEXT,          -- ex: 'J06.9'
      cid10_descricao TEXT,
      cid10_secundarios JSONB,       -- array de CIDs secundários
      hipotese_diagnostica TEXT,

      -- Conduta
      prescricao TEXT,               -- texto livre da prescrição
      prescricao_medicamentos JSONB, -- array estruturado de medicamentos
      solicitacoes_exames TEXT,
      encaminhamentos TEXT,
      retorno_em_dias INT,
      orientacoes TEXT,

      -- Controle
      status TEXT DEFAULT 'rascunho', -- rascunho, assinado
      assinado_em TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `, []);
}

// ── GET /api/pep/paciente/:pacienteId ─────────────────────────────────────
// Histórico completo de prontuários do paciente (ordem cronológica)
router.get('/paciente/:pacienteId', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);

    const prontuarios = await req.db.all(`
      SELECT p.*, u.nome AS medico_nome
      FROM prontuarios_pep p
      LEFT JOIN usuarios u ON u.id = p.medico_id
      WHERE p.paciente_id=$1 AND p.tenant_id=$2
      ORDER BY p.created_at DESC
    `, [req.params.pacienteId, req.tenantId]);

    res.json({ success: true, prontuarios, total: prontuarios.length });
  } catch (err) {
    console.error('[PEP] Erro ao buscar prontuários:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── GET /api/pep/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);

    const pep = await req.db.get(`
      SELECT p.*, u.nome AS medico_nome, pac.nome AS paciente_nome
      FROM prontuarios_pep p
      LEFT JOIN usuarios u ON u.id = p.medico_id
      LEFT JOIN pacientes pac ON pac.id = p.paciente_id
      WHERE p.id=$1 AND p.tenant_id=$2
    `, [req.params.id, req.tenantId]);

    if (!pep) return res.status(404).json({ error: 'Prontuário não encontrado' });
    res.json({ success: true, prontuario: pep });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── POST /api/pep ─────────────────────────────────────────────────────────
// Criar novo prontuário (rascunho)
router.post('/', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);
    const {
      paciente_id, agendamento_id,
      queixa_principal, historia_doenca_atual, antecedentes_pessoais,
      antecedentes_familiares, medicamentos_em_uso, alergias, habitos,
      pressao_arterial, frequencia_cardiaca, temperatura, peso, altura,
      outros_sinais_vitais, exame_fisico,
      cid10_principal, cid10_descricao, cid10_secundarios, hipotese_diagnostica,
      prescricao, prescricao_medicamentos, solicitacoes_exames,
      encaminhamentos, retorno_em_dias, orientacoes
    } = req.body;

    if (!paciente_id) return res.status(400).json({ error: 'paciente_id é obrigatório' });

    const result = await req.db.run(`
      INSERT INTO prontuarios_pep (
        tenant_id, paciente_id, medico_id, agendamento_id,
        queixa_principal, historia_doenca_atual, antecedentes_pessoais,
        antecedentes_familiares, medicamentos_em_uso, alergias, habitos,
        pressao_arterial, frequencia_cardiaca, temperatura, peso, altura,
        outros_sinais_vitais, exame_fisico,
        cid10_principal, cid10_descricao, cid10_secundarios, hipotese_diagnostica,
        prescricao, prescricao_medicamentos, solicitacoes_exames,
        encaminhamentos, retorno_em_dias, orientacoes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26,$27,$28
      ) RETURNING id
    `, [
      req.tenantId, paciente_id, req.user?.id, agendamento_id || null,
      queixa_principal, historia_doenca_atual, antecedentes_pessoais,
      antecedentes_familiares, medicamentos_em_uso, alergias, habitos,
      pressao_arterial, frequencia_cardiaca || null, temperatura || null,
      peso || null, altura || null, outros_sinais_vitais, exame_fisico,
      cid10_principal, cid10_descricao,
      JSON.stringify(cid10_secundarios || []),
      hipotese_diagnostica, prescricao,
      JSON.stringify(prescricao_medicamentos || []),
      solicitacoes_exames, encaminhamentos, retorno_em_dias || null, orientacoes
    ]);

    // Atualizar retorno_em_dias no agendamento se informado
    if (agendamento_id && retorno_em_dias) {
      await req.db.run(
        'UPDATE agendamentos SET retorno_em_dias=$1, status=$2 WHERE id=$3',
        [retorno_em_dias, 'realizado', agendamento_id]
      ).catch(() => {});
    }

    res.status(201).json({ success: true, id: result.lastID });
  } catch (err) {
    console.error('[PEP] Erro ao criar prontuário:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── PUT /api/pep/:id ──────────────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await ensureTables(req.db);
    const pep = await req.db.get(
      'SELECT id, status FROM prontuarios_pep WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!pep) return res.status(404).json({ error: 'Prontuário não encontrado' });
    if (pep.status === 'assinado') return res.status(403).json({ error: 'Prontuário assinado não pode ser editado (CFM 1821/2007)' });

    const fields = [
      'queixa_principal','historia_doenca_atual','antecedentes_pessoais',
      'antecedentes_familiares','medicamentos_em_uso','alergias','habitos',
      'pressao_arterial','frequencia_cardiaca','temperatura','peso','altura',
      'outros_sinais_vitais','exame_fisico','cid10_principal','cid10_descricao',
      'hipotese_diagnostica','prescricao','solicitacoes_exames',
      'encaminhamentos','retorno_em_dias','orientacoes'
    ];

    const updates = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        params.push(req.body[f]);
        updates.push(`${f}=$${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    params.push(req.params.id, req.tenantId);
    await req.db.run(
      `UPDATE prontuarios_pep SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${params.length - 1} AND tenant_id=$${params.length}`,
      params
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── POST /api/pep/:id/assinar ─────────────────────────────────────────────
// Assinar eletronicamente o prontuário (imutável após assinatura — CFM)
router.post('/:id/assinar', authenticateToken, async (req, res) => {
  try {
    await req.db.run(
      `UPDATE prontuarios_pep SET status='assinado', assinado_em=NOW() WHERE id=$1 AND tenant_id=$2`,
      [req.params.id, req.tenantId]
    );
    res.json({ success: true, message: 'Prontuário assinado digitalmente' });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ── GET /api/pep/cid10/buscar?q=hipertensão ──────────────────────────────
// Busca CID-10 (lista estática dos mais comuns — base completa via integração futura)
router.get('/cid10/buscar', authenticateToken, (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ results: [] });

  const CID10_COMUNS = [
    { codigo: 'J06.9', descricao: 'Infecção aguda das vias aéreas superiores não especificada' },
    { codigo: 'I10',   descricao: 'Hipertensão essencial (primária)' },
    { codigo: 'E11',   descricao: 'Diabetes mellitus tipo 2' },
    { codigo: 'F41.1', descricao: 'Transtorno de ansiedade generalizada' },
    { codigo: 'F32',   descricao: 'Episódio depressivo' },
    { codigo: 'J45',   descricao: 'Asma' },
    { codigo: 'K21',   descricao: 'Doença de refluxo gastresofágico' },
    { codigo: 'M54.5', descricao: 'Dor lombar baixa' },
    { codigo: 'N39.0', descricao: 'Infecção do trato urinário de localização não especificada' },
    { codigo: 'L70',   descricao: 'Acne' },
    { codigo: 'E66',   descricao: 'Obesidade' },
    { codigo: 'G43',   descricao: 'Enxaqueca' },
    { codigo: 'Z00.0', descricao: 'Exame médico geral' },
    { codigo: 'Z00.1', descricao: 'Exame de rotina de criança' },
    { codigo: 'A09',   descricao: 'Diarreia e gastroenterite de presumível origem infecciosa' },
  ];

  const termo = q.toLowerCase();
  const results = CID10_COMUNS.filter(c =>
    c.codigo.toLowerCase().includes(termo) || c.descricao.toLowerCase().includes(termo)
  ).slice(0, 10);

  res.json({ results });
});

module.exports = router;
