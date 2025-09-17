const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const UsuarioModel = require('../models/UsuarioMultiTenant');
const multiTenantDb = require('../models/MultiTenantDatabase');
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

  jwt.verify(token, process.env.JWT_SECRET || 'saee-development-secret', (err, user) => {
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

// 📧 LOGIN COM DETECÇÃO AUTOMÁTICA DE TENANT
router.post('/login', (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar tenant do usuário baseado no email
    let tenantInfo = null;
    let usuario = null;
    let foundTenantId = null;

    try {
      const masterDb = multiTenantDb.getMasterDb();
      const tenants = masterDb.prepare('SELECT id, nome, slug FROM tenants').all();

      // Tentar autenticar em cada tenant
      for (const tenant of tenants) {
        try {
          const user = UsuarioModel.authenticate(email, senha, tenant.id);
          if (user) {
            usuario = user;
            tenantInfo = tenant;
            foundTenantId = tenant.id;
            break;
          }
        } catch (authError) {
          // Continuar tentando outros tenants
          continue;
        }
      }

      if (!usuario || !tenantInfo) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }
    } catch (dbError) {
      console.error('❌ Erro ao buscar tenant do usuário:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Verificar se é primeiro acesso
    const isFirstAccess = usuario.status === 'pending_first_access' || 
                         usuario.email_verified_at === null;

    // Gerar JWT token
    const token = jwt.sign({
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      tenantId: foundTenantId,
      firstAccess: isFirstAccess
    }, process.env.JWT_SECRET || 'saee-development-secret', { 
      expiresIn: '24h' 
    });

    // Se é primeiro acesso, marcar como verificado
    if (isFirstAccess) {
      try {
        const tenantDb = multiTenantDb.getTenantDb(foundTenantId);
        tenantDb.prepare(`
          UPDATE usuarios 
          SET email_verified_at = datetime('now'), status = 'active', last_login = datetime('now')
          WHERE id = ?
        `).run(usuario.id);

        // Atualizar master_users também
        const masterDb = multiTenantDb.getMasterDb();
        // Note: master_users não tem colunas firstAccessCompleted ou updated_at
        // Essas informações são controladas na tabela do tenant
        console.log('✅ Primeiro acesso registrado no tenant para:', usuario.email);

        console.log('✅ Primeiro acesso registrado para:', usuario.email);
      } catch (updateError) {
        console.error('⚠️ Erro ao marcar primeiro acesso:', updateError);
      }
    }

    res.json({
      success: true,
      message: isFirstAccess ? 'Primeiro acesso realizado com sucesso!' : 'Login realizado com sucesso',
      token: token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        firstAccess: isFirstAccess
      },
      tenant: {
        id: tenantInfo.id,
        nome: tenantInfo.nome,
        slug: tenantInfo.slug
      },
      license: {
        id: 'default-license',
        type: 'owner',
        permissions: ['all']
      },
      ...(isFirstAccess && {
        passwordChangeRequired: true,
        instructions: 'Por segurança, altere sua senha temporária na próxima tela.'
      })
    });

  } catch (error) {
    console.error('Erro no login:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 🔍 ROTA PARA VERIFICAR STATUS DE INICIALIZAÇÃO
router.get('/init-status', (req, res) => {
  try {
    const multiTenantDb = require('../models/MultiTenantDatabase');
    const masterDb = multiTenantDb.getMasterDb();
    
    const tenantCount = masterDb.prepare('SELECT COUNT(*) as count FROM tenants').get();
    const userCount = masterDb.prepare('SELECT COUNT(*) as count FROM master_users').get();
    
    res.json({
      success: true,
      initialized: tenantCount.count > 0,
      tenants: tenantCount.count,
      users: userCount.count,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Erro ao verificar status de inicialização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status'
    });
  }
});

// 🚀 ROTA PARA INICIALIZAÇÃO MANUAL (EMERGÊNCIA)
router.post('/init-system', async (req, res) => {
  try {
    // Verificar se já está inicializado
    const multiTenantDb = require('../models/MultiTenantDatabase');
    const masterDb = multiTenantDb.getMasterDb();
    
    const tenantCount = masterDb.prepare('SELECT COUNT(*) as count FROM tenants').get();
    
    if (tenantCount.count > 0) {
      return res.json({
        success: true,
        message: 'Sistema já está inicializado',
        initialized: true
      });
    }

    // Inicializar sistema
    const ProductionInitializer = require('../utils/productionInitializer');
    const result = await ProductionInitializer.createFirstAccess();

    res.json({
      success: true,
      message: 'Sistema inicializado com sucesso',
      initialized: true,
      credentials: {
        email: result.adminEmail,
        password: result.adminPassword,
        tenant: result.tenantSlug
      }
    });

  } catch (error) {
    console.error('Erro na inicialização manual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao inicializar sistema: ' + error.message
    });
  }
});

// Rota para trocar senha no primeiro acesso
router.put('/change-first-password', authenticateToken, async (req, res) => {
  console.log('🔄 CHANGE PASSWORD: Rota chamada');
  console.log('👤 User do token:', req.user);
  
  try {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    console.log('📝 Dados recebidos:', { userId, tenantId, hasNewPassword: !!newPassword, hasConfirmPassword: !!confirmPassword });

    if (!newPassword || !confirmPassword) {
      console.log('❌ Senha não fornecida');
      return res.status(400).json({
        success: false,
        message: 'Nova senha e confirmação são obrigatórias'
      });
    }

    if (newPassword !== confirmPassword) {
      console.log('❌ Senhas não coincidem');
      return res.status(400).json({
        success: false,
        message: 'Nova senha e confirmação não coincidem'
      });
    }

    if (newPassword.length < 6) {
      console.log('❌ Senha muito curta');
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    console.log('✅ Validações passaram, gerando hash...');

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Hash gerado com sucesso');

    // Atualizar senha no banco do tenant
    console.log('🔄 Atualizando senha no banco do tenant...');
    const tenantDb = multiTenantDb.getTenantDb(tenantId);
    const updateResult = tenantDb.prepare(`
      UPDATE usuarios 
      SET senha_hash = ?, 
          status = 'active',
          updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).run(hashedPassword, userId, tenantId);

    console.log('📊 Resultado da atualização tenant:', updateResult);

    if (updateResult.changes === 0) {
      console.log('❌ Nenhum usuário foi atualizado no tenant DB');
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    console.log('✅ Usuário atualizado no tenant DB');

    // Atualizar master_users também
    console.log('🔄 Atualizando senha no master DB...');
    const masterDb = multiTenantDb.getMasterDb();
    const masterUpdateResult = masterDb.prepare(`
      UPDATE master_users 
      SET senha_hash = ?
      WHERE email = ? AND tenant_id = ?
    `).run(hashedPassword, req.user.email, tenantId);

    console.log('📊 Resultado da atualização master:', masterUpdateResult);

    console.log('✅ Senha alterada com sucesso para usuário:', userId);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso! Você já pode fazer login normalmente.',
      passwordChanged: true
    });

  } catch (error) {
    console.error('❌ Erro ao trocar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 🔐 ESQUECI MINHA SENHA - Solicitar redefinição
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    console.log('🔐 Solicitação de redefinição para:', email);

    // Buscar usuário no master DB
    const masterDb = multiTenantDb.getMasterDb();
    const user = masterDb.prepare('SELECT id, email, tenant_id FROM master_users WHERE email = ?').get(email);

    if (!user) {
      // Por segurança, não informar se o email existe ou não
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
      });
    }

    // Gerar token único
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token na tabela (criar se não existir)
    try {
      masterDb.prepare(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          tenant_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES master_users(id),
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
      `).run();

      // Remover tokens expirados
      masterDb.prepare('DELETE FROM password_reset_tokens WHERE expires_at < datetime(\'now\')').run();

      // Inserir novo token
      masterDb.prepare(`
        INSERT INTO password_reset_tokens (user_id, tenant_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(user.id, user.tenant_id, resetToken, expiresAt.toISOString());

    } catch (dbError) {
      console.error('Erro ao salvar token:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Enviar email
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '🔐 Redefinição de Senha - AltClinic',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Redefinição de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir sua senha no sistema AltClinic.</p>
            <p>Clique no link abaixo para criar uma nova senha:</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Redefinir Senha
              </a>
            </p>
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Este link expira em 1 hora</li>
              <li>Se você não solicitou esta redefinição, ignore este email</li>
              <li>Por segurança, não compartilhe este link com ninguém</li>
            </ul>
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Esta é uma mensagem automática. Não responda este email.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('📧 Email de redefinição enviado para:', email);

    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Não retornar erro para não expor se o email existe
    }

    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
    });

  } catch (error) {
    console.error('❌ Erro ao solicitar redefinição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 🔍 VALIDAR TOKEN DE REDEFINIÇÃO
router.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
    }

    const masterDb = multiTenantDb.getMasterDb();

    // Buscar token válido
    const tokenData = masterDb.prepare(`
      SELECT prt.*, mu.email
      FROM password_reset_tokens prt
      JOIN master_users mu ON prt.user_id = mu.id
      WHERE prt.token = ?
        AND prt.expires_at > datetime('now')
        AND prt.used = FALSE
    `).get(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      expiresAt: tokenData.expires_at,
      email: tokenData.email
    });

  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 🔄 REDEFINIR SENHA
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios'
      });
    }

    // Validar força da senha
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 8 caracteres'
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve conter pelo menos uma letra maiúscula'
      });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve conter pelo menos um número'
      });
    }

    const masterDb = multiTenantDb.getMasterDb();

    // Buscar e validar token
    const tokenData = masterDb.prepare(`
      SELECT prt.*, mu.email
      FROM password_reset_tokens prt
      JOIN master_users mu ON prt.user_id = mu.id
      WHERE prt.token = ?
        AND prt.expires_at > datetime('now')
        AND prt.used = FALSE
    `).get(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha no master DB
    const masterUpdate = masterDb.prepare(`
      UPDATE master_users
      SET senha_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, tokenData.user_id);

    if (masterUpdate.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar senha no tenant DB
    try {
      const tenantDb = multiTenantDb.getTenantDb(tokenData.tenant_id);
      tenantDb.prepare(`
        UPDATE usuarios
        SET senha_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `).run(hashedPassword, tokenData.email);
    } catch (tenantError) {
      console.error('Erro ao atualizar senha no tenant DB:', tenantError);
      // Continuar mesmo se falhar no tenant DB
    }

    // Marcar token como usado
    masterDb.prepare(`
      UPDATE password_reset_tokens
      SET used = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(tokenData.id);

    // Limpar tokens expirados
    masterDb.prepare('DELETE FROM password_reset_tokens WHERE expires_at < datetime(\'now\')').run();

    console.log('✅ Senha redefinida com sucesso para:', tokenData.email);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você pode fazer login com sua nova senha.'
    });

  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 📋 ENDPOINT PARA OBTER INFORMAÇÕES DO USUÁRIO AUTENTICADO
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    
    // Buscar informações completas do usuário
    const UsuarioModel = require('../models/UsuarioMultiTenant');
    
    const usuario = await UsuarioModel.findById(userId, tenantId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Buscar informações completas do tenant
    const masterDb = multiTenantDb.getMasterDb();
    const tenantInfo = masterDb.prepare('SELECT id, nome, slug FROM tenants WHERE id = ?').get(tenantId);
    
    if (!tenantInfo) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }
    
    // Retornar informações do usuário (sem senha)
    const userInfo = {
      id: usuario.id,
      tenant_id: usuario.tenant_id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      permissions: usuario.permissions,
      avatar: usuario.avatar,
      telefone: usuario.telefone,
      crm: usuario.crm,
      especialidade: usuario.especialidade,
      status: usuario.status,
      last_login: usuario.last_login,
      created_at: usuario.created_at,
      updated_at: usuario.updated_at
    };
    
    console.log('✅ GET /me: Informações retornadas para:', usuario.email);
    
    res.json({
      success: true,
      user: userInfo,
      tenant: {
        id: tenantInfo.id,
        nome: tenantInfo.nome,
        slug: tenantInfo.slug
      },
      license: { id: 'default-license', type: 'owner', permissions: ['all'] }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar informações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
