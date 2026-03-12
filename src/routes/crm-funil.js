/**
 * CRM Camada 2 — Issues #21 e #22
 * Funil Kanban de Pacientes + Dashboard de Conversão
 *
 * Endpoints:
 *   GET    /api/crm/funil                    — todos os leads agrupados por etapa (kanban)
 *   POST   /api/crm/funil/lead               — criar novo lead
 *   PUT    /api/crm/funil/lead/:id/etapa     — mover lead de etapa
 *   GET    /api/crm/funil/lead/:id           — detalhes do lead
 *   DELETE /api/crm/funil/lead/:id           — remover lead
 *   GET    /api/crm/funil/dashboard          — dashboard de conversão por etapa
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// ── DDL ──────────────────────────────────────────────────────────────────────

const DDL_CRM_LEADS = `
  CREATE TABLE IF NOT EXISTS crm_leads (
    id         BIGSERIAL PRIMARY KEY,
    tenant_id  TEXT NOT NULL,
    paciente_id BIGINT,
    nome       TEXT NOT NULL,
    telefone   TEXT,
    email      TEXT,
    origem     TEXT,
    campanha   TEXT,
    etapa      TEXT DEFAULT 'novo_interesse',
    notas      TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`;

const ETAPAS_ORDENADAS = [
  'novo_interesse',
  'em_negociacao',
  'agendado',
  'compareceu',
  'fidelizado',
  'perdido',
];

// Garante que a tabela existe antes de qualquer operação
async function ensureTable(db) {
  await db.run(DDL_CRM_LEADS);
}

// ── #21 — GET /funil ─────────────────────────────────────────────────────────

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    await ensureTable(db);

    const rows = await db.all(
      `SELECT * FROM crm_leads
       WHERE tenant_id = $1 AND etapa != 'perdido'
       ORDER BY updated_at DESC`,
      [tenantId]
    );

    const funil = {
      novo_interesse: [],
      em_negociacao: [],
      agendado: [],
      compareceu: [],
      fidelizado: [],
    };

    for (const lead of rows) {
      if (funil[lead.etapa] !== undefined) {
        funil[lead.etapa].push(lead);
      }
    }

    const totais = {};
    for (const etapa of Object.keys(funil)) {
      totais[etapa] = funil[etapa].length;
    }

    res.json({ success: true, funil, totais });
  } catch (error) {
    console.error('Erro ao buscar funil:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── #21 — POST /funil/lead ────────────────────────────────────────────────────

router.post('/lead', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { paciente_id, nome, telefone, email, origem, campanha, etapa, notas } = req.body;

    if (!nome) {
      return res.status(400).json({ success: false, message: 'Campo obrigatório: nome' });
    }

    await ensureTable(db);

    const etapaValida = etapa && ETAPAS_ORDENADAS.includes(etapa) ? etapa : 'novo_interesse';

    const result = await db.run(
      `INSERT INTO crm_leads
         (tenant_id, paciente_id, nome, telefone, email, origem, campanha, etapa, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tenantId, paciente_id || null, nome, telefone || null, email || null,
       origem || null, campanha || null, etapaValida, notas || null]
    );

    const lead = result.rows ? result.rows[0] : result;

    res.status(201).json({ success: true, lead, message: 'Lead criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar lead:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── #21 — PUT /funil/lead/:id/etapa ──────────────────────────────────────────

router.put('/lead/:id/etapa', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { id } = req.params;
    const { etapa } = req.body;

    if (!etapa || !ETAPAS_ORDENADAS.includes(etapa)) {
      return res.status(400).json({
        success: false,
        message: `Etapa inválida. Válidas: ${ETAPAS_ORDENADAS.join(', ')}`,
      });
    }

    await ensureTable(db);

    const result = await db.run(
      `UPDATE crm_leads
       SET etapa = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [etapa, id, tenantId]
    );

    const lead = result.rows ? result.rows[0] : null;

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead não encontrado' });
    }

    res.json({ success: true, lead, message: `Lead movido para etapa '${etapa}'` });
  } catch (error) {
    console.error('Erro ao mover lead:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── #21 — GET /funil/lead/:id ─────────────────────────────────────────────────

router.get('/lead/:id', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { id } = req.params;

    await ensureTable(db);

    const lead = await db.get(
      `SELECT * FROM crm_leads WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead não encontrado' });
    }

    res.json({ success: true, lead });
  } catch (error) {
    console.error('Erro ao buscar lead:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── #21 — DELETE /funil/lead/:id ──────────────────────────────────────────────

router.delete('/lead/:id', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { id } = req.params;

    await ensureTable(db);

    const result = await db.run(
      `DELETE FROM crm_leads WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    );

    const deleted = result.rows ? result.rows[0] : null;

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Lead não encontrado' });
    }

    res.json({ success: true, message: 'Lead removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover lead:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── #22 — GET /funil/dashboard ────────────────────────────────────────────────

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const periodo = parseInt(req.query.periodo) || 30;

    await ensureTable(db);

    // Total de leads no período
    const totalRow = await db.get(
      `SELECT COUNT(*) AS total FROM crm_leads
       WHERE tenant_id = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL`,
      [tenantId, periodo]
    );
    const totalLeads = parseInt(totalRow.total) || 0;

    // Leads que chegaram em 'fidelizado' no período
    const fidelizadosRow = await db.get(
      `SELECT COUNT(*) AS total FROM crm_leads
       WHERE tenant_id = $1
         AND etapa = 'fidelizado'
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL`,
      [tenantId, periodo]
    );
    const totalFidelizados = parseInt(fidelizadosRow.total) || 0;

    const conversaoGeral =
      totalLeads > 0 ? parseFloat(((totalFidelizados / totalLeads) * 100).toFixed(1)) : 0;

    // Contagem por etapa no período
    const contagemRows = await db.all(
      `SELECT etapa, COUNT(*) AS total
       FROM crm_leads
       WHERE tenant_id = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY etapa`,
      [tenantId, periodo]
    );

    const contagemPorEtapa = {};
    for (const row of contagemRows) {
      contagemPorEtapa[row.etapa] = parseInt(row.total);
    }

    // Montar por_etapa com taxa de conversão para a próxima etapa
    const etapasOrdem = ['novo_interesse', 'em_negociacao', 'agendado', 'compareceu', 'fidelizado'];
    const porEtapa = etapasOrdem.map((etapa, idx) => {
      const total = contagemPorEtapa[etapa] || 0;
      const proxima = etapasOrdem[idx + 1];
      const totalProxima = proxima ? (contagemPorEtapa[proxima] || 0) : null;
      const conversaoProxima =
        proxima && total > 0
          ? parseFloat(((totalProxima / total) * 100).toFixed(1))
          : null;
      return { etapa, total, conversao_proxima: conversaoProxima };
    });

    // Leads parados (sem atualização há mais de 7 dias), excluindo 'perdido' e 'fidelizado'
    const leadsParados = await db.all(
      `SELECT * FROM crm_leads
       WHERE tenant_id = $1
         AND etapa NOT IN ('fidelizado', 'perdido')
         AND updated_at < NOW() - INTERVAL '7 days'
       ORDER BY updated_at ASC
       LIMIT 50`,
      [tenantId]
    );

    res.json({
      success: true,
      periodo_dias: periodo,
      total_leads: totalLeads,
      conversao_geral: conversaoGeral,
      por_etapa: porEtapa,
      leads_parados: leadsParados,
    });
  } catch (error) {
    console.error('Erro ao gerar dashboard funil:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router;
