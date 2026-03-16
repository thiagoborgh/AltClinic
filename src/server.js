require('dotenv').config();
const Sentry = require('@sentry/node');
const http = require('http');
const logger = require('./utils/logger');
// app.js exporta a classe SaeeApp — instanciar com new e usar .app (Express)
const SaeeApp = require('./app');
const createApp = () => {
  const instance = new SaeeApp();
  return instance.app; // retorna o Express app
};
// cronManager legado (usa SQLite — carregamento protegido)
let cronManager = { start: () => {}, stop: () => {} };
try { cronManager = require('./cron/inactivityChecker'); } catch (e) {
  logger.warn('cronManager (legado/SQLite) não disponível — ignorando', { message: e.message });
}
const ProductionInitializer = require('./utils/productionInitializer');
// trialNurturing — lazy load (arquivo pode não existir em todas as branches)
let startNurturingJob = () => {};
try { ({ startNurturingJob } = require('./jobs/trialNurturing')); } catch (e) { /* não instalado */ }
const { testFirestore } = require('./utils/firestoreHealth');
const { startAllJobs } = require('./jobs');
// Workers BullMQ — inicializados apenas se REDIS_URL estiver configurada
require('./queues/workers/whatsapp');

// Sentry — monitoramento de erros em produção
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
  logger.info('Sentry inicializado');
}

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    logger.info('Iniciando AltClinic - Sistema de Agendamento...');

    // Verify DB connection (PostgreSQL)
    const pool = require('./database/postgres');
    await pool.query('SELECT 1');
    logger.info('Banco de dados PostgreSQL conectado');

    // First-time production setup
    await ProductionInitializer.checkAndInitialize();

    // Test Firestore connectivity (sets global availability flag)
    await testFirestore();

    // Start scheduled jobs
    if (process.env.NODE_ENV !== 'test') {
      // Cron legado (usa modelo SQLite — protegido para não crashar em produção)
      try {
        cronManager.start();
      } catch (err) {
        logger.warn('cronManager (legado) falhou ao iniciar — ignorando', { message: err.message });
      }
      startNurturingJob();
      // Jobs CRM multi-tenant (confirmação D-2/D-1, retorno, aniversário, NPS)
      startAllJobs();
    }

    // Boot HTTP server com maxHeaderSize aumentado (padrão Node é 8KB — insuficiente
    // quando o browser acumula muitos cookies/tokens de autenticação)
    const app = createApp();
    const server = http.createServer({ maxHeaderSize: 32768 }, app);

    server.listen(PORT, () => {
      console.log(`\n🌟 AltClinic API rodando em http://localhost:${PORT}`);
      logger.info('Health check disponivel', { url: `http://localhost:${PORT}/health` });
      logger.info('Status disponivel',       { url: `http://localhost:${PORT}/api/status` });
      logger.info('Ambiente: ' + (process.env.NODE_ENV || 'development'));
    });

    server.timeout = 30000;

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Recebido sinal ${signal}. Iniciando shutdown gracioso...`);
      server.close(async () => {
        try {
          cronManager.stop();
          logger.info('Shutdown completo');
          process.exit(0);
        } catch (err) {
          logger.error('Erro durante shutdown', { message: err.message });
          process.exit(1);
        }
      });
      setTimeout(() => { logger.error('Timeout de shutdown. Forcando encerramento...'); process.exit(1); }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Erro ao iniciar servidor', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

start();
