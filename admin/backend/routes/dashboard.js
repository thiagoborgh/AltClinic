const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/database');

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// GET /api/admin/dashboard/stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = db.getDashboardStats();
    
    // Estatísticas adicionais
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Licenças vencendo em 30 dias
    const vencendoEm30Dias = db.db.prepare(`
      SELECT COUNT(*) as count 
      FROM licencas 
      WHERE data_vencimento <= ? AND data_vencimento >= ? AND status = 'ativa'
    `).get(thirtyDaysFromNow.toISOString().split('T')[0], now.toISOString().split('T')[0]);

    stats.licencasVencendo = vencendoEm30Dias.count;

    // Crescimento mensal (simulado)
    stats.crescimentoMensal = 12.5;

    // Log da ação
    db.logAction(
      req.user.userId,
      'VIEW_DASHBOARD',
      'dashboard',
      null,
      { stats },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/dashboard/recent-activity
router.get('/recent-activity', authenticateToken, (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Buscar atividades recentes
    const activities = db.getRecentLogs(parseInt(limit));

    res.json({
      activities,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/dashboard/alerts
router.get('/alerts', authenticateToken, (req, res) => {
  try {
    const alerts = [];

    // Licenças vencendo
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const licencasVencendo = db.db.prepare(`
      SELECT COUNT(*) as count 
      FROM licencas 
      WHERE data_vencimento <= ? AND status = 'ativa'
    `).get(thirtyDaysFromNow.toISOString().split('T')[0]);

    if (licencasVencendo.count > 0) {
      alerts.push({
        type: 'warning',
        title: 'Licenças Vencendo',
        message: `${licencasVencendo.count} licenças vencem em 30 dias`,
        count: licencasVencendo.count,
        priority: 'high'
      });
    }

    // Licenças vencidas
    const licencasVencidas = db.db.prepare(`
      SELECT COUNT(*) as count 
      FROM licencas 
      WHERE data_vencimento < ? AND status = 'ativa'
    `).get(now.toISOString().split('T')[0]);

    if (licencasVencidas.count > 0) {
      alerts.push({
        type: 'error',
        title: 'Licenças Vencidas',
        message: `${licencasVencidas.count} licenças estão vencidas`,
        count: licencasVencidas.count,
        priority: 'critical'
      });
    }

    // Licenças suspensas
    const licencasSuspensas = db.db.prepare(`
      SELECT COUNT(*) as count 
      FROM licencas 
      WHERE status = 'suspensa'
    `).get();

    if (licencasSuspensas.count > 0) {
      alerts.push({
        type: 'info',
        title: 'Licenças Suspensas',
        message: `${licencasSuspensas.count} licenças estão suspensas`,
        count: licencasSuspensas.count,
        priority: 'medium'
      });
    }

    res.json({
      alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/dashboard/revenue
router.get('/revenue', authenticateToken, (req, res) => {
  try {
    const { period = '6m' } = req.query;

    // Dados mock de faturamento por enquanto
    const revenueData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      // Simular crescimento
      const baseRevenue = 35000;
      const growth = i === 0 ? 0 : (5 - i) * 3000;
      
      revenueData.push({
        period: monthName,
        revenue: baseRevenue + growth + Math.random() * 5000,
        licenses: 40 + (5 - i) * 3 + Math.floor(Math.random() * 5),
        date: date.toISOString().split('T')[0]
      });
    }

    res.json({
      data: revenueData,
      period,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar dados de faturamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/dashboard/licenses-by-status
router.get('/licenses-by-status', authenticateToken, (req, res) => {
  try {
    const statusData = db.db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM licencas
      GROUP BY status
      ORDER BY count DESC
    `).all();

    // Mapear cores para cada status
    const statusColors = {
      'ativa': '#4caf50',
      'vencendo': '#ff9800',
      'vencida': '#f44336',
      'suspensa': '#9e9e9e'
    };

    const formattedData = statusData.map(item => ({
      status: item.status,
      count: item.count,
      color: statusColors[item.status] || '#9e9e9e'
    }));

    res.json({
      data: formattedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar licenças por status:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
