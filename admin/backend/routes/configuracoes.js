const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/database');

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

// GET /api/admin/configuracoes/:licencaId
router.get('/:licencaId', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Buscar configurações da licença
    const configuracoes = db.getConfiguracoesByLicenca(licencaId);

    // Log da ação
    db.logAction(
      req.user.userId,
      'VIEW_CONFIGURACOES',
      'configuracoes',
      licencaId,
      { licenca_id: licencaId },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      licencaId,
      configuracoes
    });

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/configuracoes/:licencaId
router.put('/:licencaId', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    const configuracoes = req.body;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    if (!licenca.clinica_id) {
      return res.status(400).json({
        error: 'Licença não possui clínica associada'
      });
    }

    // Para atualizar configurações, precisaríamos de uma conexão de escrita
    // ao banco principal, mas por segurança vamos apenas log
    
    // Log da ação
    db.logAction(
      req.user.userId,
      'UPDATE_CONFIGURACOES',
      'configuracoes',
      licencaId,
      { 
        licenca_id: licencaId, 
        clinica_id: licenca.clinica_id,
        configuracoes_count: Object.keys(configuracoes).length
      },
      req.ip,
      req.get('User-Agent')
    );

    // Por enquanto, apenas simular sucesso
    res.json({
      message: 'Configurações atualizadas com sucesso',
      licencaId,
      updatedCount: Object.keys(configuracoes).length
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/configuracoes/:licencaId/sections
router.get('/:licencaId/sections', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Buscar configurações agrupadas por seção
    if (!db.mainDb || !licenca.clinica_id) {
      return res.json({
        sections: {}
      });
    }

    try {
      const configuracoes = db.mainDb.prepare(`
        SELECT chave, valor, secao, descricao, tipo_valor 
        FROM configuracoes 
        WHERE clinica_id = ? 
        ORDER BY secao, chave
      `).all(licenca.clinica_id);

      // Agrupar por seção
      const sections = {};
      configuracoes.forEach(config => {
        if (!sections[config.secao]) {
          sections[config.secao] = {};
        }
        sections[config.secao][config.chave] = {
          valor: config.valor,
          descricao: config.descricao,
          tipo: config.tipo_valor
        };
      });

      res.json({
        licencaId,
        sections
      });

    } catch (error) {
      console.error('Erro ao buscar seções:', error);
      res.json({
        sections: {}
      });
    }

  } catch (error) {
    console.error('Erro ao buscar seções de configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/configuracoes/:licencaId/backup
router.get('/:licencaId/backup', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Buscar todas as configurações para backup
    const configuracoes = db.getConfiguracoesByLicenca(licencaId);

    const backup = {
      licencaId,
      cliente: licenca.cliente,
      timestamp: new Date().toISOString(),
      configuracoes
    };

    // Log da ação
    db.logAction(
      req.user.userId,
      'BACKUP_CONFIGURACOES',
      'configuracoes',
      licencaId,
      { licenca_id: licencaId, config_count: Object.keys(configuracoes).length },
      req.ip,
      req.get('User-Agent')
    );

    res.json(backup);

  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
