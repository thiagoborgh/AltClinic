import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}))

import { useConfirmacaoActions } from '@/hooks/useConfirmacaoActions'
import { api } from '@/lib/api'

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useConfirmacaoActions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('confirmar chama POST /confirmacoes/:id/confirmar com canal presencial', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    const { result } = renderHook(() => useConfirmacaoActions(), { wrapper })
    await act(async () => {
      await result.current.confirmar.mutateAsync(1)
    })
    expect(api.post).toHaveBeenCalledWith('/confirmacoes/1/confirmar', { canal: 'presencial' })
  })

  it('cancelar envia motivo "outro" quando não fornecido', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    const { result } = renderHook(() => useConfirmacaoActions(), { wrapper })
    await act(async () => {
      await result.current.cancelar.mutateAsync({ agendamento_id: 2 })
    })
    expect(api.post).toHaveBeenCalledWith('/confirmacoes/2/cancelar', { motivo: 'outro' })
  })

  it('enviarWhatsApp chama POST /confirmacoes/:id/enviar-whatsapp', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    const { result } = renderHook(() => useConfirmacaoActions(), { wrapper })
    await act(async () => {
      await result.current.enviarWhatsApp.mutateAsync(3)
    })
    expect(api.post).toHaveBeenCalledWith('/confirmacoes/3/enviar-whatsapp')
  })
})
