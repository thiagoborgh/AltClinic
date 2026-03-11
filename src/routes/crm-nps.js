/**
 * CRM — Endpoints NPS
 * Issue #20
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/crm/nps/resposta
 * Recebe resposta do paciente (via webhook WhatsApp ou manual)
 */
router.post('/resposta', async (req, res) => {
  try {
    const { agendamentoId, resposta, comentario } = req.body;

    if (!agendamentoId || !resposta) {
      return res.status(400).json({ error: 'agendamentoId e resposta são obrigatórios' });
    }

    const positivo = /👍|positivo|sim|bom|otimo|ótimo|excelente|1/i.test(resposta);
    const score = positivo ? 'positivo' : 'negativo';

    await req.db.run(
      `UPDATE agendamentos SET nps_score=$1, nps_comentario=$2 WHERE id=$3`,
      [score, comentario || null, agendamentoId]
    );

    res.json({ success: true, nps_score: score });
  } catch (err) {
    console.error('[CRM NPS] Erro ao registrar resposta:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * GET /api/crm/nps/dashboard
 * Dashboard de NPS do tenant
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { periodo = 30 } = req.query;

    const rows = await req.db.all(`
      SELECT
        a.nps_score,
        COUNT(*) AS total,
        u.nome AS medico_nome
      FROM agendamentos a
      LEFT JOIN usuarios u ON u.id = a.medico_id
      WHERE a.nps_score IS NOT NULL
        AND a.data_agendamento >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY a.nps_score, u.nome
    `, [periodo]);

    const totais = { positivo: 0, negativo: 0 };
    const porMedico = {};

    for (const r of rows) {
      const n = parseInt(r.total);
      if (r.nps_score === 'positivo') totais.positivo += n;
      else totais.negativo += n;

      const medico = r.medico_nome || 'Sem médico';
      if (!porMedico[medico]) porMedico[medico] = { positivo: 0, negativo: 0 };
      porMedico[medico][r.nps_score] = (porMedico[medico][r.nps_score] || 0) + n;
    }

    const total = totais.positivo + totais.negativo;
    const percentualPositivo = total > 0 ? Math.round((totais.positivo / total) * 100) : 0;

    res.json({
      success: true,
      periodo_dias: parseInt(periodo),
      total,
      positivos: totais.positivo,
      negativos: totais.negativo,
      percentualPositivo,
      porMedico: Object.entries(porMedico).map(([nome, scores]) => ({
        medico: nome, ...scores,
        percentualPositivo: scores.positivo + scores.negativo > 0
          ? Math.round((scores.positivo / (scores.positivo + scores.negativo)) * 100)
          : 0
      }))
    });
  } catch (err) {
    console.error('[CRM NPS] Erro no dashboard:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
