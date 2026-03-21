import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock EventSource global
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
const mockClose = vi.fn()
const MockEventSource = vi.fn(() => ({
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  close: mockClose,
}))
vi.stubGlobal('EventSource', MockEventSource)

const mockInvalidate = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
  }
})

import { useConfirmacoesSSE } from '@/hooks/useConfirmacoesSSE'

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useConfirmacoesSSE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('conecta EventSource no mount quando tenantId definido', () => {
    renderHook(() => useConfirmacoesSSE('tenant-123'), { wrapper })
    expect(MockEventSource).toHaveBeenCalledWith('/api/confirmacoes/events')
    expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function))
  })

  it('não conecta quando tenantId é undefined', () => {
    renderHook(() => useConfirmacoesSSE(undefined), { wrapper })
    expect(MockEventSource).not.toHaveBeenCalled()
  })

  it('chama invalidateQueries em evento confirmacao_atualizada', () => {
    renderHook(() => useConfirmacoesSSE('tenant-123'), { wrapper })
    const handler = mockAddEventListener.mock.calls[0][1]
    act(() => {
      handler({ data: JSON.stringify({ tipo: 'confirmacao_atualizada', agendamento_id: 5 }) })
    })
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['confirmacoes'] })
  })

  it('fecha EventSource no unmount', () => {
    const { unmount } = renderHook(() => useConfirmacoesSSE('tenant-123'), { wrapper })
    unmount()
    expect(mockClose).toHaveBeenCalled()
  })
})
