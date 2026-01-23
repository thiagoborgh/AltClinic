import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../services/api';

/**
 * Hook para gerenciar status das automações WhatsApp
 */
const useAutomationStatus = () => {
  const [status, setStatus] = useState({
    whatsappConnected: false,
    automationsEnabled: false,
    blockedAttempts: 0,
    lastChecked: null,
    loading: true,
    error: null
  });

  const fetchStatus = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const response = await crmService.getAutomationStatus();

      if (response.data.success) {
        setStatus({
          ...response.data,
          loading: false,
          error: null
        });
      } else {
        throw new Error('Resposta inválida do servidor');
      }

    } catch (error) {
      console.error('Erro ao buscar status das automações:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar status das automações'
      }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Atualizar status a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    ...status,
    refetch: fetchStatus
  };
};

export default useAutomationStatus;