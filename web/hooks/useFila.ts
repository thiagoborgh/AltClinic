// web/hooks/useFila.ts
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'
import type { FilaItem } from '@/types/checkin'

export function useFila(tenantId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery<FilaItem[]>({
    queryKey: ['fila'],
    queryFn: async () => {
      const { data } = await api.get('/fila')
      return data.data ?? []
    },
    staleTime: 30 * 1000, // 30s — socket.io invalida em tempo real
    enabled: !!tenantId,
  })

  useEffect(() => {
    if (!tenantId) return

    const socket = getSocket()
    socket.connect()
    socket.emit('join', tenantId)

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['fila'] })
    }

    socket.on('fila:update', handleUpdate)

    return () => {
      socket.off('fila:update', handleUpdate)
      socket.disconnect()
    }
  }, [tenantId, queryClient])

  return query
}
