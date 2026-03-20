// web/hooks/useCheckin.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Agendamento, CheckinPayload } from '@/types/checkin'

export function useCheckin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CheckinPayload) => {
      const { data } = await api.post('/checkins', payload)
      // Backend retorna posicao_fila (não posicao)
      return data.data as {
        checkin_id: number
        posicao_fila: number
        alertas: { fatura_aberta: number; ultimo_atendimento_dias: number | null }
      }
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['checkins'] })
      const previous = queryClient.getQueryData<Agendamento[]>(['checkins'])
      queryClient.setQueryData<Agendamento[]>(['checkins'], (old) =>
        old?.map(a =>
          a.agendamento_id === payload.agendamento_id
            ? { ...a, checkin_status: 'presente' as const }
            : a
        ) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['checkins'], context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] })
    },
  })
}
