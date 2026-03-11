/**
 * CRM C1 — Job: NPS Pós-Consulta
 * Issue #20
 *
 * Roda todo dia às 10:00 (America/Sao_Paulo).
 * Busca consultas realizadas ontem e envia pesquisa de satisfação.
 */
const cron = require('node-cron');
const { UnifiedWhatsAppService } = require('../services/UnifiedWhatsAppService');

async function run(multiTenantDb) {
  const masterDb = multiTenantDb.getMasterDb();
  console.log('[CRM NPS] Iniciando job...');

  let tenants = [];
  try {
    tenants = await masterDb.all(
      "SELECT id, slug, nome FROM tenants WHERE status IN ('active', 'trial')",
      []
    );
  } catch (err) {
    console.error('[CRM NPS] Erro ao buscar tenants:', err.message);
    return;
  }

  let totalEnviados = 0;

  for (const tenant of tenants) {
    try {
      const tenantDb = multiTenantDb.getTenantDb(tenant.id, tenant.slug);

      // Migrations inline
      await tenantDb.run(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS nps_enviado BOOLEAN DEFAULT FALSE`, []);
      await tenantDb.run(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS nps_score TEXT`, []);
      await tenantDb.run(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS nps_comentario TEXT`, []);
      await tenantDb.run(`
        CREATE TABLE IF NOT EXISTS crm_mensagens (
          id BIGSERIAL PRIMARY KEY,
          tenant_id TEXT, paciente_id BIGINT, agendamento_id BIGINT,
          tipo TEXT, telefone TEXT, mensagem TEXT,
          status TEXT DEFAULT 'enviado', enviado_at TIMESTAMP DEFAULT NOW()
        )
      `, []);

      const agendamentos = await tenantDb.all(`
        SELECT a.id, a.paciente_id, a.data_agendamento,
               p.nome AS paciente_nome, p.telefone,
               u.nome AS medico_nome
        FROM agendamentos a
        JOIN pacientes p ON p.id = a.paciente_id
        LEFT JOIN usuarios u ON u.id = a.medico_id
        WHERE a.status = 'realizado'
          AND DATE(a.data_agendamento) = CURRENT_DATE - INTERVAL '1 day'
          AND (a.nps_enviado IS NULL OR a.nps_enviado = FALSE)
          AND p.telefone IS NOT NULL AND p.telefone != ''
      `, []);

      if (!agendamentos.length) continue;

      const whatsapp = new UnifiedWhatsAppService(tenant.id, tenant.slug);

      for (const ag of agendamentos) {
        try {
          const medico = ag.medico_nome ? `Dr(a). ${ag.medico_nome}` : 'nosso médico';
          const mensagem =
            `Olá ${ag.paciente_nome}! 😊 Como foi sua consulta com ${medico} ontem?\n\n` +
            `Sua opinião é muito importante para a ${tenant.nome}!\n\n` +
            `👍 Excelente\n👎 Precisa melhorar\n\n` +
            `Responda com 👍 ou 👎`;

          await whatsapp.sendMessage(ag.telefone, mensagem);

          await tenantDb.run(
            `UPDATE agendamentos SET nps_enviado = TRUE WHERE id = $1`,
            [ag.id]
          );

          await tenantDb.run(`
            INSERT INTO crm_mensagens (tenant_id, paciente_id, agendamento_id, tipo, telefone, mensagem)
            VALUES ($1, $2, $3, 'nps', $4, $5)
          `, [tenant.id, ag.paciente_id, ag.id, ag.telefone, mensagem]);

          console.log(`[CRM NPS] ✅ ${ag.paciente_nome} (${ag.telefone}) — tenant ${tenant.slug}`);
          totalEnviados++;
        } catch (err) {
          console.error(`[CRM NPS] Erro ao enviar para ${ag.paciente_nome}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[CRM NPS] Erro no tenant ${tenant.slug}:`, err.message);
    }
  }

  console.log(`[CRM NPS] Job concluído — ${totalEnviados} pesquisas enviadas.`);
}

function start(multiTenantDb) {
  cron.schedule('0 10 * * *', () => run(multiTenantDb), {
    timezone: 'America/Sao_Paulo',
  });
  console.log('[CRM] Job NPS agendado: 10:00 diário');
}

module.exports = { run, start };
