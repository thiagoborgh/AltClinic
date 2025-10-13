const express = require('express');
const router = express.Router();

// GET /api/professional/schedule - Buscar horários
router.get('/schedule', (req, res) => {
  try {
    const { tenant, db } = req;
    const { professionalId } = req.query;
    
    console.log('🔍 DEBUG GET schedule: professionalId recebido:', professionalId);
    
    // Query simples usando apenas colunas que existem
    let query = `
      SELECT 
        id,
        professional_id,
        professional_name,
        day_of_week,
        start_time,
        end_time,
        is_available,
        created_at,
        updated_at
      FROM professional_schedules 
      WHERE 1=1
    `;
    
    let params = [];
    
    if (professionalId) {
      // Buscar por professional_id (numérico)
      if (!isNaN(professionalId)) {
        query += ' AND professional_id = ?';
        params.push(parseInt(professionalId));
        console.log('🔍 DEBUG: Buscando por professional_id:', professionalId);
      } else {
        // Se não for numérico, buscar por nome
        query += ' AND professional_name = ?';
        params.push(professionalId);
        console.log('🔍 DEBUG: Buscando por nome:', professionalId);
      }
    }
    
    query += ' ORDER BY day_of_week, start_time';
    
    console.log('🔍 DEBUG: Query final:', query);
    console.log('🔍 DEBUG: Params:', params);
    
    const schedules = db.prepare(query).all(...params);
    console.log('🔍 DEBUG: Resultado schedules:', schedules.length, 'horários encontrados');
    console.log('🔍 DEBUG: Primeiros 3 horários:', JSON.stringify(schedules.slice(0, 3), null, 2));

    // Organizar por dia da semana
    const schedulesByDay = {};
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    schedules.forEach(schedule => {
      const dayName = daysOfWeek[schedule.day_of_week];
      if (!schedulesByDay[dayName]) {
        schedulesByDay[dayName] = [];
      }
      schedulesByDay[dayName].push(schedule);
    });

    console.log('🔍 DEBUG: schedulesByDay keys:', Object.keys(schedulesByDay));
    console.log('🔍 DEBUG: Total por dia:', Object.keys(schedulesByDay).map(day => `${day}: ${schedulesByDay[day].length}`));

    const response = {
      success: true,
      message: 'Horários encontrados com sucesso!',
      tenant: tenant.nome,
      data: schedules,
      schedulesByDay
    };

    console.log('🔍 DEBUG: Response final - success:', response.success, 'data length:', response.data.length);
    res.json(response);

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
router.post('/schedule', (req, res) => {
  try {
    const { tenant, db } = req;
    const {
      professional_id = 1,
      professional_name = 'Profissional Principal',
      day_of_week,
      start_time,
      end_time
    } = req.body;

    // Validações básicas
    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: day_of_week, start_time, end_time'
      });
    }

    // Inserir novo horário
    const result = db.prepare(`
      INSERT INTO professional_schedules 
      (professional_id, professional_name, day_of_week, start_time, end_time, is_available) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      professional_id || 1, // padrão para Dr. João Silva
      professional_name,
      parseInt(day_of_week),
      start_time,
      end_time,
      1 // is_available padrão true
    );

    res.json({
      success: true,
      message: 'Horário criado com sucesso',
      data: {
        id: result.lastInsertRowid,
        professional_name,
        day_of_week: parseInt(day_of_week),
        start_time,
        end_time,
        is_available: 1
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
router.put('/schedule/:id', (req, res) => {
  try {
    const { tenant, db } = req;
    const { id } = req.params;
    const {
      professional_id,
      professional_name,
      day_of_week,
      start_time,
      end_time,
      is_available
    } = req.body;

    const updates = [];
    const values = [];

    if (professional_id !== undefined) {
      updates.push('professional_id = ?');
      values.push(parseInt(professional_id));
    }

    if (professional_name !== undefined) {
      updates.push('professional_name = ?');
      values.push(professional_name);
    }

    if (day_of_week !== undefined) {
      updates.push('day_of_week = ?');
      values.push(parseInt(day_of_week));
    }

    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time);
    }

    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time);
    }

    if (is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(is_available ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo fornecido para atualização'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updateQuery = `
      UPDATE professional_schedules 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(...values);

    // Buscar horário atualizado
    const updatedSchedule = db.prepare(`
      SELECT * FROM professional_schedules WHERE id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Horário atualizado com sucesso',
      data: updatedSchedule
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

// DELETE /api/professional/schedule/:id - Deletar horário (soft delete)
router.delete('/schedule/:id', (req, res) => {
  try {
    const { tenant, db } = req;
    const { id } = req.params;

    // Verificar se horário existe
    const existingSchedule = db.prepare(`
      SELECT id FROM professional_schedules WHERE id = ?
    `).get(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Horário não encontrado'
      });
    }

    // Soft delete: marcar como indisponível
    db.prepare(`
      UPDATE professional_schedules 
      SET is_available = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);

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
router.post('/schedule/bulk-update', (req, res) => {
  try {
    const { tenant, db } = req;
    const { schedules = [] } = req.body;

    if (!Array.isArray(schedules)) {
      return res.status(400).json({
        success: false,
        message: 'schedules deve ser um array'
      });
    }

    const results = [];

    console.log('🔍 DEBUG bulk-update: schedules recebidos:', JSON.stringify(schedules.slice(0, 2), null, 2));

    // Processar cada horário
    for (const scheduleData of schedules) {
      console.log('🔍 DEBUG bulk-update: processando scheduleData:', JSON.stringify(scheduleData, null, 2));
      
      // Verificar se scheduleData é válido
      if (!scheduleData || typeof scheduleData !== 'object') {
        console.error('❌ ERROR: scheduleData inválido:', scheduleData);
        continue;
      }
      
      // Verificar se é formato novo (dados diretos) ou formato antigo (com action/data)
      let action, id, data;
      
      if (scheduleData.action && scheduleData.data) {
        // Formato antigo: { action: 'create', data: {...} }
        action = scheduleData.action;
        id = scheduleData.id;
        data = scheduleData.data;
      } else {
        // Formato novo: dados diretos do frontend
        action = 'create'; // assumir create para todos os novos dados
        data = scheduleData; // os dados estão no próprio objeto
      }
      
      console.log('🔍 DEBUG bulk-update: action:', action, 'data:', JSON.stringify(data, null, 2));

      // Verificar se data existe
      if (!data) {
        console.error('❌ ERROR: data é undefined para scheduleData:', scheduleData);
        continue; // pular este item
      }

      if (action === 'create') {
        const result = db.prepare(`
          INSERT INTO professional_schedules 
          (professional_id, professional_name, day_of_week, start_time, end_time, is_available) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          data.professional_id || 1, // padrão Dr. João Silva
          data.professional_name || 'Profissional Principal',
          data.day_of_week,
          data.start_time,
          data.end_time,
          data.is_available !== false ? 1 : 0
        );
        results.push({ action: 'create', id: result.lastInsertRowid });

      } else if (action === 'update' && id) {
        const updates = [];
        const values = [];

        if (data.professional_name !== undefined) {
          updates.push('professional_name = ?');
          values.push(data.professional_name);
        }

        if (data.day_of_week !== undefined) {
          updates.push('day_of_week = ?');
          values.push(data.day_of_week);
        }

        if (data.start_time !== undefined) {
          updates.push('start_time = ?');
          values.push(data.start_time);
        }

        if (data.end_time !== undefined) {
          updates.push('end_time = ?');
          values.push(data.end_time);
        }

        if (data.is_available !== undefined) {
          updates.push('is_available = ?');
          values.push(data.is_available ? 1 : 0);
        }

        if (updates.length > 0) {
          updates.push('updated_at = CURRENT_TIMESTAMP');
          values.push(id);

          db.prepare(`
            UPDATE professional_schedules 
            SET ${updates.join(', ')} 
            WHERE id = ?
          `).run(...values);
          results.push({ action: 'update', id });
        }

      } else if (action === 'delete' && id) {
        db.prepare(`
          UPDATE professional_schedules 
          SET is_available = 0, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(id);
        results.push({ action: 'delete', id });
      }
    }

    res.json({
      success: true,
      message: `Processados ${results.length} horários`,
      data: results
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

// POST /api/professional/schedule/bulk-save - Rota alternativa mais flexível
router.post('/schedule/bulk-save', (req, res) => {
  try {
    const { tenant, db } = req;
    const { schedules = [], professional_name = 'Profissional Principal' } = req.body;

    if (!Array.isArray(schedules)) {
      return res.status(400).json({
        success: false,
        message: 'schedules deve ser um array'
      });
    }

    console.log('🔍 DEBUG bulk-save: recebeu', schedules.length, 'horários');
    console.log('🔍 DEBUG bulk-save: primeiro item:', JSON.stringify(schedules[0], null, 2));

    const results = [];

    // Limpar horários existentes para este profissional (se necessário)
    // db.prepare('DELETE FROM professional_schedules WHERE professional_name = ?').run(professional_name);

    // Inserir novos horários
    for (const schedule of schedules) {
      try {
        const result = db.prepare(`
          INSERT INTO professional_schedules 
          (professional_id, professional_name, day_of_week, start_time, end_time, is_available) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          schedule.professional_id || 1,
          schedule.professional_name || professional_name,
          parseInt(schedule.day_of_week || schedule.dayOfWeek || 0),
          schedule.start_time || schedule.startTime || schedule.horario?.split(' - ')[0],
          schedule.end_time || schedule.endTime || schedule.horario?.split(' - ')[1],
          schedule.is_available !== false ? 1 : 0
        );
        results.push({ action: 'create', id: result.lastInsertRowid });
      } catch (insertError) {
        console.error('❌ Erro ao inserir horário:', insertError, 'dados:', schedule);
        // Continuar com outros horários
      }
    }

    res.json({
      success: true,
      message: `Processados ${results.length} de ${schedules.length} horários`,
      data: results
    });

  } catch (error) {
    console.error(`❌ Erro no bulk-save:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/professional/schedules/all - Deletar todos os horários de um profissional
router.delete('/schedules/all', (req, res) => {
  try {
    const { tenant, db } = req;
    const { professionalId } = req.query;
    
    console.log('🗑️ DEBUG delete-all: professionalId recebido:', professionalId);
    
    if (!professionalId) {
      return res.status(400).json({
        success: false,
        message: 'professionalId é obrigatório'
      });
    }
    
    // Contar quantos registros serão deletados
    let countQuery = `SELECT COUNT(*) as total FROM professional_schedules WHERE `;
    let deleteQuery = `DELETE FROM professional_schedules WHERE `;
    let params = [];
    
    if (!isNaN(professionalId)) {
      // Se for numérico, buscar por professional_id
      countQuery += 'professional_id = ?';
      deleteQuery += 'professional_id = ?';
      params.push(parseInt(professionalId));
      console.log('🗑️ DEBUG: Deletando por professional_id:', professionalId);
    } else {
      // Se não for numérico, buscar por nome
      countQuery += 'professional_name = ?';
      deleteQuery += 'professional_name = ?';
      params.push(professionalId);
      console.log('🗑️ DEBUG: Deletando por nome:', professionalId);
    }
    
    // Contar registros antes de deletar
    const countResult = db.prepare(countQuery).get(...params);
    console.log('🗑️ DEBUG: Registros encontrados para deleção:', countResult.total);
    
    if (countResult.total === 0) {
      return res.json({
        success: true,
        message: 'Nenhum horário encontrado para deletar',
        deletedCount: 0
      });
    }
    
    // Executar deleção
    const deleteResult = db.prepare(deleteQuery).run(...params);
    console.log('🗑️ DEBUG: Resultado da deleção:', deleteResult);
    
    res.json({
      success: true,
      message: `${deleteResult.changes} horários deletados com sucesso`,
      deletedCount: deleteResult.changes
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