import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Meta } from '@/types/dashboard'

export function useMetas(mes?: string) {
  return useQuery<Meta[]>({
    queryKey: ['dashboard-metas', mes],
    queryFn: async () => {
      const params = mes ? { mes } : {}
      const { data } = await api.get('/dashboard-ia/metas', { params })
      return data.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
