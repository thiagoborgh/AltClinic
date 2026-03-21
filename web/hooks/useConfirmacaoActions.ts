import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useConfirmacaoActions() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['confirmacoes'] })
  // Chave parcial ['confirmacoes'] é intencional — invalida todas as datas em cache

  const confirmar = useMutation({
    mutationFn: (agendamento_id: number) =>
      api.post(`/confirmacoes/${agendamento_id}/confirmar`, { canal: 'presencial' }),
    onSuccess: invalidate,
  })

  const cancelar = useMutation({
    mutationFn: ({ agendamento_id, motivo }: { agendamento_id: number; motivo?: string }) =>
      api.post(`/confirmacoes/${agendamento_id}/cancelar`, { motivo: motivo ?? 'outro' }),
    onSuccess: invalidate,
  })

  const enviarWhatsApp = useMutation({
    mutationFn: (agendamento_id: number) =>
      api.post(`/confirmacoes/${agendamento_id}/enviar-whatsapp`),
    onSuccess: invalidate,
  })

  return { confirmar, cancelar, enviarWhatsApp }
}
