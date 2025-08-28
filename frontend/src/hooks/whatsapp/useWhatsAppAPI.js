import { useState, useEffect } from 'react';

// Hook para integração com WhatsApp Business API
const useWhatsAppAPI = () => {
  const [config, setConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    webhookToken: '',
    isConnected: false
  });
  
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar configuração do localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('whatsappConfig');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      if (parsedConfig.accessToken && parsedConfig.phoneNumberId) {
        verificarConexao(parsedConfig);
      }
    }
  }, []);

  const verificarConexao = async (configToTest = config) => {
    if (!configToTest.accessToken || !configToTest.phoneNumberId) {
      return false;
    }

    setLoading(true);
    try {
      // Simular verificação da API (substituir por chamada real)
      const response = await fetch(`https://graph.facebook.com/v18.0/${configToTest.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${configToTest.accessToken}`
        }
      });

      if (response.ok) {
        setConfig(prev => ({ ...prev, isConnected: true }));
        return true;
      } else {
        setConfig(prev => ({ ...prev, isConnected: false }));
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar conexão WhatsApp:', error);
      setConfig(prev => ({ ...prev, isConnected: false }));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracao = async (novaConfig) => {
    const configCompleta = { ...config, ...novaConfig };
    setConfig(configCompleta);
    localStorage.setItem('whatsappConfig', JSON.stringify(configCompleta));
    
    if (novaConfig.accessToken && novaConfig.phoneNumberId) {
      return await verificarConexao(configCompleta);
    }
    return false;
  };

  const enviarMensagem = async (telefone, mensagem, tipo = 'text') => {
    if (!config.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    setLoading(true);
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: telefone,
        type: tipo,
        text: tipo === 'text' ? { body: mensagem } : undefined
      };

      // Simular envio (substituir por chamada real à API)
      const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Adicionar à lista de conversas
        const novaConversa = {
          id: result.messages?.[0]?.id || Date.now(),
          telefone,
          mensagem,
          tipo: 'enviada',
          timestamp: new Date().toISOString(),
          status: 'enviada'
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
