const express = require('express');
const router = express.Router();
const dbManager = require('../models/database');

// Middleware simples para simular autenticação
const simpleAuth = (req, res, next) => {
  // Por enquanto, apenas passar adiante
  next();
};

// GET /api/configuracoes/health - Health check específico
router.get('/health', (req, res) => {
  try {
    const db = dbManager.getDb();
    // Teste básico de conexão com o banco
    const result = db.prepare('SELECT 1 as test').get();
    
    res.json({
      success: true,
      message: 'API de configurações funcionando',
      timestamp: new Date().toISOString(),
      database: result ? 'conectado' : 'erro'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no health check',
      error: error.message
    });
  }
});

// GET /api/configuracoes - Listar todas as configurações
router.get('/', simpleAuth, (req, res) => {
  try {
    const db = dbManager.getDb();
    
    const configuracoes = db.prepare(`
      SELECT secao, chave, valor, descricao, tipo_valor 
      FROM configuracoes 
      WHERE clinica_id = ?
      ORDER BY secao, chave
    `).all(1);
    
    // Agrupar por seção
    const grouped = configuracoes.reduce((acc, config) => {
      if (!acc[config.secao]) {
        acc[config.secao] = {};
      }
      acc[config.secao][config.chave] = {
        valor: config.valor,
        descricao: config.descricao,
        tipo: config.tipo_valor
      };
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: grouped,
      total: configuracoes.length
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// GET /api/configuracoes/:secao - Configurações de uma seção específica
router.get('/:secao', simpleAuth, (req, res) => {
  try {
    const { secao } = req.params;
    const db = dbManager.getDb();
    
    const configuracoes = db.prepare(`
      SELECT chave, valor, descricao, tipo_valor 
      FROM configuracoes 
      WHERE clinica_id = ? AND secao = ?
      ORDER BY chave
    `).all(1, secao);
    
    if (configuracoes.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Nenhuma configuração encontrada para a seção '${secao}'`
      });
    }
    
    const config = configuracoes.reduce((acc, item) => {
      acc[item.chave] = {
        valor: item.valor,
        descricao: item.descricao,
        tipo: item.tipo_valor
      };
      return acc;
    }, {});
    
    res.json({
      success: true,
      secao,
      data: config,
      total: configuracoes.length
    });
  } catch (error) {
    console.error('Erro ao buscar configurações da seção:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// POST /api/configuracoes - Salvar configurações
router.post('/', simpleAuth, (req, res) => {
  try {
    const db = dbManager.getDb();
    const { secao, chave, valor } = req.body;
    
    if (!secao || !chave) {
      return res.status(400).json({
        success: false,
        message: 'Seção e chave são obrigatórias'
      });
    }
    
    db.prepare(`
      INSERT OR REPLACE INTO configuracoes 
      (clinica_id, secao, chave, valor, atualizado_em) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(1, secao, chave, valor || '');
    
    res.json({
      success: true,
      message: 'Configuração salva com sucesso',
      data: { secao, chave, valor }
    });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// GET /api/configuracoes/teste/ping - Rota de teste
router.get('/teste/ping', (req, res) => {
  res.json({
    success: true,
    message: 'API de configurações está funcionando!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
