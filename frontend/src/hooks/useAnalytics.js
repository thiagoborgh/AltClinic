import { useCallback } from 'react';

// Tipos de eventos para tracking
export const ANALYTICS_EVENTS = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_iniciado',
  ONBOARDING_COMPLETED: 'onboarding_concluido',
  ONBOARDING_STEP_COMPLETED: 'onboarding_passo_concluido',

  // Primeiro uso
  FIRST_APPOINTMENT_CREATED: 'primeiro_agendamento',
  FIRST_MESSAGE_SENT: 'mensagem_teste_enviada',
  WHATSAPP_CONNECTED: 'whatsapp_conectado',
  REMINDERS_ACTIVATED: 'lembrete_ativado',

  // Engajamento
  APPOINTMENT_CREATED: 'agendamento_criado',
  APPOINTMENT_EDITED: 'agendamento_editado',
  APPOINTMENT_CANCELLED: 'agendamento_cancelado',
  MESSAGE_SENT: 'mensagem_enviada',
  PATIENT_ADDED: 'paciente_adicionado',
  PROFESSIONAL_ADDED: 'profissional_adicionado',

  // Conversão
  TRIAL_STARTED: 'trial_iniciado',
  SUBSCRIPTION_STARTED: 'assinatura_iniciada',
  PAYMENT_COMPLETED: 'pagamento_concluido',

  // Cancelamento
  ACCOUNT_CANCELLED: 'cancelamento_conta',
  TRIAL_EXPIRED: 'trial_expirado',

  // Navegação
  PAGE_VIEW: 'visualizacao_pagina',
  FEATURE_USED: 'funcionalidade_usada'
};

// Hook para analytics
export const useAnalytics = () => {
  // Função para trackear eventos
  const trackEvent = useCallback(async (eventName, properties = {}) => {
    try {
      // Dados básicos do evento
      const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...properties
      };

      // Log no console para desenvolvimento
      console.log('📊 Analytics Event:', eventData);

      // TODO: Integrar com Google Analytics, Mixpanel, ou sistema próprio
      // Por enquanto, armazenar no localStorage para análise posterior
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(eventData);

      // Manter apenas os últimos 1000 eventos
      if (storedEvents.length > 1000) {
        storedEvents.splice(0, storedEvents.length - 1000);
      }

      localStorage.setItem('analytics_events', JSON.stringify(storedEvents));

      // Enviar para backend (futuramente)
      // await api.post('/analytics/track', eventData);

    } catch (error) {
      console.error('Erro ao trackear evento:', error);
    }
  }, []);

  // Função para trackear visualização de página
  const trackPageView = useCallback((pageName, properties = {}) => {
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      page: pageName,
      ...properties
    });
  }, [trackEvent]);

  // Função para trackear uso de funcionalidade
  const trackFeatureUsage = useCallback((featureName, properties = {}) => {
    trackEvent(ANALYTICS_EVENTS.FEATURE_USED, {
      feature: featureName,
      ...properties
    });
  }, [trackEvent]);

  // Função para obter eventos armazenados (para debug/admin)
  const getStoredEvents = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch (error) {
      console.error('Erro ao obter eventos armazenados:', error);
      return [];
    }
  }, []);

  // Função para limpar eventos armazenados
  const clearStoredEvents = useCallback(() => {
    localStorage.removeItem('analytics_events');
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackFeatureUsage,
    getStoredEvents,
    clearStoredEvents,
    ANALYTICS_EVENTS
  };
};

export default useAnalytics;