const express = require('express');
const router = express.Router();

// Rota básica para imagens de prontuário
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Imagens de prontuário - funcionalidade em desenvolvimento',
    data: []
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Imagem enviada com sucesso',
    data: { id: Date.now() }
  });
});

module.exports = router;
