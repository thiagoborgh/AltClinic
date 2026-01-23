const express = require('express');
const router = express.Router();
const authUtil = require('../utils/auth');
const firestoreService = require('../services/firestoreService');

/**
 * ✅ Endpoint simplificado para integração com AgendaLite - FIRESTORE
 * Usa estrutura compatível com o frontend existente
 */

// Função auxiliar para formatar data
function formatDate(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Função auxiliar para obter data com offset em dias
function getDateWithOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

// GET /api/agenda/agendamentos - Listar agendamentos
router.get('/', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const tenantId = req.tenantId; // Vem do middleware extractTenantFirestore
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📅 Firestore: Buscando agendamentos do tenant ${tenantId}`);

    // Buscar agendamentos do Firestore
    const agendamentos = await firestoreService.getAgendamentos(tenantId, {
      data_inicio,
      data_fim
    });

    console.log(`📅 Firestore: Retornando ${agendamentos.length} agendamentos`);

    res.json({
      success: true,
      data: agendamentos
    });  } catch (error) {
    console.error('❌ Erro ao listar agendamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar agendamentos',
      error: error.message
    });
  }
});

// POST /api/agenda/agendamentos - Criar agendamento
router.post('/', async (req, res) => {
  try {
    const agendamentoData = req.body;
    const tenantId = req.tenantId; // Vem do middleware extractTenantFirestore
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }
    
    console.log('📝 Firestore: Criando agendamento:', agendamentoData);
    
    // Preparar dados para inserção
    const dados = {
      horario: agendamentoData.horario,
      data: agendamentoData.data || formatDate(new Date()),
      paciente: agendamentoData.paciente || '',
      procedimento: agendamentoData.procedimento || 'Consulta',
      status: agendamentoData.status || 'não confirmado',
      valor: parseFloat(agendamentoData.valor) || 0,
      observacoes: agendamentoData.observacoes || '',
      tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const agendamentoId = await firestoreService.createAgendamento(tenantId, dados);
    
    const agendamentoCriado = {
      id: agendamentoId,
      ...dados
    };
    
    console.log('✅ Firestore: Agendamento criado:', agendamentoCriado);
    
    res.status(201).json({
      success: true,
      data: agendamentoCriado,
      message: 'Agendamento criado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar agendamento',
      error: error.message
    });
  }
});

// PUT /api/agenda/agendamentos/:id - Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agendamentoData = req.body;
    const tenantId = req.tenantId; // Vem do middleware extractTenantFirestore
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }
    
    console.log(`📝 Firestore: Atualizando agendamento ${id}:`, agendamentoData);
    
    // Preparar dados para atualização
    const dados = {
      horario: agendamentoData.horario,
      data: agendamentoData.data,
      paciente: agendamentoData.paciente || '',
      procedimento: agendamentoData.procedimento || 'Consulta',
      status: agendamentoData.status || 'não confirmado',
      valor: parseFloat(agendamentoData.valor) || 0,
      observacoes: agendamentoData.observacoes || '',
      updated_at: new Date().toISOString()
    };
    
    await firestoreService.updateAgendamento(tenantId, id, dados);
    
    const agendamentoAtualizado = {
      id,
      ...dados,
      tenantId
    };
    
    console.log('✅ Firestore: Agendamento atualizado:', agendamentoAtualizado);
    
    res.json({
      success: true,
      data: agendamentoAtualizado,
      message: 'Agendamento atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar agendamento',
      error: error.message
    });
  }
});

// DELETE /api/agenda/agendamentos/:id - Deletar agendamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId; // Vem do middleware extractTenantFirestore
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }
    
    console.log(`🗑️ Firestore: Deletando agendamento ${id} do tenant ${tenantId}`);
    
    await firestoreService.deleteAgendamento(tenantId, id);
    
    console.log(`✅ Firestore: Agendamento ${id} deletado`);
    
    res.json({
      success: true,
      message: 'Agendamento deletado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar agendamento',
      error: error.message
    });
  }
});

module.exports = router;