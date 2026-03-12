/**
 * CRM C1 — Job: Lembrete de Retorno Automático
 * Issue #18
 *
 * Roda todo dia às 09:30 (America/Sao_Paulo).
 * Avisa pacientes cujo retorno vence em 3 dias.
 */
const cron = require('node-cron');
const { UnifiedWhatsAppService } = require('../services/UnifiedWhatsAppService');

async function run(multiTenantDb) {
  const masterDb = multiTenantDb.getMasterDb();
  console.log('[CRM Retorno] Iniciando job...');

  let tenants = [];
  try {
    tenants = await masterDb.all(
      "SELECT id, slug, nome FROM tenants WHERE status IN ('active', 'trial')",
      []
    );
  } catch (err) {
    console.error('[CRM Retorno] Erro ao buscar tenants:', err.message);
    return;
  }

  let totalEnviados = 0;

  for (const tenant of tenants) {
    try {
      const tenantDb = multiTenantDb.getTenantDb(tenant.id, tenant.slug);

      // Migrations inline
      await tenantDb.run(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS retorno_em_dias INT`, []);
      await tenantDb.run(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS retorno_lembrete_enviado BOOLEAN DEFAULT FALSE`, []);

      // Agendamentos realizados cujo retorno vence em 3 dias
      const agendamentos = await tenantDb.all(`
        SELECT a.id, a.data_agendamento, a.retorno_em_dias,
               p.nome AS paciente_nome, p.telefone,
               u.nome AS medico_nome
        FROM agendamentos a
        JOIN pacientes p ON p.id = a.paciente_id
        LEFT JOIN usuarios u ON u.id = a.medico_id
        WHERE a.status = 'realizado'
          AND a.retorno_em_dias IS NOT NULL
          AND (a.retorno_lembrete_enviado IS NULL OR a.retorno_lembrete_enviado = FALSE)
          AND DATE(a.data_agendamento) + (a.retorno_em_dias || ' days')::INTERVAL
              = CURRENT_DATE + INTERVAL '3 days'
          AND p.telefone IS NOT NULL AND p.telefone != ''
      `, []);

      if (!agendamentos.length) continue;

      const whatsapp = new UnifiedWhatsAppService(tenant.id, tenant.slug);

      for (const ag of agendamentos) {
        try {
          const dataRetorno = new Date(
            new Date(ag.data_agendamento).getTime() + ag.retorno_em_dias * 86400000
          ).toLocaleDateString('pt-BR');

          const medico = ag.medico_nome ? `Dr(a). ${ag.medico_nome}` : 'nosso profissional';
          const mensagem =
            `Olá ${ag.paciente_nome}! 😊\n\n` +
            `${medico} recomendou seu retorno até *${dataRetorno}*.\n\n` +
            `Que tal agendar? Estamos disponíveis!\n` +
            `📞 Responda essa mensagem ou entre em contato com a ${tenant.nome}.`;

          await whatsapp.sendMessage(ag.telefone, mensagem);
          await tenantDb.run(
            `UPDATE agendamentos SET retorno_lembrete_enviado=TRUE WHERE id=$1`,
            [ag.id]
          );
          await tenantDb.run(`
            INSERT INTO crm_mensagens (tenant_id, paciente_id, agendamento_id, tipo, telefone, mensagem)
            VALUES ($1, $2, $3, 'retorno', $4, $5)
          `, [tenant.id, ag.paciente_id, ag.id, ag.telefone, mensagem]).catch(() => {});

          console.log(`[CRM Retorno] ✅ ${ag.paciente_nome} — retorno em ${dataRetorno} — tenant ${tenant.slug}`);
          totalEnviados++;
        } catch (err) {
          console.error(`[CRM Retorno] Erro ao enviar para ${ag.paciente_nome}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[CRM Retorno] Erro no tenant ${tenant.slug}:`, err.message);
    }
  }

  console.log(`[CRM Retorno] Job concluído — ${totalEnviados} lembretes enviados.`);
}

function start(multiTenantDb) {
  cron.schedule('30 9 * * *', () => run(multiTenantDb), {
    timezone: 'America/Sao_Paulo',
  });
  console.log('[CRM] Job retorno agendado: 09:30 diário');
}

module.exports = { run, start };
