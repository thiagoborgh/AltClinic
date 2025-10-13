-- Migração 008: Criar tabela para status das mensagens WhatsApp
-- Data: 2025-01-19
-- Descrição: Tabela para controlar status de entrega das mensagens

CREATE TABLE IF NOT EXISTS whatsapp_message_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    client_id INTEGER NOT NULL,
    status TEXT NOT NULL, -- sent, delivered, read, failed
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id),
    FOREIGN KEY (client_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_client_id ON whatsapp_message_status(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_message_id ON whatsapp_message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_timestamp ON whatsapp_message_status(timestamp);