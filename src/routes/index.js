const path = require('path');
const logger = require('../utils/logger');

const { extractTenant } = require('../middleware/tenant');
// extractTenantFirestore substituído por extractTenant (migração Firestore → PostgreSQL)
const extractTenantFirestore = extractTenant;

// Route modules
const authRoutes              = require('./auth');
const agendaAgendamentosRoutes = require('./agenda-agendamentos');
const propostasRoutes         = require('./propostas');
const prontuariosRoutes       = require('./prontuarios');
const tenantsRoutes           = require('./tenants');
const tenantsAdminRoutes      = require('./tenants-admin');
const adminAuthRoutes         = require('./admin-auth');
const adminLicencasRoutes     = require('./admin-licencas');
const billingRoutes           = require('./billing');
const pacientesRoutes         = require('./pacientes-simple');
const templatesRoutes         = require('./templates');
const prontuarioRoutes        = require('./prontuario-simple');
const prontuarioImagemRoutes  = require('./prontuario-imagem-simple');
const configuracoesRoutes     = require('./configuracoes-simple');
const atendimentosRoutes      = require('./atendimentos');
const cadastrosRoutes         = require('./cadastros');
const professionalRoutes      = require('./professional-firestore');
const manyChatRoutes          = require('./manychat');
const onboardingRoutes        = require('./onboarding');
const trialFirestoreRoutes    = require('./trial-firestore');
const pacientesFirestoreRoutes = require('./pacientes-firestore');
const tenantsAdminFirestoreRoutes = require('./tenants-admin-firestore');
const dashboardFirestoreRoutes = require('./dashboard-firestore');
const financeiroFirestoreRoutes = require('./financeiro-firestore');
const crmFirestoreRoutes      = require('./crm-firestore');
const crmFunilRoutes          = require('./crm-funil');
const crmSegmentacaoRoutes    = require('./crm-segmentacao');
const whatsappRoutes          = require('./whatsapp');
const metaWebhookRoutes       = require('./whatsapp-meta-webhook');
const asaasWebhookRoutes      = require('./asaas-webhooks');

const cronManager = require('../cron/inactivityChecker');
const TenantWhatsAppService = require('../services/TenantWhatsAppService');

