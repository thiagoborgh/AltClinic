-- Migração 010: Adicionar campos api_token e webhook_url à tabela whatsapp_instances
-- Data: 2025-09-25
-- Descrição: Adicionar suporte para instâncias Z-API existentes

-- Adicionar colunas para configuração de instâncias existentes
ALTER TABLE whatsapp_instances ADD COLUMN api_token TEXT;
ALTER TABLE whatsapp_instances ADD COLUMN webhook_url TEXT;

-- Atualizar status possíveis para incluir 'configured'
-- Note: SQLite não suporta ALTER COLUMN, então mantemos flexibilidade no campo status