const express = require('express');
const router = express.Router();
const authUtil = require('../utils/auth');

/**
 * Endpoint simplificado para integração com AgendaLite
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
    
    // Usar o database do tenant (vem do middleware)
    const db = req.db;

    let query = `
      SELECT 
        id,
        horario,
        data,
        paciente,
        procedimento,
        status,
        valor,
        observacoes,
        created_at,
        updated_at
      FROM agenda_agendamentos 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (data_inicio) {
      query += ` AND data >= ?`;
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ` AND data <= ?`;
      params.push(data_fim);
    }
    
    query += ` ORDER BY data, horario`;

    const agendamentos = db.prepare(query).all(...params);

    console.log(`📅 API: Retornando ${agendamentos.length} agendamentos`);

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
    
    console.log('📝 API: Criando agendamento:', agendamentoData);
    
    // Usar o database do tenant (vem do middleware)
    const db = req.db;
    
    // Preparar dados para inserção
    const dados = {
      horario: agendamentoData.horario,
      data: agendamentoData.data || formatDate(new Date()),
      paciente: agendamentoData.paciente || '',
      procedimento: agendamentoData.procedimento || 'Consulta',
      status: agendamentoData.status || 'não confirmado',
      valor: parseFloat(agendamentoData.valor) || 0,
      observacoes: agendamentoData.observacoes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = db.prepare(`
      INSERT INTO agenda_agendamentos 
      (horario, data, paciente, procedimento, status, valor, observacoes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dados.horario,
      dados.data,
      dados.paciente,
      dados.procedimento,
      dados.status,
      dados.valor,
      dados.observacoes,
      dados.created_at,
      dados.updated_at
    );
    
    const agendamentoCriado = {
      id: result.lastInsertRowid,
      ...dados
    };
    
    console.log('✅ API: Agendamento criado:', agendamentoCriado);
    
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
    
    console.log(`📝 API: Atualizando agendamento ${id}:`, agendamentoData);
    
    // Usar o database do tenant (vem do middleware)
    const db = req.db;
    
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
    
    const result = db.prepare(`
      UPDATE agenda_agendamentos 
      SET horario = ?, data = ?, paciente = ?, procedimento = ?, 
          status = ?, valor = ?, observacoes = ?, updated_at = ?
      WHERE id = ?
    `).run(
      dados.horario,
      dados.data,
      dados.paciente,
      dados.procedimento,
      dados.status,
      dados.valor,
      dados.observacoes,
      dados.updated_at,
      id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }
    
    const agendamentoAtualizado = {
      id: parseInt(id),
      ...dados
    };
    
    console.log('✅ API: Agendamento atualizado:', agendamentoAtualizado);
    
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
    
    console.log(`🗑️ API: Deletando agendamento ${id}`);
    
    // Usar o database do tenant (vem do middleware)
    const db = req.db;
    
    const result = db.prepare('DELETE FROM agenda_agendamentos WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado'
      });
    }
    
    console.log(`✅ API: Agendamento ${id} deletado`);
    
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