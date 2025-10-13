// Tenant WhatsApp Service - Conecta com o Admin para usar WhatsApp
// Agora com suporte a múltiplas APIs e controle de duplicação

const axios = require('axios');
const UnifiedWhatsAppService = require('./UnifiedWhatsAppService');

class TenantWhatsAppService {
    constructor() {
        this.adminBaseUrl = process.env.ADMIN_WHATSAPP_URL || 'http://localhost:3001/api/whatsapp';
        this.tenantId = process.env.TENANT_ID || 'default_tenant';
        this.config = null;
        this.configLastFetch = null;
        this.configCacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        // Número padrão para desenvolvimento - todas as licenças usarão este número
        this.developmentPhoneNumber = process.env.DEV_WHATSAPP_NUMBER || '5511999887766';
        this.isDevelopment = process.env.NODE_ENV === 'development' || process.env.USE_DEV_PHONE === 'true';
        
        // Serviço unificado para envios diretos (fallback quando admin offline)
        this.unifiedService = new UnifiedWhatsAppService();
    }

    // Obter configuração WhatsApp do tenant via admin
    async getTenantConfig(forceRefresh = false) {
        const now = Date.now();
        
        // Usar cache se disponível e não expirado
        if (this.config && this.configLastFetch && 
            (now - this.configLastFetch) < this.configCacheTimeout && !forceRefresh) {
            return this.config;
        }

        try {
            const response = await axios.get(`${this.adminBaseUrl}/tenant-config/${this.tenantId}`);
            
            if (response.data.success) {
                this.config = response.data.data;
                this.configLastFetch = now;
                return this.config;
            } else {
                console.log('Tenant não configurado para WhatsApp:', response.data.error);
                return null;
            }
        } catch (error) {
            console.error('Erro ao obter configuração WhatsApp do admin:', error.message);
            return null;
        }
    }

    // Verificar se WhatsApp está disponível para este tenant
    async isWhatsAppAvailable() {
        const config = await this.getTenantConfig();
        return config && config.has_whatsapp;
    }

    // Verificar se um tipo de automação está habilitado
    async isAutomationEnabled(automationType) {
        const config = await this.getTenantConfig();
        return config && config.enabled_automations && config.enabled_automations[automationType];
    }

    // === MÉTODOS DE ENVIO DE MENSAGENS ===

    // Enviar confirmação de agendamento
    async sendAppointmentConfirmation(appointmentData) {
        if (!await this.isAutomationEnabled('appointment_confirmations')) {
            console.log('Confirmações de agendamento não habilitadas para este tenant');
            return { success: false, reason: 'automation_disabled' };
        }

        // Usar serviço unificado direto se disponível, senão usar admin API
        if (process.env.DIRECT_WHATSAPP === 'true') {
            console.log('🔧 Usando envio direto (UnifiedWhatsAppService)');
            return await this.unifiedService.sendAppointmentConfirmation(this.tenantId, {
                patientName: appointmentData.patientName,
                doctorName: appointmentData.doctorName,
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                phoneNumber: this.isDevelopment ? this.developmentPhoneNumber : appointmentData.phoneNumber,
                appointmentId: appointmentData.appointmentId || `appt_${Date.now()}`
            });
        }

        const messageData = {
            patient_name: appointmentData.patientName,
            doctor_name: appointmentData.doctorName,
            appointment_date: this.formatDate(appointmentData.appointmentDate),
            appointment_time: this.formatTime(appointmentData.appointmentTime),
            clinic_name: appointmentData.clinicName || await this.getClinicName(),
            phone_number: appointmentData.phoneNumber,
            appointment_id: appointmentData.appointmentId
        };

        return await this.sendMessage('appointment_confirmations', appointmentData.phoneNumber, messageData);
    }

    // Enviar lembrete de consulta
    async sendAppointmentReminder(appointmentData) {
        if (!await this.isAutomationEnabled('appointment_reminders')) {
            console.log('Lembretes de consulta não habilitados para este tenant');
            return { success: false, reason: 'automation_disabled' };
        }

        const messageData = {
            patient_name: appointmentData.patientName,
            doctor_name: appointmentData.doctorName,
            appointment_date: this.formatDate(appointmentData.appointmentDate),
            appointment_time: this.formatTime(appointmentData.appointmentTime),
            clinic_name: appointmentData.clinicName || await this.getClinicName(),
            clinic_address: appointmentData.clinicAddress || await this.getClinicAddress(),
            phone_number: appointmentData.phoneNumber
        };

        return await this.sendMessage('appointment_reminders', appointmentData.phoneNumber, messageData);
    }

    // Enviar cobrança de pagamento
    async sendPaymentRequest(paymentData) {
        if (!await this.isAutomationEnabled('payment_requests')) {
            console.log('Cobranças de pagamento não habilitadas para este tenant');
            return { success: false, reason: 'automation_disabled' };
        }

        const messageData = {
            patient_name: paymentData.patientName,
            amount: this.formatCurrency(paymentData.amount),
            description: paymentData.description,
            due_date: this.formatDate(paymentData.dueDate),
            payment_link: paymentData.paymentLink,
            phone_number: paymentData.phoneNumber
        };

        return await this.sendMessage('payment_requests', paymentData.phoneNumber, messageData);
    }

