const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../database/postgres');
const { requireAdminAuth } = require('../middleware/adminAuth');

// POST /login — autenticar admin
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'email e senha são obrigatórios' });
    }

    const { rows } = await pool.query(
      'SELECT id, nome, email, senha_hash, role, ativo FROM admin_usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const admin = rows[0];

    if (!admin || !admin.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo' });
    }

    const senhaValida = await bcrypt.compare(senha, admin.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo' });
    }

    // Atualizar último acesso
    await pool.query(
      'UPDATE admin_usuarios SET ultimo_acesso = NOW() WHERE id = $1',
      [admin.id]
    ).catch(() => {});

    const token = jwt.sign(
      {
        sub: admin.id,
        nome: admin.nome,
        email: admin.email,
        role: admin.role,
        isAdmin: true
      },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, acao, detalhes_json, ip, user_agent)
       VALUES ($1,'admin.login',$2,$3,$4)`,
      [
        admin.id,
        JSON.stringify({ email: admin.email }),
        req.ip || null,
        req.headers['user-agent'] || null
      ]
    ).catch(() => {});

    res.json({
      token,
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('[auth-admin] POST /login:', err.message);
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
});

// GET /me — retornar admin logado
router.get('/me', requireAdminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, role, ativo, criado_em, ultimo_acesso FROM admin_usuarios WHERE id = $1',
      [req.adminUser.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Admin não encontrado' });

    res.json({ admin: rows[0] });
  } catch (err) {
    console.error('[auth-admin] GET /me:', err.message);
    res.status(500).json({ error: 'Erro ao buscar dados do admin' });
  }
});

module.exports = router;
