const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { extractTenant } = require('../middleware/tenant');

router.use(authenticateToken);
router.use(extractTenant);

// ── Helpers ──────────────────────────────────────────────────────────────────

function getToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getMonthRange(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return { start: year + '-' + month + '-01', end: year + '-' + month + '-31' };
}

function variation(current, previous) {
  if (!previous || previous === 0) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

async function safeQuery(db, sql, params) {
  try { return await db.all(sql, params); } catch { return []; }
}

async function safeGet(db, sql, params) {
  try { return await db.get(sql, params); } catch { return null; }
}

/**
 * GET /api/dashboard/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const db = req.db;
    const tenantId = req.tenantId;
    const today = getToday();
    const thisMonth = getMonthRange(0);
    const lastMonth = getMonthRange(-1);

    // Agendamentos hoje
    const apptToday = await safeGet(db,
      "SELECT COUNT(*) as total FROM agendamentos_lite WHERE tenant_id = $1 AND data = $2",
      [tenantId, today]
    );
    const apptYesterday = await safeGet(db,
      "SELECT COUNT(*) as total FROM agendamentos_lite WHERE tenant_id = $1 AND data = ($2::date - INTERVAL '1 day')::date",
      [tenantId, today]
    );
    const todayCount = apptToday ? parseInt(apptToday.total) : 0;
    const yesterdayCount = apptYesterday ? parseInt(apptYesterday.total) : 0;

    // Pacientes ativos
    const patientsRow = await safeGet(db,
      "SELECT COUNT(*) as total FROM pacientes WHERE tenant_id = $1 AND (status = 'ativo' OR status IS NULL)",
      [tenantId]
    );
    const patientsLastMonth = await safeGet(db,
      "SELECT COUNT(*) as total FROM pacientes WHERE tenant_id = $1 AND (status = 'ativo' OR status IS NULL) AND created_at < $2",
      [tenantId, thisMonth.start]
    ) || { total: 0 };
    const activePatients = patientsRow ? parseInt(patientsRow.total) : 0;
    const activePatientsPrev = parseInt(patientsLastMonth.total);

    // Receita do mês (agendamentos realizados com valor)
    const revenueThisMonth = await safeGet(db,
      "SELECT COALESCE(SUM(valor), 0) as total FROM agendamentos_lite WHERE tenant_id = $1 AND data BETWEEN $2 AND $3 AND status IN ('realizado', 'confirmado') AND valor > 0",
      [tenantId, thisMonth.start, thisMonth.end]
    );
    const revenueLastMonth = await safeGet(db,
      "SELECT COALESCE(SUM(valor), 0) as total FROM agendamentos_lite WHERE tenant_id = $1 AND data BETWEEN $2 AND $3 AND status IN ('realizado', 'confirmado') AND valor > 0",
      [tenantId, lastMonth.start, lastMonth.end]
    );
    const monthRevenue = revenueThisMonth ? parseFloat(revenueThisMonth.total) : 0;
    const prevRevenue = revenueLastMonth ? parseFloat(revenueLastMonth.total) : 0;

    // Taxa de ocupação: agendamentos do mês / dias úteis * slots por dia (estimativa simples)
    const apptThisMonth = await safeGet(db,
      "SELECT COUNT(*) as total FROM agendamentos_lite WHERE tenant_id = $1 AND data BETWEEN $2 AND $3",
      [tenantId, thisMonth.start, thisMonth.end]
    );
    const totalAppt = apptThisMonth ? parseInt(apptThisMonth.total) : 0;
    // Estimativa: máx 8 slots por dia * 22 dias úteis = 176 slots/mês
    const occupationPct = totalAppt > 0 ? Math.min(100, Math.round(totalAppt / 176 * 100)) : 0;

    res.json({
      success: true,
      data: {
        todayAppointments: { value: todayCount, variation: variation(todayCount, yesterdayCount) },
        activePatients:    { value: activePatients, variation: variation(activePatients, activePatientsPrev) },
        monthlyRevenue:    { value: monthRevenue > 0 ? 'R$ ' + (monthRevenue / 1000).toFixed(1) + 'k' : 'R$ 0', raw: monthRevenue, variation: variation(monthRevenue, prevRevenue) },
        occupationRate:    { value: occupationPct + '%', variation: 0 }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/dashboard/activities
 * Atividades recentes: novos pacientes + agendamentos recentes
 */
router.get('/activities', async (req, res) => {
  try {
    const db = req.db;
    const tenantId = req.tenantId;

    const recentAppts = await safeQuery(db,
      "SELECT id, paciente, procedimento, created_at FROM agendamentos_lite WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5",
      [tenantId]
    );
    const recentPatients = await safeQuery(db,
      "SELECT id, nome, created_at FROM pacientes WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 3",
      [tenantId]
    );

    const activities = [];

    recentAppts.forEach(a => {
      activities.push({
        id: 'appt_' + a.id,
        type: 'agendamento',
        title: 'Agendamento marcado',
        description: (a.paciente || 'Paciente') + (a.procedimento ? ' · ' + a.procedimento : ''),
        time: a.created_at ? new Date(a.created_at).toLocaleString('pt-BR') : ''
      });
    });

    recentPatients.forEach(p => {
      activities.push({
        id: 'pat_' + p.id,
        type: 'paciente',
        title: 'Novo paciente cadastrado',
        description: p.nome || 'Paciente',
        time: p.created_at ? new Date(p.created_at).toLocaleString('pt-BR') : ''
      });
    });

    // Ordenar por data decrescente
    activities.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    res.json({ success: true, data: activities.slice(0, 8) });
  } catch (error) {
    console.error('Erro ao buscar atividades do dashboard:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/dashboard/appointments
 * Agendamentos de hoje
 */
router.get('/appointments', async (req, res) => {
  try {
    const db = req.db;
    const tenantId = req.tenantId;
    const today = getToday();

    const rows = await safeQuery(db,
      "SELECT id, paciente, procedimento, horario, status FROM agendamentos_lite WHERE tenant_id = $1 AND data = $2 ORDER BY horario ASC LIMIT 20",
      [tenantId, today]
    );

    const appointments = rows.map(r => ({
      id: r.id,
      paciente: r.paciente || 'Paciente',
      procedimento: r.procedimento || '',
      horario: r.horario || '',
      status: r.status || 'pendente',
      avatar: (r.paciente || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    }));

    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do dashboard:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/dashboard/charts
 * Dados para gráficos — últimos 6 meses
 */
router.get('/charts', async (req, res) => {
  try {
    const db = req.db;
    const tenantId = req.tenantId;

    const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels = [];
    const apptCounts = [];
    const revenues = [];

    for (let i = 5; i >= 0; i--) {
      const range = getMonthRange(-i);
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      labels.push(MONTHS_PT[d.getMonth()]);

      const apptRow = await safeGet(db,
        "SELECT COUNT(*) as total FROM agendamentos_lite WHERE tenant_id = $1 AND data BETWEEN $2 AND $3",
        [tenantId, range.start, range.end]
      );
      apptCounts.push(apptRow ? parseInt(apptRow.total) : 0);

      const revRow = await safeGet(db,
        "SELECT COALESCE(SUM(valor), 0) as total FROM agendamentos_lite WHERE tenant_id = $1 AND data BETWEEN $2 AND $3 AND valor > 0",
        [tenantId, range.start, range.end]
      );
      revenues.push(revRow ? parseFloat((parseFloat(revRow.total) / 1000).toFixed(1)) : 0);
    }

    // Procedimentos mais comuns
    const topProcs = await safeQuery(db,
      "SELECT procedimento, COUNT(*) as total FROM agendamentos_lite WHERE tenant_id = $1 AND procedimento IS NOT NULL AND procedimento != '' GROUP BY procedimento ORDER BY total DESC LIMIT 5",
      [tenantId]
    );

    const COLORS_BG   = ['rgba(54,162,235,0.8)', 'rgba(75,192,192,0.8)', 'rgba(255,206,86,0.8)', 'rgba(255,99,132,0.8)', 'rgba(153,102,255,0.8)'];
    const COLORS_BORDER = ['rgba(54,162,235,1)', 'rgba(75,192,192,1)', 'rgba(255,206,86,1)', 'rgba(255,99,132,1)', 'rgba(153,102,255,1)'];

    res.json({
      success: true,
      data: {
        appointmentsRevenue: {
          labels,
          datasets: [
            { label: 'Agendamentos', data: apptCounts, borderColor: 'rgb(53,162,235)', backgroundColor: 'rgba(53,162,235,0.2)', yAxisID: 'y' },
            { label: 'Receita (R$ mil)', data: revenues, borderColor: 'rgb(255,99,132)', backgroundColor: 'rgba(255,99,132,0.2)', yAxisID: 'y1' }
          ]
        },
        procedures: topProcs.length > 0 ? {
          labels: topProcs.map(p => p.procedimento),
          datasets: [{
            data: topProcs.map(p => parseInt(p.total)),
            backgroundColor: COLORS_BG.slice(0, topProcs.length),
            borderColor: COLORS_BORDER.slice(0, topProcs.length),
            borderWidth: 2
          }]
        } : null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router;
