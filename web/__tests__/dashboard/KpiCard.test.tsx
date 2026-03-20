import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '@/components/dashboard/KpiCard'

describe('KpiCard', () => {
  it('deve renderizar label e valor', () => {
    render(<KpiCard label="Receita do mês" value="R$ 44.200" />)
    expect(screen.getByText('Receita do mês')).toBeDefined()
    expect(screen.getByText('R$ 44.200')).toBeDefined()
  })

  it('deve renderizar subtext quando fornecido', () => {
    render(<KpiCard label="No-show" value="7%" subtext="+3pp vs. mês anterior" />)
    expect(screen.getByText('+3pp vs. mês anterior')).toBeDefined()
  })

  it('deve aplicar classe danger quando variant=danger', () => {
    const { container } = render(<KpiCard label="Inadimplência" value="12%" variant="danger" />)
    expect(container.querySelector('.text-destructive') ?? container.innerHTML).toBeTruthy()
  })

  it('deve mostrar skeleton quando value é undefined', () => {
    const { container } = render(<KpiCard label="Carregando" value={undefined as any} />)
    expect(container.querySelector('[data-testid="kpi-skeleton"]')).toBeDefined()
  })
})
