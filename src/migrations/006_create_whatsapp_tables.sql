-- Migração 006: Criar tabelas para WhatsApp Business API
-- Data: 2025-01-19
-- Descrição: Tabelas para integração WhatsApp com limites por plano

-- Tabela para armazenar tokens e configurações do WhatsApp por cliente
CREATE TABLE IF NOT EXISTS whatsapp_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    phone_id TEXT NOT NULL,
    token TEXT, -- Token criptografado com AES-256
    status TEXT DEFAULT 'pending_qr', -- pending_qr, active, blocked, expired
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id),
    UNIQUE(phone_id)
);

-- Tabela para controlar uso mensal do WhatsApp por cliente
CREATE TABLE IF NOT EXISTS whatsapp_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL, -- 2025, 2026, etc.
    used_messages INTEGER DEFAULT 0,
    limit_messages INTEGER NOT NULL,
    plan_type TEXT NOT NULL, -- trial, starter, professional, enterprise
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, month, year)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_client_id ON whatsapp_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_phone_id ON whatsapp_tokens(phone_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_usage_client_month_year ON whatsapp_usage(client_id, month, year);

-- Inserir dados de exemplo para teste (remover em produção)
-- INSERT INTO whatsapp_usage (client_id, month, year, used_messages, limit_messages, plan_type)
-- VALUES (1, 1, 2025, 0, 100, 'trial');