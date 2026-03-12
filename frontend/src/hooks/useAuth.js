import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [license, setLicense] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [licenses, setLicenses] = useState([]);
  const [showLicenseSelector, setShowLicenseSelector] = useState(false);
  const [loading, setLoading] = useState(false); // Iniciar como false
  const [loginLoading, setLoginLoading] = useState(false);

  // Limpa cookies grandes que causam erro 431 (Request Header Fields Too Large)
  const cleanupCookies = useCallback(() => {
    try {
      const totalCookieSize = document.cookie.length;
      if (totalCookieSize > 3000) {
        console.warn(`Cookies grandes detectados (${totalCookieSize} bytes), limpando...`);
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim();
          // Limpar cookie para o domínio atual e path raiz
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        });
      }
    } catch (error) {
      console.error('Erro ao limpar cookies:', error);
    }
  }, []);

  // Função para limpar dados problemáticos do localStorage
  const cleanupLocalStorage = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('saee-') || key.includes('auth')) {
          const value = localStorage.getItem(key);
          if (value && value.length > 5000) { // Dados muito grandes
            console.warn(`Removendo dados grandes do localStorage: ${key}`);
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }, []);

  // Função logout separada para evitar dependências circulares
  const logout = useCallback(() => {
    setUser(null);
    setTenant(null);
    setLicense(null);
    setToken(null);
    setLicenses([]);
    setShowLicenseSelector(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('tenantSlug');
    localStorage.removeItem('agenda_profissionais_selecionados');
  }, []);

  // Configurar token no axios
  useEffect(() => {
    if (token) {
      // Verificar tamanho do token antes de configurar
      const tokenSize = `Bearer ${token}`.length;
      if (tokenSize > 4000) {
        console.warn('Token muito grande detectado, fazendo logout');
        logout();
        return;
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('authToken', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
    }
  }, [token, logout]);

  // Limpar dados problemáticos ao inicializar (cookies + localStorage)
  useEffect(() => {
    cleanupCookies();
    cleanupLocalStorage();
  }, [cleanupCookies, cleanupLocalStorage]);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        // Verificar tamanho do token antes de usar
        const tokenSize = `Bearer ${token}`.length;
        if (tokenSize > 4000) {
          console.warn('Token muito grande detectado no checkAuth, fazendo logout');
          logout();
          return;
        }

        setLoading(true);
        try {
          const response = await api.get('/auth/me', { _silent: true });
          if (response.data.success) {
            setUser(response.data.user);
            setTenant(response.data.tenant);
            setLicense(response.data.license);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          logout();
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [token, logout]);

  // Login unificado com controle de sessões
  const login = async (email, senha, forceLogin = false, sessionsToRemove = []) => {
    try {
      console.log('🔐 LOGIN API: Iniciando login para:', email);
      setLoginLoading(true);

      // Garantir que nenhum token stale vai no header de login (evita 431)
      delete api.defaults.headers.common['Authorization'];

      const response = await api.post('/auth/login', {
        email, 
        senha, 
        forceLogin, 
        sessionsToRemove 
      });
      
        console.log('🔐 LOGIN API: Response status:', response.status);
        console.log('🔐 LOGIN API: Response data:', response.data);
        
        if (response.data.success) {
          const { user: userData, token: authToken, sessionId, sessionInfo } = response.data;        console.log('🔐 LOGIN API: Setting auth state');
        
        // Armazenar informações no localStorage ANTES de definir o estado
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('sessionId', sessionId);
        
        // Armazenar tenantSlug para requisições futuras
        if (response.data.tenant?.slug) {
          localStorage.setItem('tenantSlug', response.data.tenant.slug);
        }
        
        // Agora definir o estado React
        setUser(userData);
        setToken(authToken);
        setTenant(response.data.tenant);
        setLicense(response.data.license || null);
        
        console.log('🔐 LOGIN API: Estado atualizado, isAuthenticated:', !!(authToken && userData && response.data.tenant));
        
        return { 
          success: true, 
          singleLicense: true,
          sessionInfo
        };
      }      return { success: false, message: response.data.message };
      
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Verificar se é conflito de sessão
      if (error.response?.status === 409 && error.response?.data?.requireConfirmation) {
        return {
          success: false,
          requireConfirmation: true,
          message: error.response.data.message,
          otherSessions: error.response.data.otherSessions,
          currentIP: error.response.data.currentIP,
          options: error.response.data.options
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro inesperado no login' 
      };
    } finally {
      setLoginLoading(false);
    }
  };

  // Selecionar licença específica
  const selectLicense = async (selectedLicense) => {
    try {
      setLoginLoading(true);
      
      const response = await api.post('/auth/select-license', {
        userId: user.id,
        licenseId: selectedLicense.id
      });
      
      if (response.data.success) {
        setToken(response.data.token);
        setTenant(response.data.tenant);
        setLicense(response.data.license);
        setShowLicenseSelector(false);
        setLicenses([]);
        
        return { success: true };
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Erro na seleção de licença:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao selecionar licença'
      };
    } finally {
      setLoginLoading(false);
    }
  };

  // Trocar licença durante sessão
  const switchLicense = async (newLicenseId) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/switch-license', {
        currentToken: token,
        newLicenseId: newLicenseId
      });
      
      if (response.data.success) {
        setToken(response.data.token);
        setTenant(response.data.tenant);
        setLicense(response.data.license);
        
        return { success: true };
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Erro ao trocar licença:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao trocar licença'
      };
    } finally {
      setLoading(false);
    }
  };

  // Buscar todas as licenças do usuário
  const getUserLicenses = async () => {
    try {
      const response = await api.get('/auth/my-licenses');
      
      if (response.data.success) {
        return response.data.licenses;
      }
      
      return [];
      
    } catch (error) {
      console.error('Erro ao buscar licenças:', error);
      return [];
    }
  };

  // Verificar permissão
  const hasPermission = (permission) => {
    if (!license || !license.permissions) return false;
    return license.permissions[permission] === true;
  };

  // Verificar se é admin
  const isAdmin = () => {
    return license && ['owner', 'admin'].includes(license.role);
  };

  // Verificar se é proprietário
  const isOwner = () => {
    return license && license.role === 'owner';
  };

  // Estado de autenticação
  const isAuthenticated = !!token && !!user && !!tenant;
  
  console.log('🔐 AUTH STATE:', {
    token: !!token,
    user: !!user,
    tenant: !!tenant,
    license: !!license,
    isAuthenticated
  });

  const value = {
    // Estados
    user,
    tenant,
    license,
    token,
    licenses,
    showLicenseSelector,
    loading,
    loginLoading,
    isAuthenticated,
    
    // Funções
    login,
    logout,
    selectLicense,
    switchLicense,
    getUserLicenses,
    hasPermission,
    isAdmin,
    isOwner,
    
    // Setters para controle externo
    setShowLicenseSelector
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
