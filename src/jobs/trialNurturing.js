const cron = require('node-cron');
const firestoreService = require('../services/firestoreService');
const { isFirestoreAvailable } = require('../utils/firestoreHealth');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');

const NURTURING_SCHEDULE = [
  {
    day: 1,
    subject: 'Bem-vindo ao AltClinic — primeiros passos',
    template: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1976d2">Olá ${d.nome}, sua clínica está configurada! 🎉</h2>
        <p>Você tem <strong>15 dias grátis</strong> para explorar o AltClinic.</p>
        <p><strong>Comece por aqui:</strong></p>
        <ol>
          <li>Conecte seu WhatsApp (leva menos de 1 minuto)</li>
          <li>Crie seu primeiro agendamento</li>
          <li>Veja o lembrete automático ser disparado</li>
        </ol>
        <a href="${d.loginUrl}" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px">
          Acessar minha conta
        </a>
      </div>
    `
  },
  {
    day: 3,
    subject: 'Sua clínica já está no WhatsApp?',
    template: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1976d2">A integração WhatsApp é o coração do AltClinic 📱</h2>
        <p>Clínicas com WhatsApp conectado reduzem faltas em até <strong>70%</strong>.</p>
        <p>Conectar leva menos de 2 minutos — basta escanear o QR Code.</p>
        <a href="${d.loginUrl}/configuracoes/whatsapp" style="background:#25D366;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px">
          Conectar WhatsApp agora
        </a>
      </div>
    `
  },
  {
    day: 7,
    subject: 'Como a Clínica Bella Vita aumentou 30% de retorno',
    template: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1976d2">Resultados reais com o AltClinic 📈</h2>
        <blockquote style="border-left:4px solid #1976d2;padding-left:16px;color:#555">
          "Em poucos meses, nossa taxa de retorno de pacientes aumentou 30% só com os lembretes automáticos."
          <br><strong>— Dra. Ana Silva, Clínica Bella Vita</strong>
        </blockquote>
        <p>Você tem ${d.daysRemaining} dias de trial restantes. Comece a usar e veja os resultados.</p>
        <a href="${d.loginUrl}" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px">
          Continuar usando
        </a>
      </div>
    `
  },
  {
    day: 12,
    subject: 'Faltam 3 dias do seu trial — não perca seus dados',
    template: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#e65100">Seu trial expira em 3 dias ⏰</h2>
        <p>Tudo que você configurou (pacientes, agenda, templates) ficará disponível ao fazer upgrade.</p>
        <p><strong>Plano Starter a partir de R$ 149/mês</strong> — agenda, pacientes, WhatsApp e muito mais.</p>
        <a href="${d.loginUrl}/upgrade" style="background:#e65100;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px">
          Fazer upgrade agora
        </a>
        <p style="color:#999;font-size:12px;margin-top:16px">Sem cartão? O trial continua ativo por mais 7 dias em modo leitura.</p>
      </div>
    `
  },
  {
    day: 14,
    subject: 'Último dia — continue sem perder seus dados',
    template: (d) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#c62828">Hoje é o último dia do seu trial 🔔</h2>
        <p>Não perca o acesso à sua clínica e ao histórico dos seus pacientes.</p>
        <p>Faça o upgrade hoje e continue de onde parou.</p>
        <a href="${d.loginUrl}/upgrade" style="background:#c62828;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px">
          Continuar com o AltClinic
        </a>
      </div>
    `
  }
];

function daysSince(dateStr) {
  const created = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

async function sendNurturingEmails() {
  logger.info('Verificando emails de nurturing para trials ativos...');
  try {
    if (!isFirestoreAvailable()) {
      logger.info('Nurturing: Firestore indisponível, usando SQLite');
      const MultiTenantDatabase = require('../models/MultiTenantDatabase');
      const masterDb = MultiTenantDatabase.getMasterDb();
      const rows = masterDb.prepare(
        "SELECT id, slug, nome, email, status, created_at FROM tenants WHERE status = 'trial'"
      ).all();
      if (rows.length === 0) return;
      // Map SQLite rows to the expected tenant shape
      var tenants = rows.map(r => ({ id: r.id, slug: r.slug, nome: r.nome, email: r.email, status: r.status, created_at: r.created_at }));
      var trials = tenants;
    } else {
      const tenants = await firestoreService.getActiveTenants();
      var trials = tenants.filter(t => t.status === 'trial');
    }

    let sent = 0;
    for (const tenant of trials) {
      const daysActive = daysSince(tenant.created_at || tenant.createdAt);
      const scheduled = NURTURING_SCHEDULE.find(s => s.day === daysActive);
      if (!scheduled) continue;

      const trialExpire = new Date(tenant.trial_expire_at || tenant.billing?.trial_expire_at);
      const daysRemaining = Math.max(0, Math.ceil((trialExpire - new Date()) / (1000 * 60 * 60 * 24)));
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}`;

      try {
        await sendEmail({
          to: tenant.email,
          subject: scheduled.subject,
          html: scheduled.template({
            nome: tenant.nome || 'Olá',
            loginUrl,
            daysRemaining
          })
        });
        sent++;
        logger.info('Nurturing email enviado', { tenant: tenant.slug, day: daysActive });
      } catch (err) {
        logger.warn('Falha ao enviar nurturing email', { tenant: tenant.slug, error: err.message });
      }
    }

    if (sent > 0) logger.info(`Nurturing: ${sent} emails enviados`);
  } catch (error) {
    logger.error('Erro no job de nurturing', { message: error.message });
  }
}

function startNurturingJob() {
  // Roda todo dia às 9h
  const job = cron.schedule('0 9 * * *', sendNurturingEmails, { timezone: 'America/Sao_Paulo' });
  logger.info('Job de nurturing configurado (9h diário)');
  return job;
}

module.exports = { startNurturingJob, sendNurturingEmails };