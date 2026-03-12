import apiClient from './api';

class WhatsAppService {
  // Verificar status da conexão (silencioso — falha não mostra toast)
  async getStatus() {
    const response = await apiClient.get('/whatsapp/session/status', { _silent: true });
    return response.data;
  }

  // Iniciar conexão (gera QR Code)
  async connect() {
    const response = await apiClient.post('/whatsapp/session/connect');
    return response.data;
  }

  // Desconectar
  async disconnect() {
    const response = await apiClient.post('/whatsapp/session/disconnect');
    return response.data;
  }

  // Limpar sessão (para reconectar)
  async clearSession() {
    const response = await apiClient.post('/whatsapp/session/clear');
    return response.data;
  }

  // Enviar mensagem de texto
  async sendMessage(phoneNumber, message) {
    const response = await apiClient.post('/whatsapp/send', {
      phoneNumber,
      message
    });
    return response.data;
  }

  // Enviar mídia (imagem, vídeo, áudio)
  async sendMedia(phoneNumber, mediaUrl, caption = '') {
    const response = await apiClient.post('/whatsapp/send-media', {
      phoneNumber,
      mediaUrl,
      caption
    });
    return response.data;
  }

  // Listar mensagens
  async getMessages(filters = {}) {
    const params = new URLSearchParams();
    if (filters.phoneNumber) params.append('phoneNumber', filters.phoneNumber);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.direction) params.append('direction', filters.direction);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await apiClient.get(`/whatsapp/messages?${params.toString()}`);
    return response.data;
  }

  // Marcar mensagem como lida
  async markAsRead(messageId) {
    const response = await apiClient.patch(`/whatsapp/messages/${messageId}/read`);
    return response.data;
  }

  // Listar contatos
  async getContacts() {
    const response = await apiClient.get('/whatsapp/contacts');
    return response.data;
  }

  // Obter configurações
  async getConfig() {
    const response = await apiClient.get('/whatsapp/config');
    return response.data;
  }

  // Salvar configurações
  async saveConfig(config) {
    const response = await apiClient.post('/whatsapp/config', config);
    return response.data;
  }

  // Obter estatísticas
  async getStats() {
    const response = await apiClient.get('/whatsapp/stats');
    return response.data;
  }
}

const whatsappServiceInstance = new WhatsAppService();
export default whatsappServiceInstance;
