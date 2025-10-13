const express = require('express');
const router = express.Router();
const authUtil = require('../utils/auth');
const dbManager = require('../models/database');
const multiTenantDb = require('../models/MultiTenantDatabase');

// Rota de teste para verificar se as rotas estão funcionando
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rota professional funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para verificar se o tenant está funcionando
router.get('/test-tenant', (req, res) => {
  try {
    const tenant = req.tenant;
    const db = req.db;
    
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }
    
    // Testar uma query simples no banco tenant
    const count = db.prepare('SELECT COUNT(*) as count FROM professional_schedules').get();
    
    res.json({
      success: true,
      message: 'Tenant funcionando!',
      tenant: {
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug
      },
      schedules_count: count.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao testar tenant',
      error: error.message
    });
  }
});

// Rota de teste para a funcionalidade de schedule sem autenticação
router.get('/schedule-test', (req, res) => {
  try {
    const tenant = req.tenant;
    const db = req.db;
    
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }
    
    // Buscar horários do banco tenant
    const schedules = db.prepare(`
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
      ORDER BY day_of_week, start_time
    `).all();
    
    res.json({
      success: true,
      message: 'Horários encontrados com sucesso!',
      tenant: tenant.nome,
      data: schedules
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar horários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota de debug simples para testar a query
router.get('/schedule-debug', (req, res) => {
  try {
    const tenant = req.tenant;
    const db = req.db;
    
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }
    
    // Testar query mais simples
    const testQuery = `SELECT COUNT(*) as count FROM professional_schedules`;
    const result = db.prepare(testQuery).get();
    
    res.json({
      success: true,
      message: 'Debug OK',
      tenant: tenant.nome,
      query_result: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no debug',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route GET /professional/schedule
 * @desc Buscar horários do profissional da clínica
 */
router.get('/schedule', async (req, res) => {
  const logs = [];
  
  try {
    logs.push('🔍 DEBUG: Iniciando rota /schedule');
    
    const tenant = req.tenant;
    const db = req.db;
    
    logs.push(`🔍 DEBUG: tenant existe: ${!!tenant}`);
    logs.push(`🔍 DEBUG: db existe: ${!!db}`);
    
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não encontrado',
        logs
      });
    }
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Banco de dados não disponível',
        logs
      });
    }
    
    const { professionalId } = req.query;
    logs.push(`🔍 DEBUG: professionalId: ${professionalId}`);
    
    // Query simples e funcional
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
    
    logs.push('🔍 DEBUG: Preparando query...');
    const statement = db.prepare(query);
    logs.push('🔍 DEBUG: Query preparada, executando...');
    const schedules = statement.all(...params);
    logs.push(`🔍 DEBUG: schedules encontrados: ${schedules.length}`);

    // Organizar por dia da semana
    const schedulesByDay = {};
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    schedules.forEach(schedule => {
      const dayName = dayNames[schedule.day_of_week];
      if (!schedulesByDay[dayName]) {
        schedulesByDay[dayName] = [];
      }
      schedulesByDay[dayName].push({
        ...schedule,
        day_name: dayName
      });
    });

    logs.push('🔍 DEBUG: Dados organizados, enviando resposta...');

    res.json({
      success: true,
      data: {
        schedulesByDay,
        totalSchedules: schedules.length,
        tenant: tenant.nome
      },
      debug_logs: logs
    });

  } catch (error) {
    logs.push(`❌ Erro: ${error.message}`);
    logs.push(`❌ Stack: ${error.stack}`);
    
    console.error('❌ Erro ao buscar horários:', error);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      debug_logs: logs
    });
  }
});

/**
 * @route POST /professional/schedule
 * @desc Criar novo horário do profissional
 */
