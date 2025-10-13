const Database = require('better-sqlite3');
const db = new Database('./saee.db');

console.log('🔄 Atualizando tabela whatsapp_tokens...');

try {
  // Adicionar novos campos
  db.exec('ALTER TABLE whatsapp_tokens ADD COLUMN phone_number TEXT;');
  console.log('✅ Campo phone_number adicionado');

  db.exec('ALTER TABLE whatsapp_tokens ADD COLUMN wa_app_id TEXT;');
  console.log('✅ Campo wa_app_id adicionado');

  db.exec('ALTER TABLE whatsapp_tokens ADD COLUMN wa_system_user_token TEXT;');
  console.log('✅ Campo wa_system_user_token adicionado');

  db.exec('ALTER TABLE whatsapp_tokens ADD COLUMN wa_webhook_verify_token TEXT;');
  console.log('✅ Campo wa_webhook_verify_token adicionado');

  db.exec('ALTER TABLE whatsapp_tokens ADD COLUMN wa_business_account_id TEXT;');
  console.log('✅ Campo wa_business_account_id adicionado');

  // Atualizar status
  db.exec('UPDATE whatsapp_tokens SET status = "not_configured" WHERE status IS NULL OR status = "" OR status = "pending_qr";');
  console.log('✅ Status atualizado');

  console.log('🎉 Tabela whatsapp_tokens atualizada com sucesso!');

} catch (error) {
  console.error('❌ Erro ao atualizar tabela:', error.message);
} finally {
  db.close();
}