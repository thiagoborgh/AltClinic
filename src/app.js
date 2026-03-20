require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');

// Importar rotas
const authRoutes = require('./routes/auth');
const agendaAgendamentosRoutes = require('./routes/agenda-agendamentos'); // ✅ AGENDA LITE (PADRÃO)
const propostasRoutes = require('./routes/propostas');
const crmRoutes = require('./routes/crm');
const prontuariosRoutes = require('./routes/prontuarios');
const financeiroRoutes = require('./routes/financeiro');
const tenantsRoutes = require('./routes/tenants');
const tenantsAdminRoutes = require('./routes/tenants-admin');
const adminAuthRoutes = require('./routes/admin-auth');
const adminLicencasRoutes = require('./routes/admin-licencas');
const billingRoutes = require('./routes/billing');
const pacientesRoutes = require('./routes/pacientes'); // TDD Cadastro de Paciente
const templatesRoutes = require('./routes/templates'); // 🆕 TEMPLATES
const prontuarioRoutes = require('./routes/prontuario-medico');
const prontuarioImagemRoutes = require('./routes/prontuario-imagem-simple');
const configuracoesRoutes = require('./routes/configuracoes-simple');
const atendimentosRoutes = require('./routes/atendimentos');
const manyChatRoutes = require('./routes/manychat');
const onboardingRoutes = require('./routes/onboarding'); // 🆕 ONBOARDING

// Rotas admin master (TDD 22)
const adminMasterTenantsRoutes   = require('./admin/routes/admin-tenants');
const adminMasterFaturamentoRoutes = require('./admin/routes/faturamento');
const adminMasterLogsRoutes      = require('./admin/routes/logs');
const adminMasterAuthRoutes      = require('./admin/routes/auth-admin');
const stripeWebhookRoute         = require('./admin/routes/stripe-webhook');
const { requireAdminAuth: requireAdminMasterAuth } = require('./admin/middleware/adminAuth');

// Importar middlewares
const { extractTenant } = require('./middleware/tenant');

// Importar utilitários
const cronManager = require('./cron/inactivityChecker');
require('./cron/cleanup-tokens'); // Limpeza semanal de refresh_tokens e tokens_senha expirados
require('./cron/alertas-registro-profissional'); // Alertas diários de registro profissional vencendo
require('./jobs/crmScoreRecalculo'); // Recálculo diário de score IA do CRM às 6h
require('./jobs/crmSugestoes');          // Sugestões IA de oportunidades às 7h
require('./jobs/crmFollowupProcessor'); // Follow-up WhatsApp a cada 15min
require('./jobs/whatsappSla').register(); // SLA WhatsApp a cada 5min
require('./jobs/botSessoes').register();   // Sessões inativas do bot a cada 15min
require('./jobs/cobrancasWhatsApp').register(); // Cobranças e lembretes financeiros a cada hora
require('./jobs/faturasVencidas').register();   // Marcar faturas vencidas às 00:05 diário
require('./jobs/qrExpirar').register();         // Expirar QR codes vencidos (1min) + fallback polling (10min)
require('./jobs/iaScores').register();          // Scores de risco financeiro IA às 06:00 diário
require('./jobs/iaInsights').register();        // Insights financeiros IA dia 1 do mês às 07:00
require('./jobs/receitaInsights').register();   // Insights receita IA dia 1 do mês às 07:00
require('./jobs/dashboard-cache').register();   // Pré-cálculo KPIs dashboard IA a cada hora
require('./jobs/briefing-diario').register();   // Briefing IA diário às 07:00
require('./jobs/alertas-engine').register();    // Detectores de alertas proativos a cada 5min
try { require('./admin/jobs/monitoramento.job').register(); } catch(e) { console.warn('[monitoramento.job] não iniciado:', e.message); }
const { startAllJobs } = require('./jobs/index');
const ProductionInitializer = require('./utils/productionInitializer');
const TenantWhatsAppService = require('./services/TenantWhatsAppService');

class SaeeApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.tenantWhatsApp = new TenantWhatsAppService();
    
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  /**
   * Configura middlewares da aplicação
   */
  setupMiddlewares() {
    // Segurança
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: process.env.NODE_ENV === 'production' 
            ? ["'self'", "https:"] 
            : ["'self'", "http://localhost:3000", "http://localhost:3001", "https:"],
        },
      },
    }));

    // CORS
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          process.env.NEXT_PUBLIC_APP_URL,
          'http://localhost:8080',
          'http://localhost:3001',
        ].filter(Boolean)
      : ['http://localhost:8080', 'http://localhost:3001'];

    this.app.use(cors({
      origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('CORS blocked origin:', origin);
          callback(null, false);
        }
      },
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: {
        success: false,
        message: 'Muitas tentativas. Tente novamente em 15 minutos.'
      }
    });
    this.app.use('/api/', limiter);

    // Rate limiting mais restritivo para auth
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5, // máximo 5 tentativas de login por IP
      message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
      }
    });
    this.app.use('/api/auth/login', authLimiter);

    // Parse JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Servir uploads (imagens de prontuário)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Logs de requisições em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      this.app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
      });
    }
  }

  /**
   * Configura rotas da aplicação
   */
  setupRoutes() {
    console.log('🔧 Configurando rotas da aplicação...');
    
    // Health check (múltiplas rotas para compatibilidade)
    const healthCheckHandler = async (req, res) => {
      try {
        const whatsappStatus = await this.tenantWhatsApp.isWhatsAppAvailable();
        const developmentInfo = this.tenantWhatsApp.getDevelopmentInfo();
        
        res.json({
          success: true,
          status: 'ok',
          message: 'SAEE API está funcionando',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '2.0.0',
          environment: process.env.NODE_ENV || 'development',
          whatsapp: whatsappStatus ? 'available_via_admin' : 'not_configured',
          development: developmentInfo
        });
      } catch (error) {
        res.json({
          success: true,
          status: 'ok',
          message: 'SAEE API está funcionando',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '2.0.0',
          environment: process.env.NODE_ENV || 'development',
          whatsapp: 'admin_connection_error',
          development: this.tenantWhatsApp.getDevelopmentInfo()
        });
      }
    };
    
    // Registrar health check em múltiplas rotas
    this.app.get('/health', healthCheckHandler);
    this.app.get('/api/health', healthCheckHandler);

    // Status WhatsApp via Admin
    this.app.get('/whatsapp/status', async (req, res) => {
      try {
        const status = await this.tenantWhatsApp.checkConnection();
        const usage = await this.tenantWhatsApp.getUsageStats();
        
        res.json({
          success: true,
          connection: status,
          usage: usage
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Rotas da API
    // Rotas multi-tenant (devem vir ANTES das outras)
    this.app.use('/api/tenants', tenantsRoutes);
    this.app.use('/api/tenants/admin', tenantsAdminRoutes);
    this.app.use('/api/billing', billingRoutes);
    
    // Rotas admin (sem tenant)
    console.log('🔧 Configurando rotas admin...');
    this.app.use('/api/admin/auth', adminAuthRoutes);
    this.app.use('/api/admin/licencas', adminLicencasRoutes);

    // Rotas admin master (TDD 22)
    this.app.use('/admin/api/auth',        adminMasterAuthRoutes);
    this.app.use('/admin/api/tenants',     requireAdminMasterAuth, adminMasterTenantsRoutes);
    this.app.use('/admin/api/faturamento', requireAdminMasterAuth, adminMasterFaturamentoRoutes);
    this.app.use('/admin/api/logs',        requireAdminMasterAuth, adminMasterLogsRoutes);
    this.app.use('/admin/api/webhook',     stripeWebhookRoute); // Stripe webhook sem JWT
    
    // Rotas que precisam de tenant (exceto login que já tem o middleware interno)
    // this.app.use('/api/auth/login', extractTenant); // Removido - middleware aplicado internamente
    // this.app.use('/api/auth/me', extractTenant); // Removido - usa tenantId do JWT
    this.app.use('/api/auth/send-first-access-email', extractTenant);
    // /api/auth/recovery não precisa de tenant - ela encontra o tenant pelo email
    
    this.app.use('/api/pacientes', extractTenant, pacientesRoutes);
    // Histórico de Atendimentos (TDD 9) — montado no mesmo prefixo, rotas /:id/historico
    this.app.use('/api/pacientes', require('./routes/historico'));
    this.app.use('/api/prontuario', extractTenant);
    this.app.use('/api/prontuario/imagem', extractTenant);
    this.app.use('/api/prontuario-completo', extractTenant);
    this.app.use('/api/ai', extractTenant);
    this.app.use('/api/automacao', extractTenant);
    this.app.use('/api/agendamentos', extractTenant);
    this.app.use('/api/agenda/agendamentos', extractTenant);
    this.app.use('/api/propostas', extractTenant);
    this.app.use('/api/prontuarios', extractTenant);
    this.app.use('/api/configuracoes', extractTenant);
    this.app.use('/api/atendimentos', extractTenant);
    this.app.use('/api/manychat', extractTenant);
    this.app.use('/api/onboarding', extractTenant, onboardingRoutes); // 🆕 ONBOARDING
    this.app.use('/api/templates', extractTenant, templatesRoutes); // 🆕 TEMPLATES
    
    // Rotas de auth (SOMENTE as que não precisam de tenant)
    console.log('🔧 Configurando rota /api/auth...');
    this.app.use('/api/auth', authRoutes);

    // Gestão de usuários da clínica
    this.app.use('/api/usuarios', require('./routes/usuarios'));

    // Profissionais (TDD Cadastro de Profissionais)
    this.app.use('/api/profissionais', require('./routes/profissionais'));

    // Check-in de Pacientes (TDD Check-in)
    this.app.use('/api/checkins', require('./routes/checkins'));

    // Fila de Espera (TDD Fila de Espera)
    this.app.use('/api/fila', require('./routes/fila-espera'));

    // Confirmação de Agendamentos (TDD Confirmação)
    this.app.use('/api/confirmacoes', require('./routes/confirmacoes'));

    // CRM Pipeline (TDD 10)
    this.app.use('/api/crm', require('./routes/crm-pipeline'));

    // WhatsApp Central de Atendimento (TDD 13) — antes das rotas Firestore legadas
    this.app.use('/api/whatsapp', require('./routes/whatsapp-central'));
    // WhatsApp Bot de Agendamento (TDD 14) — config/FAQ/sessões admin
    this.app.use('/api/whatsapp/bot', require('./routes/whatsapp-bot'));

    // Relatório de No-Show (TDD 19) — view analítica, export CSV/PDF, insights Claude
    this.app.use('/api/relatorios/no-show', require('./routes/relatorios-no-show'));

    // Relatório de Receita (TDD 20) — views analíticas, export CSV/PDF, insights Claude mensal
    this.app.use('/api/relatorios/receita', require('./routes/relatorios-receita'));

    // Dashboard IA com alertas proativos e briefing (TDD 21)
    this.app.use('/api/dashboard-ia', require('./routes/dashboard-ia'));

    // IA Financeira (TDD 18) — score de risco, insights Claude, projeção de caixa, alertas
    this.app.use('/api/financeiro', require('./routes/ia-financeiro'));

    // Financeiro Cobranças e Pagamentos (TDD 16) — faturas, pagamentos, caixa, repasses, preços
    this.app.use('/api/financeiro', require('./routes/financeiro-faturas'));

    // QR Billing Pix (TDD 17) — gerar/consultar QR codes, webhook pix, config pix
    this.app.use('/api/financeiro', require('./routes/qr-billing'));

    // WhatsApp Cobranças e Lembretes Financeiros (TDD 15)
    this.app.use('/api/financeiro', require('./routes/financeiro-cobrancas'));
    
    // ✅ AGENDA LITE (PADRÃO) - Usar em ambos os endpoints com Firestore
    this.app.use('/api/agendamentos', extractTenant, agendaAgendamentosRoutes);
    this.app.use('/api/agenda/agendamentos', extractTenant, agendaAgendamentosRoutes);

    this.app.use('/api/prontuario', prontuarioRoutes); // prontuário médico schema-driven
    this.app.use('/api/prontuarios', prontuariosRoutes);
    // Prontuário Eletrônico TDD (novo — PostgreSQL multi-tenant)
    this.app.use('/api/prontuarios-v2', require('./routes/prontuarios-eletronico'));
    this.app.use('/api/configuracoes', configuracoesRoutes);
    this.app.use('/api/atendimentos', atendimentosRoutes);
    this.app.use('/api/manychat', manyChatRoutes);

    // Webhook do ManyChat (substituindo Twilio/WhatsApp)
    this.app.post('/webhook/manychat', (req, res) => {
      try {
        console.log('📥 Webhook ManyChat recebido:', req.body);
        
        // Processar webhook do ManyChat será feito pelas rotas /api/manychat/webhook
        
        res.status(200).json({ status: 'received' });
      } catch (error) {
        console.error('❌ Erro no webhook ManyChat:', error.message);
        res.status(500).send('Error');
      }
    });

    // Rota para testar IA
    this.app.post('/api/ai/test', async (req, res) => {
      try {
        const { message, type = 'chat' } = req.body;
        const aiService = require('./utils/ai');
        
        let result;
        switch (type) {
          case 'chat':
            result = await aiService.chat(message);
            break;
          case 'anamnese':
            result = await aiService.gerarSugestoesAnamnese(
              { nome: 'Paciente Teste' }, 
              message
            );
            break;
          default:
            result = await aiService.chat(message);
        }
        
        res.json({
          success: true,
          data: result,
          ai_status: aiService.getStatus()
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erro no teste de IA',
          error: error.message
        });
      }
    });

    // Rota para status do sistema
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        data: {
          api: 'online',
          database: 'connected',
          cron_jobs: cronManager.getStatus(),
          manychat: 'configured',
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version
        }
      });
    });

    // 404 para rotas da API não encontradas
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({ success: false, message: 'Rota não encontrada' });
    });
  }

  /**
   * Configura tratamento de erros
   */
  setupErrorHandling() {
    // Handler de erros do multer
    this.app.use((error, req, res, next) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Máximo 10MB.'
          });
        }
      }
      next(error);
    });

    // Handler geral de erros
    this.app.use((error, req, res, next) => {
      console.error('💥 Erro não tratado:', error);

      // Não vazar detalhes em produção
      const message = process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor'
        : error.message;

      res.status(500).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      });
    });

    // Handler para promises rejeitadas
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Promise Rejection:', reason);
      // Em produção, você pode querer reiniciar o processo
    });

    // Handler para exceções não capturadas
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });
  }

  /**
   * Configura graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Recebido sinal ${signal}. Iniciando shutdown gracioso...`);
      
      // Parar de aceitar novas conexões
      this.server.close(async () => {
        console.log('🔒 Servidor HTTP fechado');
        
        try {
          // Parar cron jobs
          cronManager.stop();
          
          // Bots removidos - usando apenas ManyChat
          
          // Fechar conexão com banco
          const dbManager = require('./models/database');
          dbManager.close();
          
          console.log('✅ Shutdown completo');
          process.exit(0);
          
        } catch (error) {
          console.error('❌ Erro durante shutdown:', error);
          process.exit(1);
        }
      });

      // Forçar shutdown após 30 segundos
      setTimeout(() => {
        console.error('⏰ Timeout de shutdown. Forçando encerramento...');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Inicia o servidor
   */
  async start() {
    try {
      console.log('🚀 Iniciando SAEE - Sistema de Agendamento Automatizado...');
      
      // Verificar se as migrations foram executadas
      try {
        const dbManager = require('./models/database');
        const db = dbManager.getDb();

        // Testar conexão (MasterDb é async)
        await db.query('SELECT 1');
        console.log('✅ Banco de dados conectado');

      } catch (error) {
        console.error('❌ Erro no banco de dados:', error.message);
        console.log('💡 Verifique a variável DATABASE_URL e a conexão com o PostgreSQL');
        process.exit(1);
      }

      // Inicializar primeiro acesso em produção (se necessário)
      await ProductionInitializer.checkAndInitialize();

      // Iniciar cron jobs
      if (process.env.NODE_ENV !== 'test') {
        cronManager.start();
        startAllJobs(); // CRM jobs: confirmação, retorno, aniversário, NPS
      }

      // Iniciar servidor HTTP
      this.server = this.app.listen(this.port, () => {
        console.log(`\n🌟 SAEE API rodando em http://localhost:${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📈 Status: http://localhost:${this.port}/api/status`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`⏰ Timezone: ${process.env.TZ || 'UTC'}\n`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Modo desenvolvimento ativo');
          console.log('📱 ManyChat configurado para comunicação...\n');
        }
      });

      // Configurar timeout do servidor
      this.server.timeout = 30000; // 30 segundos

    } catch (error) {
      console.error('💥 Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }
}

// Inicializar aplicação se executado diretamente
if (require.main === module) {
  const app = new SaeeApp();
  app.start();
}

module.exports = SaeeApp;
