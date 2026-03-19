const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/check-permission');
const usuarioService = require('../services/usuario-service');

// GET /api/usuarios — listar usuários da clínica
router.get('/', authMiddleware, checkPermission('usuarios', 'read'), async (req, res) => {
  try {
    const usuarios = await usuarioService.listarUsuarios(req.usuario.tenant_slug);
    return res.json({ data: usuarios });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[/usuarios] GET error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/usuarios — criar usuário (admin)
router.post('/', authMiddleware, checkPermission('usuarios', 'create'), async (req, res) => {
  try {
    const { nome, email, perfil } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ error: 'nome e email são obrigatórios' });
    }

    const result = await usuarioService.criarUsuario(req.usuario.tenant_slug, { nome, email, perfil });
    return res.status(201).json({
      data: result.usuario,
      message: 'Usuário criado. Email de convite será enviado em breve.',
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[/usuarios] POST error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /api/usuarios/:id/status — ativar/desativar usuário
router.patch('/:id/status', authMiddleware, checkPermission('usuarios', 'update'), async (req, res) => {
  try {
    const { ativo } = req.body;
    if (typeof ativo !== 'boolean') {
      return res.status(400).json({ error: 'ativo deve ser true ou false' });
    }

    await usuarioService.atualizarStatusUsuario(req.usuario.tenant_slug, req.params.id, ativo);
    return res.json({ message: ativo ? 'Usuário ativado' : 'Usuário desativado' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[/usuarios] PATCH status error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
