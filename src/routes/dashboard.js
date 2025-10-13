const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { extractTenant } = require('../middleware/tenant');

// Middleware de autenticação e tenant
router.use(authenticateToken);
router.use(extractTenant);

// Dados mockados para dashboard
const mockDashboardData = {
  metrics: {
    todayAppointments: { value: 12, variation: 8.2 },
    activePatients: { value: 248, variation: 15.3 },
    monthlyRevenue: { value: 'R$ 22.5k', variation: 12.8 },
    occupationRate: { value: '85%', variation: 5.2 }
  },

  activities: [
    {
      id: 1,
      type: 'agendamento',
      title: 'Nova consulta agendada',
      description: 'Maria Silva - Limpeza de Pele',
      time: '2 min atrás'
    },
    {
      id: 2,
      type: 'whatsapp',
      title: 'Mensagem WhatsApp',
      description: 'João Santos confirmou agendamento',
      time: '5 min atrás'
    },
    {
      id: 3,
      type: 'proposta',
      title: 'Proposta aprovada',
      description: 'Ana Costa - R$ 1.200',
      time: '10 min atrás'
    },
    {
      id: 4,
      type: 'paciente',
      title: 'Novo paciente cadastrado',
      description: 'Carlos Lima',
      time: '15 min atrás'
    }
  ],

  appointments: [
    {
      id: 1,
      paciente: 'Maria Silva',
      procedimento: 'Limpeza de Pele',
      horario: '09:00',
      status: 'confirmado',
      avatar: 'MS'
    },
    {
      id: 2,
      paciente: 'João Santos',
      procedimento: 'Consulta Dermatológica',
      horario: '10:30',
      status: 'confirmado',
      avatar: 'JS'
    },
    {
      id: 3,
      paciente: 'Ana Costa',
      procedimento: 'Tratamento Facial',
      horario: '14:00',
      status: 'pendente',
      avatar: 'AC'
    }
  ],

  chartData: {
    appointmentsRevenue: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Agendamentos',
          data: [45, 52, 48, 61, 55, 67],
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.2)',
          yAxisID: 'y',
        },
        {
          label: 'Receita (R$ mil)',
          data: [18.5, 22.1, 25.8, 19.2, 22.5, 24.5],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
        }
      ]
    },
    procedures: {
      labels: ['Limpeza de Pele', 'Tratamento Facial', 'Consultas', 'Botox', 'Outros'],
      datasets: [
        {
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 2,
        }
      ]
    }
  }
};

/**
 * GET /api/dashboard/metrics
 * Retorna métricas principais do dashboard
 */
router.get('/metrics', async (req, res) => {
  try {
    // Retornar dados mockados por enquanto
    res.json({
      success: true,
      data: mockDashboardData.metrics
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/dashboard/activities
 * Retorna atividades recentes
 */
router.get('/activities', async (req, res) => {
  try {
    // Retornar dados mockados por enquanto
    res.json({
      success: true,
      data: mockDashboardData.activities
    });
  } catch (error) {
    console.error('Erro ao buscar atividades do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/dashboard/appointments
 * Retorna agendamentos do dia
 */
router.get('/appointments', async (req, res) => {
  try {
    // Retornar dados mockados por enquanto
    res.json({
      success: true,
      data: mockDashboardData.appointments
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/dashboard/charts
 * Retorna dados para gráficos
 */
router.get('/charts', async (req, res) => {
  try {
    // Retornar dados mockados por enquanto
    res.json({
      success: true,
      data: mockDashboardData.chartData
    });
  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;