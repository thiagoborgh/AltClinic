const { Worker, RateLimiter } = require('bullmq');
const { getRedisConnection } = require('../connection');
const logger = require('../../utils/logger');

const connection = getRedisConnection();

let whatsappWorker = null;

if (connection) {
  whatsappWorker = new Worker(
    'whatsapp-messages',
    async (job) => {
      const { tenantId, phone, message, type = 'text' } = job.data;

      // Importação lazy para evitar dependência circular na inicialização
      const UnifiedWhatsAppService = require('../../services/UnifiedWhatsAppService');
      const multiTenantDb = require('../../database/MultiTenantPostgres');

      const tenant = await multiTenantDb.getTenantBySlugOrId(tenantId);
      if (!tenant) throw new Error(`Tenant não encontrado: ${tenantId}`);

      const service = new UnifiedWhatsAppService(tenant);
      await service.sendMessage(phone, message);

      logger.info('[Worker/WhatsApp] Mensagem enviada', { jobId: job.id, tenantId, phone });
    },
    {
      connection,
      concurrency: 1, // uma mensagem por vez por worker
      limiter: {
        max: 80,        // máximo 80 mensagens
        duration: 3600000, // por hora (ms)
      },
    }
  );

  whatsappWorker.on('completed', (job) => {
    logger.info('[Worker/WhatsApp] Job concluído', { jobId: job.id });
  });

  whatsappWorker.on('failed', (job, err) => {
    logger.error('[Worker/WhatsApp] Job falhou', { jobId: job?.id, error: err.message });
  });

  logger.info('[Worker/WhatsApp] Worker iniciado (rate limit: 80 msg/hora)');
}

module.exports = { whatsappWorker };
