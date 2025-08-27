import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado - Usuário mock para desenvolvimento
      user: {
        id: 1,
        nome: 'Usuário Demo',
        email: 'demo@altclinic.com',
        role: 'admin'
      },
      token: 'mock-token-123',
      isAuthenticated: true, // Sempre autenticado para desenvolvimento
      isLoading: false,
      
      // Ações
      login: async (email, senha) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, senha });
          const { token, usuario } = response.data;
          
          // Configurar token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user: usuario,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            error: error.response?.data?.error || 'Erro ao fazer login' 
          };
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', userData);
          const { token, usuario } = response.data;
          
          // Configurar token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user: usuario,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            error: error.response?.data?.error || 'Erro ao registrar usuário' 
          };
        }
      },
      
      logout: () => {
        // Remover token do axios
        delete api.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      // Verificar se o token ainda é válido
      validateToken: async () => {
        const { token } = get();
        if (!token) return false;
        
        try {
          // Configurar token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verificar se o token é válido fazendo uma requisição para o perfil
          const response = await api.get('/auth/profile');
          const user = response.data;
          
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          // Token inválido, limpar estado
          get().logout();
          return false;
        }
      },
      
      // Atualizar dados do usuário
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }));
      },
      
      // Verificar permissões
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        // Admins têm todas as permissões
        if (user.tipoUsuario === 'admin') return true;
        
        // Verificar permissões específicas por tipo de usuário
        const permissions = {
          medico: ['agendamentos', 'pacientes', 'prontuarios', 'propostas'],
          recepcionista: ['agendamentos', 'pacientes', 'propostas', 'crm'],
          financeiro: ['propostas', 'relatorios', 'crm'],
        };
        
        return permissions[user.tipoUsuario]?.includes(permission) || false;
      },
    }),
    {
      name: 'saee-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Inicializar auth na primeira carga
const initializeAuth = async () => {
  const store = useAuthStore.getState();
  if (store.token) {
    await store.validateToken();
  }
};

// Executar inicialização
initializeAuth();
