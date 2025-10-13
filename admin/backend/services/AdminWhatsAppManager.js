// Admin WhatsApp Connection Manager
// Gerencia conexões WhatsApp e vinculações com tenants

const crypto = require('crypto');
const Database = require('sqlite3').Database;
const path = require('path');

class AdminWhatsAppManager {
    constructor() {
        this.dbPath = path.join(__dirname, '../database/admin.db');
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'default_key_change_in_production';
        this.connections = new Map(); // Cache das conexões ativas
    }

    // Inicializar database
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            // Ler e executar migration
            const fs = require('fs');
            const migrationPath = path.join(__dirname, '../migrations/001_admin_whatsapp_system.sql');
            const migration = fs.readFileSync(migrationPath, 'utf8');
            
            db.exec(migration, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
                db.close();
            });
        });
    }

    // Criptografia das credenciais
    encryptCredentials(credentials) {
        const cipher = crypto.createCipher('aes256', this.encryptionKey);
        let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decryptCredentials(encryptedCredentials) {
        try {
            const decipher = crypto.createDecipher('aes256', this.encryptionKey);
            let decrypted = decipher.update(encryptedCredentials, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Erro ao descriptografar credenciais:', error);
            return null;
        }
    }

    // === GERENCIAMENTO DE CONEXÕES WHATSAPP ===

    // Criar nova conexão WhatsApp
    async createWhatsAppConnection(connectionData) {
        const { name, type, credentials, config, created_by } = connectionData;
        
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const encryptedCredentials = this.encryptCredentials(credentials);
            const configJson = JSON.stringify(config || {});
            
            const query = `
                INSERT INTO admin_whatsapp_connections 
                (name, type, credentials, config, created_by)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            db.run(query, [name, type, encryptedCredentials, configJson, created_by], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, name, type, status: 'active' });
                }
                db.close();
            });
        });
    }

    // Listar todas as conexões
    async listWhatsAppConnections() {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const query = `
                SELECT id, name, type, status, created_at, updated_at,
                       (SELECT COUNT(*) FROM tenant_whatsapp_bindings 
                        WHERE whatsapp_connection_id = admin_whatsapp_connections.id 
                        AND status = 'active') as active_tenants
                FROM admin_whatsapp_connections 
                ORDER BY created_at DESC
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
                db.close();
            });
        });
    }

    // Obter conexão específica com credenciais
    async getWhatsAppConnection(connectionId) {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const query = `
                SELECT * FROM admin_whatsapp_connections 
                WHERE id = ?
            `;
            
            db.get(query, [connectionId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    // Descriptografar credenciais
                    const credentials = this.decryptCredentials(row.credentials);
                    resolve({
                        ...row,
                        credentials,
                        config: JSON.parse(row.config || '{}')
                    });
                }
                db.close();
            });
        });
    }

    // === GERENCIAMENTO DE VINCULAÇÕES TENANT ===

    // Vincular tenant a uma conexão WhatsApp OU configurar API própria
    async bindTenantToWhatsApp(bindingData) {
        const {
            tenant_id,
            tenant_name,
            whatsapp_connection_id,
            phone_number,
            business_name,
            enabled_automations,
            assigned_by,
            // Novos campos para API própria
            own_api_enabled,
            own_api_type,
            own_api_credentials,
            own_api_config
        } = bindingData;

        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            // Validar configuração
            if (own_api_enabled) {
                // Usando API própria - não precisa de conexão admin
                if (!own_api_type || !own_api_credentials) {
                    reject(new Error('API própria requer tipo e credenciais'));
                    return;
                }
            } else {
                // Usando conexão admin - verificar se existe
                if (!whatsapp_connection_id) {
                    reject(new Error('Conexão admin ou API própria é obrigatória'));
                    return;
                }
            }
            
            const checkConnection = (callback) => {
                if (own_api_enabled) {
                    callback(null, { id: null }); // API própria não precisa verificar
                } else {
                    db.get('SELECT id FROM admin_whatsapp_connections WHERE id = ?', 
                        [whatsapp_connection_id], (err, connection) => {
                        if (err) {
                            callback(err);
                            return;
                        }
                        
                        if (!connection) {
                            callback(new Error('Conexão WhatsApp não encontrada'));
                            return;
                        }
                        
                        callback(null, connection);
                    });
                }
            };
            
            checkConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Inserir ou atualizar vinculação
                const query = `
                    INSERT OR REPLACE INTO tenant_whatsapp_bindings 
                    (tenant_id, tenant_name, whatsapp_connection_id, phone_number, 
                     business_name, enabled_automations, assigned_by,
                     own_api_enabled, own_api_type, own_api_credentials, own_api_config)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const automationsJson = JSON.stringify(enabled_automations || {});
                const encryptedOwnCredentials = own_api_credentials ? 
                    this.encryptCredentials(own_api_credentials) : null;
                const ownConfigJson = own_api_config ? JSON.stringify(own_api_config) : null;
                
                db.run(query, [
                    tenant_id, tenant_name, whatsapp_connection_id,
                    phone_number, business_name, automationsJson, assigned_by,
                    own_api_enabled || false, own_api_type, encryptedOwnCredentials, ownConfigJson
                ], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            id: this.lastID,
                            tenant_id,
                            whatsapp_connection_id: own_api_enabled ? null : whatsapp_connection_id,
                            own_api_enabled: own_api_enabled || false,
                            status: 'active'
                        });
                    }
                    db.close();
                });
            });
        });
    }

    // Listar vinculações
    async listTenantBindings() {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const query = `
                SELECT 
                    tb.*,
                    awc.name as connection_name,
                    awc.type as connection_type,
                    awc.status as connection_status
                FROM tenant_whatsapp_bindings tb
                JOIN admin_whatsapp_connections awc ON tb.whatsapp_connection_id = awc.id
                ORDER BY tb.created_at DESC
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const bindings = rows.map(row => ({
                        ...row,
                        enabled_automations: JSON.parse(row.enabled_automations || '{}'),
                        message_templates: JSON.parse(row.message_templates || '{}')
                    }));
                    resolve(bindings);
                }
                db.close();
            });
        });
    }

    // Obter configuração WhatsApp para um tenant específico
    async getTenantWhatsAppConfig(tenantId) {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const query = `
                SELECT * FROM tenant_whatsapp_bindings 
                WHERE tenant_id = ? AND is_active = 1
            `;
            
            db.get(query, [tenantId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    resolve(null);
                    return;
                }

                // Transformar resultado em formato esperado
                const config = {
                    provider: row.provider,
                    is_active: row.is_active,
                    tenant_id: row.tenant_id
                };

                // Adicionar credenciais específicas baseado no provider
                if (row.provider === 'zapi') {
                    config.zapiInstanceId = row.instance_id;
                    config.zapiToken = row.api_token;
                } else if (row.provider === 'manychat') {
                    config.manychatPageId = row.page_id;
                    config.manychatToken = row.api_token;
                }

                resolve(config);
            });
            
            db.close();
        });
    }

    // === CONTROLE DE DUPLICAÇÃO ===

    // Verificar se mensagem já foi enviada para o mesmo evento
    async checkDuplicateMessage(tenantId, eventType, eventId, messageType) {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const query = `
                SELECT id, message_content, sent_at 
                FROM tenant_whatsapp_usage 
                WHERE tenant_id = ? AND event_type = ? AND event_id = ? AND message_type = ?
                AND status != 'failed'
                ORDER BY created_at DESC
                LIMIT 1
            `;
            
            db.get(query, [tenantId, eventType, eventId, messageType], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? {
                        isDuplicate: true,
                        previousMessage: row
                    } : {
                        isDuplicate: false
                    });
                }
                db.close();
            });
        });
    }

    // Gerar hash de conteúdo
    generateContentHash(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    // Registrar envio de mensagem com controle de duplicação
    async logMessageSent(logData) {
        const {
            tenant_id,
            whatsapp_connection_id,
            message_type,
            recipient_phone,
            message_content,
            external_message_id,
            cost_cents,
            event_type,
            event_id
        } = logData;

        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            // Verificar duplicação se event_type e event_id fornecidos
            const checkDuplicate = (callback) => {
                if (event_type && event_id) {
                    this.checkDuplicateMessage(tenant_id, event_type, event_id, message_type)
                        .then(result => {
                            if (result.isDuplicate) {
                                callback({
                                    duplicate: true,
                                    message: 'Mensagem já enviada para este evento',
                                    previous: result.previousMessage
                                });
                            } else {
                                callback(null);
                            }
                        })
                        .catch(callback);
                } else {
                    callback(null);
                }
            };
            
            checkDuplicate((duplicateError) => {
                if (duplicateError && duplicateError.duplicate) {
                    // Retornar erro de duplicação
                    resolve({
                        log_id: null,
                        duplicate_blocked: true,
                        message: duplicateError.message,
                        previous_message: duplicateError.previous
                    });
                    return;
                }
                
                if (duplicateError) {
                    reject(duplicateError);
                    return;
                }
            
                // Inserir log da mensagem
                const messageHash = this.generateContentHash(message_content || '');
                
                const query = `
                    INSERT INTO tenant_whatsapp_usage 
                    (tenant_id, whatsapp_connection_id, message_type, recipient_phone,
                     message_content, message_hash, event_type, event_id,
                     external_message_id, cost_cents, sent_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `;
                
                db.run(query, [
                    tenant_id, whatsapp_connection_id, message_type, recipient_phone,
                    message_content, messageHash, event_type, event_id,
                    external_message_id, cost_cents || 0
                ], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        // Atualizar contador de uso mensal
                        db.run(`
                            UPDATE tenant_whatsapp_bindings 
                            SET current_monthly_usage = current_monthly_usage + 1
                            WHERE tenant_id = ?
                        `, [tenant_id], () => {
                            resolve({ 
                                log_id: this.lastID,
                                duplicate_blocked: false 
                            });
                            db.close();
                        });
                    }
                });
            });
        });
    }

    // Atualizar status de entrega
    async updateMessageStatus(logId, status, deliveredAt = null, errorMessage = null) {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const query = `
                UPDATE tenant_whatsapp_usage 
                SET status = ?, delivered_at = ?, error_message = ?
                WHERE id = ?
            `;
            
            db.run(query, [status, deliveredAt, errorMessage, logId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ updated: this.changes > 0 });
                }
                db.close();
            });
        });
    }

    // Obter estatísticas de uso
    async getTenantUsageStats(tenantId, period = '30 days') {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            const query = `
                SELECT 
                    message_type,
                    status,
                    COUNT(*) as count,
                    SUM(cost_cents) as total_cost
                FROM tenant_whatsapp_usage 
                WHERE tenant_id = ? 
                AND created_at >= datetime('now', '-${period}')
                GROUP BY message_type, status
                ORDER BY message_type, status
            `;
            
            db.all(query, [tenantId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
                db.close();
            });
        });
    }

    // === TEMPLATES DE MENSAGEM ===

    // Obter templates disponíveis
    async getMessageTemplates(type = null, category = null) {
        return new Promise((resolve, reject) => {
            const db = new Database(this.dbPath);
            
            let query = 'SELECT * FROM admin_message_templates WHERE is_global = 1';
            const params = [];
            
            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }
            
            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }
            
            query += ' ORDER BY type, name';
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const templates = rows.map(row => ({
                        ...row,
                        variables: JSON.parse(row.variables || '[]'),
                        whatsapp_connection_types: JSON.parse(row.whatsapp_connection_types || '[]')
                    }));
                    resolve(templates);
                }
                db.close();
            });
        });
    }
}

module.exports = AdminWhatsAppManager;