    // Enviar pesquisa de satisfação
    async sendSatisfactionSurvey(surveyData) {
        if (!await this.isAutomationEnabled('satisfaction_surveys')) {
            console.log('Pesquisas de satisfação não habilitadas para este tenant');
            return { success: false, reason: 'automation_disabled' };
        }

        const messageData = {
            patient_name: surveyData.patientName,
            doctor_name: surveyData.doctorName,
            service_date: this.formatDate(surveyData.serviceDate),
            clinic_name: surveyData.clinicName || await this.getClinicName(),
            survey_link: surveyData.surveyLink,
            phone_number: surveyData.phoneNumber
        };

        return await this.sendMessage('satisfaction_surveys', surveyData.phoneNumber, messageData);
    }

    // Enviar mensagem personalizada
    async sendCustomMessage(phoneNumber, messageContent, messageType = 'custom') {
        const messageData = {
            content: messageContent,
            phone_number: phoneNumber
        };

        return await this.sendMessage(messageType, phoneNumber, messageData);
    }

    // === MÉTODO INTERNO DE ENVIO ===

    // Enviar mensagem via admin
    async sendMessage(messageType, recipientPhone, messageData) {
        try {
            // Verificar se WhatsApp está disponível
            if (!await this.isWhatsAppAvailable()) {
                return { 
                    success: false, 
                    reason: 'whatsapp_not_configured',
                    message: 'WhatsApp não configurado para este tenant'
                };
            }

            // Em desenvolvimento, usar número padrão para todas as mensagens
            const phoneToUse = this.isDevelopment ? this.developmentPhoneNumber : this.cleanPhoneNumber(recipientPhone);
            
            if (this.isDevelopment) {
                console.log(`🧪 [DESENVOLVIMENTO] Enviando para número padrão: ${phoneToUse} (original: ${recipientPhone})`);
            }

            const response = await axios.post(`${this.adminBaseUrl}/tenant-send/${this.tenantId}`, {
                message_type: messageType,
                recipient_phone: phoneToUse,
                message_data: messageData
            });

            if (response.data.success) {
                return {
                    success: true,
                    message_id: response.data.data.message_id,
                    status: response.data.data.status,
                    remaining_limit: response.data.data.remaining_limit,
                    development_note: this.isDevelopment ? `Enviado para número padrão: ${phoneToUse}` : undefined
                };
            } else {
                return {
                    success: false,
                    reason: 'send_failed',
                    message: response.data.error
                };
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem via admin:', error.message);
            
            if (error.response) {
                return {
                    success: false,
                    reason: 'api_error',
                    message: error.response.data.error,
                    status_code: error.response.status
                };
            }
            
            return {
                success: false,
                reason: 'network_error',
                message: 'Erro de conectividade com admin WhatsApp'
            };
        }
    }

    // === MÉTODOS DE UTILIDADE ===

    // Limpar e formatar número de telefone
    cleanPhoneNumber(phone) {
        if (!phone) return null;
        
        // Remover caracteres não numéricos
        let cleaned = phone.replace(/\D/g, '');
        
        // Remover código de área inicial "0" se presente
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // Adicionar código do país se necessário (Brasil = 55)
        if (cleaned.length === 10 || cleaned.length === 11) {
            // Se já tem código do país, não adicionar novamente
            if (!cleaned.startsWith('55')) {
                cleaned = '55' + cleaned;
            }
        }
        
        // Garantir que temos pelo menos 12 dígitos (55 + 10/11 dígitos)
        if (cleaned.length < 12) {
            return null;
        }
        
        return cleaned;
    }

    // Formatar data
    formatDate(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('pt-BR');
    }

    // Formatar hora
    formatTime(time) {
        if (!time) return '';
        
        if (typeof time === 'string') {
            return time;
        }
        
        const timeObj = new Date(time);
        return timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    // Formatar moeda
    formatCurrency(amount) {
        if (!amount) return 'R$ 0,00';
        
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return numAmount.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
    }

    // Obter nome da clínica (implementar conforme sistema)
    async getClinicName() {
        // TODO: Implementar busca do nome da clínica no banco
        return process.env.CLINIC_NAME || 'Nossa Clínica';
    }

    // Obter endereço da clínica (implementar conforme sistema)
    async getClinicAddress() {
        // TODO: Implementar busca do endereço da clínica no banco
        return process.env.CLINIC_ADDRESS || 'Endereço da clínica';
    }

    // === MÉTODOS DE MONITORAMENTO ===

    // Obter informações do modo desenvolvimento
    getDevelopmentInfo() {
        return {
            is_development: this.isDevelopment,
            development_phone: this.isDevelopment ? this.developmentPhoneNumber : null,
            environment: process.env.NODE_ENV || 'development',
            note: this.isDevelopment ? 'Todas as mensagens serão enviadas para o número padrão' : 'Modo produção - números reais'
        };
    }

    // Obter estatísticas de uso
    async getUsageStats() {
        const config = await this.getTenantConfig();
        if (!config) return null;

        return {
            monthly_limit: config.limits.monthly_limit,
            current_usage: config.limits.current_usage,
            remaining: config.limits.monthly_limit - config.limits.current_usage,
            last_reset: config.limits.last_reset
        };
    }

    // Verificar saúde da conexão WhatsApp
    async checkConnection() {
        try {
            const config = await this.getTenantConfig(true); // Forçar refresh
            return {
                connected: !!config,
                connection_type: config?.connection_type,
                automations: config?.enabled_automations,
                limits: config?.limits
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }
}

module.exports = TenantWhatsAppService;