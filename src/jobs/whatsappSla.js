const cron = require('node-cron');
const pool = require('../database/postgres');

function getIo() {
  try { return require('../server').io; } catch { return null; }
}

async function verificarSla() {
  const { rows: tenants } = await pool.query(
    "SELECT id, slug FROM public.tenants WHERE ativo = true"
  );

  const io = getIo();

  for (const tenant of tenants) {
    const schema = `clinica_${tenant.slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    try {
      const { rows: configRows } = await pool.query(
        `SELECT sla_minutos FROM "${schema}".whatsapp_config WHERE tenant_id = $1 LIMIT 1`,
        [tenant.id]
      ).catch(() => ({ rows: [] }));
      const slaMinutos = configRows[0]?.sla_minutos || 30;

      const { rows: conversas } = await pool.query(`
        SELECT wc.id, wc.numero,
               EXTRACT(EPOCH FROM (NOW() - wc.ultima_mensagem_em)) / 60 AS minutos
        FROM "${schema}".whatsapp_conversas wc
        WHERE wc.tenant_id = $1
          AND wc.status = 'aberta'
          AND wc.sem_resposta_alerta = false
          AND wc.ultima_mensagem_em < NOW() - ($2 || ' minutes')::INTERVAL
          AND (
            SELECT direcao FROM "${schema}".whatsapp_mensagens
            WHERE conversa_id = wc.id ORDER BY id DESC LIMIT 1
          ) = 'entrada'
      `, [tenant.id, slaMinutos]);

      for (const c of conversas) {
        if (io) io.to(`tenant:${tenant.id}`).emit('alerta_sla', {
          conversa_id: c.id, minutos_sem_resposta: Math.floor(c.minutos),
        });
        await pool.query(
          `UPDATE "${schema}".whatsapp_conversas SET sem_resposta_alerta = true WHERE id = $1`,
          [c.id]
        );
      }
    } catch (err) {
      console.error(`[SLA WA] Erro tenant ${tenant.slug}:`, err.message);
    }
  }
}

function register() {
  cron.schedule('*/5 * * * *', () => verificarSla().catch(console.error), {
    timezone: 'America/Sao_Paulo',
  });
  console.log('[WhatsApp SLA] Job registrado — a cada 5min');
}

module.exports = { register };
