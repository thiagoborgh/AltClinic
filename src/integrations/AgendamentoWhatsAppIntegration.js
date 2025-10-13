// Exemplo de uso do TenantWhatsAppService
// Substitui as integrações diretas de WhatsApp no controller de agendamentos

const TenantWhatsAppService = require('../services/TenantWhatsAppService');

// Instância única do serviço WhatsApp para o tenant
const whatsapp = new TenantWhatsAppService();

class AgendamentoWhatsAppIntegration {
    
    // Enviar confirmação após criar agendamento
    static async sendConfirmationAfterCreate(agendamentoData) {
        try {
            console.log('📱 Enviando confirmação de agendamento via Admin WhatsApp...');
            
            const result = await whatsapp.sendAppointmentConfirmation({
                patientName: agendamentoData.paciente_nome,
                doctorName: agendamentoData.medico_nome,
                appointmentDate: agendamentoData.data_agendamento,
                appointmentTime: agendamentoData.horario,
                phoneNumber: agendamentoData.paciente_telefone,
                clinicName: agendamentoData.clinica_nome
            });

            if (result.success) {
                console.log(`✅ Confirmação enviada! ID: ${result.message_id}`);
                return {
                    sent: true,
                    message_id: result.message_id,
                    remaining_limit: result.remaining_limit
                };
            } else {
                console.log(`❌ Falha no envio: ${result.reason} - ${result.message}`);
                return {
                    sent: false,
                    reason: result.reason,
                    message: result.message
                };
            }
        } catch (error) {
            console.error('💥 Erro ao enviar confirmação WhatsApp:', error);
            return {
                sent: false,
                error: error.message
            };
        }
    }

    // Enviar lembrete 24h antes da consulta
    static async sendReminderBeforeAppointment(agendamentoData) {
        try {
            console.log('🔔 Enviando lembrete de consulta via Admin WhatsApp...');
            
            const result = await whatsapp.sendAppointmentReminder({
                patientName: agendamentoData.paciente_nome,
                doctorName: agendamentoData.medico_nome,
                appointmentDate: agendamentoData.data_agendamento,
                appointmentTime: agendamentoData.horario,
                phoneNumber: agendamentoData.paciente_telefone,
                clinicName: agendamentoData.clinica_nome,
                clinicAddress: agendamentoData.clinica_endereco
            });

            if (result.success) {
                console.log(`✅ Lembrete enviado! ID: ${result.message_id}`);
                return { sent: true, message_id: result.message_id };
            } else {
                console.log(`❌ Falha no lembrete: ${result.reason}`);
                return { sent: false, reason: result.reason };
            }
        } catch (error) {
            console.error('💥 Erro ao enviar lembrete WhatsApp:', error);
            return { sent: false, error: error.message };
        }
    }

    // Enviar cobrança de consulta
    static async sendPaymentRequest(paymentData) {
        try {
            console.log('💰 Enviando cobrança via Admin WhatsApp...');
            
            const result = await whatsapp.sendPaymentRequest({
                patientName: paymentData.paciente_nome,
                amount: paymentData.valor,
                description: paymentData.descricao,
                dueDate: paymentData.data_vencimento,
                paymentLink: paymentData.link_pagamento,
                phoneNumber: paymentData.paciente_telefone
            });

            if (result.success) {
                console.log(`✅ Cobrança enviada! ID: ${result.message_id}`);
                return { sent: true, message_id: result.message_id };
            } else {
                console.log(`❌ Falha na cobrança: ${result.reason}`);
                return { sent: false, reason: result.reason };
            }
        } catch (error) {
            console.error('💥 Erro ao enviar cobrança WhatsApp:', error);
            return { sent: false, error: error.message };
        }
    }

    // Enviar pesquisa de satisfação após consulta
    static async sendSatisfactionSurvey(surveyData) {
        try {
            console.log('📊 Enviando pesquisa de satisfação via Admin WhatsApp...');
            
            const result = await whatsapp.sendSatisfactionSurvey({
                patientName: surveyData.paciente_nome,
                doctorName: surveyData.medico_nome,
                serviceDate: surveyData.data_atendimento,
                phoneNumber: surveyData.paciente_telefone,
                surveyLink: surveyData.link_pesquisa,
                clinicName: surveyData.clinica_nome
            });

            if (result.success) {
                console.log(`✅ Pesquisa enviada! ID: ${result.message_id}`);
                return { sent: true, message_id: result.message_id };
            } else {
                console.log(`❌ Falha na pesquisa: ${result.reason}`);
                return { sent: false, reason: result.reason };
            }
        } catch (error) {
            console.error('💥 Erro ao enviar pesquisa WhatsApp:', error);
            return { sent: false, error: error.message };
        }
    }

    // Verificar se WhatsApp está configurado antes de tentar enviar
    static async checkWhatsAppAvailability() {
        try {
            const isAvailable = await whatsapp.isWhatsAppAvailable();
            const connectionStatus = await whatsapp.checkConnection();
            
            return {
                available: isAvailable,
                connection: connectionStatus
            };
        } catch (error) {
            console.error('Erro ao verificar WhatsApp:', error);
            return {
                available: false,
                error: error.message
            };
        }
    }

    // Obter estatísticas de uso WhatsApp
    static async getUsageStatistics() {
        try {
            const stats = await whatsapp.getUsageStats();
            return stats;
        } catch (error) {
            console.error('Erro ao obter estatísticas WhatsApp:', error);
            return null;
        }
    }
}

// Exemplo de uso no controller de agendamentos:
// 
// const AgendamentoWhatsAppIntegration = require('../integrations/AgendamentoWhatsAppIntegration');
// 
// // Após criar agendamento
// const whatsappResult = await AgendamentoWhatsAppIntegration.sendConfirmationAfterCreate({
//   paciente_nome: 'João Silva',
//   medico_nome: 'Dr. Carlos',
//   data_agendamento: '2024-01-15',
//   horario: '14:30',
//   paciente_telefone: '11999999999',
//   clinica_nome: 'Clínica Exemplo'
// });
//
// // No cron job de lembretes (24h antes)
// const reminderResult = await AgendamentoWhatsAppIntegration.sendReminderBeforeAppointment(agendamentoData);
//
// // Para cobranças
// const paymentResult = await AgendamentoWhatsAppIntegration.sendPaymentRequest({
//   paciente_nome: 'João Silva',
//   valor: 150.00,
//   descricao: 'Consulta com Dr. Carlos',
//   data_vencimento: '2024-01-20',
//   link_pagamento: 'https://pay.example.com/123',
//   paciente_telefone: '11999999999'
// });

module.exports = AgendamentoWhatsAppIntegration;