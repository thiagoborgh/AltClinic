/**
 * CRM C1 — Job: Mensagem de Aniversário
 * Issue #19
 *
 * Roda todo dia às 09:00 (America/Sao_Paulo).
 * Busca pacientes com aniversário hoje e envia WhatsApp personalizado.
 */
const cron = require('node-cron');
const { UnifiedWhatsAppService } = require('../services/UnifiedWhatsAppService');

async function run(multiTenantDb) {
  const masterDb = multiTenantDb.getMasterDb();
  console.log('[CRM Aniversário] Iniciando job...');

  let tenants = [];
  try {
    tenants = await masterDb.all(
      "SELECT id, slug, nome FROM tenants WHERE status IN ('active', 'trial')",
      []
    );
  } catch (err) {
    console.error('[CRM Aniversário] Erro ao buscar tenants:', err.message);
    return;
  }

  let totalEnviados = 0;

  for (const tenant of tenants) {
    try {
      const tenantDb = multiTenantDb.getTenantDb(tenant.id, tenant.slug);

      // Garantir coluna crm_mensagens
      await tenantDb.run(`
        CREATE TABLE IF NOT EXISTS crm_mensagens (
          id BIGSERIAL PRIMARY KEY,
          tenant_id TEXT,
          paciente_id BIGINT,
          agendamento_id BIGINT,
          tipo TEXT,
          telefone TEXT,
          mensagem TEXT,
          status TEXT DEFAULT 'enviado',
          enviado_at TIMESTAMP DEFAULT NOW()
        )
      `, []);

      const pacientes = await tenantDb.all(`
        SELECT id, nome, telefone, data_nascimento
        FROM pacientes
        WHERE telefone IS NOT NULL
          AND telefone != ''
          AND status = 'ativo'
          AND data_nascimento IS NOT NULL
          AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY   FROM data_nascimento) = EXTRACT(DAY   FROM CURRENT_DATE)
      `, []);

      if (!pacientes.length) continue;

      const whatsapp = new UnifiedWhatsAppService(tenant.id, tenant.slug);

      for (const paciente of pacientes) {
        try {
          const mensagem =
            `🎂 Feliz Aniversário, ${paciente.nome}!\n` +
            `A equipe da ${tenant.nome} deseja um dia muito especial! 🥳\n\n` +
            `Que tal celebrar cuidando da sua saúde? Agende uma consulta! 😊`;

          await whatsapp.sendMessage(paciente.telefone, mensagem);

          await tenantDb.run(`
            INSERT INTO crm_mensagens (tenant_id, paciente_id, tipo, telefone, mensagem, status)
            VALUES ($1, $2, 'aniversario', $3, $4, 'enviado')
          `, [tenant.id, paciente.id, paciente.telefone, mensagem]);

          console.log(`[CRM Aniversário] ✅ ${paciente.nome} (${paciente.telefone}) — tenant ${tenant.slug}`);
          totalEnviados++;
        } catch (err) {
          console.error(`[CRM Aniversário] Erro ao enviar para ${paciente.nome}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[CRM Aniversário] Erro no tenant ${tenant.slug}:`, err.message);
    }
  }

  console.log(`[CRM Aniversário] Job concluído — ${totalEnviados} mensagens enviadas.`);
}

function start(multiTenantDb) {
  cron.schedule('0 9 * * *', () => run(multiTenantDb), {
    timezone: 'America/Sao_Paulo',
  });
  console.log('[CRM] Job aniversário agendado: 09:00 diário');
}

module.exports = { run, start };
