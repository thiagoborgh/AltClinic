// Unified WhatsApp Service - Suporta ManyChat e Z-API com controle de duplicação
const ManyChatService = require('./ManyChatService');
const ZAPIService = require('./ZAPIService');
const AdminWhatsAppManager = require('../../admin/backend/services/AdminWhatsAppManager');

class UnifiedWhatsAppService {
    constructor() {
        this.adminManager = new AdminWhatsAppManager();
        this.services = {};
    }

    // Obter serviço apropriado baseado no tipo de conexão
    getService(connectionType, credentials) {
        const serviceKey = `${connectionType}_${credentials.instance_id || credentials.page_id}`;
        
        if (!this.services[serviceKey]) {
            switch (connectionType) {
                case 'manychat':
                    this.services[serviceKey] = new ManyChatService(credentials);
                    break;
                case 'z_api':
                    this.services[serviceKey] = new ZAPIService(credentials);
                    break;
                default:
                    throw new Error(`Tipo de conexão não suportado: ${connectionType}`);
            }
        }
        
        return this.services[serviceKey];
    }

    // Enviar mensagem com controle de duplicação
    async sendMessage(tenantId, messageType, messageData, eventData = null) {
        try {
            console.log(`📱 Enviando ${messageType} para tenant ${tenantId}...`);

            // 1. Obter configuração do tenant
            const tenantConfig = await this.adminManager.getTenantWhatsAppConfig(tenantId);
            
            if (!tenantConfig) {
                return {
                    success: false,
                    reason: 'tenant_not_configured',
                    message: 'Tenant não configurado para WhatsApp'
                };
            }

            // 2. Verificar duplicação se eventData fornecido
            if (eventData && eventData.eventType && eventData.eventId) {
                console.log(`🔍 Verificando duplicação para evento ${eventData.eventType}:${eventData.eventId}...`);
                
                const duplicateCheck = await this.adminManager.checkDuplicateMessage(
                    tenantId, 
                    eventData.eventType, 
                    eventData.eventId, 
                    messageType
                );

                if (duplicateCheck.isDuplicate) {
                    console.log(`⚠️ Mensagem duplicada bloqueada para evento ${eventData.eventId}`);
                    return {
                        success: false,
                        reason: 'duplicate_blocked',
                        message: 'Mensagem já enviada para este evento',
                        previous_message: duplicateCheck.previousMessage
                    };
                }
            }

            // 3. Obter serviço apropriado
            const service = this.getService(tenantConfig.connection.type, tenantConfig.connection.credentials);

            // 4. Enviar mensagem baseado no tipo
            let result;
            const eventId = eventData ? `${eventData.eventType}_${eventData.eventId}` : null;

            switch (messageType) {
                case 'appointment_confirmations':
                    result = await service.sendAppointmentConfirmation({
                        ...messageData,
                        appointmentId: eventData?.eventId,
                        clinicName: tenantConfig.business_name
                    });
                    break;

                case 'appointment_reminders':
                    result = await service.sendAppointmentReminder({
                        ...messageData,
                        appointmentId: eventData?.eventId,
                        clinicName: tenantConfig.business_name
                    });
                    break;

                case 'payment_requests':
                    result = await service.sendPaymentRequest({
                        ...messageData,
                        paymentId: eventData?.eventId
                    });
                    break;

                case 'satisfaction_surveys':
                    result = await service.sendSatisfactionSurvey({
                        ...messageData,
                        serviceId: eventData?.eventId,
                        clinicName: tenantConfig.business_name
                    });
                    break;

                default:
                    return {
                        success: false,
                        reason: 'invalid_message_type',
                        message: `Tipo de mensagem não suportado: ${messageType}`
                    };
            }

            // 5. Registrar log
            if (result.success) {
                const logData = {
                    tenant_id: tenantId,
                    whatsapp_connection_id: tenantConfig.connection.id || 0,
                    message_type: messageType,
                    recipient_phone: messageData.phoneNumber,
                    message_content: result.final_message || result.message || 'Mensagem enviada',
                    external_message_id: result.message_id,
                    cost_cents: 5, // Custo padrão
                    event_type: eventData?.eventType || null,
                    event_id: eventData?.eventId || null
                };

                const logResult = await this.adminManager.logMessageSent(logData);
                
                if (logResult.duplicate_blocked) {
                    console.log(`⚠️ Duplicação detectada no log para ${eventData?.eventId}`);
                    return {
                        success: false,
                        reason: 'duplicate_detected_on_log',
                        message: logResult.message
                    };
                }

                console.log(`✅ Mensagem enviada com sucesso! Log ID: ${logResult.log_id}`);
                
                return {
                    success: true,
                    message_id: result.message_id,
                    log_id: logResult.log_id,
                    connection_type: tenantConfig.connection.type,
                    final_message: result.final_message
                };
            } else {
                console.log(`❌ Falha no envio: ${result.error}`);
                return {
                    success: false,
                    reason: 'send_failed',
                    message: result.error
                };
            }

        } catch (error) {
            console.error('💥 Erro no UnifiedWhatsAppService:', error);
            return {
                success: false,
                reason: 'service_error',
                message: error.message
            };
        }
    }

