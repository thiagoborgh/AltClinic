const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const licencasRoutes = require('./routes/licencas');
const configuracoesRoutes = require('./routes/configuracoes');
const dashboardRoutes = require('./routes/dashboard');
const relatoriosRoutes = require('./routes/relatorios');
const whatsappRoutes = require('./routes/whatsapp');
const financeiroRoutes = require('./routes/financeiro');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos
  max: process.env.RATE_LIMIT_MAX || 100, // máximo 100 requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
});
app.use('/api/admin', limiter);

// Middlewares gerais
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de log customizado
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rotas da API Admin
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/licencas', licencasRoutes);
app.use('/api/admin/configuracoes', configuracoesRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/relatorios', relatoriosRoutes);
app.use('/api/admin/whatsapp', whatsappRoutes);
app.use('/api/admin/financeiro', financeiroRoutes);

// Rota de health check
app.get('/api/admin/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.message
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`
  🚀 Admin Intranet Altclinic Server rodando!
  
  📡 Porta: ${PORT}
  🌍 Ambiente: ${process.env.NODE_ENV}
  📊 Health Check: http://localhost:${PORT}/api/admin/health
  🔐 Admin Login: http://localhost:${PORT}/api/admin/auth/login
  
  📋 Rotas disponíveis:
  - POST /api/admin/auth/login
  - GET  /api/admin/auth/me
  - GET  /api/admin/dashboard/stats
  - GET  /api/admin/licencas
  - GET  /api/admin/configuracoes/:licencaId
  - GET  /api/admin/relatorios
  - POST /api/admin/whatsapp/:licencaId/qr
  - POST /api/admin/financeiro/recorrencia
  - GET  /api/admin/financeiro/recorrencia/:tenantId
  - GET  /api/admin/financeiro/resumo
  - POST /api/admin/financeiro/pix
  `);
});

module.exports = app;
