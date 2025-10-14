-- Script simplificado para criar tabelas necessárias para testes Z-API

-- Tabela para vincular tenants às configurações WhatsApp
CREATE TABLE IF NOT EXISTS tenant_whatsapp_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    page_id TEXT,
    api_token TEXT,
    instance_id TEXT,
    webhook_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para registrar uso de mensagens
CREATE TABLE IF NOT EXISTS tenant_whatsapp_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type TEXT NOT NULL,
    message_hash TEXT NOT NULL,
    event_type TEXT,
    event_id TEXT,
    provider TEXT NOT NULL,
    api_response TEXT,
    status TEXT DEFAULT 'sent',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuração padrão para desenvolvimento
INSERT OR REPLACE INTO tenant_whatsapp_bindings (
    tenant_id, 
    provider, 
    instance_id, 
    api_token, 
    is_active
) VALUES (
    'dev_tenant',
    'zapi',
    '3E82B061D75E61EBAFEAD69A39353161',
    'F487276990a8447d59f83300fa95de9f1S',
    1
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tenant_phone ON tenant_whatsapp_usage(tenant_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_message_hash ON tenant_whatsapp_usage(message_hash);
CREATE INDEX IF NOT EXISTS idx_event ON tenant_whatsapp_usage(tenant_id, event_type, event_id);