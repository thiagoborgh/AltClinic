import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Store para cache de dados da agenda
export const useAgendaCache = create(
  devtools(
    persist(
      (set, get) => ({
        // Dados de profissionais
        profissionais: [],
        profissionaisLoading: false,
        profissionaisError: null,
        profissionaisLastFetch: null,

        // Dados de pacientes
        pacientes: [],
        pacientesLoading: false,
        pacientesError: null,
        pacientesLastFetch: null,

        // Dados de agendamentos (cache local para performance)
        agendamentosCache: new Map(),
        agendamentosLastFetch: null,

        // Ações para profissionais
        setProfissionais: (profissionais) => set({
          profissionais,
          profissionaisLastFetch: Date.now(),
          profissionaisError: null
        }),

        setProfissionaisLoading: (loading) => set({ profissionaisLoading: loading }),

        setProfissionaisError: (error) => set({
          profissionaisError: error,
          profissionaisLoading: false
        }),

        // Ações para pacientes
        setPacientes: (pacientes) => set({
          pacientes,
          pacientesLastFetch: Date.now(),
          pacientesError: null
        }),

        setPacientesLoading: (loading) => set({ pacientesLoading: loading }),

        setPacientesError: (error) => set({
          pacientesError: error,
          pacientesLoading: false
        }),

        // Ações para agendamentos
        setAgendamentosCache: (dateKey, agendamentos) => {
          const cache = new Map(get().agendamentosCache);
          cache.set(dateKey, {
            data: agendamentos,
            timestamp: Date.now()
          });
          set({
            agendamentosCache: cache,
            agendamentosLastFetch: Date.now()
          });
        },

        getAgendamentosFromCache: (dateKey) => {
          const cache = get().agendamentosCache;
          const cached = cache.get(dateKey);
          if (!cached) return null;

          // Cache válido por 5 minutos
          const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
          if (isExpired) {
            cache.delete(dateKey);
            set({ agendamentosCache: cache });
            return null;
          }

          return cached.data;
        },

        // Método para buscar profissionais com cache
        fetchProfissionais: async (force = false) => {
          const state = get();

          // Se não for forçado e temos dados recentes (< 10 minutos), retorna cache
          if (!force && state.profissionaisLastFetch &&
              Date.now() - state.profissionaisLastFetch < 10 * 60 * 1000 &&
              state.profissionais.length > 0) {
            return state.profissionais;
          }

          try {
            set({ profissionaisLoading: true, profissionaisError: null });

            const response = await fetch('/api/profissionais', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (!response.ok) throw new Error('Erro ao buscar profissionais');

            const data = await response.json();
            set({
              profissionais: data,
              profissionaisLoading: false,
              profissionaisLastFetch: Date.now()
            });

            return data;
          } catch (error) {
            set({
              profissionaisError: error.message,
              profissionaisLoading: false
            });
            throw error;
          }
        },

        // Método para buscar pacientes com cache
        fetchPacientes: async (force = false) => {
          const state = get();

          // Se não for forçado e temos dados recentes (< 5 minutos), retorna cache
          if (!force && state.pacientesLastFetch &&
              Date.now() - state.pacientesLastFetch < 5 * 60 * 1000 &&
              state.pacientes.length > 0) {
            return state.pacientes;
          }

          try {
            set({ pacientesLoading: true, pacientesError: null });

            const response = await fetch('/api/pacientes', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (!response.ok) throw new Error('Erro ao buscar pacientes');

            const data = await response.json();
            set({
              pacientes: data,
              pacientesLoading: false,
              pacientesLastFetch: Date.now()
            });

            return data;
          } catch (error) {
            set({
              pacientesError: error.message,
              pacientesLoading: false
            });
            throw error;
          }
        },

        // Método para limpar cache
        clearCache: () => set({
          profissionais: [],
          pacientes: [],
          agendamentosCache: new Map(),
          profissionaisLastFetch: null,
          pacientesLastFetch: null,
          agendamentosLastFetch: null
        }),

        // Método para buscar paciente por ID (com cache)
        getPacienteById: (id) => {
          const state = get();
          return state.pacientes.find(p => p.id === id) || null;
        },

        // Método para buscar profissional por ID (com cache)
        getProfissionalById: (id) => {
          const state = get();
          return state.profissionais.find(p => p.id === id) || null;
        }
      }),
      {
        name: 'agenda-cache',
        // Não persistir dados sensíveis, apenas timestamps
        partialize: (state) => ({
          profissionaisLastFetch: state.profissionaisLastFetch,
          pacientesLastFetch: state.pacientesLastFetch,
          agendamentosLastFetch: state.agendamentosLastFetch
        })
      }
    ),
    { name: 'agenda-cache' }
  )
);