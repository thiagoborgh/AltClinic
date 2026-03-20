// web/hooks/useCheckins.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Agendamento } from '@/types/checkin'

export function useCheckins() {
  return useQuery<Agendamento[]>({
    queryKey: ['checkins'],
    queryFn: async () => {
      const { data } = await api.get('/checkins', { params: { data: 'hoje' } })
      return data.data ?? []
    },
    staleTime: 2 * 60 * 1000, // 2 min
  })
}
