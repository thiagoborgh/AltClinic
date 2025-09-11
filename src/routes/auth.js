const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
  console.log('🚀 LOGIN ROUTE: Rota /login chamada!');
  try {
    const { email, senha } = req.body;
    console.log('🔍 DEBUG LOGIN: Iniciando login para:', email);

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar tenant do usuário automaticamente
    let tenantId = null;
    
    try {
      const masterDb = multiTenantDb.getMasterDb();
      
      // Primeiro, tentar encontrar o usuário no master_users
      const masterUser = masterDb.prepare('SELECT tenant_id FROM master_users WHERE email = ?').get(email);
      
      if (masterUser) {
        tenantId = masterUser.tenant_id;
        console.log('🔍 DEBUG: Tenant encontrado via master_users:', tenantId);
      } else {
        // Se não encontrou no master, buscar no primeiro tenant ativo (para demo)
        const firstTenant = masterDb.prepare('SELECT id FROM tenants WHERE status = ? LIMIT 1').get('active');
        if (firstTenant) {
          tenantId = firstTenant.id;
          console.log('🔍 DEBUG: Usando primeiro tenant ativo:', tenantId);
        } else {
          console.log('❌ Nenhum tenant encontrado');
          return res.status(401).json({
            success: false,
            message: 'Sistema não inicializado. Entre em contato com o suporte.'
          });
        }
      }
    } catch (dbError) {
      console.error('❌ Erro ao buscar tenant:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    console.log('🔍 DEBUG: Tentando autenticar:', email);
    console.log('🔍 DEBUG: Tenant ID:', tenantId);
    
    const usuario = UsuarioModel.authenticate(email, senha, tenantId);
    
    console.log('🔍 DEBUG: Resultado autenticação:', !!usuario);
    console.log('🔍 DEBUG: Usuário encontrado:', usuario);    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
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
      tenantId: tenantId,
      firstAccess: isFirstAccess
    }, process.env.JWT_SECRET || 'saee-development-secret', { 
      expiresIn: '24h' 
    });

    // Se é primeiro acesso, marcar como verificado
    if (isFirstAccess) {
      try {
        const tenantDb = multiTenantDb.getTenantDb(tenantId);
        tenantDb.prepare(`
          UPDATE usuarios 
          SET email_verified_at = datetime('now'), status = 'active', last_login = datetime('now')
          WHERE id = ? AND tenant_id = ?
        `).run(usuario.id, tenantId);

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
        id: tenantId
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

module.exports = router;
