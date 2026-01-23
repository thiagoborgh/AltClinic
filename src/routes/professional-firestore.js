const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');
const admin = require('firebase-admin');

// Obter referência do Firestore
const db = admin.firestore();

/**
 * ✅ ROTAS DE PROFISSIONAIS MÉDICOS - FIRESTORE
 */

// GET /api/professional/medicos - Buscar todos os médicos
router.get('/medicos', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { nome, especialidade, crm, status } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('🔍 Firestore GET medicos: tenantId:', tenantId, 'filtros:', { nome, especialidade, crm, status });

    let query = db.collection('tenants').doc(tenantId).collection('medicos');

    // Aplicar filtros
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const medicos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      // Filtros adicionais (nome, crm, especialidade) - fazer no cliente pois Firestore tem limitações
      let incluir = true;
      
      if (nome && !data.nome?.toLowerCase().includes(nome.toLowerCase())) {
        incluir = false;
      }
      if (crm && !data.crm?.toLowerCase().includes(crm.toLowerCase())) {
        incluir = false;
      }
      if (especialidade && data.especialidade !== especialidade) {
        incluir = false;
      }

      if (incluir) {
        medicos.push({
          id: doc.id,
          ...data
        });
      }
    });

    console.log(`✅ Firestore: ${medicos.length} médicos encontrados`);

    res.json({
      success: true,
      data: medicos,
      message: medicos.length > 0 ? 'Médicos encontrados' : 'Nenhum médico cadastrado'
    });

  } catch (error) {
    console.error(`❌ Erro ao buscar médicos:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/professional/medicos/:id - Buscar médico por ID
router.get('/medicos/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('🔍 Firestore GET medico by ID:', id, 'tenantId:', tenantId);

    const doc = await db.collection('tenants').doc(tenantId).collection('medicos').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao buscar médico:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/professional/medicos - Criar novo médico
router.post('/medicos', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { nome, crm, especialidade, telefone, email, observacoes } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    // Validações
    if (!nome || !crm || !especialidade || !telefone) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: nome, crm, especialidade, telefone'
      });
    }

    console.log('➕ Firestore POST medico:', { nome, crm, especialidade, telefone });

    // Verificar se CRM já existe
    const crmQuery = await db.collection('tenants').doc(tenantId).collection('medicos')
      .where('crm', '==', crm)
      .get();

    if (!crmQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'CRM já cadastrado no sistema'
      });
    }

    const medicoData = {
      nome,
      crm,
      especialidade,
      telefone,
      email: email || null,
      observacoes: observacoes || null,
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('tenants').doc(tenantId).collection('medicos').add(medicoData);

    console.log('✅ Médico criado com ID:', docRef.id);

    res.status(201).json({
      success: true,
      message: 'Médico cadastrado com sucesso',
      data: {
        id: docRef.id,
        ...medicoData
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao criar médico:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/professional/medicos/:id - Atualizar médico
router.put('/medicos/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { nome, crm, especialidade, telefone, email, observacoes } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('✏️ Firestore PUT medico:', id, { nome, crm, especialidade, telefone });

    // Verificar se médico existe
    const docRef = db.collection('tenants').doc(tenantId).collection('medicos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    // Se CRM foi alterado, verificar duplicatas
    if (crm && crm !== doc.data().crm) {
      const crmQuery = await db.collection('tenants').doc(tenantId).collection('medicos')
        .where('crm', '==', crm)
        .get();

      if (!crmQuery.empty && crmQuery.docs[0].id !== id) {
        return res.status(409).json({
          success: false,
          message: 'CRM já cadastrado para outro médico'
        });
      }
    }

    const updateData = {
      ...(nome && { nome }),
      ...(crm && { crm }),
      ...(especialidade && { especialidade }),
      ...(telefone && { telefone }),
      ...(email !== undefined && { email: email || null }),
      ...(observacoes !== undefined && { observacoes: observacoes || null }),
      updated_at: new Date().toISOString()
    };

    await docRef.update(updateData);

    console.log('✅ Médico atualizado:', id);

    res.json({
      success: true,
      message: 'Médico atualizado com sucesso',
      data: {
        id,
        ...doc.data(),
        ...updateData
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao atualizar médico:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/professional/medico/:id/status - Ativar/Inativar médico
router.patch('/medico/:id/status', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { ativo } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('🔄 Firestore PATCH medico status:', id, 'ativo:', ativo);

    const docRef = db.collection('tenants').doc(tenantId).collection('medicos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    await docRef.update({
      status: ativo ? 'ativo' : 'inativo',
      updated_at: new Date().toISOString()
    });

    console.log('✅ Status do médico alterado:', id, 'para', ativo ? 'ativo' : 'inativo');

    res.json({
      success: true,
      message: `Médico ${ativo ? 'ativado' : 'inativado'} com sucesso`,
      data: {
        id,
        status: ativo ? 'ativo' : 'inativo'
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao alterar status do médico:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/professional/medicos/:id - Deletar médico
router.delete('/medicos/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('🗑️ Firestore DELETE medico:', id);

    const docRef = db.collection('tenants').doc(tenantId).collection('medicos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    await docRef.delete();

    console.log('✅ Médico deletado:', id);

    res.json({
      success: true,
      message: 'Médico deletado com sucesso'
    });

  } catch (error) {
    console.error(`❌ Erro ao deletar médico:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/professional/medicos/:id/enviar-convite - Enviar convite de acesso
router.post('/medicos/:id/enviar-convite', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { email } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    console.log('📧 Enviando convite de acesso para:', email, 'medicoId:', id);

    // Buscar dados do médico
    const docRef = db.collection('tenants').doc(tenantId).collection('medicos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    const medico = doc.data();

    // Gerar token de convite (válido por 7 dias)
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');
    const token = jwt.sign(
      {
        medicoId: id,
        tenantId: tenantId,
        email: email,
        tipo: 'convite_profissional'
      },
      process.env.JWT_SECRET || 'secret-key-default',
      { expiresIn: '7d' }
    );

    // Salvar token no Firestore
    await db.collection('tenants').doc(tenantId).collection('convites_profissionais').add({
      medicoId: id,
      email: email,
      token: token,
      status: 'pendente',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Enviar email (aqui você integraria com seu serviço de email)
    const linkConvite = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/aceitar-convite?token=${token}`;
    
    console.log('📧 Link do convite gerado:', linkConvite);
    console.log('📧 TODO: Implementar envio de email com o link');

    // TODO: Integrar com serviço de email (SendGrid, AWS SES, etc)
    // await emailService.enviarConviteProfissional({
    //   to: email,
    //   nome: medico.nome,
    //   link: linkConvite
    // });

    res.json({
      success: true,
      message: 'Convite enviado com sucesso',
      data: {
        email: email,
        linkConvite: linkConvite, // Remover em produção
        expiresIn: '7 dias'
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao enviar convite:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * ✅ ROTAS DE GRADES DE HORÁRIOS PROFISSIONAIS - FIRESTORE
 */

// GET /api/professional/schedule - Buscar horários
router.get('/schedule', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { professionalId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }
    
    console.log('🔍 Firestore GET schedule: professionalId:', professionalId, 'tenantId:', tenantId);
    
    const schedules = await firestoreService.getProfessionalSchedules(tenantId, professionalId);
    
    console.log(`✅ Firestore: ${schedules.length} horários encontrados`);

    // Organizar por dia da semana
    const schedulesByDay = {};
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    schedules.forEach(schedule => {
      const dayName = daysOfWeek[schedule.day_of_week] || 'Desconhecido';
      if (!schedulesByDay[dayName]) {
        schedulesByDay[dayName] = [];
      }
      schedulesByDay[dayName].push(schedule);
    });

    res.json({
      success: true,
      message: schedules.length > 0 ? 'Horários encontrados com sucesso!' : 'Nenhum horário cadastrado',
      data: schedules,
      schedulesByDay
    });

  } catch (error) {
    console.error(`❌ Erro ao buscar horários:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/professional/schedule - Criar horário
router.post('/schedule', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      professional_id = 1,
      professional_name = 'Profissional Principal',
      day_of_week,
      start_time,
      end_time,
      is_available = true
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    // Validações básicas
    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: day_of_week, start_time, end_time'
      });
    }

    const scheduleData = {
      professional_id: parseInt(professional_id),
      professional_name,
      day_of_week: parseInt(day_of_week),
      start_time,
      end_time,
      is_available
    };

    const scheduleId = await firestoreService.createProfessionalSchedule(tenantId, scheduleData);

    res.json({
      success: true,
      message: 'Horário criado com sucesso',
      data: {
        id: scheduleId,
        ...scheduleData
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao criar horário:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/professional/schedule/:id - Atualizar horário
router.put('/schedule/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const updateData = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;

    // Converter tipos se necessário
    if (updateData.professional_id) {
      updateData.professional_id = parseInt(updateData.professional_id);
    }
    if (updateData.day_of_week !== undefined) {
      updateData.day_of_week = parseInt(updateData.day_of_week);
    }

    await firestoreService.updateProfessionalSchedule(tenantId, id, updateData);

    res.json({
      success: true,
      message: 'Horário atualizado com sucesso',
      data: { id, ...updateData }
    });

  } catch (error) {
    console.error(`❌ Erro ao atualizar horário:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/professional/schedule/:id - Deletar horário
router.delete('/schedule/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    await firestoreService.deleteProfessionalSchedule(tenantId, id);

    res.json({
      success: true,
      message: 'Horário removido com sucesso'
    });

  } catch (error) {
    console.error(`❌ Erro ao deletar horário:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/professional/schedule/bulk-update - Atualização em lote
router.post('/schedule/bulk-update', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { schedules = [] } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    if (!Array.isArray(schedules)) {
      return res.status(400).json({
        success: false,
        message: 'schedules deve ser um array'
      });
    }

    console.log('🔄 Firestore bulk-update: processando', schedules.length, 'horários');

    // Processar cada horário
    const processedSchedules = schedules.map(schedule => {
      // Normalizar dados
      const data = schedule.data || schedule;
      
      return {
        ...(schedule.id && { id: schedule.id }),
        professional_id: parseInt(data.professional_id || 1),
        professional_name: data.professional_name || 'Profissional Principal',
        day_of_week: parseInt(data.day_of_week || 0),
        start_time: data.start_time,
        end_time: data.end_time,
        is_available: data.is_available !== false
      };
    });

    await firestoreService.bulkUpdateProfessionalSchedules(tenantId, processedSchedules);

    res.json({
      success: true,
      message: `Processados ${schedules.length} horários`,
      data: processedSchedules.length
    });

  } catch (error) {
    console.error(`❌ Erro no bulk-update:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/professional/schedules/all - Deletar todos os horários de um profissional
router.delete('/schedules/all', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { professionalId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }
    
    if (!professionalId) {
      return res.status(400).json({
        success: false,
        message: 'professionalId é obrigatório'
      });
    }
    
    console.log('🗑️ Firestore: Deletando horários do profissional:', professionalId);
    
    const deletedCount = await firestoreService.deleteAllProfessionalSchedules(tenantId, professionalId);
    
    res.json({
      success: true,
      message: `${deletedCount} horários deletados com sucesso`,
      deletedCount
    });
    
  } catch (error) {
    console.error(`❌ Erro ao deletar todos os horários:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
