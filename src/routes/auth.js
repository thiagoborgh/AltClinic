const express = require('express');
const router = express.Router();
const UsuarioModel = require('../models/Usuario');
const authUtil = require('../utils/auth');

/**
 * @route POST /auth/login
 * @desc Autentica usuário
 */
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

    const token = authUtil.generateToken({
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      clinica_id: usuario.clinica_id
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          clinica_id: usuario.clinica_id,
          clinica_nome: usuario.clinica_nome
        },
        token
      }
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
 * @route POST /auth/register
 * @desc Registra novo usuário (apenas admin pode criar)
 */
router.post('/register', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const { nome, email, senha, role = 'atendente' } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (!['admin', 'atendente'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role inválida'
      });
    }

    const novoUsuario = await UsuarioModel.create({
      clinica_id: req.user.clinica_id,
      nome,
      email,
      senha,
      role
    });

    // Remover dados sensíveis
    delete novoUsuario.senha_hash;

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: novoUsuario
    });

  } catch (error) {
    if (error.message === 'Email já está em uso') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    console.error('Erro no registro:', error.message);
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
router.get('/me', authUtil.authenticate, async (req, res) => {
  try {
    const usuario = UsuarioModel.findById(req.user.id);

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
      data: usuario
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /auth/update-password
 * @desc Atualiza senha do usuário
 */
router.put('/update-password', authUtil.authenticate, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verificar senha atual
    const usuario = UsuarioModel.findById(req.user.id);
    const senhaValida = await authUtil.verifyPassword(senhaAtual, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    const usuarioAtualizado = await UsuarioModel.update(req.user.id, {
      senha: novaSenha
    });

    delete usuarioAtualizado.senha_hash;

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso',
      data: usuarioAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar senha:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /auth/usuarios
 * @desc Lista usuários da clínica (apenas admin)
 */
router.get('/usuarios', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const usuarios = UsuarioModel.findByClinica(req.user.clinica_id);

    res.json({
      success: true,
      data: usuarios
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route DELETE /auth/usuarios/:id
 * @desc Remove usuário (apenas admin)
 */
router.delete('/usuarios/:id', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário pertence à mesma clínica
    if (!UsuarioModel.belongsToClinica(id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Usuário não pertence à sua clínica'
      });
    }

    // Não permitir auto-exclusão
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir seu próprio usuário'
      });
    }

    const sucesso = UsuarioModel.delete(id);

    if (!sucesso) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuário removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover usuário:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
