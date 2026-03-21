'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useConfirmacoesSSE(tenantId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const source = new EventSource('/api/confirmacoes/events')

    const handleMessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data)
        if (parsed.tipo === 'confirmacao_atualizada') {
          queryClient.invalidateQueries({ queryKey: ['confirmacoes'] })
        }
      } catch {
        // ignora erros de parse (heartbeat, etc.)
      }
    }

    source.addEventListener('message', handleMessage)

    return () => {
      source.removeEventListener('message', handleMessage)
      source.close()
    }
  }, [tenantId, queryClient])
}
