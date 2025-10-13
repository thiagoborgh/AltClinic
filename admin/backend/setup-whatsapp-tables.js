/**
 * Script para criar tabelas necessárias para WhatsApp no banco admin
 */

const Database = require('better-sqlite3');
const path = require('path');

const adminDbPath = './database/admin.sqlite';
const db = new Database(adminDbPath);

console.log('🔧 Criando tabelas necessárias para WhatsApp admin...');

// Tabela de vinculações tenant-whatsapp
db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_whatsapp_bindings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        instance_id TEXT,
        api_token TEXT,
        page_id TEXT,
        phone_number TEXT,
        status TEXT DEFAULT 'active',
        config_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, provider_type, instance_id)
    )
`);

// Tabela de uso/mensagens WhatsApp
db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_whatsapp_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        message_type TEXT NOT NULL,
        recipient_phone TEXT NOT NULL,
        message_content TEXT,
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        response_data TEXT,
        duplicate_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(duplicate_key)
    )
`);

// Inserir uma conexão Z-API padrão se não existir
const existingZapi = db.prepare(`
    SELECT COUNT(*) as count FROM tenant_whatsapp_bindings 
    WHERE provider_type = 'zapi' AND instance_id = '3E82B061D75E61EBAFEAD69A39353161'
`).get();

if (existingZapi.count === 0) {
    db.prepare(`
        INSERT INTO tenant_whatsapp_bindings 
        (tenant_id, provider_type, instance_id, api_token, status) 
        VALUES (?, ?, ?, ?, ?)
    `).run('dev_tenant', 'zapi', '3E82B061D75E61EBAFEAD69A39353161', '8E1DFE5E6F2D7BF408038207', 'active');
    
    console.log('✅ Conexão Z-API padrão criada');
}

// Verificar se existe tabela tenants no banco principal
const mainDbPath = '../../saee.db';
try {
    const mainDb = new Database(mainDbPath);
    const tenants = mainDb.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='tenants'
    `).get();
    
    if (tenants) {
        console.log('✅ Tabela tenants encontrada no banco principal');
    } else {
        console.log('⚠️ Tabela tenants não encontrada no banco principal');
    }
    
    mainDb.close();
} catch (e) {
    console.log('⚠️ Banco principal não encontrado');
}

// Inserir alguns dados de teste se necessário
const usageCount = db.prepare(`SELECT COUNT(*) as count FROM tenant_whatsapp_usage`).get();
if (usageCount.count === 0) {
    // Inserir algumas mensagens de teste para demonstração
    const today = new Date().toISOString().split('T')[0];
    
    db.prepare(`
        INSERT INTO tenant_whatsapp_usage 
        (tenant_id, provider_type, message_type, recipient_phone, message_content, status, duplicate_key) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('dev_tenant', 'zapi', 'appointment_reminder', '5511999887766', 'Lembrete de consulta teste', 'sent', `test_1_${Date.now()}`);
    
    db.prepare(`
        INSERT INTO tenant_whatsapp_usage 
        (tenant_id, provider_type, message_type, recipient_phone, message_content, status, duplicate_key) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('dev_tenant', 'zapi', 'payment_reminder', '5511999887755', 'Lembrete de pagamento teste', 'sent', `test_2_${Date.now()}`);
    
    console.log('✅ Dados de teste inseridos');
}

console.log('🎉 Tabelas WhatsApp criadas com sucesso!');

db.close();