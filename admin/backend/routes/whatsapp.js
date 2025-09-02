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

// POST /api/admin/whatsapp/:licencaId/qr
router.post('/:licencaId/qr', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Simular geração de QR Code
    // Em produção, aqui seria feita a integração real com WhatsApp Web.js
    const qrCodeData = {
      qrCode: generateMockQRCode(),
      sessionId: `session_${licencaId}_${Date.now()}`,
      expiresIn: 60000, // 60 segundos
      status: 'waiting_scan'
    };

    // Log da ação
    db.logAction(
      req.user.userId,
      'GENERATE_WHATSAPP_QR',
      'whatsapp',
      licencaId,
      { 
        licenca_id: licencaId,
        session_id: qrCodeData.sessionId
      },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: qrCodeData,
      message: 'QR Code gerado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao gerar QR Code WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/whatsapp/:licencaId/status
router.get('/:licencaId/status', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Simular status do WhatsApp
    // Em produção, verificaria o status real da sessão
    const status = {
      connected: Math.random() > 0.5, // 50% chance de estar conectado
      sessionId: `session_${licencaId}`,
      lastActivity: new Date().toISOString(),
      phoneNumber: licenca.telefone || '+55119999999',
      qrExpired: false
    };

    res.json({
      licencaId,
      whatsappStatus: status
    });

  } catch (error) {
    console.error('Erro ao verificar status WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/whatsapp/:licencaId/disconnect
router.post('/:licencaId/disconnect', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Log da ação
    db.logAction(
      req.user.userId,
      'DISCONNECT_WHATSAPP',
      'whatsapp',
      licencaId,
      { licenca_id: licencaId },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso',
      licencaId
    });

  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/whatsapp/:licencaId/test-message
router.post('/:licencaId/test-message', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    const { message = 'Mensagem de teste da intranet Altclinic' } = req.body;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Simular envio de mensagem de teste
    const testResult = {
      sent: true,
      messageId: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: licenca.telefone || '+55119999999',
      message
    };

    // Log da ação
    db.logAction(
      req.user.userId,
      'SEND_WHATSAPP_TEST',
      'whatsapp',
      licencaId,
      { 
        licenca_id: licencaId,
        message_id: testResult.messageId,
        recipient: testResult.recipient
      },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      testResult,
      message: 'Mensagem de teste enviada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/whatsapp/:licencaId/logs
router.get('/:licencaId/logs', authenticateToken, (req, res) => {
  try {
    const { licencaId } = req.params;
    const { limit = 50 } = req.query;
    
    // Verificar se a licença existe
    const licenca = db.getLicencaById(licencaId);
    if (!licenca) {
      return res.status(404).json({
        error: 'Licença não encontrada'
      });
    }

    // Buscar logs relacionados ao WhatsApp desta licença
    const logs = db.db.prepare(`
      SELECT 
        al.*,
        au.name as admin_name
      FROM admin_logs al
      JOIN admin_users au ON al.admin_user_id = au.id
      WHERE al.resource_type = 'whatsapp' 
      AND al.resource_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(licencaId, parseInt(limit));

    res.json({
      licencaId,
      logs,
      total: logs.length
    });

  } catch (error) {
    console.error('Erro ao buscar logs WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/whatsapp/global-status
router.get('/global-status', authenticateToken, (req, res) => {
  try {
    // Simular status global do WhatsApp
    const globalStatus = {
      totalSessions: 25,
      connectedSessions: 18,
      disconnectedSessions: 7,
      lastUpdate: new Date().toISOString(),
      serviceStatus: 'operational',
      uptime: '99.8%'
    };

    // Buscar algumas estatísticas reais do banco
    const whatsappStats = db.db.prepare(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(CASE WHEN action LIKE '%WHATSAPP%' THEN 1 END) as whatsapp_actions
      FROM admin_logs
      WHERE created_at >= date('now', '-7 days')
    `).get();

    globalStatus.weeklyActions = whatsappStats.whatsapp_actions;

    res.json({
      globalStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar status global WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Função auxiliar para gerar QR Code mock
function generateMockQRCode() {
  // Em produção, retornaria o QR Code real do WhatsApp Web.js
  // Por enquanto, retorna um SVG simples como placeholder
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <rect x="20" y="20" width="160" height="160" fill="black"/>
      <rect x="40" y="40" width="120" height="120" fill="white"/>
      <rect x="60" y="60" width="80" height="80" fill="black"/>
      <text x="100" y="105" text-anchor="middle" fill="white" font-size="12">QR CODE</text>
      <text x="100" y="120" text-anchor="middle" fill="white" font-size="8">MOCK</text>
    </svg>
  `).toString('base64')}`;
}

module.exports = router;
