require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth');
const agendamentosRoutes = require('./routes/agendamentos');
const propostasRoutes = require('./routes/propostas');
const crmRoutes = require('./routes/crm');
const prontuariosRoutes = require('./routes/prontuarios');
const financeiroRoutes = require('./routes/financeiro');
const tenantsRoutes = require('./routes/tenants');
const tenantsAdminRoutes = require('./routes/tenants-admin');
const billingRoutes = require('./routes/billing');
const pacientesRoutes = require('./routes/pacientes-simple');
const prontuarioRoutes = require('./routes/prontuario-simple');
const prontuarioImagemRoutes = require('./routes/prontuario-imagem-simple');
const configuracoesRoutes = require('./routes/configuracoes-simple');

// Importar middlewares
const { extractTenant } = require('./middleware/tenant');

// Importar utilitários
const cronManager = require('./cron/inactivityChecker');
const { botManager } = require('./utils/bot');
const ProductionInitializer = require('./utils/productionInitializer');

class SaeeApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
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
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: process.env.NODE_ENV === 'production' 
            ? ["'self'", "https:"] 
            : ["'self'", "http://localhost:3000", "http://localhost:3001", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? true // Aceitar qualquer origem em produção (necessário para OnRender)
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
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

    // Servir arquivos estáticos (imagens de prontuário)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Servir arquivos estáticos do frontend em produção
    if (process.env.NODE_ENV === 'production') {
      // Middleware para definir MIME types corretos
      this.app.use(express.static(path.join(__dirname, '../public'), {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
          }
        }
      }));
    }

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
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'SAEE API está funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Rotas da API
    // Rotas multi-tenant (devem vir ANTES das outras)
    this.app.use('/api/tenants', tenantsRoutes);
    this.app.use('/api/tenants/admin', tenantsAdminRoutes);
    this.app.use('/api/billing', billingRoutes);
    
    // Rotas que precisam de tenant (exceto login que já tem o middleware interno)
    // this.app.use('/api/auth/login', extractTenant); // Removido - middleware aplicado internamente
    this.app.use('/api/auth/me', extractTenant);
    this.app.use('/api/auth/send-first-access-email', extractTenant);
    // /api/auth/recovery não precisa de tenant - ela encontra o tenant pelo email
    
    this.app.use('/api/pacientes', extractTenant);
    this.app.use('/api/prontuario', extractTenant);
    this.app.use('/api/prontuario/imagem', extractTenant);
    this.app.use('/api/prontuario-completo', extractTenant);
    this.app.use('/api/ai', extractTenant);
    this.app.use('/api/automacao', extractTenant);
    this.app.use('/api/agendamentos', extractTenant);
    this.app.use('/api/propostas', extractTenant);
    this.app.use('/api/crm', extractTenant);
    this.app.use('/api/prontuarios', extractTenant);
    this.app.use('/api/financeiro', extractTenant);
    this.app.use('/api/configuracoes', extractTenant);
    
    // Rotas de auth (SOMENTE as que não precisam de tenant)
    console.log('🔧 Configurando rota /api/auth...');
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/prontuarios', prontuariosRoutes);
    this.app.use('/api/financeiro', financeiroRoutes);
    this.app.use('/api/configuracoes', configuracoesRoutes);

    // Webhook do Twilio para WhatsApp/SMS
    this.app.post('/webhook/twilio', (req, res) => {
      try {
        console.log('📥 Webhook Twilio recebido:', req.body);
        
        const messageData = botManager.processTwilioWebhook(req);
        
        // Processar mensagem de forma assíncrona
        botManager.handleWebhookMessage(messageData).catch(error => {
          console.error('❌ Erro ao processar webhook:', error.message);
        });
        
        // Responder ao Twilio rapidamente
        res.set('Content-Type', 'text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Message>Mensagem recebida! Em breve nossa equipe entrará em contato.</Message>
          </Response>
        `);
        
      } catch (error) {
        console.error('❌ Erro no webhook Twilio:', error.message);
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
          case 'bot':
            result = await aiService.gerarRespostaBot(message, {
              nomeClinica: 'Clínica Teste',
              nomeCliente: 'Cliente Teste'
            });
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
          bots: botManager.getStatus(),
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version
        }
      });
    });

    // Rota catch-all para SPA (se servindo frontend)
    if (process.env.NODE_ENV === 'production') {
      this.app.get('*', (req, res) => {
        // Evitar interferir com rotas da API
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({
            success: false,
            message: 'Rota da API não encontrada'
          });
        }
        res.sendFile(path.join(__dirname, '../public/index.html'));
      });
    }

    // 404 para rotas da API
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
      });
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
          
          // Parar bots
          await botManager.stop();
          
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
        
        // Testar conexão
        db.prepare('SELECT 1').get();
        console.log('✅ Banco de dados conectado');
        
      } catch (error) {
        console.error('❌ Erro no banco de dados:', error.message);
        console.log('💡 Execute as migrations primeiro: npm run migrate');
        process.exit(1);
      }

      // Inicializar primeiro acesso em produção (se necessário)
      await ProductionInitializer.checkAndInitialize();

      // Iniciar cron jobs
      if (process.env.NODE_ENV !== 'test') {
        cronManager.start();
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
          console.log('📱 Aguardando conexão dos bots...\n');
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
