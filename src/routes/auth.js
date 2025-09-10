const express = require('express');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioMultiTenant');
const router = express.Router();

// 📧 LOGIN SIMPLIFICADO PARA TESTE
router.post('/login', (req, res) => {
  console.log('🚀 LOGIN ROUTE: Rota /login chamada!');
  try {
    const { email, senha } = req.body;
    console.log('🔍 DEBUG LOGIN: Iniciando login para:', email);

    // TEMPORÁRIO: Definir tenantId fixo para teste
    const tenantId = '8086bc18-14c0-4ac3-9256-ed723e714850';

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
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

module.exports = router;
