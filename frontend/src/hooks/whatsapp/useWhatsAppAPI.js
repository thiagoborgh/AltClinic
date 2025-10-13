import { useState, useEffect } from 'react';
import api from '../../services/api';

// Hook para integração com WhatsApp Business API
const useWhatsAppAPI = () => {
  const [usage, setUsage] = useState({
    used: 0,
    limit: 100,
    remaining: 100,
    exceeded: false,
    planType: 'trial',
    percentage: 0
  });
  const [whatsappStatus, setWhatsappStatus] = useState('not_configured');
  const [loading, setLoading] = useState(false);
  const [nextReset, setNextReset] = useState('');

  // Carregar dados de uso do WhatsApp
  const loadUsage = async () => {
    try {
      const response = await api.get('/whatsapp/usage');
      if (response.data.success) {
        setUsage(response.data.usage);
        setWhatsappStatus(response.data.whatsappStatus);
        setNextReset(response.data.nextReset);
      }
    } catch (error) {
      console.error('Erro ao carregar uso do WhatsApp:', error);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadUsage();
  }, []);

  const isConnected = whatsappStatus === 'active';

  const activateWhatsApp = async (phoneNumber) => {
    setLoading(true);
    try {
      const response = await api.post('/whatsapp/activate', { phoneNumber });
      if (response.data.success) {
        setWhatsappStatus('pending_qr');
        return {
          success: true,
          phoneId: response.data.phoneId,
          qrUrl: response.data.qrUrl,
          message: response.data.message
        };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Erro ao ativar WhatsApp:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro interno do servidor'
      };
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (to, message) => {
    if (usage.exceeded) {
      throw new Error('Limite mensal de mensagens excedido');
    }

    setLoading(true);
    try {
      const response = await api.post('/whatsapp/send', { to, message });
      if (response.data.success) {
        // Atualizar uso local
        setUsage(prev => ({
          ...prev,
          used: response.data.usage.used,
          remaining: response.data.usage.remaining,
          percentage: response.data.usage.percentage
        }));

        return {
          success: true,
          messageId: response.data.messageId,
          usage: response.data.usage
        };
      }
      throw new Error(response.data.message);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (newPlan) => {
    setLoading(true);
    try {
      const response = await api.post('/whatsapp/upgrade', { newPlan });
      if (response.data.success) {
        // Recarregar uso após upgrade
        await loadUsage();
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro interno do servidor'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    usage,
    whatsappStatus,
    isConnected,
    loading,
    nextReset,
    activateWhatsApp,
    sendMessage,
    upgradePlan,
    loadUsage
  };
};

export default useWhatsAppAPI;
          timestamp: new Date().toISOString(),
          import { useState, useEffect } from 'react';
import api from '../../services/api';

// Hook para integração com WhatsApp Business API
const useWhatsAppAPI = () => {
  const [usage, setUsage] = useState({
    used: 0,
    limit: 100,
    remaining: 100,
    exceeded: false,
    planType: 'trial',
    percentage: 0
  });
  const [whatsappStatus, setWhatsappStatus] = useState('not_configured');
  const [loading, setLoading] = useState(false);
  const [nextReset, setNextReset] = useState('');

  // Carregar dados de uso do WhatsApp
  const loadUsage = async () => {
    try {
      const response = await api.get('/whatsapp/usage');
      if (response.data.success) {
        setUsage(response.data.usage);
        setWhatsappStatus(response.data.whatsappStatus);
        setNextReset(response.data.nextReset);
      }
    } catch (error) {
      console.error('Erro ao carregar uso do WhatsApp:', error);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadUsage();
  }, []);

  const isConnected = whatsappStatus === 'active';

  const activateWhatsApp = async (phoneNumber) => {
    setLoading(true);
    try {
      const response = await api.post('/whatsapp/activate', { phoneNumber });
      if (response.data.success) {
        setWhatsappStatus('pending_qr');
        return {
          success: true,
          phoneId: response.data.phoneId,
          qrUrl: response.data.qrUrl,
          message: response.data.message
        };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Erro ao ativar WhatsApp:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro interno do servidor'
      };
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (to, message) => {
    if (usage.exceeded) {
      throw new Error('Limite mensal de mensagens excedido');
    }

    setLoading(true);
    try {
      const response = await api.post('/whatsapp/send', { to, message });
      if (response.data.success) {
        // Atualizar uso local
        setUsage(prev => ({
          ...prev,
          used: response.data.usage.used,
          remaining: response.data.usage.remaining,
          percentage: response.data.usage.percentage
        }));

        return {
          success: true,
          messageId: response.data.messageId,
          usage: response.data.usage
        };
      }
      throw new Error(response.data.message);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (newPlan) => {
    setLoading(true);
    try {
      const response = await api.post('/whatsapp/upgrade', { newPlan });
      if (response.data.success) {
        // Recarregar uso após upgrade
        await loadUsage();
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro interno do servidor'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    usage,
    whatsappStatus,
    isConnected,
    loading,
    nextReset,
    activateWhatsApp,
    sendMessage,
    upgradePlan,
    loadUsage
  };
};

export default useWhatsAppAPI;
        };
        
        setConversas(prev => [novaConversa, ...prev]);
        return result;
      } else {
        throw new Error('Falha no envio da mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const enviarTemplate = async (telefone, templateName, parameters = []) => {
    if (!config.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: telefone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components: parameters.length > 0 ? [
          {
            type: 'body',
            parameters: parameters.map(param => ({ type: 'text', text: param }))
          }
        ] : []
      }
    };

    return await enviarMensagem(telefone, payload, 'template');
  };

  const enviarMensagemInterativa = async (telefone, titulo, botoes) => {
    if (!config.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: telefone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: titulo },
        action: {
          buttons: botoes.map((botao, index) => ({
            type: 'reply',
            reply: {
              id: `btn_${index}`,
              title: botao.texto
            }
          }))
        }
      }
    };

    return await enviarMensagem(telefone, payload, 'interactive');
  };

  const processarWebhook = (webhookData) => {
    // Processar mensagens recebidas via webhook
    if (webhookData.messages) {
      webhookData.messages.forEach(message => {
        const novaConversa = {
          id: message.id,
          telefone: message.from,
          mensagem: message.text?.body || message.type,
          tipo: 'recebida',
          timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
          status: 'recebida'
        };
        
        setConversas(prev => {
          // Evitar duplicatas
          if (prev.some(c => c.id === message.id)) {
            return prev;
          }
          return [novaConversa, ...prev];
        });
      });
    }

    // Processar status de mensagens
    if (webhookData.statuses) {
      webhookData.statuses.forEach(status => {
        setConversas(prev => prev.map(conversa => 
          conversa.id === status.id 
            ? { ...conversa, status: status.status }
            : conversa
        ));
      });
    }
  };

  return {
    config,
    conversas,
    loading,
    isConnected: config.isConnected,
    salvarConfiguracao,
    verificarConexao,
    enviarMensagem,
    enviarTemplate,
    enviarMensagemInterativa,
    processarWebhook
  };
};

export default useWhatsAppAPI;
