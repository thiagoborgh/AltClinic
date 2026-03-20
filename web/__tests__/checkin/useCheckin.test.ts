import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Agendamento } from '@/types/checkin'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const mockAgendamento: Agendamento = {
  agendamento_id: 10,
  paciente_id: 5,
  paciente_nome: 'Ana',
  profissional_id: 3,
  profissional_nome: 'Dr. Carlos',
  horario_marcado: '2026-03-20T09:00:00Z',
  agendamento_status: 'agendado',
  checkin_status: 'aguardando',
}

describe('useCheckin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deve chamar POST /api/checkins com o payload', async () => {
    const { default: api } = await import('@/lib/api')
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: { checkin_id: 1, posicao_fila: 2, alertas: { fatura_aberta: 0, ultimo_atendimento_dias: null } } },
    })

    const { useCheckin } = await import('@/hooks/useCheckin')
    const { result } = renderHook(() => useCheckin(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        agendamento_id: 10,
        paciente_id: 5,
        profissional_id: 3,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/checkins', {
      agendamento_id: 10,
      paciente_id: 5,
      profissional_id: 3,
    })
  })

  it('deve aplicar optimistic update: checkin_status = presente', async () => {
    const { default: api } = await import('@/lib/api')
    vi.mocked(api.post).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: { success: true, data: { checkin_id: 1, posicao_fila: 1, alertas: {} } }
      }), 200))
    )

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['checkins'], [mockAgendamento])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children)

    const { useCheckin } = await import('@/hooks/useCheckin')
    const { result } = renderHook(() => useCheckin(), { wrapper })

    act(() => {
      result.current.mutate({ agendamento_id: 10, paciente_id: 5, profissional_id: 3 })
    })

    await waitFor(() => {
      const cached = qc.getQueryData<Agendamento[]>(['checkins'])
      expect(cached?.find(a => a.agendamento_id === 10)?.checkin_status).toBe('presente')
    })
  })

  it('deve reverter optimistic update em caso de erro', async () => {
    const { default: api } = await import('@/lib/api')
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'))

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    qc.setQueryData(['checkins'], [mockAgendamento])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children)

    const { useCheckin } = await import('@/hooks/useCheckin')
    const { result } = renderHook(() => useCheckin(), { wrapper })

    await act(async () => {
      result.current.mutate({ agendamento_id: 10, paciente_id: 5, profissional_id: 3 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = qc.getQueryData<Agendamento[]>(['checkins'])
    expect(cached?.find(a => a.agendamento_id === 10)?.checkin_status).toBe('aguardando')
  })
})
