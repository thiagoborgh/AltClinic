// web/hooks/useTriagem.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { TriagemPayload } from '@/types/checkin'

export function useTriagem(onClose: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: TriagemPayload) => {
      const { data } = await api.post('/fila/triagens', payload)
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fila'] })
      onClose()
    },
  })
}
