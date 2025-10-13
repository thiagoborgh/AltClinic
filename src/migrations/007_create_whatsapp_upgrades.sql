-- Migração 007: Criar tabela para upgrades do WhatsApp
-- Data: 2025-01-19
-- Descrição: Tabela para controlar upgrades e pagamentos via Stripe

CREATE TABLE IF NOT EXISTS whatsapp_upgrades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    plan_type TEXT NOT NULL, -- starter, professional, enterprise
    stripe_session_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled
    amount INTEGER NOT NULL, -- valor em centavos
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_upgrades_client_id ON whatsapp_upgrades(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_upgrades_stripe_session ON whatsapp_upgrades(stripe_session_id);