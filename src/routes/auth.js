const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const UsuarioModel = require('../models/Usuario');
const { sendEmail, sendFirstAccessEmail } = require('../services/emailService');
const sessionManager = require('../middleware/sessionManager');
const multiTenantDb = require('../models/MultiTenantDatabase');
const router = express.Router();

// 📧 LOGIN COM CONTROLE INTELIGENTE DE SESSÕES
router.post('/login', async (req, res) => {
  try {
    const { email, senha, forceLogin = false, sessionsToRemove = [] } = req.body;
    const userIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Criar instância do UsuarioModel com banco do tenant
    const tenantDb = multiTenantDb.getTenantDb(req.tenantId);
    
    // O UsuarioModel já é uma instância, então vou sobrescrever o banco
    const originalDb = UsuarioModel.db;
    UsuarioModel.db = tenantDb;

    console.log('🔍 DEBUG: Tentando autenticar:', email);
    
    const usuario = await UsuarioModel.authenticate(email, senha);
    
    console.log('🔍 DEBUG: Resultado autenticação:', !!usuario);
    
    // Restaurar o banco original
    UsuarioModel.db = originalDb;

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar sessões existentes
    const sessionCheck = await sessionManager.createOrCheckSession(
      usuario.id, 
      userIP, 
      userAgent
    );

    // Se há conflito de IP e não é login forçado
    if (!sessionCheck.success && sessionCheck.action === 'other_ip_detected' && !forceLogin) {
      return res.status(409).json({
        success: false,
        requireConfirmation: true,
        message: 'Já existe uma sessão ativa em outro dispositivo',
        action: 'other_ip_detected',
        otherSessions: sessionCheck.otherSessions,
        currentIP: sessionCheck.currentIP,
        options: {
          forceLogin: 'Entrar e manter outras sessões',
          logoutOthers: 'Entrar e deslogar outros dispositivos'
        }
      });
    }

    // Se é login forçado, remover sessões específicas se solicitado
    if (forceLogin && sessionsToRemove.length > 0) {
      await sessionManager.logoutOtherSessions(
        usuario.id, 
        null, // Não temos sessionId ainda
        sessionsToRemove
      );
    }

    // Criar nova sessão se necessário
    let sessionId;
    if (sessionCheck.success) {
      sessionId = sessionCheck.sessionId;
    } else {
      // Forçar criação de nova sessão
      const newSession = await sessionManager.createOrCheckSession(
        usuario.id, 
        userIP, 
        userAgent
      );
      sessionId = newSession.sessionId;
    }

    // Gerar token JWT com sessionId
    const token = jwt.sign({
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      clinica_id: usuario.clinica_id,
      sessionId: sessionId
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Marcar primeiro acesso como completo
    try {
      const masterDb = multiTenantDb.getMasterDb();
      masterDb.prepare(`
        UPDATE master_users 
        SET firstAccessCompleted = 1 
        WHERE email = ?
      `).run(email);
    } catch (error) {
      console.error('Erro ao marcar primeiro acesso:', error);
      // Não falhar o login por causa disso
    }

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      sessionId,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        clinica_id: usuario.clinica_id,
        clinica_nome: usuario.clinica_nome
      },
      sessionInfo: {
        ip: sessionManager.maskIP(userIP),
        action: sessionCheck.action,
        message: sessionCheck.message
      },
      singleLicense: true
    });

  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /auth/me
 * @desc Obtém dados do usuário logado
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se a sessão ainda é válida
    if (decoded.sessionId && !sessionManager.isSessionValid(decoded.id, decoded.sessionId)) {
      return res.status(401).json({
        success: false,
        message: 'Sessão expirada ou inválida'
      });
    }
    
    const usuario = UsuarioModel.findById(decoded.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Remover dados sensíveis
    delete usuario.senha_hash;

    res.json({
      success: true,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        clinica_id: usuario.clinica_id
      },
      tenant: {
        id: usuario.clinica_id,
        nome: usuario.clinica_nome || 'Minha Clínica'
      },
      license: {
        role: usuario.role,
        permissions: {
          dashboard: true,
          pacientes: true,
          agendamentos: true,
          financeiro: usuario.role === 'admin',
          relatorios: usuario.role === 'admin',
          configuracoes: usuario.role === 'admin'
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
});

/**
 * @route GET /auth/sessions
 * @desc Lista todas as sessões ativas do usuário
 */
router.get('/sessions', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sessions = sessionManager.getUserSessions(decoded.id);

    res.json({
      success: true,
      sessions,
      currentSessionId: decoded.sessionId
    });

  } catch (error) {
    console.error('Erro ao buscar sessões:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /auth/logout-sessions
 * @desc Desloga sessões específicas ou todas as outras
 */
router.post('/logout-sessions', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { sessionIds = [], logoutAll = false } = req.body;

    let result;
    if (logoutAll) {
      // Deslogar todas as outras sessões
      result = await sessionManager.logoutOtherSessions(
        decoded.id, 
        decoded.sessionId
      );
    } else if (sessionIds.length > 0) {
      // Deslogar sessões específicas
      result = await sessionManager.logoutOtherSessions(
        decoded.id, 
        decoded.sessionId, 
        sessionIds
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Especifique as sessões para deslogar ou use logoutAll'
      });
    }

    res.json({
      success: true,
      message: result.message,
      removedCount: result.removedCount
    });

  } catch (error) {
    console.error('Erro ao deslogar sessões:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /auth/logout
 * @desc Desloga a sessão atual
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.sessionId) {
      sessionManager.removeSession(decoded.id, decoded.sessionId);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /auth/session-stats
 * @desc Estatísticas das sessões (admin only)
 */
router.get('/session-stats', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se é admin
    if (decoded.role !== 'admin' && decoded.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const stats = sessionManager.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 📧 ENVIAR EMAIL DE PRIMEIRO ACESSO
router.post('/send-first-access-email', async (req, res) => {
  try {
    const { email, tenantSlug, clinicaNome, tempPassword, trialExpireAt } = req.body;

    if (!email || !tenantSlug || !clinicaNome || !tempPassword) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios não fornecidos'
      });
    }

    // Buscar tenant no master DB
    const masterDb = multiTenantDb.getMasterDb();
    const tenant = masterDb.prepare('SELECT * FROM tenants WHERE slug = ?').get(tenantSlug);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    // Preparar dados para o template
    const templateData = {
      userName: tenant.owner_name || 'Usuário',
      tenantName: clinicaNome,
      email: email,
      tempPassword: tempPassword,
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/${tenantSlug}`,
      trialExpireAt: trialExpireAt ? `<p><strong>📅 Período de teste:</strong> Expira em ${new Date(trialExpireAt).toLocaleDateString('pt-BR')}</p>` : ''
    };

    // Enviar email usando o serviço
    const emailResult = await sendEmail({
      to: email,
      subject: `Bem-vindo à ${clinicaNome} - Suas credenciais de acesso`,
      template: 'first-access',
      data: templateData
    });

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Email de primeiro acesso enviado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar email de primeiro acesso'
      });
    }

  } catch (error) {
    console.error('Erro ao enviar email de primeiro acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 🔐 RECUPERAÇÃO DE SENHA / PRIMEIRO ACESSO
router.post('/recovery', async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar usuário no master DB (para encontrar o tenant)
    const masterDb = multiTenantDb.getMasterDb();
    const masterUser = masterDb.prepare('SELECT * FROM master_users WHERE email = ?').get(email);

    if (!masterUser) {
      // Se não encontrou no master, pode ser um usuário de tenant
      // Por simplicidade, vamos assumir que é um usuário de tenant e procurar em todos
      return res.status(404).json({
        success: false,
        message: 'Email não encontrado em nosso sistema'
      });
    }

    // Buscar tenant
    const tenant = masterDb.prepare('SELECT * FROM tenants WHERE id = ?').get(masterUser.tenant_id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    if (type === 'first-access') {
      // Para primeiro acesso, enviar email com credenciais
      const templateData = {
        userName: masterUser.name || 'Usuário',
        tenantName: tenant.nome,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/${tenant.slug}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'suporte@altclinic.com.br'
      };

      const emailResult = await sendEmail({
        to: email,
        subject: `Primeiro Acesso - ${tenant.nome}`,
        template: 'first-access-reminder',
        data: templateData
      });

      if (emailResult.success) {
        res.json({
          success: true,
          message: 'Email de primeiro acesso enviado com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao enviar email de primeiro acesso'
        });
      }

    } else if (type === 'forgot-password') {
      // Para recuperação de senha, gerar token e enviar email
      const resetToken = crypto.randomBytes(32).hex();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hora

      // Salvar token no banco (simplificado - em produção usar Redis ou similar)
      // Por enquanto, vamos apenas enviar o email

      const templateData = {
        userName: masterUser.name || 'Usuário',
        tenantName: tenant.nome,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'suporte@altclinic.com.br'
      };

      const emailResult = await sendEmail({
        to: email,
        subject: `Redefinição de Senha - ${tenant.nome}`,
        template: 'password-reset',
        data: templateData
      });

      if (emailResult.success) {
        res.json({
          success: true,
          message: 'Email de recuperação de senha enviado com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao enviar email de recuperação'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Tipo de recuperação inválido'
      });
    }

  } catch (error) {
    console.error('Erro na recuperação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
