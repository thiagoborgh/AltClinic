const { Queue } = require('bullmq');
const { getRedisConnection } = require('./connection');
const logger = require('../utils/logger');

const connection = getRedisConnection();

// ─── Definição das filas ──────────────────────────────────────────────────────

let whatsappQueue = null;
let appointmentQueue = null;

if (connection) {
  // Fila de envio de WhatsApp com rate limiting
  // Máximo 80 mensagens por hora (evita bloqueio do número)
  whatsappQueue = new Queue('whatsapp-messages', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });

  // Fila de confirmações de consulta (D-2 / D-1)
  appointmentQueue = new Queue('appointment-confirmations', {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 30000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 100 },
    },
  });

  logger.info('[Queues] Filas BullMQ inicializadas: whatsapp-messages, appointment-confirmations');
} else {
  logger.warn('[Queues] Redis indisponível — filas desativadas, usando cron direto');
}

// ─── Helpers para enfileirar mensagens ───────────────────────────────────────

/**
 * Enfileira uma mensagem WhatsApp com delay mínimo de 30s entre envios.
 * Se Redis não estiver disponível, retorna null (caller deve enviar direto).
 *
 * @param {object} payload - { tenantId, phone, message, type }
 * @param {number} delayMs  - atraso em ms antes de processar (default: 0)
 */
async function enqueueWhatsApp(payload, delayMs = 0) {
  if (!whatsappQueue) return null;
  const job = await whatsappQueue.add('send', payload, { delay: delayMs });
  logger.info('[Queues] Mensagem WhatsApp enfileirada', { jobId: job.id, phone: payload.phone });
  return job;
}

/**
 * Enfileira confirmação de consulta para ser processada em horário específico.
 *
 * @param {object} payload - { tenantId, agendamentoId, tipo: 'D2'|'D1' }
 * @param {Date}   runAt   - momento exato de execução
 */
async function enqueueConfirmation(payload, runAt) {
  if (!appointmentQueue) return null;
  const delayMs = Math.max(0, runAt.getTime() - Date.now());
  const job = await appointmentQueue.add('confirm', payload, { delay: delayMs });
  logger.info('[Queues] Confirmação enfileirada', { jobId: job.id, tipo: payload.tipo, delay: delayMs });
  return job;
}

module.exports = {
  whatsappQueue,
  appointmentQueue,
  enqueueWhatsApp,
  enqueueConfirmation,
};
