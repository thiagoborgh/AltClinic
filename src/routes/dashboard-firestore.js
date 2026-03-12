const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');

/**
 * ✅ ROTAS DE DASHBOARD - FIRESTORE (SEM DADOS MOCK)
 * Todas as métricas são calculadas com base em dados reais
 */

/**
 * GET /api/dashboard/metrics
 * Retorna métricas principais do dashboard
 */
router.get('/metrics', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    const metrics = await firestoreService.getDashboardMetrics(tenantId);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/activities
 * Retorna atividades recentes (implementação futura)
 */
router.get('/activities', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    const activities = await firestoreService.getDashboardActivities(tenantId);

    res.json({
      success: true,
      data: activities,
      message: activities.length === 0 ? 'Sistema de atividades será implementado em breve' : null
    });
  } catch (error) {
    console.error('Erro ao buscar atividades do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/appointments
 * Retorna agendamentos do dia
 */
router.get('/appointments', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    const appointments = await firestoreService.getDashboardAppointments(tenantId);

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * GET /api/dashboard/charts
 * Retorna dados para gráficos (últimos 6 meses) — PostgreSQL
 */
router.get('/charts', async (req, res) => {
  try {
    const { tenantId, db } = req;

    if (!tenantId || !db) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    // Agendamentos por mês (últimos 6 meses)
    const agendamentosPorMes = await db.query(
      `SELECT
         TO_CHAR(data_agendamento, 'YYYY-MM') AS mes,
         TO_CHAR(data_agendamento, 'Mon/YY')  AS label,
         COUNT(*)                              AS total,
         COUNT(*) FILTER (WHERE status = 'confirmado' OR status = 'atendido') AS confirmados,
         COUNT(*) FILTER (WHERE status = 'cancelado') AS cancelados
       FROM agendamentos
       WHERE tenant_id = $1
         AND data_agendamento >= NOW() - INTERVAL '6 months'
       GROUP BY mes, label
       ORDER BY mes ASC`,
      [tenantId]
    );

    // Novos pacientes por mês (últimos 6 meses)
    const pacientesPorMes = await db.query(
      `SELECT
         TO_CHAR(created_at, 'YYYY-MM') AS mes,
         TO_CHAR(created_at, 'Mon/YY')  AS label,
         COUNT(*)                        AS total
       FROM pacientes
       WHERE tenant_id = $1
         AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY mes, label
       ORDER BY mes ASC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        agendamentos: agendamentosPorMes.rows ?? agendamentosPorMes,
        pacientes: pacientesPorMes.rows ?? pacientesPorMes,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
