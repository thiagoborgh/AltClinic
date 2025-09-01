const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const UsuarioModel = require('../models/Usuario');
const { sendEmail } = require('../services/emailService');
const router = express.Router();

// 📧 LOGIN - USANDO SISTEMA EXISTENTE
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    const usuario = await UsuarioModel.authenticate(email, senha);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    const token = jwt.sign({
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      clinica_id: usuario.clinica_id
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        clinica_id: usuario.clinica_id,
        clinica_nome: usuario.clinica_nome
      },
      singleLicense: true // Por enquanto, sistema simples
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

module.exports = router;
