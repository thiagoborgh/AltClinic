const { Redis } = require('ioredis');
const logger = require('../utils/logger');

let connection = null;

function getRedisConnection() {
  if (connection) return connection;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('[Redis] REDIS_URL não definida — filas BullMQ desativadas (jobs rodam via cron simples)');
    return null;
  }

  connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // exigido pelo BullMQ
    enableReadyCheck: false,
  });

  connection.on('connect', () => logger.info('[Redis] Conectado'));
  connection.on('error', (err) => logger.error('[Redis] Erro de conexão', { message: err.message }));

  return connection;
}

module.exports = { getRedisConnection };
