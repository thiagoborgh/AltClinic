import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgendamentosTab } from '@/components/checkin/AgendamentosTab'

vi.mock('@/hooks/useCheckins', () => ({ useCheckins: vi.fn() }))
vi.mock('@/hooks/useCheckin', () => ({ useCheckin: vi.fn() }))

import { useCheckins } from '@/hooks/useCheckins'
import { useCheckin } from '@/hooks/useCheckin'

const mockAgendamentos = [
  {
    agendamento_id: 1,
    paciente_id: 10,
    paciente_nome: 'Maria Santos',
    profissional_id: 5,
    profissional_nome: 'Dr. Carlos',
    horario_marcado: '2026-03-20T09:00:00',
    agendamento_status: 'agendado',
    checkin_status: 'aguardando',
    alertas: { fatura_aberta: 250, ultimo_atendimento_dias: 45 },
  },
  {
    agendamento_id: 2,
    paciente_id: 11,
    paciente_nome: 'João Costa',
    profissional_id: 5,
    profissional_nome: 'Dr. Carlos',
    horario_marcado: '2026-03-20T10:00:00',
    agendamento_status: 'cancelado',
    checkin_status: 'aguardando',
    alertas: undefined,
  },
]

describe('AgendamentosTab', () => {
  beforeEach(() => {
    vi.mocked(useCheckin).mockReturnValue({ mutate: vi.fn(), isPending: false, error: null } as any)
  })

  it('filtra por status padrão (agendado + confirmado)', () => {
    vi.mocked(useCheckins).mockReturnValue({ data: mockAgendamentos, isLoading: false } as any)

    render(<AgendamentosTab />)

    expect(screen.getByText('Maria Santos')).toBeDefined()
    expect(screen.queryByText('João Costa')).toBeNull() // cancelado — não deve aparecer
  })

  it('exibe badge de fatura quando fatura_aberta > 0', () => {
    vi.mocked(useCheckins).mockReturnValue({ data: mockAgendamentos, isLoading: false } as any)

    render(<AgendamentosTab />)

    expect(screen.getByTestId('badge-fatura')).toBeDefined()
  })

  it('botão check-in some após check-in (checkin_status = presente)', () => {
    const agendamentosComCheckin = [
      { ...mockAgendamentos[0], checkin_status: 'presente' },
    ]
    vi.mocked(useCheckins).mockReturnValue({ data: agendamentosComCheckin, isLoading: false } as any)

    render(<AgendamentosTab />)

    expect(screen.queryByTestId('btn-checkin-1')).toBeNull()
  })

  it('chama onCheckin com posicao e alertas no sucesso', () => {
    const mutate = vi.fn((_, options) => options?.onSuccess?.({ posicao_fila: 3 }))
    vi.mocked(useCheckin).mockReturnValue({ mutate, isPending: false, error: null } as any)
    vi.mocked(useCheckins).mockReturnValue({ data: mockAgendamentos, isLoading: false } as any)

    const onCheckin = vi.fn()
    render(<AgendamentosTab onCheckin={onCheckin} />)

    fireEvent.click(screen.getByTestId('btn-checkin-1'))

    expect(onCheckin).toHaveBeenCalledWith(3, mockAgendamentos[0].alertas)
  })

  it('chip Todos mostra todos os agendamentos', () => {
    vi.mocked(useCheckins).mockReturnValue({ data: mockAgendamentos, isLoading: false } as any)

    render(<AgendamentosTab />)
    fireEvent.click(screen.getByTestId('chip-todos'))

    expect(screen.getByText('Maria Santos')).toBeDefined()
    expect(screen.getByText('João Costa')).toBeDefined()
  })
})
