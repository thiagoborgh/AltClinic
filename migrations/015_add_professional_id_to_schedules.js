const migration = {
  version: 15,
  name: 'add_professional_id_to_schedules',
  up: `
    -- Adicionar coluna professional_id à tabela professional_schedules
    ALTER TABLE professional_schedules 
    ADD COLUMN professional_id INTEGER;
    
    -- Criar índice para melhor performance
    CREATE INDEX IF NOT EXISTS idx_professional_schedules_professional_id 
    ON professional_schedules(professional_id);
  `,
  down: `
    -- Remover coluna professional_id (SQLite não suporta DROP COLUMN diretamente)
    -- Esta operação requer recrear a tabela, então vamos deixar a coluna
    -- DROP INDEX IF EXISTS idx_professional_schedules_professional_id;
  `
};

module.exports = migration;