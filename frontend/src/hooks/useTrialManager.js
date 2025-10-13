import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook para gerenciar o estado do trial e detectar expiração
 */
export const useTrialManager = () => {
  const { user } = useAuth();
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [trialStatus, setTrialStatus] = useState({
    isTrialUser: false,
    daysLeft: 0,
    isExpired: false,
    hasCheckedExpiration: false
  });

  useEffect(() => {
    if (!user) return;

    const isTrialUser = user?.singleLicense?.plan === 'trial' || 
                       user?.tenant?.plano === 'trial';

    if (!isTrialUser) {
      setTrialStatus(prev => ({ ...prev, isTrialUser: false }));
      return;
    }

    const checkTrialExpiration = () => {
      const trialExpireAt = user?.tenant?.trial_expire_at;
      
      if (!trialExpireAt) return;

      const expireDate = new Date(trialExpireAt);
      const today = new Date();
      const diffTime = expireDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const isExpired = diffDays <= 0;
      const daysLeft = Math.max(0, diffDays);

      setTrialStatus({
        isTrialUser: true,
        daysLeft,
        isExpired,
        hasCheckedExpiration: true
      });

      // Mostrar modal de expiração apenas uma vez por sessão
      if (isExpired && !localStorage.getItem('trialExpiredModalShown')) {
        setShowTrialExpiredModal(true);
        localStorage.setItem('trialExpiredModalShown', 'true');
      }
    };

    checkTrialExpiration();

    // Verificar a cada hora se o trial expirou
    const interval = setInterval(checkTrialExpiration, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const closeTrialExpiredModal = () => {
    setShowTrialExpiredModal(false);
  };

  const handleUpgrade = (planId) => {
    // Aqui você pode implementar a lógica de upgrade
    console.log('Upgrade para plano:', planId);
    
    // Redirecionar para checkout ou abrir modal de pagamento
    // Por exemplo, integração com Stripe:
    // window.location.href = `/checkout?plan=${planId}`;
    
    closeTrialExpiredModal();
  };

  const resetTrialExpiredModalFlag = () => {
    localStorage.removeItem('trialExpiredModalShown');
  };

  return {
    trialStatus,
    showTrialExpiredModal,
    closeTrialExpiredModal,
    handleUpgrade,
    resetTrialExpiredModalFlag
  };
};