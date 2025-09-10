const express = require('express');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioMultiTenant');
const multiTenantDb = require('../models/MultiTenantDatabase');
const router = express.Router();

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

    // Gerar JWT token
    const token = jwt.sign({
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      tenantId: tenantId
    }, process.env.JWT_SECRET || 'saee-development-secret', { 
      expiresIn: '24h' 
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      tenant: {
        id: tenantId
      }
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

module.exports = router;
