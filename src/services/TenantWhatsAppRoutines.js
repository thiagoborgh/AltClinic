/**
 * TenantWhatsAppRoutines.js
 * Sistema de rotinas automatizadas por tenant usando conexões do admin
 * 
 * Funcionalidades:
 * - Lembretes de consulta
 * - Cobranças de pagamento
 * - Confirmações de agendamento
 * - Mensagens de boas-vindas
 * - Campanhas personalizadas
 */

const path = require('path');
const AdminWhatsAppManager = require('../../admin/backend/services/AdminWhatsAppManager');
const UnifiedWhatsAppService = require('./UnifiedWhatsAppService');

class TenantWhatsAppRoutines {
    constructor() {
        this.adminManager = new AdminWhatsAppManager();
        this.unifiedService = new UnifiedWhatsAppService();
        this.routines = new Map(); // Cache de rotinas ativas por tenant
    }

    /**
     * Inicializar rotinas para um tenant
     * @param {string} tenantId - ID do tenant
     * @param {Object} routineConfig - Configurações das rotinas
     */
    async initializeTenantRoutines(tenantId, routineConfig = {}) {
        try {
            console.log(`🔄 Inicializando rotinas para tenant: ${tenantId}`);

            // Buscar configurações WhatsApp do tenant
            const whatsappConfig = await this.adminManager.getTenantWhatsAppConfig(tenantId);
            
            if (!whatsappConfig || !whatsappConfig.is_active) {
                console.log(`⚠️ Tenant ${tenantId} não possui WhatsApp configurado ou ativo`);
                return false;
            }

            // Configurar rotinas padrão se não especificadas
            const defaultRoutines = {
                appointmentReminders: true,
                paymentReminders: true,
                appointmentConfirmations: true,
                welcomeMessages: true,
                customCampaigns: false
            };

            const finalConfig = { ...defaultRoutines, ...routineConfig };

            // Armazenar configuração no cache
            this.routines.set(tenantId, {
                whatsappConfig,
                routines: finalConfig,
                lastUpdate: new Date(),
                status: 'active'
            });

            console.log(`✅ Rotinas inicializadas para ${tenantId}:`, finalConfig);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao inicializar rotinas para ${tenantId}:`, error);
            return false;
        }
    }

    /**
     * Enviar lembrete de consulta
     * @param {string} tenantId - ID do tenant
     * @param {Object} appointmentData - Dados da consulta
     */
    async sendAppointmentReminder(tenantId, appointmentData) {
        try {
            console.log(`📅 Enviando lembrete de consulta para tenant: ${tenantId}`);

            // Verificar se rotina está ativa
            if (!this.isRoutineActive(tenantId, 'appointmentReminders')) {
                console.log(`⚠️ Rotina de lembretes não está ativa para ${tenantId}`);
                return { success: false, reason: 'routine_disabled' };
            }

            // Obter configuração WhatsApp
            const config = await this.getTenantWhatsAppConfig(tenantId);
            if (!config) {
                return { success: false, reason: 'whatsapp_not_configured' };
            }

            // Preparar dados da mensagem
            const messageData = {
                phone: appointmentData.patientPhone,
                content: this.buildAppointmentReminderMessage(appointmentData),
                tenantId,
                eventType: 'appointment_reminder',
                eventId: appointmentData.appointmentId
            };

            // Enviar via UnifiedWhatsAppService
            const result = await this.unifiedService.sendMessage(
                messageData.phone,
                messageData.content,
                messageData.tenantId,
                config,
                messageData.eventType,
                messageData.eventId
            );

            // Log do resultado
            await this.logRoutineExecution(tenantId, 'appointment_reminder', appointmentData.appointmentId, result);

            console.log(`📤 Lembrete enviado para ${appointmentData.patientName}:`, result);
            return result;

        } catch (error) {
            console.error(`❌ Erro ao enviar lembrete de consulta:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar lembrete de pagamento
     * @param {string} tenantId - ID do tenant
     * @param {Object} paymentData - Dados do pagamento
     */
    async sendPaymentReminder(tenantId, paymentData) {
        try {
            console.log(`💰 Enviando lembrete de pagamento para tenant: ${tenantId}`);

            if (!this.isRoutineActive(tenantId, 'paymentReminders')) {
                console.log(`⚠️ Rotina de cobrança não está ativa para ${tenantId}`);
                return { success: false, reason: 'routine_disabled' };
            }

            const config = await this.getTenantWhatsAppConfig(tenantId);
            if (!config) {
                return { success: false, reason: 'whatsapp_not_configured' };
            }

            const messageData = {
                phone: paymentData.patientPhone,
                content: this.buildPaymentReminderMessage(paymentData),
                tenantId,
                eventType: 'payment_reminder',
                eventId: paymentData.invoiceId
            };

            const result = await this.unifiedService.sendMessage(
                messageData.phone,
                messageData.content,
                messageData.tenantId,
                config,
                messageData.eventType,
                messageData.eventId
            );

            await this.logRoutineExecution(tenantId, 'payment_reminder', paymentData.invoiceId, result);

            console.log(`💸 Cobrança enviada para ${paymentData.patientName}:`, result);
            return result;

        } catch (error) {
            console.error(`❌ Erro ao enviar lembrete de pagamento:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar confirmação de agendamento
     * @param {string} tenantId - ID do tenant
     * @param {Object} confirmationData - Dados da confirmação
     */
    async sendAppointmentConfirmation(tenantId, confirmationData) {
        try {
            console.log(`✅ Enviando confirmação de agendamento para tenant: ${tenantId}`);

            if (!this.isRoutineActive(tenantId, 'appointmentConfirmations')) {
                return { success: false, reason: 'routine_disabled' };
            }

            const config = await this.getTenantWhatsAppConfig(tenantId);
            if (!config) {
                return { success: false, reason: 'whatsapp_not_configured' };
            }

            const messageData = {
                phone: confirmationData.patientPhone,
                content: this.buildAppointmentConfirmationMessage(confirmationData),
                tenantId,
                eventType: 'appointment_confirmation',
                eventId: confirmationData.appointmentId
            };

            const result = await this.unifiedService.sendMessage(
                messageData.phone,
                messageData.content,
                messageData.tenantId,
                config,
                messageData.eventType,
                messageData.eventId
            );

            await this.logRoutineExecution(tenantId, 'appointment_confirmation', confirmationData.appointmentId, result);

            console.log(`✅ Confirmação enviada para ${confirmationData.patientName}:`, result);
            return result;

        } catch (error) {
            console.error(`❌ Erro ao enviar confirmação:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar mensagem de boas-vindas
     * @param {string} tenantId - ID do tenant
     * @param {Object} welcomeData - Dados da mensagem de boas-vindas
     */
    async sendWelcomeMessage(tenantId, welcomeData) {
        try {
            console.log(`👋 Enviando boas-vindas para tenant: ${tenantId}`);

            if (!this.isRoutineActive(tenantId, 'welcomeMessages')) {
                return { success: false, reason: 'routine_disabled' };
            }

            const config = await this.getTenantWhatsAppConfig(tenantId);
            if (!config) {
                return { success: false, reason: 'whatsapp_not_configured' };
            }

            const messageData = {
                phone: welcomeData.patientPhone,
                content: this.buildWelcomeMessage(welcomeData),
                tenantId,
                eventType: 'welcome_message',
                eventId: welcomeData.patientId
            };

            const result = await this.unifiedService.sendMessage(
                messageData.phone,
                messageData.content,
                messageData.tenantId,
                config,
                messageData.eventType,
                messageData.eventId
            );

            await this.logRoutineExecution(tenantId, 'welcome_message', welcomeData.patientId, result);

            console.log(`👋 Boas-vindas enviadas para ${welcomeData.patientName}:`, result);
            return result;

        } catch (error) {
            console.error(`❌ Erro ao enviar boas-vindas:`, error);
            return { success: false, error: error.message };
        }
    }

    // === MÉTODOS AUXILIARES ===

    /**
     * Verificar se uma rotina está ativa
     */
    isRoutineActive(tenantId, routineName) {
        const tenantConfig = this.routines.get(tenantId);
        return tenantConfig && tenantConfig.routines[routineName] === true;
    }

    /**
     * Obter configuração WhatsApp do tenant
     */
    async getTenantWhatsAppConfig(tenantId) {
        try {
            const tenantConfig = this.routines.get(tenantId);
            if (tenantConfig) {
                return tenantConfig.whatsappConfig;
            }

            // Se não está no cache, buscar no banco
            const config = await this.adminManager.getTenantWhatsAppConfig(tenantId);
            return config;

        } catch (error) {
            console.error(`❌ Erro ao obter config WhatsApp para ${tenantId}:`, error);
            return null;
        }
    }

    /**
     * Registrar execução de rotina
     */
    async logRoutineExecution(tenantId, routineType, eventId, result) {
        try {
            await this.adminManager.logMessageSent(
                tenantId,
                result.phone || 'unknown',
                result.message || 'routine_message',
                routineType,
                JSON.stringify(result),
                result.success ? 'sent' : 'failed'
            );
        } catch (error) {
            console.error(`❌ Erro ao registrar log de rotina:`, error);
        }
    }

    // === CONSTRUTORES DE MENSAGEM ===

    buildAppointmentReminderMessage(data) {
        const { patientName, date, time, doctor, clinicName, clinicAddress } = data;
        
        return `🏥 *${clinicName}*

👋 Olá, ${patientName}!

📅 Lembrete da sua consulta:
🗓️ **Data:** ${date}
⏰ **Horário:** ${time}
👨‍⚕️ **Profissional:** ${doctor}

📍 **Local:** ${clinicAddress}

⚠️ Por favor, chegue 15 minutos antes do horário marcado.

Em caso de impossibilidade de comparecimento, entre em contato conosco com antecedência.

Nos vemos em breve! 😊`;
    }

    buildPaymentReminderMessage(data) {
        const { patientName, amount, dueDate, invoiceId, clinicName } = data;
        
        return `💰 *${clinicName}*

👋 Olá, ${patientName}!

💳 Lembrete de pagamento pendente:
🧾 **Fatura:** #${invoiceId}
💵 **Valor:** R$ ${amount}
📅 **Vencimento:** ${dueDate}

Para efetuar o pagamento ou esclarecer dúvidas, entre em contato conosco.

Agradecemos sua atenção! 🙏`;
    }

    buildAppointmentConfirmationMessage(data) {
        const { patientName, date, time, doctor, clinicName } = data;
        
        return `✅ *${clinicName}*

👋 Olá, ${patientName}!

🎉 Sua consulta foi confirmada:
🗓️ **Data:** ${date}
⏰ **Horário:** ${time}
👨‍⚕️ **Profissional:** ${doctor}

Aguardamos você! 😊

*Esta é uma confirmação automática.*`;
    }

    buildWelcomeMessage(data) {
        const { patientName, clinicName, clinicAddress } = data;
        
        return `🎉 *Bem-vindo(a) à ${clinicName}!*

👋 Olá, ${patientName}!

É um prazer tê-lo(a) como nosso paciente! 

🏥 **Nossa clínica:** ${clinicAddress}

📱 Por este WhatsApp você receberá:
• Lembretes de consultas
• Confirmações de agendamento
• Informações importantes

Qualquer dúvida, estamos à disposição!

Seja muito bem-vindo(a)! 🤗`;
    }

    /**
     * Atualizar configuração de rotinas de um tenant
     */
    async updateTenantRoutines(tenantId, newConfig) {
        try {
            const currentConfig = this.routines.get(tenantId);
            if (currentConfig) {
                currentConfig.routines = { ...currentConfig.routines, ...newConfig };
                currentConfig.lastUpdate = new Date();
                this.routines.set(tenantId, currentConfig);
                
                console.log(`🔄 Rotinas atualizadas para ${tenantId}:`, currentConfig.routines);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`❌ Erro ao atualizar rotinas:`, error);
            return false;
        }
    }

    /**
     * Obter status das rotinas de um tenant
     */
    getTenantRoutinesStatus(tenantId) {
        const config = this.routines.get(tenantId);
        if (config) {
            return {
                tenantId,
                status: config.status,
                routines: config.routines,
                lastUpdate: config.lastUpdate,
                whatsappProvider: config.whatsappConfig?.provider
            };
        }
        
        return { tenantId, status: 'not_initialized' };
    }
}

module.exports = TenantWhatsAppRoutines;