const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// POST /api/admin/financeiro/recorrencia
router.post('/recorrencia', authenticateToken, [
  body('tenantId').notEmpty().withMessage('Tenant ID é obrigatório'),
  body('valor').isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('frequencia').isIn(['mensal', 'anual']).withMessage('Frequência deve ser mensal ou anual'),
  body('diasGraca').isInt({ min: 0, max: 30 }).withMessage('Dias de graça deve ser entre 0 e 30'),
  body('lembretesDias').isInt({ min: 0, max: 30 }).withMessage('Dias para lembretes deve ser entre 0 e 30')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const config = {
      tenantId: req.body.tenantId,
      frequencia: req.body.frequencia,
      valor: parseFloat(req.body.valor),
      diasGraca: parseInt(req.body.diasGraca) || 7,
      chavePix: req.body.chavePix || null,
      cartaoNumero: req.body.cartaoNumero || null,
      cartaoNome: req.body.cartaoNome || null,
      cartaoValidade: req.body.cartaoValidade || null,
      cartaoCvv: req.body.cartaoCvv || null,
      agencia: req.body.agencia || null,
      conta: req.body.conta || null,
      lembretesDias: parseInt(req.body.lembretesDias) || 3,
      ativo: req.body.ativo || false
    };

    // Verificar se tenant existe
    const tenant = db.getLicencaById(config.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    // Salvar configuração
    db.saveRecorrenciaConfig(config);

    // Log da ação
    db.logAction(
      req.user.id,
      'CONFIGURACAO_RECORRENCIA',
      'recorrencia_config',
      config.tenantId,
      config,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Configuração de recorrência salva com sucesso',
      data: config
    });

  } catch (error) {
    console.error('Erro ao salvar configuração de recorrência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/financeiro/recorrencia/:tenantId
router.get('/recorrencia/:tenantId', authenticateToken, (req, res) => {
  try {
    const { tenantId } = req.params;

    const config = db.getRecorrenciaConfig(tenantId);

    if (!config) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Erro ao buscar configuração de recorrência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/financeiro/resumo
router.get('/resumo', authenticateToken, (req, res) => {
  try {
    // Dados mockados para o resumo financeiro
    // Em produção, calcular baseado nas configurações de recorrência ativas
    const resumo = {
      receitaMensal: 0,
      contasReceber: 0,
      lucroMensal: 0,
      percentualMeta: 0
    };

    // Calcular receita baseada nas configurações ativas
    const recorrenciasAtivas = db.db.prepare(`
      SELECT SUM(valor) as total FROM recorrencia_config WHERE ativo = 1
    `).get();

    resumo.receitaMensal = recorrenciasAtivas.total || 0;

    res.json({
      success: true,
      data: resumo
    });

  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/financeiro/pix
router.post('/pix', authenticateToken, [
  body('valor').isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('tenant').notEmpty().withMessage('Tenant é obrigatório')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { valor, descricao, tenant } = req.body;

    // Aqui seria integrada com uma API de PIX real
    // Por enquanto, gerar dados mockados
    const pixData = {
      codigo: `00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986540${valor.toFixed(2).replace('.', '')}5802BR5913ALTCLINIC6009SAOPAULO62070503***6304ABCD`,
      valor: valor,
      descricao: descricao || 'Mensalidade ALTCLINIC',
      tenant: tenant
    };

    res.json({
      success: true,
      data: pixData
    });

  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
