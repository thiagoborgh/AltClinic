/**
 * CRM C1 — Job: Confirmação de Consulta D-2 e D-1
 * Issue #17
 *
 * Roda todo dia às 09:00 (America/Sao_Paulo).
 * D-2: envia confirmação e aguarda SIM/NÃO.
 * D-1: envia lembrete final para quem ainda não confirmou.
 */
const cron = require('node-cron');
const { UnifiedWhatsAppService } = require('../services/UnifiedWhatsAppService');

async function run(multiTenantDb) {
  const masterDb = multiTenantDb.getMasterDb();
  console.log('[CRM Confirmação] Iniciando job...');

  let tenants = [];
  try {
    tenants = await masterDb.all(
      "SELECT id, slug, nome FROM tenants WHERE status IN ('active', 'trial')",
      []
    );
  } catch (err) {
    console.error('[CRM Confirmação] Erro ao buscar tenants:', err.message);
    return;
  }

  let totalEnviados = 0;

  for (const tenant of tenants) {
    try {
      const tenantDb = multiTenantDb.getTenantDb(tenant.id, tenant.slug);

      // Migrations inline
      await tenantDb.run(
        `ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS confirmacao_status TEXT DEFAULT 'pendente'`,
        []
      );
      await tenantDb.run(`
        CREATE TABLE IF NOT EXISTS crm_mensagens (
          id BIGSERIAL PRIMARY KEY,
          tenant_id TEXT, paciente_id BIGINT, agendamento_id BIGINT,
          tipo TEXT, telefone TEXT, mensagem TEXT,
          status TEXT DEFAULT 'enviado', enviado_at TIMESTAMP DEFAULT NOW()
        )
      `, []);

      const whatsapp = new UnifiedWhatsAppService(tenant.id, tenant.slug);

      // ── D-2: primeira confirmação ──────────────────────────────────────────
      const d2 = await tenantDb.all(`
        SELECT a.id, a.data_agendamento, a.horario,
               p.nome AS paciente_nome, p.telefone,
               u.nome AS medico_nome
        FROM agendamentos a
        JOIN pacientes p ON p.id = a.paciente_id
        LEFT JOIN usuarios u ON u.id = a.medico_id
        WHERE DATE(a.data_agendamento) = CURRENT_DATE + INTERVAL '2 days'
          AND a.status = 'agendado'
          AND (a.confirmacao_status IS NULL OR a.confirmacao_status = 'pendente')
          AND p.telefone IS NOT NULL AND p.telefone != ''
      `, []);

      for (const ag of d2) {
        try {
          const data = new Date(ag.data_agendamento).toLocaleDateString('pt-BR');
          const medico = ag.medico_nome ? `Dr(a). ${ag.medico_nome}` : 'nosso profissional';
          const mensagem =
            `Olá ${ag.paciente_nome}! 👋\n` +
            `Sua consulta com ${medico} está marcada para *${data}* às *${ag.horario || ''}*.\n\n` +
            `Confirme sua presença respondendo:\n✅ *SIM* — Estarei lá!\n❌ *NÃO* — Preciso cancelar\n\n` +
            `📍 ${tenant.nome}`;

          await whatsapp.sendMessage(ag.telefone, mensagem);
          await tenantDb.run(
            `UPDATE agendamentos SET confirmacao_status='aguardando_confirmacao' WHERE id=$1`,
            [ag.id]
          );
          await tenantDb.run(`
            INSERT INTO crm_mensagens (tenant_id, paciente_id, agendamento_id, tipo, telefone, mensagem)
            VALUES ($1, $2, $3, 'confirmacao_d2', $4, $5)
          `, [tenant.id, ag.paciente_id, ag.id, ag.telefone, mensagem]);

          console.log(`[CRM Confirmação] D-2 ✅ ${ag.paciente_nome} — tenant ${tenant.slug}`);
          totalEnviados++;
        } catch (err) {
          console.error(`[CRM Confirmação] D-2 erro ${ag.paciente_nome}:`, err.message);
        }
      }

      // ── D-1: lembrete final ────────────────────────────────────────────────
      const d1 = await tenantDb.all(`
        SELECT a.id, a.data_agendamento, a.horario,
               p.nome AS paciente_nome, p.telefone,
               u.nome AS medico_nome
        FROM agendamentos a
        JOIN pacientes p ON p.id = a.paciente_id
        LEFT JOIN usuarios u ON u.id = a.medico_id
        WHERE DATE(a.data_agendamento) = CURRENT_DATE + INTERVAL '1 day'
          AND a.status = 'agendado'
          AND a.confirmacao_status = 'aguardando_confirmacao'
          AND p.telefone IS NOT NULL AND p.telefone != ''
      `, []);

      for (const ag of d1) {
        try {
          const medico = ag.medico_nome ? `Dr(a). ${ag.medico_nome}` : 'nosso profissional';
          const mensagem =
            `⏰ Lembrete! Sua consulta é *AMANHÃ*!\n\n` +
            `👨‍⚕️ ${medico}\n` +
            `🕐 ${ag.horario || ''}\n` +
            `🏥 ${tenant.nome}\n\n` +
            `Estamos esperando você! 😊`;

          await whatsapp.sendMessage(ag.telefone, mensagem);
          await tenantDb.run(`
            INSERT INTO crm_mensagens (tenant_id, paciente_id, agendamento_id, tipo, telefone, mensagem)
            VALUES ($1, $2, $3, 'confirmacao_d1', $4, $5)
          `, [tenant.id, ag.paciente_id, ag.id, ag.telefone, mensagem]);

          console.log(`[CRM Confirmação] D-1 ✅ ${ag.paciente_nome} — tenant ${tenant.slug}`);
          totalEnviados++;
        } catch (err) {
          console.error(`[CRM Confirmação] D-1 erro ${ag.paciente_nome}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[CRM Confirmação] Erro no tenant ${tenant.slug}:`, err.message);
    }
  }

  console.log(`[CRM Confirmação] Job concluído — ${totalEnviados} mensagens enviadas.`);
}

function start(multiTenantDb) {
  cron.schedule('0 9 * * *', () => run(multiTenantDb), {
    timezone: 'America/Sao_Paulo',
  });
  console.log('[CRM] Job confirmação agendado: 09:00 diário');
}

module.exports = { run, start };