router.post('/schedule', async (req, res) => {
  const logs = [];
  try {
    logs.push('🔍 DEBUG POST: Iniciando criação de horário');
    logs.push(`🔍 DEBUG POST: Body recebido: ${JSON.stringify(req.body)}`);
    
    const {
      professional_id = null,
      professional_name = 'Profissional Principal',
      day_of_week,
      start_time,
      end_time,
      pause_start,
      pause_end,
      exception_date,
      exception_note,
      is_exception_day = 0
    } = req.body;

    logs.push(`🔍 DEBUG POST: Dados extraídos - day_of_week: ${day_of_week}, start_time: ${start_time}, end_time: ${end_time}`);

    // Validações
    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Dia da semana, horário de início e fim são obrigatórios',
        debug_logs: logs
      });
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({
        success: false,
        message: 'Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)',
        debug_logs: logs
      });
    }

    // Validar formato de horários (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de horário inválido. Use HH:MM',
        debug_logs: logs
      });
    }

    if (pause_start && !timeRegex.test(pause_start)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de horário de pausa inválido. Use HH:MM'
      });
    }

    if (pause_end && !timeRegex.test(pause_end)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de horário de pausa inválido. Use HH:MM'
      });
    }

    // Validar que horário de fim é após horário de início
    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: 'Horário de fim deve ser posterior ao horário de início'
      });
    }

    logs.push('🔍 DEBUG POST: Validações passaram, acessando banco...');
    
    // Usar o banco do tenant em vez do banco principal
    const db = req.db || dbManager.getDb();
    logs.push(`🔍 DEBUG POST: Banco obtido: ${!!db}`);

    // Verificar conflitos (só para horários regulares, não exceções)
    if (!is_exception_day) {
      logs.push('🔍 DEBUG POST: Verificando conflitos...');
      const conflictCheck = db.prepare(`
        SELECT id FROM professional_schedules 
        WHERE day_of_week = ? 
          AND is_available = 1 
          AND is_exception_day = 0
          AND (
            (start_time <= ? AND end_time > ?) OR
            (start_time < ? AND end_time >= ?) OR
            (start_time >= ? AND end_time <= ?)
          )
      `).get(
        parseInt(day_of_week), 
        start_time, start_time,
        end_time, end_time,
        start_time, end_time
      );

      if (conflictCheck) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um horário configurado que conflita com este período',
          debug_logs: logs
        });
      }
      logs.push('🔍 DEBUG POST: Nenhum conflito encontrado');
    }

    logs.push('🔍 DEBUG POST: Inserindo novo horário...');
    // Inserir novo horário usando apenas colunas que existem
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

    logs.push(`🔍 DEBUG POST: Horário inserido com ID: ${result.lastInsertRowid}`);

    const newSchedule = db.prepare(`
      SELECT * FROM professional_schedules WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Horário criado com sucesso',
      data: newSchedule,
      debug_logs: logs
    });

  } catch (error) {
    console.error('Erro ao criar horário:', error);
    logs.push(`🔍 DEBUG POST ERROR: ${error.message}`);
    logs.push(`🔍 DEBUG POST ERROR Stack: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      debug_logs: logs
    });
  }
});

/**
 * @route PUT /professional/schedule/:id
 * @desc Atualizar horário do profissional
 */
