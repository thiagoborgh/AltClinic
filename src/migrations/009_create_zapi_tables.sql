-- Migração 009: Criar tabelas para Z-API WhatsApp
-- Data: 2025-09-25
-- Descrição: Tabelas para integração Z-API com instâncias por cliente

-- Tabela para armazenar instâncias Z-API por cliente
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    instance_id TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, active, blocked
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(client_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_client_id ON whatsapp_instances(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_id ON whatsapp_instances(instance_id);