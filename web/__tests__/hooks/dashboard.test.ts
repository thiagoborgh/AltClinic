import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock lib/api
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deve chamar GET /dashboard-ia e retornar kpis', async () => {
    const mockKpis = {
      perfil: 'admin',
      agendamentos_hoje: 28,
      confirmados: 19,
      no_shows: 2,
      receita_mes: 44200,
      meta_receita: 60000,
      inadimplencia_valor: 3200,
      faturas_vencidas: 5,
      taxa_no_show_mes: 7,
      metas: {},
      calculado_em: '2026-03-20T09:00:00Z',
    }
    const { default: api } = await import('@/lib/api')
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockKpis } })

    const { useDashboard } = await import('@/hooks/useDashboard')
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/dashboard-ia')
    expect(result.current.data).toEqual(mockKpis)
  })
})

describe('useBriefing', () => {
  it('deve chamar GET /dashboard-ia/briefing e retornar briefing', async () => {
    const mockBriefing = {
      briefing: 'Sua receita está 12% acima de fevereiro.',
      kpis: {},
      gerado_em: '2026-03-20T07:00:00Z',
    }
    const { default: api } = await import('@/lib/api')
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockBriefing } })

    const { useBriefing } = await import('@/hooks/useBriefing')
    const { result } = renderHook(() => useBriefing(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/dashboard-ia/briefing')
    expect(result.current.data?.briefing).toContain('receita')
  })
})

describe('useDashboardConfig', () => {
  it('deve chamar GET /dashboard-ia/config', async () => {
    const mockConfig = {
      layout_json: { cards: ['kpi1', 'kpi2'], hidden: [] },
      alertas_config_json: {},
      horario_briefing: '07:00',
    }
    const { default: api } = await import('@/lib/api')
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockConfig } })

    const { useDashboardConfig } = await import('@/hooks/useDashboardConfig')
    const { result } = renderHook(() => useDashboardConfig(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/dashboard-ia/config')
    expect(result.current.data?.layout_json.cards).toHaveLength(2)
  })
})