router.put('/schedule/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      professional_name,
      day_of_week,
      start_time,
      end_time,
      pause_start,
      pause_end,
      exception_date,
      exception_note,
      is_exception_day,
      is_available
    } = req.body;

    const db = dbManager.getDb();

    // Verificar se o horário existe e pertence à clínica
    const existingSchedule = db.prepare(`
      SELECT * FROM professional_schedules 
      WHERE id = ? AND clinica_id = ?
    `).get(id, req.user.clinica_id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Horário não encontrado'
      });
    }

    // Validar formato de horários se fornecidos
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (start_time && !timeRegex.test(start_time)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de horário de início inválido'
      });
    }

    if (end_time && !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de horário de fim inválido'
      });
    }

    // Construir query de atualização dinamicamente
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
    if (pause_start !== undefined) {
      updates.push('pause_start = ?');
      values.push(pause_start || null);
    }
    if (pause_end !== undefined) {
      updates.push('pause_end = ?');
      values.push(pause_end || null);
    }
    if (exception_date !== undefined) {
      updates.push('exception_date = ?');
      values.push(exception_date || null);
    }
    if (exception_note !== undefined) {
      updates.push('exception_note = ?');
      values.push(exception_note || null);
    }
    if (is_exception_day !== undefined) {
      updates.push('is_exception_day = ?');
      values.push(is_exception_day ? 1 : 0);
    }
    if (is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(is_available ? 1 : 0);
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
    console.error('Erro ao atualizar horário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route DELETE /professional/schedule/:id
 * @desc Excluir horário do profissional
 */
router.delete('/schedule/:id', authUtil.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDb();

    // Verificar se o horário existe e pertence à clínica
    const existingSchedule = db.prepare(`
      SELECT * FROM professional_schedules 
      WHERE id = ? AND clinica_id = ?
    `).get(id, req.user.clinica_id);

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
    console.error('Erro ao remover horário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /professional/schedule/availability
 * @desc Verificar disponibilidade em uma data específica
 */
router.get('/schedule/availability', authUtil.authenticate, async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Data é obrigatória (formato: YYYY-MM-DD)'
      });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0=Domingo, 1=Segunda, etc.

    const db = dbManager.getDb();

    // Buscar exceções para a data específica
    const exceptions = db.prepare(`
      SELECT * FROM professional_schedules 
      WHERE clinica_id = ? 
        AND is_exception_day = 1 
        AND exception_date = ?
        AND is_available = 1
    `).all(req.user.clinica_id, date);

    // Se há exceções, usar elas
    if (exceptions.length > 0) {
      const availableSlots = exceptions.map(exc => ({
        start_time: exc.start_time,
        end_time: exc.end_time,
        pause_start: exc.pause_start,
        pause_end: exc.pause_end,
        note: exc.exception_note
      }));

      return res.json({
        success: true,
        data: {
          date,
          day_of_week: dayOfWeek,
          has_exceptions: true,
          available_slots: availableSlots
        }
      });
    }

    // Buscar horários regulares para o dia da semana
    const regularSchedules = db.prepare(`
      SELECT * FROM professional_schedules 
      WHERE clinica_id = ? 
        AND day_of_week = ? 
        AND is_exception_day = 0
        AND is_available = 1
      ORDER BY start_time
    `).all(req.user.clinica_id, dayOfWeek);

    const availableSlots = regularSchedules.map(schedule => ({
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      pause_start: schedule.pause_start,
      pause_end: schedule.pause_end,
      professional_name: schedule.professional_name
    }));

    res.json({
      success: true,
      data: {
        date,
        day_of_week: dayOfWeek,
        has_exceptions: false,
        available_slots: availableSlots
      }
    });

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /professional/schedule/bulk-update
 * @desc Atualizar múltiplos horários de uma vez (útil para mudanças em massa)
 */
router.post('/schedule/bulk-update', authUtil.authenticate, async (req, res) => {
  try {
    const { schedules } = req.body;

    console.log('🔍 DEBUG bulk-update início:', {
      schedules_count: schedules?.length,
      user: req.user,
      clinica_id_available: req.user?.clinica_id,
      user_id: req.user?.id
    });

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array de horários é obrigatório'
      });
    }

    // O middleware já configurou o banco do tenant correto
    // Usar o banco que já está disponível no contexto do request
    const db = req.db || dbManager.getDb();
    
    console.log('🔍 DEBUG: Database info:', {
      tenantSlug: req.tenantSlug,
      hasReqDb: !!req.db,
      userTenantId: req.user?.tenantId,
      databasePath: db.name || 'unknown'
    });
    
    const transaction = db.transaction((schedules) => {
      const results = [];

      for (const schedule of schedules) {
        const { id, action, ...data } = schedule;

        if (action === 'create') {
          console.log('🔍 DEBUG bulk-update create:', {
            clinica_id: req.user?.clinica_id,
            professional_id: data.professional_id,
            professional_name: data.professional_name,
            day_of_week: data.day_of_week,
            start_time: data.start_time,
            end_time: data.end_time,
            exception_date: data.exception_date,
            is_exception_day: data.is_exception_day
          });

          // Obter clinica_id do usuário logado ou usar padrão
          let clinicaId = req.user?.clinica_id || req.user?.id;
          
          // Se ainda não temos clinica_id, usar 1 como padrão para desenvolvimento
          if (!clinicaId) {
            console.log('⚠️ DEBUG: clinica_id não encontrado, usando padrão 1');
            clinicaId = 1;
          }
          
          console.log('🔍 DEBUG clinica_id final:', clinicaId, 'de req.user:', req.user);
          
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

          Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
              updates.push(`${key} = ?`);
              values.push(data[key]);
            }
          });

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

      return results;
    });

    const results = transaction(schedules);

    res.json({
      success: true,
      message: `${results.length} operações executadas com sucesso`,
      data: results
    });

  } catch (error) {
    console.error('Erro na atualização em massa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /professional/schedule/setup-notifications
 * @desc Configurar notificações automáticas baseadas nos horários
 */
router.post('/schedule/setup-notifications', authUtil.authenticate, async (req, res) => {
  try {
    const {
      enable_opening_reminder = true,
      enable_closing_reminder = true,
      opening_reminder_minutes = 30,
      closing_reminder_minutes = 15,
      custom_opening_message,
      custom_closing_message,
      notification_phone // Número para receber as notificações
    } = req.body;

    if (!notification_phone) {
      return res.status(400).json({
        success: false,
        message: 'Número do telefone para notificações é obrigatório'
      });
    }

    const db = dbManager.getDb();

    // Verificar se já existe configuração de notificação
    const existingConfig = db.prepare(`
      SELECT * FROM professional_notification_config 
      WHERE clinica_id = ?
    `).get(req.user.clinica_id);

    const defaultOpeningMessage = `🌅 *Lembrete de Abertura*

Olá! O horário de funcionamento está se aproximando.

⏰ Abertura em ${opening_reminder_minutes} minutos
📋 Não esqueça de verificar os agendamentos do dia
💼 Tenha um excelente dia de trabalho!`;

    const defaultClosingMessage = `🌅 *Lembrete de Fechamento*

Atenção! O horário de funcionamento está se encerrando.

⏰ Fechamento em ${closing_reminder_minutes} minutos
📝 Lembre-se de finalizar os atendimentos
🔒 Verifique se tudo está organizado para o próximo dia`;

    if (existingConfig) {
      // Atualizar configuração existente
      db.prepare(`
        UPDATE professional_notification_config SET
          enable_opening_reminder = ?,
          enable_closing_reminder = ?,
          opening_reminder_minutes = ?,
          closing_reminder_minutes = ?,
          custom_opening_message = ?,
          custom_closing_message = ?,
          notification_phone = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE clinica_id = ?
      `).run(
        enable_opening_reminder ? 1 : 0,
        enable_closing_reminder ? 1 : 0,
        opening_reminder_minutes,
        closing_reminder_minutes,
        custom_opening_message || defaultOpeningMessage,
        custom_closing_message || defaultClosingMessage,
        notification_phone,
        req.user.clinica_id
      );
    } else {
      // Criar nova configuração
      // Primeiro, verificar se a tabela existe e criar se necessário
      db.prepare(`
        CREATE TABLE IF NOT EXISTS professional_notification_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clinica_id INTEGER NOT NULL,
          enable_opening_reminder BOOLEAN DEFAULT 1,
          enable_closing_reminder BOOLEAN DEFAULT 1,
          opening_reminder_minutes INTEGER DEFAULT 30,
          closing_reminder_minutes INTEGER DEFAULT 15,
          custom_opening_message TEXT,
          custom_closing_message TEXT,
          notification_phone TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
        )
      `).run();

      db.prepare(`
        INSERT INTO professional_notification_config 
        (clinica_id, enable_opening_reminder, enable_closing_reminder,
         opening_reminder_minutes, closing_reminder_minutes, 
         custom_opening_message, custom_closing_message, notification_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.clinica_id,
        enable_opening_reminder ? 1 : 0,
        enable_closing_reminder ? 1 : 0,
        opening_reminder_minutes,
        closing_reminder_minutes,
        custom_opening_message || defaultOpeningMessage,
        custom_closing_message || defaultClosingMessage,
        notification_phone
      );
    }

    res.json({
      success: true,
      message: 'Configuração de notificações salva com sucesso',
      data: {
        enable_opening_reminder,
        enable_closing_reminder,
        opening_reminder_minutes,
        closing_reminder_minutes,
        notification_phone
      }
    });

  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /professional/schedule/notifications-config
 * @desc Buscar configuração de notificações
 */
router.get('/schedule/notifications-config', authUtil.authenticate, async (req, res) => {
  try {
    const db = dbManager.getDb();

    // Verificar se a tabela existe
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='professional_notification_config'
    `).get();

    if (!tableExists) {
      return res.json({
        success: true,
        data: {
          enable_opening_reminder: true,
          enable_closing_reminder: true,
          opening_reminder_minutes: 30,
          closing_reminder_minutes: 15,
          custom_opening_message: '',
          custom_closing_message: '',
          notification_phone: ''
        }
      });
    }

    const config = db.prepare(`
      SELECT * FROM professional_notification_config 
      WHERE clinica_id = ?
    `).get(req.user.clinica_id);

    if (!config) {
      return res.json({
        success: true,
        data: {
          enable_opening_reminder: true,
          enable_closing_reminder: true,
          opening_reminder_minutes: 30,
          closing_reminder_minutes: 15,
          custom_opening_message: '',
          custom_closing_message: '',
          notification_phone: ''
        }
      });
    }

    res.json({
      success: true,
      data: {
        enable_opening_reminder: !!config.enable_opening_reminder,
        enable_closing_reminder: !!config.enable_closing_reminder,
        opening_reminder_minutes: config.opening_reminder_minutes,
        closing_reminder_minutes: config.closing_reminder_minutes,
        custom_opening_message: config.custom_opening_message,
        custom_closing_message: config.custom_closing_message,
        notification_phone: config.notification_phone
      }
    });

  } catch (error) {
    console.error('Erro ao buscar configuração de notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /professional/schedule/test-notification
 * @desc Testar envio de notificação
 */
router.post('/schedule/test-notification', authUtil.authenticate, async (req, res) => {
  try {
    const { message_type = 'opening' } = req.body;

    const db = dbManager.getDb();

    const config = db.prepare(`
      SELECT * FROM professional_notification_config 
      WHERE clinica_id = ?
    `).get(req.user.clinica_id);

    if (!config || !config.notification_phone) {
      return res.status(400).json({
        success: false,
        message: 'Configure um número de telefone para notificações primeiro'
      });
    }

    const testMessage = message_type === 'opening' ? 
      `🧪 *Teste - Lembrete de Abertura*\n\nEste é um teste da notificação automática de abertura.\n\n⏰ Funcionando perfeitamente!` :
      `🧪 *Teste - Lembrete de Fechamento*\n\nEste é um teste da notificação automática de fechamento.\n\n⏰ Funcionando perfeitamente!`;

    // Aqui você integraria com o Z-API ou Evolution API
    // Por enquanto, simular o envio
    console.log(`Enviando notificação de teste para ${config.notification_phone}:`, testMessage);

    res.json({
      success: true,
      message: 'Notificação de teste enviada com sucesso!',
      sent_to: config.notification_phone,
      message_content: testMessage
    });

  } catch (error) {
    console.error('Erro ao testar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /professional/schedule/validate-appointment
 * @desc Validar se um agendamento está dentro dos horários do profissional
 */
router.post('/schedule/validate-appointment', authUtil.authenticate, async (req, res) => {
  try {
    const { appointment_datetime, duration_minutes = 60 } = req.body;

    if (!appointment_datetime) {
      return res.status(400).json({
        success: false,
        message: 'Data e hora do agendamento são obrigatórias'
      });
    }

    const appointmentDate = new Date(appointment_datetime);
    const dayOfWeek = appointmentDate.getDay();
    const appointmentTime = appointmentDate.toTimeString().slice(0, 5); // HH:MM
    const dateString = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const db = dbManager.getDb();

    // Verificar se há exceções para a data específica
    const exceptions = db.prepare(`
      SELECT * FROM professional_schedules 
      WHERE clinica_id = ? 
        AND is_exception_day = 1 
        AND exception_date = ?
        AND is_available = 1
    `).all(req.user.clinica_id, dateString);

    let availableSchedules = [];

    if (exceptions.length > 0) {
      // Usar exceções se existirem
      availableSchedules = exceptions;
    } else {
      // Buscar horários regulares para o dia da semana
      availableSchedules = db.prepare(`
        SELECT * FROM professional_schedules 
        WHERE clinica_id = ? 
          AND day_of_week = ? 
          AND is_exception_day = 0
          AND is_available = 1
      `).all(req.user.clinica_id, dayOfWeek);
    }

    if (availableSchedules.length === 0) {
      return res.json({
        success: false,
        message: 'Profissional não atende neste dia',
        available: false
      });
    }

    // Verificar se o horário está dentro de algum dos períodos disponíveis
    let isWithinSchedule = false;
    let conflictWithPause = false;
    let validSchedule = null;

    for (const schedule of availableSchedules) {
      const startTime = schedule.start_time;
      const endTime = schedule.end_time;
      const pauseStart = schedule.pause_start;
      const pauseEnd = schedule.pause_end;

      // Verificar se está dentro do horário de funcionamento
      if (appointmentTime >= startTime && appointmentTime < endTime) {
        isWithinSchedule = true;
        validSchedule = schedule;

        // Calcular horário de fim do agendamento
        const appointmentEnd = new Date(appointmentDate.getTime() + duration_minutes * 60000);
        const appointmentEndTime = appointmentEnd.toTimeString().slice(0, 5);

        // Verificar se não termina após o horário de fechamento
        if (appointmentEndTime > endTime) {
          isWithinSchedule = false;
          continue;
        }

        // Verificar conflito com pausa se existir
        if (pauseStart && pauseEnd) {
          // Agendamento começa durante a pausa
          if (appointmentTime >= pauseStart && appointmentTime < pauseEnd) {
            conflictWithPause = true;
            isWithinSchedule = false;
            continue;
          }

          // Agendamento termina durante a pausa ou atravessa a pausa
          if (appointmentEndTime > pauseStart && appointmentTime < pauseEnd) {
            conflictWithPause = true;
            isWithinSchedule = false;
            continue;
          }
        }

        // Se chegou até aqui, o horário é válido
        break;
      }
    }

    if (!isWithinSchedule) {
      let message = 'Agendamento fora do horário de funcionamento';
      
      if (conflictWithPause) {
        message = 'Agendamento conflita com horário de pausa';
      }

      return res.json({
        success: false,
        message,
        available: false,
        schedule_info: availableSchedules.map(s => ({
          start_time: s.start_time,
          end_time: s.end_time,
          pause_start: s.pause_start,
          pause_end: s.pause_end,
          professional_name: s.professional_name
        }))
      });
    }

    res.json({
      success: true,
      message: 'Agendamento dentro do horário de funcionamento',
      available: true,
      schedule_info: {
        start_time: validSchedule.start_time,
        end_time: validSchedule.end_time,
        pause_start: validSchedule.pause_start,
        pause_end: validSchedule.pause_end,
        professional_name: validSchedule.professional_name
      }
    });

  } catch (error) {
    console.error('Erro ao validar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PATCH /professional/medico/:id/status
 * @desc Alterar status do médico (ativar/inativar)
 */
router.patch('/medico/:id/status', authUtil.authenticate, async (req, res) => {
  console.log('🩺 PATCH /medico/:id/status called - id:', req.params.id, 'body:', req.body);
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    const db = req.db;

    console.log('🩺 Status change request - ID:', id, 'New status:', ativo);

    if (typeof ativo !== 'boolean') {
      console.log('🩺 Invalid status type:', typeof ativo);
      return res.status(400).json({
        success: false,
        message: 'Status deve ser um valor booleano'
      });
    }

    // Verificar se o médico existe
    const medico = db.prepare(`
      SELECT id, nome, email FROM usuarios 
      WHERE id = ? AND role IN ('medico', 'admin', 'owner')
    `).get(id);

    if (!medico) {
      return res.status(404).json({
        success: false,
        message: 'Médico não encontrado'
      });
    }

    // Atualizar status
    const updateStmt = db.prepare(`
      UPDATE usuarios 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    updateStmt.run(ativo ? 'active' : 'inactive', id);

    res.json({
      success: true,
      message: ativo ? 'Médico ativado com sucesso' : 'Médico inativado com sucesso',
      medico: {
        id: medico.id,
        nome: medico.nome,
        email: medico.email,
        status: ativo ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Erro ao alterar status do médico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
