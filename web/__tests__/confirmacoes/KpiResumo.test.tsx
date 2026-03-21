import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiResumo } from '@/components/confirmacoes/KpiResumo'
import type { ResumoConfirmacoes } from '@/types/confirmacoes'

const mockResumo: ResumoConfirmacoes = {
  total: 10,
  confirmados: 5,
  cancelados: 2,
  pendentes: 3,
  whatsapp_enviado: 0,
  sem_resposta: 0,
  taxa_confirmacao: '50.0%',
}

describe('KpiResumo', () => {
  it('renderiza 4 cards com valores corretos', () => {
    render(<KpiResumo resumo={mockResumo} />)
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('50.0%')).toBeDefined()
  })

  it('renderiza skeletons quando resumo é undefined', () => {
    render(<KpiResumo resumo={undefined} />)
    const skeletons = screen.getAllByTestId('kpi-skeleton')
    expect(skeletons.length).toBe(4)
  })
})
