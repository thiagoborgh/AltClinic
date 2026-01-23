const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * ROTAS CRM - FIRESTORE
 * Gerenciamento de CRM com análise de pacientes e campanhas
 */

// GET /api/crm/metrics - Obter métricas do CRM
router.get('/metrics', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📊 Firestore: Buscando métricas CRM do tenant ${tenantId}`);

    // Buscar todos os pacientes
    const pacientesSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('pacientes')
      .get();

    let totalPacientes = 0;
    let pacientesAtivos = 0;
    let pacientesInativos = 0;
    let pacientesPerdidos = 0;
    let valorTotalGasto = 0;

    const hoje = new Date();
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    pacientesSnapshot.forEach(doc => {
      const paciente = doc.data();
      totalPacientes++;

      const ultimaConsulta = paciente.ultimaConsulta ? new Date(paciente.ultimaConsulta) : null;
      
      if (ultimaConsulta) {
        if (ultimaConsulta >= tresMesesAtras) {
          pacientesAtivos++;
        } else if (ultimaConsulta >= seisMesesAtras) {
          pacientesInativos++;
        } else {
          pacientesPerdidos++;
        }
      } else {
        pacientesInativos++;
      }

      valorTotalGasto += paciente.valorTotalGasto || 0;
    });

    const taxaRetencao = totalPacientes > 0 ? ((pacientesAtivos / totalPacientes) * 100).toFixed(1) : 0;
    const ticketMedio = totalPacientes > 0 ? (valorTotalGasto / totalPacientes).toFixed(2) : 0;

    const metrics = {
      totalPacientes,
      pacientesAtivos,
      pacientesInativos,
      pacientesPerdidos,
      taxaRetencao: parseFloat(taxaRetencao),
      ticketMedio: parseFloat(ticketMedio),
      valorTotalGasto,
      novosUltimoMes: 0, // TODO: implementar contagem de pacientes novos
      oportunidadesReativacao: pacientesInativos
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('❌ Erro ao buscar métricas CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar métricas CRM',
      error: error.message
    });
  }
});

// GET /api/crm/pacientes - Listar pacientes com filtros CRM
router.get('/pacientes', async (req, res) => {
  try {
    const { tenantId } = req;
    const { status, segmento, search, orderBy = 'nome', page = 1, limit = 50 } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`👥 Firestore: Buscando pacientes CRM do tenant ${tenantId}`);

    let query = db
      .collection('tenants')
      .doc(tenantId)
      .collection('pacientes');

    // Aplicar filtro de status
    if (status && status !== 'todos') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    let pacientes = [];
    snapshot.forEach(doc => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Filtrar por busca (nome, email, telefone)
    if (search) {
      const searchLower = search.toLowerCase();
      pacientes = pacientes.filter(p =>
        (p.nome?.toLowerCase().includes(searchLower)) ||
        (p.email?.toLowerCase().includes(searchLower)) ||
        (p.telefone?.includes(search))
      );
    }

    // Filtrar por segmento
    if (segmento) {
      pacientes = pacientes.filter(p => p.segmento?.id === parseInt(segmento));
    }

    // Ordenar
    pacientes.sort((a, b) => {
      if (orderBy === 'nome') {
        return (a.nome || '').localeCompare(b.nome || '');
      }
      if (orderBy === 'ultima_consulta') {
        return new Date(b.ultimaConsulta || 0) - new Date(a.ultimaConsulta || 0);
      }
      if (orderBy === 'valor_total') {
        return (b.valorTotalGasto || 0) - (a.valorTotalGasto || 0);
      }
      return 0;
    });

    // Paginação
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedPacientes = pacientes.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedPacientes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: pacientes.length,
        pages: Math.ceil(pacientes.length / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pacientes CRM:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pacientes CRM',
      error: error.message
    });
  }
});

// GET /api/crm/segmentos - Listar segmentos
router.get('/segmentos', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`🏷️ Firestore: Buscando segmentos CRM do tenant ${tenantId}`);

    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('segmentos_crm')
      .where('ativo', '==', true)
      .get();

    const segmentos = [];
    snapshot.forEach(doc => {
      segmentos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Se não houver segmentos, retornar segmentos padrão
    if (segmentos.length === 0) {
      const segmentosPadrao = [
        {
          id: '1',
          nome: 'Alto Valor',
          descricao: 'Pacientes com alto valor gasto',
          cor: '#4CAF50',
          ativo: true,
          tipo: 'automatico'
        },
        {
          id: '2',
          nome: 'Inativos Propensão',
          descricao: 'Pacientes inativos com potencial de retorno',
          cor: '#FF9800',
          ativo: true,
          tipo: 'automatico'
        },
        {
          id: '3',
          nome: 'Novos Clientes',
          descricao: 'Pacientes cadastrados recentemente',
          cor: '#2196F3',
          ativo: true,
          tipo: 'automatico'
        }
      ];

      res.json({
        success: true,
        data: segmentosPadrao
      });
      return;
    }

    res.json({
      success: true,
      data: segmentos
    });

  } catch (error) {
    console.error('❌ Erro ao buscar segmentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar segmentos',
      error: error.message
    });
  }
});

// POST /api/crm/segmento - Criar segmento
router.post('/segmento', async (req, res) => {
  try {
    const { tenantId } = req;
    const dados = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('🏷️ Firestore: Criando segmento CRM:', dados);

    const segmentoData = {
      ...dados,
      tenantId,
      ativo: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('segmentos_crm')
      .add(segmentoData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...segmentoData
      },
      message: 'Segmento criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar segmento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar segmento',
      error: error.message
    });
  }
});

// GET /api/crm/relatorios/inativos - Relatório de pacientes inativos
router.get('/relatorios/inativos', async (req, res) => {
  try {
    const { tenantId } = req;
    const { dias = 90 } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📊 Firestore: Gerando relatório de inativos (${dias} dias)`);

    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('pacientes')
      .get();

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(dias));

    const pacientesInativos = [];
    snapshot.forEach(doc => {
      const paciente = doc.data();
      const ultimaConsulta = paciente.ultimaConsulta ? new Date(paciente.ultimaConsulta) : null;
      
      if (ultimaConsulta && ultimaConsulta < dataLimite) {
        const diasInativo = Math.floor((new Date() - ultimaConsulta) / (1000 * 60 * 60 * 24));
        pacientesInativos.push({
          id: doc.id,
          ...paciente,
          diasInativo
        });
      }
    });

    // Ordenar por dias de inatividade (maior primeiro)
    pacientesInativos.sort((a, b) => b.diasInativo - a.diasInativo);

    res.json({
      success: true,
      data: {
        total: pacientesInativos.length,
        pacientes: pacientesInativos,
        filtro: {
          dias: parseInt(dias),
          dataLimite: dataLimite.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar relatório de inativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório',
      error: error.message
    });
  }
});

