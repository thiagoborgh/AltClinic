const Database = require('better-sqlite3');
const path = require('path');

const migration = {
  version: 8,
  name: 'create_professional_schedules',
  up: `
    -- Tabela de Horários do Profissional
    CREATE TABLE IF NOT EXISTS professional_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinica_id INTEGER NOT NULL,
      professional_name TEXT NOT NULL DEFAULT 'Profissional Principal',
      
      -- Dias da semana (0=Domingo, 1=Segunda, 2=Terça, ..., 6=Sábado)
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      
      -- Horários de funcionamento
      start_time TEXT NOT NULL, -- Formato HH:MM
      end_time TEXT NOT NULL,   -- Formato HH:MM
      
      -- Horário de pausa/almoço (opcional)
      pause_start TEXT,         -- Formato HH:MM
      pause_end TEXT,           -- Formato HH:MM
      
      -- Exceções pontuais (feriados, folgas, etc.)
      exception_date DATE,      -- Data específica da exceção (YYYY-MM-DD)
      exception_note TEXT,      -- Motivo da exceção
      is_exception_day BOOLEAN DEFAULT 0, -- 1 se for uma exceção pontual
      
      -- Status do horário
      is_active BOOLEAN DEFAULT 1,
      
      -- Metadados
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      -- Relacionamento
      FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_clinica_id ON professional_schedules(clinica_id);
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_day_of_week ON professional_schedules(day_of_week);
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_exception_date ON professional_schedules(exception_date);
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_active ON professional_schedules(is_active);
    
    -- Índice composto para busca eficiente de horários
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_clinica_day_active 
    ON professional_schedules(clinica_id, day_of_week, is_active);
  `,
  down: `
    -- Remover índices
    DROP INDEX IF EXISTS idx_professional_schedules_clinica_id;
    DROP INDEX IF EXISTS idx_professional_schedules_day_of_week;
    DROP INDEX IF EXISTS idx_professional_schedules_exception_date;
    DROP INDEX IF EXISTS idx_professional_schedules_active;
    DROP INDEX IF EXISTS idx_professional_schedules_clinica_day_active;
    
    -- Remover tabela
    DROP TABLE IF EXISTS professional_schedules;
  `
};

function runMigration() {
  const dbPath = process.env.DB_PATH || './saee.db';
  const db = new Database(dbPath);
  
  console.log('🚀 Executando migration: professional_schedules...');
  
  try {
    // Verificar se a migration já foi executada
    const existingMigration = db.prepare(
      'SELECT version FROM migrations WHERE version = ?'
    ).get(migration.version);
    
    if (existingMigration) {
      console.log(`⏭️  Migration ${migration.version} já executada`);
      return;
    }
    
    // Executar migration
    db.exec(migration.up);
    
    // Registrar migration como executada
    db.prepare('INSERT INTO migrations (version, name) VALUES (?, ?)').run(
      migration.version,
      migration.name
    );
    
    console.log(`✅ Migration ${migration.version} executada com sucesso`);
    
    // Inserir dados de exemplo de horários (segunda a sexta, 8h às 18h com pausa 12h-13h)
    seedDefaultSchedules(db);
    
  } catch (error) {
    console.error(`❌ Erro ao executar migration ${migration.version}:`, error.message);
    throw error;
  } finally {
    db.close();
  }
}

function seedDefaultSchedules(db) {
  try {
    console.log('🌱 Inserindo horários padrão...');
    
    // Buscar todas as clínicas existentes
    const clinicas = db.prepare('SELECT id FROM clinica').all();
    
    if (clinicas.length === 0) {
      console.log('ℹ️  Nenhuma clínica encontrada para inserir horários');
      return;
    }
    
    // Horários padrão: Segunda a Sexta, 8h às 18h, pausa 12h-13h
    const defaultSchedules = [
      { day: 1, start: '08:00', end: '18:00', pauseStart: '12:00', pauseEnd: '13:00' }, // Segunda
      { day: 2, start: '08:00', end: '18:00', pauseStart: '12:00', pauseEnd: '13:00' }, // Terça
      { day: 3, start: '08:00', end: '18:00', pauseStart: '12:00', pauseEnd: '13:00' }, // Quarta
      { day: 4, start: '08:00', end: '18:00', pauseStart: '12:00', pauseEnd: '13:00' }, // Quinta
      { day: 5, start: '08:00', end: '18:00', pauseStart: '12:00', pauseEnd: '13:00' }, // Sexta
      { day: 6, start: '08:00', end: '14:00', pauseStart: null, pauseEnd: null },       // Sábado (meio período)
    ];
    
    const insertSchedule = db.prepare(`
      INSERT INTO professional_schedules 
      (clinica_id, day_of_week, start_time, end_time, pause_start, pause_end, professional_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    clinicas.forEach(clinica => {
      defaultSchedules.forEach(schedule => {
        insertSchedule.run(
          clinica.id,
          schedule.day,
          schedule.start,
          schedule.end,
          schedule.pauseStart,
          schedule.pauseEnd,
          'Profissional Principal'
        );
      });
    });
    
    console.log(`✅ Horários padrão inseridos para ${clinicas.length} clínica(s)`);
    console.log('📅 Horários: Segunda a Sexta (8h-18h), Sábado (8h-14h)');
    
  } catch (error) {
    console.error('❌ Erro ao inserir horários padrão:', error.message);
  }
}

module.exports = { migration, runMigration };

// Executar migration se chamado diretamente
if (require.main === module) {
  require('dotenv').config();
  runMigration();
}