    // Métodos específicos para cada tipo de mensagem
    async sendAppointmentConfirmation(tenantId, appointmentData) {
        const eventData = {
            eventType: 'appointment_confirmation',
            eventId: appointmentData.appointmentId || `appt_${Date.now()}`
        };

        return await this.sendMessage(tenantId, 'appointment_confirmations', appointmentData, eventData);
    }

    async sendAppointmentReminder(tenantId, appointmentData) {
        const eventData = {
            eventType: 'appointment_reminder',
            eventId: appointmentData.appointmentId || `reminder_${Date.now()}`
        };

        return await this.sendMessage(tenantId, 'appointment_reminders', appointmentData, eventData);
    }

    async sendPaymentRequest(tenantId, paymentData) {
        const eventData = {
            eventType: 'payment_request',
            eventId: paymentData.paymentId || `payment_${Date.now()}`
        };

        return await this.sendMessage(tenantId, 'payment_requests', paymentData, eventData);
    }

    async sendSatisfactionSurvey(tenantId, surveyData) {
        const eventData = {
            eventType: 'satisfaction_survey',
            eventId: surveyData.serviceId || `survey_${Date.now()}`
        };

        return await this.sendMessage(tenantId, 'satisfaction_surveys', surveyData, eventData);
    }

    // Verificar status de todas as conexões de um tenant
    async checkTenantConnections(tenantId) {
        try {
            const tenantConfig = await this.adminManager.getTenantWhatsAppConfig(tenantId);
            
            if (!tenantConfig) {
                return {
                    configured: false,
                    message: 'Tenant não configurado'
                };
            }

            const service = this.getService(tenantConfig.connection.type, tenantConfig.connection.credentials);
            
            let status;
            if (service.checkStatus) {
                status = await service.checkStatus();
            } else if (service.validateCredentials) {
                status = await service.validateCredentials();
            } else {
                status = { connected: true, note: 'Status não verificável' };
            }

            return {
                configured: true,
                connection_type: tenantConfig.connection.type,
                connection_name: tenantConfig.connection.name,
                status: status,
                automations: tenantConfig.automations,
                limits: tenantConfig.limits
            };

        } catch (error) {
            return {
                configured: false,
                error: error.message
            };
        }
    }

    // Obter histórico de mensagens de um tenant
    async getTenantMessageHistory(tenantId, limit = 50) {
        try {
            const db = this.adminManager.getDb();
            
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        message_type,
                        recipient_phone,
                        message_content,
                        event_type,
                        event_id,
                        status,
                        sent_at,
                        created_at
                    FROM tenant_whatsapp_usage 
                    WHERE tenant_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                `;
                
                db.all(query, [tenantId, limit], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

        } catch (error) {
            throw new Error(`Erro ao obter histórico: ${error.message}`);
        }
    }

    // Verificar se mensagem pode ser enviada (não é duplicata)
    async canSendMessage(tenantId, eventType, eventId, messageType) {
        try {
            const duplicateCheck = await this.adminManager.checkDuplicateMessage(
                tenantId, eventType, eventId, messageType
            );

            return {
                can_send: !duplicateCheck.isDuplicate,
                reason: duplicateCheck.isDuplicate ? 'Mensagem já enviada para este evento' : 'OK',
                previous_message: duplicateCheck.previousMessage || null
            };

        } catch (error) {
            return {
                can_send: false,
                reason: `Erro na verificação: ${error.message}`
            };
        }
    }
}

module.exports = UnifiedWhatsAppService;