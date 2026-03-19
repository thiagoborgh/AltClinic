const cron = require('node-cron');
const pool = require('../database/postgres');
const { schemaFromSlug } = require('../services/CrmScoreService');

let UnifiedWhatsAppService;
try {
  UnifiedWhatsAppService = require('../services/UnifiedWhatsAppService');
} catch {
  UnifiedWhatsAppService = null;
}

// Executa a cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  let tenants;
  try {
    const { rows } = await pool.query('SELECT slug FROM public.tenants WHERE ativo = true');
    tenants = rows;
  } catch (err) {
    console.error('[CRM Followup] Falha ao buscar tenants:', err.message);
    return;
  }

  for (const { slug } of tenants) {
    try {
      await processarFilaTenant(slug);
    } catch (err) {
      console.error(`[CRM Followup] Erro no tenant ${slug}:`, err.message);
    }
  }
});

async function processarFilaTenant(tenantSlug) {
  const schema = schemaFromSlug(tenantSlug);

  // Buscar mensagens aprovadas com agendado_para <= agora e menos de 3 tentativas
  const { rows: mensagens } = await pool.query(`
    SELECT
      f.id, f.oportunidade_id, f.passo_id,
      f.mensagem_renderizada, f.tentativas,
      o.paciente_id,
      p.telefone AS paciente_telefone,
      sp.modo, sp.horario_inicio, sp.horario_fim
    FROM "${schema}".crm_followup_fila f
    JOIN "${schema}".crm_oportunidades     o  ON o.id  = f.oportunidade_id
    JOIN "${schema}".pacientes             p  ON p.id  = o.paciente_id
    JOIN "${schema}".crm_sequencias_passos sp ON sp.id = f.passo_id
    WHERE f.status = 'aprovado'
      AND f.agendado_para <= NOW()
      AND f.tentativas < 3
    ORDER BY f.agendado_para ASC
    LIMIT 50
  `);

  for (const msg of mensagens) {
    try {
      // Verificar opt-out
      const { rows: optout } = await pool.query(`
        SELECT id FROM "${schema}".crm_optouts WHERE paciente_id = $1
      `, [msg.paciente_id]);

      if (optout.length > 0) {
        await pool.query(`
          UPDATE "${schema}".crm_followup_fila
          SET status = 'cancelado', atualizado_em = NOW()
          WHERE id = $1
        `, [msg.id]);
        continue;
      }

      // Verificar horário comercial
      const horaAtual = new Date().getHours();
      if (horaAtual < msg.horario_inicio || horaAtual >= msg.horario_fim) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        amanha.setHours(msg.horario_inicio, 0, 0, 0);
        await pool.query(`
          UPDATE "${schema}".crm_followup_fila
          SET agendado_para = $1, atualizado_em = NOW()
          WHERE id = $2
        `, [amanha, msg.id]);
        continue;
      }

      // Enviar via UnifiedWhatsAppService
      let resultado = { success: false, message_id: null };
      if (UnifiedWhatsAppService) {
        const whatsApp = new UnifiedWhatsAppService();
        resultado = await whatsApp.sendMessage(tenantSlug, 'crm_followup', {
          to:   msg.paciente_telefone,
          body: msg.mensagem_renderizada,
        }, {
          eventType: 'crm_followup',
          eventId:   msg.oportunidade_id,
        }).catch(err => ({ success: false, error: err.message }));
      }

      if (resultado.success) {
        await pool.query(`
          UPDATE "${schema}".crm_followup_fila
          SET status = 'enviado', enviado_em = NOW(),
              whatsapp_message_id = $1, atualizado_em = NOW()
          WHERE id = $2
        `, [resultado.message_id || null, msg.id]);

        await pool.query(`
          INSERT INTO "${schema}".crm_atividades (oportunidade_id, tipo, descricao, metadata)
          VALUES ($1, 'mensagem_whatsapp', 'Mensagem de follow-up enviada automaticamente', $2)
        `, [msg.oportunidade_id, JSON.stringify({ fila_id: msg.id, message_id: resultado.message_id })]);
      } else {
        const novasTentativas = msg.tentativas + 1;
        const novoStatus = novasTentativas >= 3 ? 'erro' : msg.status;
        await pool.query(`
          UPDATE "${schema}".crm_followup_fila
          SET tentativas = $1, status = $2, atualizado_em = NOW()
          WHERE id = $3
        `, [novasTentativas, novoStatus, msg.id]);
      }
    } catch (err) {
      console.error(`[CRM Followup] Erro ao enviar fila_id ${msg.id}:`, err.message);
      const novasTentativas = msg.tentativas + 1;
      await pool.query(`
        UPDATE "${schema}".crm_followup_fila
        SET tentativas = $1, status = $2, atualizado_em = NOW()
        WHERE id = $3
      `, [novasTentativas, novasTentativas >= 3 ? 'erro' : 'aprovado', msg.id]).catch(() => {});
    }
  }
}

module.exports = { processarFilaTenant };
