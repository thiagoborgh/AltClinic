const express = require('express');
const firestoreService = require('../services/firestoreService');
const router = express.Router();

// Middleware para autenticar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_in_production', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    req.user = user;
    next();
  });
}

// 📝 GET /api/templates - Listar templates de mensagens
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { tipo } = req.query;

    console.log('📝 TEMPLATES: Buscando templates para tenant:', tenantId, 'tipo:', tipo);

    const templatesRef = firestoreService.db.collection('tenants').doc(tenantId).collection('templates_mensagens');

    let query = templatesRef;
    if (tipo) {
      query = query.where('tipo', '==', tipo);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const templates = [];
    snapshot.forEach(doc => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('📝 TEMPLATES: Encontrados', templates.length, 'templates');

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ TEMPLATES LIST ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar templates',
      error: error.message
    });
  }
});

// 📝 POST /api/templates - Criar novo template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { nome, tipo, mensagem, ativo = true } = req.body;

    console.log('📝 TEMPLATES: Criando template para tenant:', tenantId, 'tipo:', tipo);

    // Validações
    if (!nome || !nome.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nome do template é obrigatório'
      });
    }

    if (!tipo || !['confirmacao', 'lembrete', 'cancelamento', 'reagendamento'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo inválido. Deve ser: confirmacao, lembrete, cancelamento ou reagendamento'
      });
    }

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem do template é obrigatória'
      });
    }

    if (mensagem.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem deve ter no máximo 300 caracteres'
      });
    }

    // Verificar se já existe template com mesmo nome
    const existingTemplate = await firestoreService.db
      .collection('tenants')
      .doc(tenantId)
      .collection('templates_mensagens')
      .where('nome', '==', nome.trim())
      .where('tipo', '==', tipo)
      .get();

    if (!existingTemplate.empty) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um template com este nome para este tipo'
      });
    }

    const templateData = {
      nome: nome.trim(),
      tipo,
      mensagem: mensagem.trim(),
      ativo,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await firestoreService.db
      .collection('tenants')
      .doc(tenantId)
      .collection('templates_mensagens')
      .add(templateData);

    console.log('📝 TEMPLATES: Template criado com ID:', docRef.id);

    res.status(201).json({
      success: true,
      message: 'Template criado com sucesso',
      data: {
        id: docRef.id,
        ...templateData
      }
    });

  } catch (error) {
    console.error('❌ TEMPLATES CREATE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar template',
      error: error.message
    });
  }
});

// 📝 PUT /api/templates/:id - Atualizar template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { nome, mensagem, ativo } = req.body;

    console.log('📝 TEMPLATES: Atualizando template:', id, 'para tenant:', tenantId);

    const templateRef = firestoreService.db
      .collection('tenants')
      .doc(tenantId)
      .collection('templates_mensagens')
      .doc(id);

    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (nome !== undefined) {
      if (!nome || !nome.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nome do template é obrigatório'
        });
      }
      updateData.nome = nome.trim();
    }

    if (mensagem !== undefined) {
      if (!mensagem || !mensagem.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Mensagem do template é obrigatória'
        });
      }

      if (mensagem.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Mensagem deve ter no máximo 300 caracteres'
        });
      }
      updateData.mensagem = mensagem.trim();
    }

    if (ativo !== undefined) {
      updateData.ativo = ativo;
    }

    await templateRef.update(updateData);

    console.log('📝 TEMPLATES: Template atualizado:', id);

    res.json({
      success: true,
      message: 'Template atualizado com sucesso',
      data: {
        id,
        ...templateDoc.data(),
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ TEMPLATES UPDATE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar template',
      error: error.message
    });
  }
});

// 📝 DELETE /api/templates/:id - Deletar template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    console.log('📝 TEMPLATES: Deletando template:', id, 'para tenant:', tenantId);

    const templateRef = firestoreService.db
      .collection('tenants')
      .doc(tenantId)
      .collection('templates_mensagens')
      .doc(id);

    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    await templateRef.delete();

    console.log('📝 TEMPLATES: Template deletado:', id);

    res.json({
      success: true,
      message: 'Template deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ TEMPLATES DELETE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar template',
      error: error.message
    });
  }
});

// 📝 POST /api/templates/seed - Criar templates padrão (primeiro acesso)
router.post('/seed', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    console.log('📝 TEMPLATES: Criando templates padrão para tenant:', tenantId);

    const templatesPadrao = [
      {
        nome: 'Confirmação Padrão',
        tipo: 'confirmacao',
        mensagem: 'Olá, {{nome}} 🌸\n\nPassando para confirmar seu horário amanhã às {{hora}} na {{clinica}}.\n\nQualquer imprevisto, é só nos avisar 💖',
        ativo: true
      },
      {
        nome: 'Lembrete 24h',
        tipo: 'lembrete',
        mensagem: 'Oi {{nome}}! 👋\n\nLembrando que você tem horário marcado amanhã às {{hora}} com {{profissional}} na {{clinica}}.\n\nEstamos te esperando! 💅',
        ativo: true
      },
      {
        nome: 'Lembrete 1h',
        tipo: 'lembrete',
        mensagem: 'Olá {{nome}}! ⏰\n\nSeu horário é hoje às {{hora}} na {{clinica}}.\n\nChegue com 10 minutos de antecedência. Até já! ✨',
        ativo: true
      },
      {
        nome: 'Cancelamento',
        tipo: 'cancelamento',
        mensagem: 'Olá {{nome}} 😔\n\nInfelizmente precisamos cancelar seu horário de amanhã às {{hora}}.\n\nVamos reagendar para quando for melhor para você?\n\n{{clinica}}',
        ativo: true
      }
    ];

    const templatesCriados = [];

    for (const template of templatesPadrao) {
      // Verificar se já existe
      const existing = await firestoreService.db
        .collection('tenants')
        .doc(tenantId)
        .collection('templates_mensagens')
        .where('nome', '==', template.nome)
        .where('tipo', '==', template.tipo)
        .get();

      if (existing.empty) {
        const docRef = await firestoreService.db
          .collection('tenants')
          .doc(tenantId)
          .collection('templates_mensagens')
          .add({
            ...template,
            createdAt: new Date(),
            updatedAt: new Date()
          });

        templatesCriados.push({
          id: docRef.id,
          ...template
        });
      }
    }

    console.log('📝 TEMPLATES: Criados', templatesCriados.length, 'templates padrão');

    res.json({
      success: true,
      message: `${templatesCriados.length} templates padrão criados`,
      data: templatesCriados
    });

  } catch (error) {
    console.error('❌ TEMPLATES SEED ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar templates padrão',
      error: error.message
    });
  }
});

module.exports = router;