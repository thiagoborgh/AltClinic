-- Atualizar tabela whatsapp_tokens para suportar credenciais da Meta API por tenant
ALTER TABLE whatsapp_tokens ADD COLUMN phone_number TEXT;
ALTER TABLE whatsapp_tokens ADD COLUMN wa_app_id TEXT;
ALTER TABLE whatsapp_tokens ADD COLUMN wa_system_user_token TEXT;
ALTER TABLE whatsapp_tokens ADD COLUMN wa_webhook_verify_token TEXT;
ALTER TABLE whatsapp_tokens ADD COLUMN wa_business_account_id TEXT;

-- Atualizar status padrão
UPDATE whatsapp_tokens SET status = 'not_configured' WHERE status IS NULL OR status = '' OR status = 'pending_qr';