// GET /api/crm/templates - Listar templates de mensagens
router.get('/templates', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📝 Firestore: Buscando templates CRM do tenant ${tenantId}`);

    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('templates_crm')
      .where('ativo', '==', true)
      .get();

    const templates = [];
    snapshot.forEach(doc => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Se não houver templates, retornar templates padrão
    if (templates.length === 0) {
      const templatesPadrao = [
        {
          id: '1',
          nome: 'Boas-vindas',
          tipo: 'boas_vindas',
          conteudo: 'Olá {{nome}}! Bem-vindo(a) à nossa clínica! 😊',
          ativo: true
        },
        {
          id: '2',
          nome: 'Reativação',
          tipo: 'reativacao',
          conteudo: 'Oi {{nome}}! Sentimos sua falta! Que tal agendar uma nova sessão?',
          ativo: true
        },
        {
          id: '3',
          nome: 'Pós-consulta',
          tipo: 'pos_consulta',
          conteudo: 'Oi {{nome}}! Esperamos que tenha gostado da consulta. Como está se sentindo?',
          ativo: true
        }
      ];

      res.json({
        success: true,
        data: templatesPadrao
      });
      return;
    }

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('❌ Erro ao buscar templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar templates',
      error: error.message
    });
  }
});

// POST /api/crm/template - Criar template
router.post('/template', async (req, res) => {
  try {
    const { tenantId } = req;
    const dados = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('📝 Firestore: Criando template CRM:', dados);

    const templateData = {
      ...dados,
      tenantId,
      ativo: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('templates_crm')
      .add(templateData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...templateData
      },
      message: 'Template criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar template',
      error: error.message
    });
  }
});

// GET /api/crm/mensagens - Listar mensagens enviadas
router.get('/mensagens', async (req, res) => {
  try {
    const { tenantId } = req;
    const { pacienteId, tipo, limit = 50 } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`💬 Firestore: Buscando mensagens CRM do tenant ${tenantId}`);

    let query = db
      .collection('tenants')
      .doc(tenantId)
      .collection('mensagens_crm')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (pacienteId) {
      query = query.where('pacienteId', '==', pacienteId);
    }

    if (tipo) {
      query = query.where('tipo', '==', tipo);
    }

    const snapshot = await query.get();

    const mensagens = [];
    snapshot.forEach(doc => {
      mensagens.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: mensagens
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens',
      error: error.message
    });
  }
});

// POST /api/crm/mensagem - Enviar mensagem
router.post('/mensagem', async (req, res) => {
  try {
    const { tenantId } = req;
    const { pacienteId, tipo, conteudo, templateId } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('💬 Firestore: Enviando mensagem CRM');

    const mensagemData = {
      tenantId,
      pacienteId,
      tipo: tipo || 'manual',
      conteudo,
      templateId: templateId || null,
      status: 'enviada',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('mensagens_crm')
      .add(mensagemData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...mensagemData
      },
      message: 'Mensagem enviada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message
    });
  }
});

// GET /api/crm/automacoes - Listar automações
router.get('/automacoes', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`🤖 Firestore: Buscando automações CRM do tenant ${tenantId}`);

    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('automacoes_crm')
      .where('ativo', '==', true)
      .get();

    const automacoes = [];
    snapshot.forEach(doc => {
      automacoes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: automacoes
    });

  } catch (error) {
    console.error('❌ Erro ao buscar automações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar automações',
      error: error.message
    });
  }
});

// POST /api/crm/automacao - Criar automação
router.post('/automacao', async (req, res) => {
  try {
    const { tenantId } = req;
    const dados = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('🤖 Firestore: Criando automação CRM:', dados);

    const automacaoData = {
      ...dados,
      tenantId,
      ativo: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('automacoes_crm')
      .add(automacaoData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...automacaoData
      },
      message: 'Automação criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar automação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar automação',
      error: error.message
    });
  }
});

module.exports = router;
