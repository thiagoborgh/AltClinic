// web/hooks/useFilaActions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useFilaActions() {
  const queryClient = useQueryClient()

  const invalidateFila = () =>
    queryClient.invalidateQueries({ queryKey: ['fila'] })

  const encaminharTriagem = useMutation({
    mutationFn: async (filaId: number) => {
      const { data } = await api.post(`/fila/${filaId}/triagem/chamar`)
      return data.data
    },
    onSuccess: invalidateFila,
  })

  const chamarAtendimento = useMutation({
    mutationFn: async (filaId: number) => {
      const { data } = await api.post(`/fila/${filaId}/chamar`)
      return data.data
    },
    onSuccess: invalidateFila,
  })

  const finalizar = useMutation({
    mutationFn: async (filaId: number) => {
      const { data } = await api.post(`/fila/${filaId}/finalizar`)
      return data.data
    },
    onSuccess: invalidateFila,
  })

  return { encaminharTriagem, chamarAtendimento, finalizar }
}
