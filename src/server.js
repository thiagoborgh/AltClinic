require('dotenv').config();
const http = require('http');
const logger = require('./utils/logger');
// app.js exporta a classe SaeeApp — instanciar com new e usar .app (Express)
const SaeeApp = require('./app');
const createApp = () => {
  const instance = new SaeeApp();
  return instance.app; // retorna o Express app
};
const cronManager = require('./cron/inactivityChecker');
const ProductionInitializer = require('./utils/productionInitializer');
// trialNurturing — lazy load (arquivo pode não existir em todas as branches)
let startNurturingJob = () => {};
try { ({ startNurturingJob } = require('./jobs/trialNurturing')); } catch (e) { /* não instalado */ }
const { testFirestore } = require('./utils/firestoreHealth');

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
      cronManager.start();
      startNurturingJob();
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
          dbManager.close();
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
