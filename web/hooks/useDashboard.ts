import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { KpisQualquer } from '@/types/dashboard'

export function useDashboard() {
  return useQuery<KpisQualquer>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard-ia')
      return data.data
    },
    staleTime: 5 * 60 * 1000, // 5 min — alinhado com TTL do cache do backend
  })
}
