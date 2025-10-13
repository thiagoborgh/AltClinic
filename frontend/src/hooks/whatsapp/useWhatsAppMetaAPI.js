import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Hook para integração com WhatsApp Business API (Meta)
const useWhatsAppMetaAPI = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ativar WhatsApp para a clínica
  const activateWhatsApp = useCallback(async (phoneNumber) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao ativar WhatsApp');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // Obter uso atual do WhatsApp
  const getUsage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao obter uso');
      }

      return data.usage;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // Fazer upgrade do plano
  const upgradePlan = useCallback(async (newPlan) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        },
        body: JSON.stringify({ newPlan })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer upgrade');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // Enviar mensagem (futuro)
  const sendMessage = useCallback(async (to, message) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        },
        body: JSON.stringify({ to, message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar mensagem');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // ==================== TEMPLATES ====================

  // Obter templates da clínica
  const getTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao obter templates');
      }

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // Criar template
  const createTemplate = useCallback(async (templateData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        },
        body: JSON.stringify(templateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar template');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // Atualizar template
  const updateTemplate = useCallback(async (templateId, templateData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        },
        body: JSON.stringify(templateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar template');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // Deletar template
  const deleteTemplate = useCallback(async (templateId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao deletar template');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  // Preview de template
  const previewTemplate = useCallback(async (templateId, dadosExemplo = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/whatsapp/templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Slug': user?.tenantSlug || ''
        },
        body: JSON.stringify(dadosExemplo)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao gerar preview');
      }

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantSlug]);

  return {
    loading,
    error,
    activateWhatsApp,
    getUsage,
    upgradePlan,
    sendMessage,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate
  };
};

export default useWhatsAppMetaAPI;