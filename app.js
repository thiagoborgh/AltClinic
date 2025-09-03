const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar utilitários
const dbManager = require('./src/models/database');
const multiTenantDb = require('./src/models/MultiTenantDatabase');
const cronManager = require('./src/cron/inactivityChecker');
const { botManager } = require('./src/utils/bot');

// Importar middlewares multi-tenant
const { extractTenant, tenantRateLimit } = require('./src/middleware/tenant');

// Importar rotas
const authRoutes = require('./src/routes/auth');
const agendamentosRoutes = require('./src/routes/agendamentos');
const propostasRoutes = require('./src/routes/propostas');
const crmRoutes = require('./src/routes/crm');
const tenantsRoutes = require('./src/routes/tenants');
const pacientesRoutes = require('./src/routes/pacientes');
const trialRoutes = require('./src/routes/trial');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança - atualizado para multi-tenant
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https:"] // Para APIs externas
    },
  },
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP por janela (aumentado para SaaS)
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
});

app.use('/api/', globalLimiter);

// Middleware básico - atualizado para multi-tenant
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://altclinic.vercel.app',
    /^https:\/\/.*\.altclinic\.com\.br$/,  // Subdomínios dos tenants
    /^https:\/\/.*\.railway\.app$/         // Railway deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de log - melhorado para multi-tenant
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const tenant = req.headers['x-tenant-slug'] || 'no-tenant';
  console.log(`${timestamp} [${tenant}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// === ROTAS PÚBLICAS (sem tenant) ===
app.use('/api/tenants', tenantsRoutes);
app.use('/api/trial', trialRoutes);

// === ROTAS COM TENANT ===
// Aplicar middleware de tenant em todas as rotas protegidas
app.use('/api/t/:tenantSlug/*', extractTenant);
app.use('/api/t/:tenantSlug/', tenantRateLimit());

// Rotas da API com tenant
app.use('/api/t/:tenantSlug/auth', authRoutes);
app.use('/api/t/:tenantSlug/agendamentos', agendamentosRoutes);
app.use('/api/t/:tenantSlug/propostas', propostasRoutes);
app.use('/api/t/:tenantSlug/crm', crmRoutes);
app.use('/api/t/:tenantSlug/pacientes', pacientesRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  const dbStatus = dbManager.getDb() ? 'connected' : 'disconnected';
  const cronStatus = cronManager.getStatus();
  const botStatus = botManager.getStatus();
  
  res.json({
    success: true,
    status: 'running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbStatus,
      cron_jobs: cronStatus,
      bots: botStatus
    }
  });
});

// Rota para servir frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  // Para desenvolvimento, servir também da pasta public se existir
  if (require('fs').existsSync(path.join(__dirname, 'public'))) {
    app.use(express.static(path.join(__dirname, 'public')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }
}

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Alt Clinic - Sistema de Agendamento Automatizado...');
    
    // Verificar conexão com banco
    const db = dbManager.getDb();
    console.log('✅ Banco de dados conectado');
    
    // Iniciar cron jobs
    cronManager.start();
    console.log('⏰ Cron jobs iniciados');
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🌐 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Ambiente: Desenvolvimento`);
        console.log(`📊 Dashboard: http://localhost:${PORT}`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Recebido SIGTERM, encerrando servidor graciosamente...');
      
      cronManager.stop();
      botManager.stop();
      dbManager.close();
      
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 Recebido SIGINT, encerrando servidor graciosamente...');
      
      cronManager.stop();
      botManager.stop();
      dbManager.close();
      
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  }
}

// Tratar erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

module.exports = app;
