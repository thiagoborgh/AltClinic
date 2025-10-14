-- Criar tabela para agendamentos da agenda lite
-- Estrutura compatível com o frontend existente

CREATE TABLE IF NOT EXISTS agenda_agendamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  horario TEXT NOT NULL,  -- Formato HH:MM (ex: "09:30")
  data TEXT NOT NULL,     -- Formato YYYY-MM-DD (ex: "2025-10-10")
  paciente TEXT NOT NULL, -- Nome do paciente
  procedimento TEXT,      -- Nome do procedimento
  status TEXT DEFAULT 'não confirmado', -- Status do agendamento
  valor REAL DEFAULT 0,   -- Valor do procedimento
  observacoes TEXT,       -- Observações extras
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agenda_agendamentos_data ON agenda_agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agenda_agendamentos_horario ON agenda_agendamentos(horario);
CREATE INDEX IF NOT EXISTS idx_agenda_agendamentos_data_horario ON agenda_agendamentos(data, horario);
CREATE INDEX IF NOT EXISTS idx_agenda_agendamentos_status ON agenda_agendamentos(status);

-- Comentários sobre a estrutura
-- Esta tabela é específica para a AgendaLite e mantém compatibilidade com o localStorage
-- Os campos seguem exatamente a estrutura que o frontend está usando