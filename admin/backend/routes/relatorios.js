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

// GET /api/admin/relatorios
router.get('/', authenticateToken, (req, res) => {
  try {
    const { 
      tipo = 'geral',
      dataInicio,
      dataFim,
      format = 'json'
    } = req.query;

    const now = new Date();
    const defaultDataInicio = dataInicio || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultDataFim = dataFim || now.toISOString().split('T')[0];

    let relatorio = {};

    switch (tipo) {
      case 'geral':
        relatorio = generateRelatorioGeral(defaultDataInicio, defaultDataFim);
        break;
      case 'financeiro':
        relatorio = generateRelatorioFinanceiro(defaultDataInicio, defaultDataFim);
        break;
      case 'licencas':
        relatorio = generateRelatorioLicencas(defaultDataInicio, defaultDataFim);
        break;
      case 'suporte':
        relatorio = generateRelatorioSuporte(defaultDataInicio, defaultDataFim);
        break;
      default:
        relatorio = generateRelatorioGeral(defaultDataInicio, defaultDataFim);
    }

    // Log da ação
    db.logAction(
      req.user.userId,
      'GENERATE_REPORT',
      'relatorios',
      null,
      { 
        tipo, 
        periodo: `${defaultDataInicio} a ${defaultDataFim}`,
        format 
      },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      tipo,
      periodo: {
        inicio: defaultDataInicio,
        fim: defaultDataFim
      },
      geradoEm: new Date().toISOString(),
      relatorio
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Função para gerar relatório geral
function generateRelatorioGeral(dataInicio, dataFim) {
  const stats = db.getDashboardStats();
  
  // Top clientes por valor
  const topClientes = db.db.prepare(`
    SELECT id, cliente, plano, valor_mensal, data_vencimento, status
    FROM licencas 
    WHERE status = 'ativa'
    ORDER BY valor_mensal DESC
    LIMIT 10
  `).all();

  // Distribuição por planos
  const distribucaoPlanos = db.db.prepare(`
    SELECT plano, COUNT(*) as quantidade, SUM(valor_mensal) as faturamento
    FROM licencas
    WHERE status = 'ativa'
    GROUP BY plano
    ORDER BY quantidade DESC
  `).all();

  return {
    resumo: stats,
    topClientes,
    distribucaoPlanos,
    alertas: [
      {
        tipo: 'vencimento',
        descricao: `${stats.licencasVencendo} licenças vencem em 30 dias`,
        prioridade: stats.licencasVencendo > 5 ? 'alta' : 'media'
      },
      {
        tipo: 'faturamento',
        descricao: `Faturamento mensal: R$ ${stats.faturamentoMensal.toLocaleString()}`,
        prioridade: 'info'
      }
    ]
  };
}

// Função para gerar relatório financeiro
function generateRelatorioFinanceiro(dataInicio, dataFim) {
  const faturamentoAtivo = db.db.prepare(`
    SELECT SUM(valor_mensal) as total
    FROM licencas
    WHERE status = 'ativa'
  `).get();

  const faturamentoPorPlano = db.db.prepare(`
    SELECT 
      plano,
      COUNT(*) as licencas,
      SUM(valor_mensal) as faturamento_mensal,
      AVG(valor_mensal) as ticket_medio
    FROM licencas
    WHERE status = 'ativa'
    GROUP BY plano
    ORDER BY faturamento_mensal DESC
  `).all();

  // Dados mock de histórico mensal
  const historicoMensal = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    historicoMensal.push({
      mes: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      faturamento: faturamentoAtivo.total + (Math.random() * 10000 - 5000),
      licencas: 45 + Math.floor(Math.random() * 10),
      churn: Math.random() * 5,
      crescimento: Math.random() * 15
    });
  }

  return {
    faturamentoTotal: faturamentoAtivo.total || 0,
    faturamentoPorPlano,
    historicoMensal,
    metricas: {
      ticketMedio: faturamentoAtivo.total / (db.getDashboardStats().licencasAtivas || 1),
      churnRate: 2.5, // Mock
      ltv: 45000, // Mock
      cac: 1200 // Mock
    }
  };
}

// Função para gerar relatório de licenças
function generateRelatorioLicencas(dataInicio, dataFim) {
  const licencasPorStatus = db.db.prepare(`
    SELECT status, COUNT(*) as quantidade
    FROM licencas
    GROUP BY status
  `).all();

  const licencasPorMes = db.db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as mes,
      COUNT(*) as novas_licencas
    FROM licencas
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY mes
  `).all(dataInicio, dataFim + ' 23:59:59');

  const licencasVencimento = db.db.prepare(`
    SELECT 
      CASE 
        WHEN data_vencimento < date('now') THEN 'vencidas'
        WHEN data_vencimento <= date('now', '+30 days') THEN 'vencendo_30_dias'
        WHEN data_vencimento <= date('now', '+60 days') THEN 'vencendo_60_dias'
        ELSE 'futuras'
      END as categoria,
      COUNT(*) as quantidade
    FROM licencas
    WHERE status = 'ativa'
    GROUP BY categoria
  `).all();

  return {
    licencasPorStatus,
    licencasPorMes,
    licencasVencimento,
    totalLicencas: db.getDashboardStats().totalLicencas
  };
}

// Função para gerar relatório de suporte
function generateRelatorioSuporte(dataInicio, dataFim) {
  // Dados mock de suporte
  const ticketsPorTipo = [
    { tipo: 'Configuração', quantidade: 25, tempo_medio: '2.5h' },
    { tipo: 'Integração', quantidade: 18, tempo_medio: '4.2h' },
    { tipo: 'Bug', quantidade: 12, tempo_medio: '1.8h' },
    { tipo: 'Dúvida', quantidade: 35, tempo_medio: '0.5h' }
  ];

  const satisfacao = {
    media: 4.2,
    total_avaliacoes: 156,
    distribuicao: {
      5: 89,
      4: 45,
      3: 15,
      2: 5,
      1: 2
    }
  };

  return {
    ticketsPorTipo,
    satisfacao,
    sla: {
      meta: '4h',
      atual: '3.2h',
      percentual_cumprimento: 87.5
    }
  };
}

// POST /api/admin/relatorios/export
router.post('/export', authenticateToken, (req, res) => {
  try {
    const { tipo, formato, dataInicio, dataFim } = req.body;

    // Log da ação
    db.logAction(
      req.user.userId,
      'EXPORT_REPORT',
      'relatorios',
      null,
      { tipo, formato, periodo: `${dataInicio} a ${dataFim}` },
      req.ip,
      req.get('User-Agent')
    );

    // Simular export
    const exportId = Math.random().toString(36).substr(2, 9);
    
    res.json({
      message: 'Export iniciado com sucesso',
      exportId,
      status: 'processing',
      estimatedTime: '2-3 minutos'
    });

  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/relatorios/templates
router.get('/templates', authenticateToken, (req, res) => {
  try {
    const templates = [
      {
        id: 'geral',
        nome: 'Relatório Geral',
        descricao: 'Visão geral completa do sistema',
        campos: ['licencas', 'faturamento', 'alertas']
      },
      {
        id: 'financeiro',
        nome: 'Relatório Financeiro',
        descricao: 'Análise detalhada de faturamento',
        campos: ['faturamento', 'metricas', 'historico']
      },
      {
        id: 'licencas',
        nome: 'Relatório de Licenças',
        descricao: 'Status e distribuição de licenças',
        campos: ['status', 'vencimentos', 'crescimento']
      },
      {
        id: 'suporte',
        nome: 'Relatório de Suporte',
        descricao: 'Métricas de atendimento ao cliente',
        campos: ['tickets', 'satisfacao', 'sla']
      }
    ];

    res.json({ templates });

  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
