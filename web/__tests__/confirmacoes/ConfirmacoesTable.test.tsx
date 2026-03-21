import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmacoesTable } from '@/components/confirmacoes/ConfirmacoesTable'
import type { Confirmacao } from '@/types/confirmacoes'

vi.mock('@/hooks/useConfirmacaoActions', () => ({
  useConfirmacaoActions: vi.fn(),
}))

import { useConfirmacaoActions } from '@/hooks/useConfirmacaoActions'

const mockConfirmacoes: Confirmacao[] = [
  {
    agendamento_id: 1,
    horario: '2026-03-21T09:00:00',
    procedimento: 'Consulta',
    paciente_id: 10,
    paciente_nome: 'Ana Lima',
    paciente_telefone: '11999999999',
    profissional_id: 5,
    profissional_nome: 'Dr. Carlos',
    confirmacao_id: null,
    status: 'pendente',
    canal: null,
    enviado_em: null,
    respondido_em: null,
  },
  {
    agendamento_id: 2,
    horario: '2026-03-21T10:00:00',
    procedimento: 'Retorno',
    paciente_id: 11,
    paciente_nome: 'João Costa',
    profissional_id: 5,
    profissional_nome: 'Dr. Carlos',
    paciente_telefone: '11888888888',
    confirmacao_id: 20,
    status: 'confirmado',
    canal: 'presencial',
    enviado_em: null,
    respondido_em: '2026-03-20T08:00:00',
  },
  {
    agendamento_id: 3,
    horario: '2026-03-21T11:00:00',
    procedimento: 'Avaliação',
    paciente_id: 12,
    paciente_nome: 'Maria Silva',
    profissional_id: 5,
    profissional_nome: 'Dr. Carlos',
    paciente_telefone: '11777777777',
    confirmacao_id: null,
    status: 'whatsapp_enviado',
    canal: 'whatsapp',
    enviado_em: '2026-03-20T07:00:00',
    respondido_em: null,
  },
]

const mockMutate = vi.fn()

describe('ConfirmacoesTable', () => {
  beforeEach(() => {
    vi.mocked(useConfirmacaoActions).mockReturnValue({
      confirmar: { mutate: mockMutate, isPending: false } as any,
      cancelar: { mutate: mockMutate, isPending: false } as any,
      enviarWhatsApp: { mutate: mockMutate, isPending: false } as any,
    })
  })

  it('filtro padrão mostra apenas pendente e whatsapp_enviado', () => {
    render(<ConfirmacoesTable confirmacoes={mockConfirmacoes} perfil="recepcionista" />)
    expect(screen.getByText('Ana Lima')).toBeDefined()       // pendente — visível
    expect(screen.getByText('Maria Silva')).toBeDefined()    // whatsapp_enviado — visível
    expect(screen.queryByText('João Costa')).toBeNull()      // confirmado — oculto
  })

  it('recepcionista vê botões de ação para pendente', () => {
    render(<ConfirmacoesTable confirmacoes={mockConfirmacoes} perfil="recepcionista" />)
    expect(screen.getByTestId('btn-confirmar-1')).toBeDefined()
    expect(screen.getByTestId('btn-whatsapp-1')).toBeDefined()
    expect(screen.getByTestId('btn-cancelar-1')).toBeDefined()
  })

  it('médico não vê botões de ação', () => {
    render(<ConfirmacoesTable confirmacoes={mockConfirmacoes} perfil="medico" />)
    expect(screen.queryByTestId('btn-confirmar-1')).toBeNull()
    expect(screen.queryByTestId('btn-whatsapp-1')).toBeNull()
    expect(screen.queryByTestId('btn-cancelar-1')).toBeNull()
  })

  it('linha confirmada não mostra botões mesmo para recepcionista', () => {
    render(<ConfirmacoesTable confirmacoes={mockConfirmacoes} perfil="recepcionista" />)
    // João Costa está com status confirmado — mesmo que apareça no filtro Todos, sem botões
    fireEvent.click(screen.getByTestId('chip-todos'))
    expect(screen.getByText('João Costa')).toBeDefined()
    expect(screen.queryByTestId('btn-confirmar-2')).toBeNull()
  })
})
