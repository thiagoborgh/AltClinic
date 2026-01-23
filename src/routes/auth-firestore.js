const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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

// 📧 LOGIN COM FIREBASE FIRESTORE
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 LOGIN FIRESTORE: Tentativa de login:', email);

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar tenant pelo slug (se fornecido no header)
    const tenantSlug = req.headers['x-tenant-slug'];
    
    if (tenantSlug) {
      console.log('🔐 LOGIN: Buscando tenant específico:', tenantSlug);
      const tenant = await firestoreService.getTenantBySlug(tenantSlug);
      
      if (!tenant) {
        return res.status(401).json({
          success: false,
          message: 'Tenant não encontrado ou inativo'
        });
      }

      // Buscar usuário no tenant
      const user = await firestoreService.getUserByEmail(tenant.id, email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado',
          errorType: 'USER_NOT_FOUND'
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, user.senha_hash);
      
      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Senha incorreta',
          errorType: 'INVALID_PASSWORD'
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id,
          tenantId: tenant.id,
          email: user.email,
          role: user.papel || user.role
        },
        process.env.JWT_SECRET || 'fallback_secret_change_in_production',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.papel || user.role
        },
        token,
        tenant: {
          id: tenant.id,
          nome: tenant.nome,
          slug: tenant.slug
        },
        sessionId: `session_${Date.now()}`
      });
    }

    // Buscar usuário em todos os tenants ativos
    console.log('🔐 LOGIN: Buscando em todos os tenants ativos...');
    const result = await firestoreService.findUserAcrossTenants(email);
    
    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Email não encontrado em nenhuma clínica',
        errorType: 'USER_NOT_FOUND'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, result.user.senha_hash);
    
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta',
        errorType: 'INVALID_PASSWORD'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: result.user.id,
        tenantId: result.tenant.id,
        email: result.user.email,
        role: result.user.papel || result.user.role
      },
      process.env.JWT_SECRET || 'fallback_secret_change_in_production',
      { expiresIn: '24h' }
    );

    console.log('✅ LOGIN: Sucesso para', email, 'no tenant', result.tenant.slug);

    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        role: result.user.papel || result.user.role
      },
      token,
      tenant: {
        id: result.tenant.id,
        nome: result.tenant.nome,
        slug: result.tenant.slug
      },
      sessionId: `session_${Date.now()}`
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// 👤 OBTER DADOS DO USUÁRIO AUTENTICADO
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await firestoreService.getUserByEmail(req.user.tenantId, req.user.email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.papel || user.role,
        tenantId: req.user.tenantId
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário'
    });
  }
});

// 🚪 LOGOUT
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
