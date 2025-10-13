const express = require('express');
const router = express.Router();

// GET /api/professional/schedule - Buscar horários
router.get('/schedule', (req, res) => {
  try {
    const { tenant, db } = req;
    const { professionalId } = req.query;
    
    // Query simples usando apenas colunas que existem
    let query = `
      SELECT 
        id,
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
      query += ' AND professional_name = ?';
      params.push(professionalId);
    }
    
    query += ' ORDER BY day_of_week, start_time';
    
    const schedules = db.prepare(query).all(...params);

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

    res.json({
      success: true,
      message: 'Horários encontrados com sucesso!',
      tenant: tenant.nome,
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
router.post('/schedule', (req, res) => {
  try {
    const { tenant, db } = req;
    const {
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
      (professional_name, day_of_week, start_time, end_time, is_available) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
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
      professional_name,
      day_of_week,
      start_time,
      end_time,
      is_available
    } = req.body;

    const updates = [];
    const values = [];

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

    // Processar cada horário
    for (const scheduleData of schedules) {
      const { action, id, data } = scheduleData;

      if (action === 'create') {
        const result = db.prepare(`
          INSERT INTO professional_schedules 
          (professional_name, day_of_week, start_time, end_time, is_available) 
          VALUES (?, ?, ?, ?, ?)
        `).run(
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

module.exports = router;