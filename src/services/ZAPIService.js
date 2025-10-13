// Z-API Service - Integração com Z-API WhatsApp
const axios = require('axios');
const crypto = require('crypto');

class ZAPIService {
    constructor(credentials) {
        this.instanceId = credentials.instance_id || '3E82B061D75E61EBAFEAD69A39353161';
        this.token = credentials.token || '6F0F59D6B5E47985FC591A56';
        this.baseUrl = `https://api.z-api.io/instances/${this.instanceId}/token/${this.token}`;
        
        this.endpoints = {
            sendText: '/send-text',
            sendImage: '/send-image',
            sendDocument: '/send-document',
            getStatus: '/status',
            getMessages: '/messages'
        };
    }

    // Gerar hash único para o conteúdo da mensagem
    generateMessageHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    // Adicionar variação única ao conteúdo para evitar duplicação
    addUniqueVariation(content, eventId, timestamp) {
        const variations = [
            `\n\n📋 Ref: ${eventId.slice(-6)}`,
            `\n\n🕐 ${new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            `\n\n📅 ${new Date(timestamp).toLocaleDateString('pt-BR')}`,
            `\n\n✨ Agendamento confirmado`,
            `\n\n🏥 Atendimento agendado`,
            `\n\n📞 Contato registrado`,
            `\n\n💼 Serviço solicitado`
        ];

        // Escolher variação baseada no hash do eventId
        const hash = crypto.createHash('md5').update(eventId).digest('hex');
        const index = parseInt(hash.substring(0, 2), 16) % variations.length;
        
        return content + variations[index];
    }

    // Verificar status da instância Z-API
    async checkStatus() {
        try {
            const response = await axios.get(`${this.baseUrl}${this.endpoints.getStatus}`);
            
            return {
                connected: response.data.connected || false,
                battery: response.data.battery || null,
                phone: response.data.phone || null,
                instance_id: this.instanceId
            };
        } catch (error) {
            console.error('Erro ao verificar status Z-API:', error.message);
            return {
                connected: false,
                error: error.message
            };
        }
    }

    // Enviar mensagem de texto via Z-API
    async sendTextMessage(phone, message, eventId = null) {
        try {
            // Adicionar variação única se eventId fornecido
            let finalMessage = message;
            if (eventId) {
                finalMessage = this.addUniqueVariation(message, eventId, Date.now());
            }

            const payload = {
                phone: this.formatPhone(phone),
                message: finalMessage
            };

            const response = await axios.post(`${this.baseUrl}${this.endpoints.sendText}`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 segundos
            });

            if (response.data && response.data.waId) {
                return {
                    success: true,
                    message_id: response.data.waId,
                    phone: response.data.phone,
                    message_hash: this.generateMessageHash(finalMessage),
                    final_message: finalMessage
                };
            } else {
                return {
                    success: false,
                    error: 'Resposta inválida da Z-API',
                    response: response.data
                };
            }

        } catch (error) {
            console.error('Erro ao enviar mensagem Z-API:', error.message);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                status_code: error.response?.status
            };
        }
    }

    // Enviar confirmação de agendamento
    async sendAppointmentConfirmation(data) {
        const message = this.buildAppointmentConfirmationMessage(data);
        const eventId = `appointment_${data.appointmentId || Date.now()}`;
        
        return await this.sendTextMessage(data.phoneNumber, message, eventId);
    }

    // Enviar lembrete de consulta
    async sendAppointmentReminder(data) {
        const message = this.buildAppointmentReminderMessage(data);
        const eventId = `reminder_${data.appointmentId || Date.now()}`;
        
        return await this.sendTextMessage(data.phoneNumber, message, eventId);
    }

    // Enviar cobrança de pagamento
    async sendPaymentRequest(data) {
        const message = this.buildPaymentRequestMessage(data);
        const eventId = `payment_${data.paymentId || Date.now()}`;
        
        return await this.sendTextMessage(data.phoneNumber, message, eventId);
    }

    // Enviar pesquisa de satisfação
    async sendSatisfactionSurvey(data) {
        const message = this.buildSatisfactionSurveyMessage(data);
        const eventId = `survey_${data.serviceId || Date.now()}`;
        
        return await this.sendTextMessage(data.phoneNumber, message, eventId);
    }

    // === TEMPLATES DE MENSAGEM ===

    buildAppointmentConfirmationMessage(data) {
        return `🏥 *${data.clinicName || 'Nossa Clínica'}*

✅ *Agendamento Confirmado*

👤 Paciente: ${data.patientName}
👨‍⚕️ Profissional: ${data.doctorName}
📅 Data: ${this.formatDate(data.appointmentDate)}
🕐 Horário: ${data.appointmentTime}

ℹ️ Por favor, chegue 15 minutos antes do horário marcado.

📞 Dúvidas? Entre em contato conosco.`;
    }

    buildAppointmentReminderMessage(data) {
        return `🔔 *Lembrete de Consulta*

${data.patientName}, você tem consulta marcada para:

👨‍⚕️ ${data.doctorName}
📅 ${this.formatDate(data.appointmentDate)} às ${data.appointmentTime}

🏥 ${data.clinicName || 'Nossa Clínica'}
📍 ${data.clinicAddress || 'Endereço da clínica'}

⏰ Não se esqueça! Chegue 15 minutos antes.`;
    }

    buildPaymentRequestMessage(data) {
        return `💰 *Cobrança Pendente*

${data.patientName}, você possui uma pendência de ${this.formatCurrency(data.amount)} referente a:

📋 ${data.description}
📅 Vencimento: ${this.formatDate(data.dueDate)}

${data.paymentLink ? `💳 Clique no link para pagar: ${data.paymentLink}` : '💳 Entre em contato para efetuar o pagamento.'}

📞 Dúvidas? Estamos à disposição.`;
    }

    buildSatisfactionSurveyMessage(data) {
        return `📊 *Pesquisa de Satisfação*

${data.patientName}, como foi sua experiência com ${data.doctorName}?

🗓️ Atendimento realizado em: ${this.formatDate(data.serviceDate)}
🏥 ${data.clinicName || 'Nossa Clínica'}

${data.surveyLink ? `📝 Avalie-nos: ${data.surveyLink}` : '📝 Sua opinião é muito importante para nós!'}

⭐ Sua avaliação nos ajuda a melhorar sempre!`;
    }

    // === UTILITÁRIOS ===

    // Formatar telefone para Z-API
    formatPhone(phone) {
        if (!phone) return null;
        
        // Remover caracteres não numéricos
        let cleaned = phone.replace(/\D/g, '');
        
        // Remover código de área inicial "0" se presente
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // Adicionar código do país se necessário (Brasil = 55)
        if (cleaned.length === 10 || cleaned.length === 11) {
            if (!cleaned.startsWith('55')) {
                cleaned = '55' + cleaned;
            }
        }
        
        // Z-API espera formato sem símbolos, apenas números
        return cleaned;
    }

    // Formatar data
    formatDate(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('pt-BR');
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

    // Validar credenciais Z-API
    async validateCredentials() {
        try {
            const status = await this.checkStatus();
            return {
                valid: status.connected === true,
                details: status
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Obter configuração da instância
    getInstanceConfig() {
        return {
            instance_id: this.instanceId,
            token: this.token.substring(0, 8) + '***', // Ocultar token para logs
            base_url: this.baseUrl,
            status: 'Z-API v2'
        };
    }
}

module.exports = ZAPIService;