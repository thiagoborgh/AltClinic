import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { DashboardConfig } from '@/types/dashboard'

const DEFAULT_CONFIG: DashboardConfig = {
  layout_json: { cards: [], hidden: [] },
  alertas_config_json: {},
  horario_briefing: '07:00',
}

export function useDashboardConfig() {
  const queryClient = useQueryClient()

  const query = useQuery<DashboardConfig>({
    queryKey: ['dashboard-config'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard-ia/config')
      return data.data ?? DEFAULT_CONFIG
    },
    staleTime: Infinity, // configuração não muda sozinha
  })

  const mutation = useMutation({
    mutationFn: async (config: Partial<DashboardConfig>) => {
      const { data } = await api.put('/dashboard-ia/config', config)
      return data.data
    },
    onMutate: async (newConfig) => {
      // Atualização otimista
      await queryClient.cancelQueries({ queryKey: ['dashboard-config'] })
      const previous = queryClient.getQueryData<DashboardConfig>(['dashboard-config'])
      queryClient.setQueryData<DashboardConfig>(['dashboard-config'], (old) => ({
        ...(old ?? DEFAULT_CONFIG),
        ...newConfig,
        layout_json: {
          ...(old?.layout_json ?? DEFAULT_CONFIG.layout_json),
          ...(newConfig.layout_json ?? {}),
        },
      }))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dashboard-config'], context.previous)
      }
    },
  })

  return { ...query, mutate: mutation.mutate, isPending: mutation.isPending }
}
