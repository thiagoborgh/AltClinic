/**
 * botSessoes — job cron para encerrar sessões inativas do bot WhatsApp
 * Executa a cada 15min e envia mensagem de expiração antes de encerrar
 */
const cron = require('node-cron');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');

async function verificarSessoesInativas() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE status IN ('active', 'trial')"
  ).catch(() => ({ rows: [] }));

  for (const tenant of tenants) {
    try {
      const schema = schemaFromSlug(tenant.slug);

      const { rows: configRows } = await pool.query(
        `SELECT * FROM "${schema}".whatsapp_bot_config WHERE tenant_id = $1`,
        [tenant.id]
      ).catch(() => ({ rows: [] }));

      const config = configRows[0];
      if (!config || !config.ativo) continue;

      const slaMinutos = config.sla_inatividade || 30;

      const { rows: sessoesInativas } = await pool.query(`
        SELECT * FROM "${schema}".whatsapp_bot_sessoes
        WHERE tenant_id = $1
          AND estado NOT IN ('transferido_humano', 'encerrado')
          AND ultima_interacao < NOW() - ($2 || ' minutes')::INTERVAL
      `, [tenant.id, slaMinutos]).catch(() => ({ rows: [] }));

      for (const sessao of sessoesInativas) {
        try {
          const UnifiedWhatsAppService = require('../services/UnifiedWhatsAppService');
          const ua = new UnifiedWhatsAppService(tenant.id, tenant.slug);
          await ua.sendMessage(sessao.numero,
            'Sua sessão expirou por inatividade. Para continuar, envie qualquer mensagem. 😊'
          );
        } catch { /* Ignorar erro de envio */ }

        await pool.query(
          `UPDATE "${schema}".whatsapp_bot_sessoes SET estado = 'encerrado' WHERE id = $1`,
          [sessao.id]
        ).catch(() => {});
      }
    } catch (err) {
      console.error(`[BotSessoes] Erro tenant ${tenant.slug}:`, err.message);
    }
  }
}

function register() {
  cron.schedule('*/15 * * * *', () => {
    verificarSessoesInativas().catch(err =>
      console.error('[BotSessoes] Erro no job:', err.message)
    );
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[Bot Sessoes] Job registrado — a cada 15min');
}

module.exports = { register, verificarSessoesInativas };
