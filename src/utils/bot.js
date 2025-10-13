/**
 * Bot utility functions for WhatsApp messaging
 * Wrapper para compatibilidade com sistema antigo
 */

const TenantWhatsAppService = require('../services/TenantWhatsAppService');

// Instância do serviço WhatsApp
const whatsappService = new TenantWhatsAppService();

/**
 * Enviar mensagem WhatsApp
 * @param {string} telefone - Número do telefone
 * @param {string} mensagem - Mensagem a ser enviada
 * @param {string} clinicaId - ID da clínica (tenant)
 * @returns {Promise<boolean>} - True se enviado com sucesso
 */
async function sendWhatsAppMessage(telefone, mensagem, clinicaId = null) {
    try {
        // Se clinicaId for fornecido, configurar o tenant
        if (clinicaId) {
            whatsappService.tenantId = clinicaId;
        }

        const result = await whatsappService.sendCustomMessage(telefone, mensagem);
        
        if (result.success) {
            console.log(`✅ Mensagem WhatsApp enviada para ${telefone}:`, result.message_id);
            return true;
        } else {
            console.log(`❌ Falha ao enviar mensagem WhatsApp para ${telefone}:`, result.reason);
            return false;
        }
    } catch (error) {
        console.error(`❌ Erro ao enviar mensagem WhatsApp para ${telefone}:`, error.message);
        return false;
    }
}

/**
 * Enviar mensagem Telegram (placeholder)
 * @param {string} chatId - ID do chat
 * @param {string} mensagem - Mensagem a ser enviada
 * @param {string} clinicaId - ID da clínica
 * @returns {Promise<boolean>} - True se enviado com sucesso
 */
async function sendTelegramMessage(chatId, mensagem, clinicaId = null) {
    console.log('📱 Telegram não implementado ainda:', { chatId, mensagem, clinicaId });
    return false;
}

/**
 * Verificar status do WhatsApp para uma clínica
 * @param {string} clinicaId - ID da clínica
 * @returns {Promise<Object>} - Status da conexão
 */
async function checkWhatsAppStatus(clinicaId) {
    try {
        if (clinicaId) {
            whatsappService.tenantId = clinicaId;
        }
        
        return await whatsappService.checkConnection();
    } catch (error) {
        console.error('❌ Erro ao verificar status WhatsApp:', error.message);
        return { connected: false, error: error.message };
    }
}

module.exports = {
    sendWhatsAppMessage,
    sendTelegramMessage,
    checkWhatsAppStatus
};