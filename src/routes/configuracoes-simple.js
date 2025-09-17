const express = require('express');
const router = express.Router();

// Rota básica de configurações
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Configurações - funcionalidade em desenvolvimento',
    data: {}
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Configurações salvas com sucesso',
    data: req.body
  });
});

module.exports = router;
