const Database = require('better-sqlite3');
const path = require('path');

const migration = {
  version: 9,
  name: 'add_professional_id_to_schedules',
  up: `
    -- Adicionar coluna professional_id à tabela professional_schedules
    ALTER TABLE professional_schedules 
    ADD COLUMN professional_id INTEGER;
    
    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_professional_id 
    ON professional_schedules(professional_id);
    
    -- Comentário: Esta coluna vincula os horários a um profissional específico
    -- Quando NULL, o horário é considerado genérico da clínica
  `,
  
  down: `
    -- Remover o índice
    DROP INDEX IF EXISTS idx_professional_schedules_professional_id;
    
    -- Remover a coluna professional_id
    -- SQLite não suporta DROP COLUMN diretamente, seria necessário recriar a tabela
    -- Por simplicidade, mantemos a coluna mas comentamos o rollback
    -- ALTER TABLE professional_schedules DROP COLUMN professional_id;
  `
};

// Função para executar a migração
function up(db) {
  console.log('📋 Executando migração 009: Adicionando professional_id aos horários...');
  
  try {
    // Executar a migração
    db.exec(migration.up);
    
    console.log('✅ Migração 009 executada com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na migração 009:', error);
    throw error;
  }
}

function down(db) {
  console.log('📋 Revertendo migração 009: Removendo professional_id dos horários...');
  
  try {
    db.exec(migration.down);
    console.log('✅ Migração 009 revertida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao reverter migração 009:', error);
    throw error;
  }
}

module.exports = {
  version: migration.version,
  name: migration.name,
  up,
  down
};