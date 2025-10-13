const cron = require('node-cron');
const dbManager = require('../models/database');

class ProfessionalScheduleNotifications {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Inicializar o sistema de notificações
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('⏰ Sistema de notificações já inicializado');
      return;
    }

    try {
      console.log('🚀 Inicializando sistema de notificações de horários...');
      
      // Verificar a cada minuto se há notificações para enviar
      cron.schedule('* * * * *', async () => {
        await this.checkAndSendNotifications();
      });

      this.isInitialized = true;
      console.log('✅ Sistema de notificações inicializado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar notificações:', error);
    }
  }

  /**
   * Verificar e enviar notificações baseadas nos horários
   */
  async checkAndSendNotifications() {
    try {
      const db = dbManager.getDb();
      
      // Verificar se a tabela de configuração existe e criar se necessário
      try {
        db.prepare('SELECT 1 FROM professional_notification_config LIMIT 1').get();
      } catch (error) {
        if (error.code === 'SQLITE_ERROR') {
          console.log('🔧 Criando tabela de configuração de notificações...');
          db.exec(`
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
          `);
          console.log('✅ Tabela de configuração criada');
        }
      }
      
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // Buscar todas as clínicas com configuração de notificação
      const clinicasQuery = `
        SELECT DISTINCT 
          pnc.clinica_id,
          pnc.enable_opening_reminder,
          pnc.enable_closing_reminder,
          pnc.opening_reminder_minutes,
          pnc.closing_reminder_minutes,
          pnc.custom_opening_message,
          pnc.custom_closing_message,
          pnc.notification_phone,
          c.nome as clinica_nome
        FROM professional_notification_config pnc
        JOIN clinica c ON c.id = pnc.clinica_id
        WHERE (pnc.enable_opening_reminder = 1 OR pnc.enable_closing_reminder = 1)
          AND pnc.notification_phone IS NOT NULL
          AND pnc.notification_phone != ''
      `;

      const clinicas = db.prepare(clinicasQuery).all();

      for (const clinica of clinicas) {
        await this.processClinicaNotifications(clinica, currentDay, currentTime, currentDate);
      }

    } catch (error) {
      console.error('❌ Erro ao verificar notificações:', error);
    }
  }

  /**
   * Processar notificações para uma clínica específica
   */
  async processClinicaNotifications(clinica, currentDay, currentTime, currentDate) {
    try {
      const db = dbManager.getDb();

      // Buscar horários para hoje (primeiro verificar exceções, depois horários regulares)
      let schedules = db.prepare(`
        SELECT * FROM professional_schedules 
        WHERE clinica_id = ? 
          AND is_exception_day = 1 
          AND exception_date = ?
          AND is_active = 1
      `).all(clinica.clinica_id, currentDate);

      if (schedules.length === 0) {
        schedules = db.prepare(`
          SELECT * FROM professional_schedules 
          WHERE clinica_id = ? 
            AND day_of_week = ? 
            AND is_exception_day = 0
            AND is_active = 1
        `).all(clinica.clinica_id, currentDay);
      }

      for (const schedule of schedules) {
        // Verificar notificação de abertura
        if (clinica.enable_opening_reminder && schedule.start_time) {
          await this.checkOpeningNotification(clinica, schedule, currentTime);
        }

        // Verificar notificação de fechamento
        if (clinica.enable_closing_reminder && schedule.end_time) {
          await this.checkClosingNotification(clinica, schedule, currentTime);
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao processar notificações da clínica ${clinica.clinica_id}:`, error);
    }
  }

  /**
   * Verificar se deve enviar notificação de abertura
   */
  async checkOpeningNotification(clinica, schedule, currentTime) {
    try {
      const reminderTime = this.subtractMinutes(schedule.start_time, clinica.opening_reminder_minutes);
      
      if (currentTime === reminderTime) {
        const notificationKey = `opening_${clinica.clinica_id}_${schedule.id}_${new Date().toDateString()}`;
        
        // Evitar envios duplicados
        if (this.jobs.has(notificationKey)) {
          return;
        }

        this.jobs.set(notificationKey, true);

        const message = clinica.custom_opening_message || 
          `🌅 *Lembrete de Abertura*\n\nOlá! O horário de funcionamento está se aproximando.\n\n⏰ Abertura em ${clinica.opening_reminder_minutes} minutos (${schedule.start_time})\n📋 Não esqueça de verificar os agendamentos do dia\n💼 Tenha um excelente dia de trabalho!`;

        await this.sendNotification(clinica.notification_phone, message, clinica.clinica_id);
        
        console.log(`📩 Notificação de abertura enviada para clínica ${clinica.clinica_nome}`);

        // Limpar cache após 1 hora
        setTimeout(() => {
          this.jobs.delete(notificationKey);
        }, 60 * 60 * 1000);
      }

    } catch (error) {
      console.error('❌ Erro ao verificar notificação de abertura:', error);
    }
  }

  /**
   * Verificar se deve enviar notificação de fechamento
   */
  async checkClosingNotification(clinica, schedule, currentTime) {
    try {
      const reminderTime = this.subtractMinutes(schedule.end_time, clinica.closing_reminder_minutes);
      
      if (currentTime === reminderTime) {
        const notificationKey = `closing_${clinica.clinica_id}_${schedule.id}_${new Date().toDateString()}`;
        
        // Evitar envios duplicados
        if (this.jobs.has(notificationKey)) {
          return;
        }

        this.jobs.set(notificationKey, true);

        const message = clinica.custom_closing_message || 
          `🌅 *Lembrete de Fechamento*\n\nAtenção! O horário de funcionamento está se encerrando.\n\n⏰ Fechamento em ${clinica.closing_reminder_minutes} minutos (${schedule.end_time})\n📝 Lembre-se de finalizar os atendimentos\n🔒 Verifique se tudo está organizado para o próximo dia`;

        await this.sendNotification(clinica.notification_phone, message, clinica.clinica_id);
        
        console.log(`📩 Notificação de fechamento enviada para clínica ${clinica.clinica_nome}`);

        // Limpar cache após 1 hora
        setTimeout(() => {
          this.jobs.delete(notificationKey);
        }, 60 * 60 * 1000);
      }

    } catch (error) {
      console.error('❌ Erro ao verificar notificação de fechamento:', error);
    }
  }

  /**
   * Enviar notificação via WhatsApp
   */
  async sendNotification(phone, message, clinicaId) {
    try {
      // Aqui você integraria com o Z-API ou Evolution API
      // Por enquanto, apenas logar
      console.log(`📱 Enviando notificação para ${phone} (Clínica ${clinicaId}):`);
      console.log(message);
      
      // Exemplo de integração com Z-API:
      /*
      const { sendWhatsAppMessage } = require('../utils/bot');
      await sendWhatsAppMessage(phone, message, clinicaId);
      */

      // Registrar no banco para histórico
      const db = dbManager.getDb();
      
      // Criar tabela de log se não existir
      db.prepare(`
        CREATE TABLE IF NOT EXISTS professional_notification_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clinica_id INTEGER NOT NULL,
          phone TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'sent'
        )
      `).run();

      db.prepare(`
        INSERT INTO professional_notification_log 
        (clinica_id, phone, message, type)
        VALUES (?, ?, ?, ?)
      `).run(clinicaId, phone, message, 'schedule_reminder');

    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
    }
  }

  /**
   * Subtrair minutos de um horário (formato HH:MM)
   */
  subtractMinutes(timeString, minutes) {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    date.setMinutes(date.getMinutes() - minutes);
    
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Parar o sistema de notificações
   */
  stop() {
    console.log('🛑 Parando sistema de notificações de horários...');
    this.jobs.clear();
    this.isInitialized = false;
  }

  /**
   * Obter estatísticas do sistema
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      activeJobs: this.jobs.size,
      jobKeys: Array.from(this.jobs.keys())
    };
  }
}

// Singleton instance
const notificationService = new ProfessionalScheduleNotifications();

module.exports = notificationService;