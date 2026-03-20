import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TriagemModal } from '@/components/checkin/TriagemModal'

// Mock useTriagem
vi.mock('@/hooks/useTriagem', () => ({
  useTriagem: vi.fn(),
}))

import { useTriagem } from '@/hooks/useTriagem'

const baseProps = {
  filaId: 1,
  checkinId: 10,
  pacienteNome: 'João Silva',
  open: true,
  onClose: vi.fn(),
}

describe('TriagemModal', () => {
  it('não renderiza nada quando open=false', () => {
    const { container } = render(<TriagemModal {...baseProps} open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('bloqueia submit sem queixa_principal', () => {
    const mutate = vi.fn()
    vi.mocked(useTriagem).mockReturnValue({ mutate, error: null, isPending: false } as any)

    render(<TriagemModal {...baseProps} />)
    fireEvent.click(screen.getByTestId('submit-triagem'))

    expect(screen.getByTestId('triagem-error')).toBeDefined()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('chama mutate com payload correto e fecha no sucesso', async () => {
    const onClose = vi.fn()
    const mutate = vi.fn()
    vi.mocked(useTriagem).mockReturnValue({ mutate, error: null, isPending: false } as any)

    render(<TriagemModal {...baseProps} onClose={onClose} />)
    fireEvent.change(screen.getByTestId('queixa-input'), { target: { value: 'Dor de cabeça' } })
    fireEvent.click(screen.getByTestId('submit-triagem'))

    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({
      fila_espera_id: 1,
      checkin_id: 10,
      queixa_principal: 'Dor de cabeça',
    }))
  })

  it('mantém modal aberto e exibe erro da mutation', () => {
    const mutate = vi.fn()
    vi.mocked(useTriagem).mockReturnValue({
      mutate,
      error: new Error('Erro ao registrar triagem'),
      isPending: false,
    } as any)

    render(<TriagemModal {...baseProps} />)

    expect(screen.getByTestId('triagem-error')).toBeDefined()
    expect(screen.getByText('Erro ao registrar triagem')).toBeDefined()
  })
})
