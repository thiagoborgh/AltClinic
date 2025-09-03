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
  console.log('AuthProvider iniciando...');
  
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [license, setLicense] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [licenses, setLicenses] = useState([]);
  const [showLicenseSelector, setShowLicenseSelector] = useState(false);
  const [loading, setLoading] = useState(false); // Iniciar como false
  const [loginLoading, setLoginLoading] = useState(false);

  console.log('AuthProvider estado inicial:', { token, user, loading });

  // Configurar token no axios
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('authToken', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
    }
  }, [token]);

  // Função logout separada para evitar dependências circulares
  const logout = useCallback(() => {
    setUser(null);
    setTenant(null);
    setLicense(null);
    setToken(null);
    setLicenses([]);
    setShowLicenseSelector(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('agenda_profissionais_selecionados');
    delete api.defaults.headers.common['Authorization'];
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        setLoading(true);
        try {
          const response = await api.get('/auth/me');
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
      setLoginLoading(true);
      
      const response = await api.post('/auth/login', { 
        email, 
        senha, 
        forceLogin, 
        sessionsToRemove 
      });
      
      if (response.data.success) {
        const { user: userData, token: authToken, sessionId, sessionInfo } = response.data;
        
        setUser(userData);
        setToken(authToken);
        setTenant(response.data.tenant);
        setLicense(response.data.license);
        
        // Armazenar informações da sessão
        localStorage.setItem('sessionId', sessionId);
        
        return { 
          success: true, 
          singleLicense: true,
          sessionInfo
        };
      }
      
      return { success: false, message: response.data.message };
      
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
  const isAuthenticated = !!token && !!user && !!tenant && !!license;

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
