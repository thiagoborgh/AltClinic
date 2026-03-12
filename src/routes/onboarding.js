const express = require('express');
const firestoreService = require('../services/firestoreService');
const { isFirestoreAvailable } = require('../utils/firestoreHealth');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const multiTenantDb = require('../database/MultiTenantPostgres');
const { sendWelcomeEmail } = require('../services/emailService');

const asaas = require("../services/AsaasService");

// ─── Helpers para o self-service onboarding ───────────────────────────────────

/**
 * Converte um nome de clínica em slug kebab-case.
 * Ex: "Clínica São Paulo" → "clinica-sao-paulo"
 */
function toSlug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')   // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')           // espaços → hífens
    .replace(/-+/g, '-');           // múltiplos hífens → um
}

/**
 * Garante que o slug é único no banco master.
 * Adiciona sufixo numérico se necessário: minha-clinica-2, minha-clinica-3…
 */
async function generateUniqueSlug(masterDb, base) {
  let slug = base;
  let attempt = 1;
  while (true) {
    const existing = await masterDb.get(
      'SELECT id FROM tenants WHERE slug = $1',
      [slug]
    );
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

/**
 * Insere 3 serviços padrão no schema do tenant recém-criado.
 */
async function seedTenantData(tenantDb, tenantId) {
  const servicos = [
    { nome: 'Consulta Médica', duracao_minutos: 60, preco: 200.00 },
    { nome: 'Retorno',         duracao_minutos: 30, preco: 100.00 },
    { nome: 'Urgência',        duracao_minutos: 45, preco: 250.00 },
  ];

  for (const s of servicos) {
    await tenantDb.run(
      `INSERT INTO servicos (nome, duracao_minutos, preco, ativo, tenant_id, created_at)
       VALUES ($1, $2, $3, true, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [s.nome, s.duracao_minutos, s.preco, tenantId]
    );
  }
  console.log(`[Onboarding] Seed de serviços concluído para tenant ${tenantId}`);
}

// Middleware para autenticar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_dev_only', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    req.user = user;
    next();
  });
}

// 📊 GET /api/onboarding/status - Verificar status do onboarding
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.tenantId;
    const steps = ['whatsappConectado', 'mensagemTestada', 'profissionalCriado', 'horariosDefinidos', 'primeiroAgendamento', 'lembreteAtivado'];
    const emptyProgress = { whatsappConectado: false, mensagemTestada: false, profissionalCriado: false, horariosDefinidos: false, primeiroAgendamento: false, lembreteAtivado: false, completedAt: null };

    // Fast path: return default when Firestore is unavailable
    if (!isFirestoreAvailable()) {
      return res.json({ success: true, data: { ...emptyProgress, progressPercentage: 0, completedSteps: 0, totalSteps: steps.length, isCompleted: false } });
    }

    console.log('📊 ONBOARDING STATUS: Verificando progresso para tenant:', tenantId);

    // Buscar progresso do onboarding no Firestore
    const progressRef = firestoreService.db.collection('tenants').doc(tenantId).collection('onboarding_progress').doc('progress');
    const progressDoc = await progressRef.get();

    let progress = {
      profissionalCriado: false,
      horariosDefinidos: false,
      whatsappConectado: false,
      mensagemTestada: false,
      primeiroAgendamento: false,
      lembreteAtivado: false,
      completedAt: null
    };

    if (progressDoc.exists) {
      progress = { ...progress, ...progressDoc.data() };
    }

    // Calcular progresso geral
    const completedSteps = steps.filter(step => progress[step]).length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    console.log('📊 ONBOARDING STATUS: Progresso encontrado:', progress);

    res.json({
      success: true,
      data: {
        ...progress,
        progressPercentage,
        completedSteps,
        totalSteps: steps.length,
        isCompleted: completedSteps === steps.length
      }
    });

  } catch (error) {
    // Firestore indisponivel -> retornar status padrao "nao iniciado"
    const isFirestoreErr = error.code === 16 || (error.message && error.message.includes('UNAUTHENTICATED'));
    if (isFirestoreErr) {
      const steps = ['whatsappConectado', 'mensagemTestada', 'profissionalCriado', 'horariosDefinidos', 'primeiroAgendamento', 'lembreteAtivado'];
      return res.json({
        success: true,
        data: {
          whatsappConectado: false, mensagemTestada: false, profissionalCriado: false,
          horariosDefinidos: false, primeiroAgendamento: false, lembreteAtivado: false,
          completedAt: null, progressPercentage: 0, completedSteps: 0,
          totalSteps: steps.length, isCompleted: false
        }
      });
    }
    console.error('ONBOARDING STATUS ERROR:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar status do onboarding', error: error.message });
  }
});

// 🔄 PATCH /api/onboarding/step/:stepName - Atualizar etapa do onboarding
router.patch('/step/:stepName', authenticateToken, async (req, res) => {
  try {
    const { stepName } = req.params;
    const tenantId = req.user.tenantId;
    const { completed = true } = req.body;

    console.log('🔄 ONBOARDING STEP:', stepName, 'para tenant:', tenantId, 'completed:', completed);

    // Validar stepName
    const validSteps = ['whatsappConectado', 'mensagemTestada', 'profissionalCriado', 'horariosDefinidos', 'primeiroAgendamento', 'lembreteAtivado'];
    if (!validSteps.includes(stepName)) {
      return res.status(400).json({
        success: false,
        message: 'Nome da etapa inválido',
        validSteps
      });
    }

    // Buscar progresso atual
    const progressRef = firestoreService.db.collection('tenants').doc(tenantId).collection('onboarding_progress').doc('progress');
    const progressDoc = await progressRef.get();

    let progress = {
      profissionalCriado: false,
      horariosDefinidos: false,
      whatsappConectado: false,
      mensagemTestada: false,
      primeiroAgendamento: false,
      lembreteAtivado: false,
      completedAt: null
    };

    if (progressDoc.exists) {
      progress = { ...progress, ...progressDoc.data() };
    }

    // Atualizar etapa específica
    progress[stepName] = completed;

    // Verificar se todas as etapas foram concluídas
    const steps = ['whatsappConectado', 'mensagemTestada', 'profissionalCriado', 'horariosDefinidos', 'primeiroAgendamento', 'lembreteAtivado'];
    const allCompleted = steps.every(step => progress[step]);

    if (allCompleted && !progress.completedAt) {
      progress.completedAt = new Date();
      console.log('🎉 ONBOARDING COMPLETED: Todas as etapas concluídas para tenant:', tenantId);
    }

    // Salvar progresso atualizado
    await progressRef.set(progress, { merge: true });

    // Calcular progresso geral
    const completedSteps = steps.filter(step => progress[step]).length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    res.json({
      success: true,
      message: `Etapa ${stepName} ${completed ? 'concluída' : 'desmarcada'}`,
      data: {
        ...progress,
        progressPercentage,
        completedSteps,
        totalSteps: steps.length,
        isCompleted: allCompleted
      }
    });

  } catch (error) {
    console.error('❌ ONBOARDING STEP ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar etapa do onboarding',
      error: error.message
    });
  }
});

// 🔄 POST /api/onboarding/reset - Resetar onboarding (para desenvolvimento)
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    console.log('🔄 ONBOARDING RESET: Resetando progresso para tenant:', tenantId);

    const progressRef = firestoreService.db.collection('tenants').doc(tenantId).collection('onboarding_progress').doc('progress');

    const resetProgress = {
      profissionalCriado: false,
      horariosDefinidos: false,
      whatsappConectado: false,
      mensagemTestada: false,
      primeiroAgendamento: false,
      lembreteAtivado: false,
      completedAt: null
    };

    await progressRef.set(resetProgress);

    res.json({
      success: true,
      message: 'Onboarding resetado com sucesso',
      data: resetProgress
    });

  } catch (error) {
    console.error('❌ ONBOARDING RESET ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resetar onboarding',
      error: error.message
    });
  }
});

// ─── GET /api/onboarding/check-slug ──────────────────────────────────────────
// Endpoint público — verifica disponibilidade de slug a partir de um nome
router.get('/check-slug', async (req, res) => {
  try {
    const { nome } = req.query;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Parâmetro "nome" é obrigatório' });
    }

    const base = toSlug(nome.trim());
    const masterDb = multiTenantDb.getMasterDb();
    const existing = await masterDb.get(
      'SELECT id FROM tenants WHERE slug = $1',
      [base]
    );

    return res.json({
      slug: base,
      available: !existing,
    });
  } catch (error) {
    console.error('[Onboarding] check-slug error:', error);
    return res.status(500).json({ error: 'Erro ao verificar slug', message: error.message });
  }
});

// ─── POST /api/onboarding/register ───────────────────────────────────────────
// Endpoint público — cadastro self-service de nova clínica (trial/plan)
router.post('/register', async (req, res) => {
  const {
    clinicaNome,
    email,
    senha,
    responsavelNome,
    telefone,
    cpfCnpj,
    plano = 'trial',
  } = req.body;

  // 1. Validar campos obrigatórios
  if (!clinicaNome || !clinicaNome.trim()) {
    return res.status(400).json({ error: 'Campo obrigatório ausente', message: 'clinicaNome é obrigatório.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Campo obrigatório ausente', message: 'email é obrigatório.' });
  }
  if (!senha || senha.length < 6) {
    return res.status(400).json({ error: 'Senha inválida', message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const masterDb = multiTenantDb.getMasterDb();

  try {
    // 2. Verificar se email já existe em master_users
    const emailExistente = await masterDb.get(
      'SELECT id FROM master_users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (emailExistente) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Já existe uma conta com este email. Faça login ou redefina sua senha.',
      });
    }

    // 3. Gerar slug único
    const slugBase = toSlug(clinicaNome.trim());
    const slug = await generateUniqueSlug(masterDb, slugBase);

    // 4. Gerar ID único para o tenant
    const tenantId = uuidv4();

    // 5. Calcular trial_expire_at = agora + 14 dias
    const trialExpireAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // 6. Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // 7. INSERT em public.tenants
    await masterDb.run(
      `INSERT INTO tenants
         (id, slug, nome, email, telefone, plano, status, trial_expire_at, cnpj_cpf, responsavel_nome, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'trial', $7, $8, $9, NOW(), NOW())`,
      [
        tenantId,
        slug,
        clinicaNome.trim(),
        email.trim().toLowerCase(),
        telefone || null,
        plano,
        trialExpireAt,
        cpfCnpj || null,
        responsavelNome || null,
      ]
    );

    // 8. INSERT em public.master_users
    await masterDb.run(
      `INSERT INTO master_users (tenant_id, email, senha_hash, role, name, created_at)
       VALUES ($1, $2, $3, 'owner', $4, NOW())`,
      [tenantId, email.trim().toLowerCase(), senhaHash, responsavelNome || null]
    );

    // 9. Provisionar schema do tenant no PostgreSQL
    await multiTenantDb.createTenantSchema(tenantId, slug);

    // 10. Seed de dados iniciais no schema do tenant
    try {
      const tenantDb = multiTenantDb.getTenantDb(tenantId, slug);
      await seedTenantData(tenantDb, tenantId);
    } catch (seedErr) {
      // Não bloqueia o cadastro — apenas loga
      console.warn('[Onboarding] Falha no seed de serviços (não crítico):', seedErr.message);
    }

    // 11. Criar customer no Asaas (somente se API key configurada)
    if (asaas.isEnabled) {
      try {
        const customer = await asaas.createCustomer({
          name: responsavelNome || clinicaNome.trim(),
          email: email.trim().toLowerCase(),
          cpfCnpj: cpfCnpj || undefined,
          phone: telefone || undefined,
        });
        // Persiste o customerId Asaas no billing do tenant
        await masterDb.run(
          `UPDATE tenants SET billing = billing || $1::jsonb WHERE id = $2`,
          [JSON.stringify({ asaasCustomerId: customer.id }), tenantId]
        );
        console.log(`[Onboarding] Customer Asaas criado: ${customer.id} para tenant ${tenantId}`);
      } catch (asaasErr) {
        // Não bloqueia o cadastro — Asaas é enriquecimento
        console.warn('[Onboarding] Falha ao criar customer Asaas (não crítico):', asaasErr.message);
      }
    }

    // 12. Enviar email de boas-vindas
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.altclinic.com.br';
    const loginUrl = `${frontendUrl}/login?tenant=${slug}`;

    try {
      await sendWelcomeEmail({
        email: email.trim().toLowerCase(),
        userName: responsavelNome || clinicaNome.trim(),
        tenantName: clinicaNome.trim(),
        loginUrl,
      });
    } catch (emailErr) {
      // Não bloqueia — email é best-effort
      console.warn('[Onboarding] Falha ao enviar email de boas-vindas (não crítico):', emailErr.message);
    }

    // 13. Retornar resposta de sucesso
    return res.status(201).json({
      success: true,
      tenant: {
        id: tenantId,
        slug,
        nome: clinicaNome.trim(),
        status: 'trial',
        trial_expire_at: trialExpireAt.toISOString(),
      },
      loginUrl,
    });

  } catch (error) {
    console.error('[Onboarding] register error:', error);
    return res.status(500).json({
      error: 'Erro interno ao cadastrar clínica',
      message: error.message,
    });
  }
});

module.exports = router;