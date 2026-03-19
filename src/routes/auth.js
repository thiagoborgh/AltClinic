const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const AuthController = require('../controllers/auth-controller');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const senhaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas solicitações de recuperação de senha.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login',           loginLimiter, AuthController.login);
router.post('/refresh',         AuthController.refresh);
router.post('/logout',          authMiddleware, AuthController.logout);
router.get('/me',               authMiddleware, AuthController.me);
router.post('/esqueci-senha',   senhaLimiter, AuthController.esqueciSenha);
router.post('/redefinir-senha', AuthController.redefinirSenha);

module.exports = router;
module.exports.authenticateToken = authMiddleware;
