const express = require('express');
const firestoreService = require('../services/firestoreService');
const router = express.Router();

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
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_in_production', (err, user) => {
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
    const tenantId = req.user.tenantId;

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
    const steps = ['profissionalCriado', 'horariosDefinidos', 'whatsappConectado', 'mensagemTestada', 'primeiroAgendamento', 'lembreteAtivado'];
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
    console.error('❌ ONBOARDING STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do onboarding',
      error: error.message
    });
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
    const validSteps = ['profissionalCriado', 'horariosDefinidos', 'whatsappConectado', 'mensagemTestada', 'primeiroAgendamento', 'lembreteAtivado'];
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
    const steps = ['profissionalCriado', 'horariosDefinidos', 'whatsappConectado', 'mensagemTestada', 'primeiroAgendamento', 'lembreteAtivado'];
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

// POST /api/onboarding/wizard/complete — salva dados do wizard de configuração
router.post('/wizard/complete', authenticateToken, async (req, res) => {
  try {
    const { clinica, medico, horarios } = req.body;
    const masterDb = multiTenantDb.getMasterDb();
    const tenantId = req.user?.tenantId;

    if (clinica?.nome) {
      await masterDb.run(
        'UPDATE tenants SET nome=$1, updated_at=NOW() WHERE id=$2',
        [clinica.nome, tenantId]
      );
    }
    console.log(`[Onboarding Wizard] Dados salvos para tenant ${tenantId}`);
    res.json({ success: true, message: 'Configuração concluída' });
  } catch (err) {
    console.error('[Onboarding Wizard] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

module.exports = router;