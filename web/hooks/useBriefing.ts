import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Briefing } from '@/types/dashboard'

export function useBriefing() {
  return useQuery<Briefing>({
    queryKey: ['dashboard-briefing'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard-ia/briefing')
      return data.data
    },
    staleTime: 60 * 60 * 1000, // 1h — alinhado com TTL do cache do backend
  })
}