function registerRoutes(app) {
  const tenantWhatsApp = new TenantWhatsAppService();

  // ── Health ─────────────────────────────────────────────────────────────────
  const healthHandler = async (req, res) => {
    try {
      const available = await tenantWhatsApp.isWhatsAppAvailable();
      res.json({ success: true, status: 'ok', uptime: process.uptime(), version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        whatsapp: available ? 'available_via_admin' : 'not_configured',
        development: tenantWhatsApp.getDevelopmentInfo() });
    } catch {
      res.json({ success: true, status: 'ok', uptime: process.uptime(), version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        whatsapp: 'admin_connection_error',
        development: tenantWhatsApp.getDevelopmentInfo() });
    }
  };
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // ── Status ─────────────────────────────────────────────────────────────────
  app.get('/api/status', (req, res) => {
    res.json({ success: true, data: {
      api: 'online', database: 'connected',
      cron_jobs: cronManager.getStatus(),
      uptime: process.uptime(), memory_usage: process.memoryUsage(), node_version: process.version
    }});
  });

  // ── WhatsApp status ────────────────────────────────────────────────────────
  app.get('/whatsapp/status', async (req, res) => {
    try {
      res.json({ success: true,
        connection: await tenantWhatsApp.checkConnection(),
        usage: await tenantWhatsApp.getUsageStats() });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── ManyChat webhook ───────────────────────────────────────────────────────
  app.post('/webhook/manychat', (req, res) => res.status(200).json({ status: 'received' }));

  // ── AI test ────────────────────────────────────────────────────────────────
  app.post('/api/ai/test', async (req, res) => {
    try {
      const { message, type = 'chat' } = req.body;
      const ai = require('../utils/ai');
      const result = type === 'anamnese'
        ? await ai.gerarSugestoesAnamnese({ nome: 'Paciente Teste' }, message)
        : await ai.chat(message);
      res.json({ success: true, data: result, ai_status: ai.getStatus() });
    } catch (e) { res.status(500).json({ success: false, message: 'Erro no teste de IA', error: e.message }); }
  });

  // ── Cleanup (temporário) ───────────────────────────────────────────────────
  app.use(require('./cleanup'));

  // ── Webhooks externos (sem autenticação JWT) ───────────────────────────────
  // Asaas deve ser registrado ANTES de qualquer middleware de auth
  app.use('/api/webhooks', asaasWebhookRoutes);

  // ── Multi-tenant / billing / admin ─────────────────────────────────────────
  app.use('/api/tenants',            tenantsRoutes);
  app.use('/api/tenants/admin',      tenantsAdminRoutes);
  app.use('/api/billing',            billingRoutes);
  app.use('/api/admin/auth',         adminAuthRoutes);
  app.use('/api/admin/licencas',     adminLicencasRoutes);

  // ── Auth ───────────────────────────────────────────────────────────────────
  app.use('/api/auth/send-first-access-email', extractTenant);
  app.use('/api/auth', authRoutes);

  // ── Onboarding / templates / WhatsApp (Firestore) ─────────────────────────
  app.use('/api/onboarding', extractTenantFirestore, onboardingRoutes);
  app.use('/api/templates',  extractTenantFirestore, templatesRoutes);
  // Meta webhook — deve ser montado ANTES do bloco autenticado /api/whatsapp
  // porque o Meta faz um GET de verificação sem headers de tenant
  app.use('/api/whatsapp/webhook/meta', metaWebhookRoutes);
  app.use('/api/whatsapp',   extractTenantFirestore, whatsappRoutes);

  // ── Firestore routes (priority) ────────────────────────────────────────────
  app.use('/api/tenants',           trialFirestoreRoutes);
  app.use('/api/pacientes-v2',      extractTenantFirestore, pacientesFirestoreRoutes);
  app.use('/api/tenants-admin-v2',  tenantsAdminFirestoreRoutes);
  app.use('/api/dashboard',         extractTenantFirestore, dashboardFirestoreRoutes);
  app.use('/api/financeiro',        extractTenantFirestore, financeiroFirestoreRoutes);
  // ── CRM Camada 2 (PostgreSQL) — issues #21, #22, #23 — deve vir antes do Firestore catch-all
  app.use('/api/crm/funil',         extractTenant,          crmFunilRoutes);
  app.use('/api/crm/tags',          extractTenant,          crmSegmentacaoRoutes);
  app.use('/api/crm/segmentos',     extractTenant,          crmSegmentacaoRoutes);
  app.use('/api/crm',               extractTenantFirestore, crmFirestoreRoutes);
  app.use('/api/professional',      extractTenantFirestore, professionalRoutes);

  // ── SQLite-aware routes ────────────────────────────────────────────────────
  app.use('/api/pacientes',         extractTenant,          pacientesRoutes);
  app.use('/api/prontuario',        extractTenant,          prontuarioRoutes);
  app.use('/api/prontuario/imagem', extractTenant,          prontuarioImagemRoutes);
  app.use('/api/prontuarios',       prontuariosRoutes);
  app.use('/api/propostas',         extractTenant,          propostasRoutes);
  app.use('/api/configuracoes',     extractTenant,          configuracoesRoutes);
  app.use('/api/atendimentos',      extractTenant,          atendimentosRoutes);
  app.use('/api/cadastros',         extractTenant,          cadastrosRoutes);
  app.use('/api/manychat',          manyChatRoutes);

  // ── Agenda (Firestore) ─────────────────────────────────────────────────────
  app.use('/api/agendamentos',          extractTenantFirestore, agendaAgendamentosRoutes);
  app.use('/api/agenda/agendamentos',   extractTenantFirestore, agendaAgendamentosRoutes);

  // ── CRM C3 — Inbox, Bot e PEP ─────────────────────────────────────────────
  app.use('/api/inbox',      extractTenant, require('./inbox'));
  app.use('/api/bot',        extractTenant, require('./bot-fluxos'));
  app.use('/api/pep',        extractTenant, require('./pep'));
  app.use('/api/crm/nps',    extractTenant, require('./crm-nps'));
  app.use('/api/crm/funil',  extractTenant, require('./crm-funil'));
  app.use('/api/crm/tags',   extractTenant, require('./crm-segmentacao'));
  app.use('/api/crm/segmentos', extractTenant, require('./crm-segmentacao'));

  // ── SPA catch-all ──────────────────────────────────────────────────────────
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: 'Rota da API não encontrada' });
    }
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });
}

module.exports = registerRoutes;
