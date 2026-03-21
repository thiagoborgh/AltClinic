import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Confirmacao, ResumoConfirmacoes } from '@/types/confirmacoes'

export function useConfirmacoes(data: string) {
  return useQuery({
    queryKey: ['confirmacoes', data],
    queryFn: async () => {
      const { data: res } = await api.get('/confirmacoes', { params: { data } })
      return {
        confirmacoes: (res.data ?? []) as Confirmacao[],
        resumo: res.resumo as ResumoConfirmacoes,
      }
    },
    staleTime: 60 * 1000,
  })
}
