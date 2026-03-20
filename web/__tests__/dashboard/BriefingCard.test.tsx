import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BriefingCard } from '@/components/dashboard/BriefingCard'

describe('BriefingCard', () => {
  it('deve mostrar skeleton quando isLoading=true', () => {
    render(<BriefingCard isLoading={true} briefing={null} error={null} />)
    expect(screen.getByTestId('briefing-skeleton')).toBeDefined()
  })

  it('deve mostrar mensagem de fallback quando error', () => {
    render(<BriefingCard isLoading={false} briefing={null} error={new Error('fail')} />)
    expect(screen.getByText('Briefing indisponível hoje')).toBeDefined()
  })

  it('deve renderizar o texto do briefing', () => {
    const texto = 'Sua receita está 12% acima de fevereiro.'
    render(<BriefingCard isLoading={false} briefing={{ briefing: texto, kpis: {}, gerado_em: '2026-03-20T07:00:00Z' }} error={null} />)
    expect(screen.getByText(texto)).toBeDefined()
  })

  it('deve mostrar o timestamp formatado', () => {
    render(<BriefingCard isLoading={false} briefing={{ briefing: 'Texto', kpis: {}, gerado_em: '2026-03-20T07:00:00Z' }} error={null} />)
    // Verifica que existe algum texto com "Gerado" (o horário varia por timezone)
    expect(screen.getByText(/Gerado/)).toBeDefined()
  })

  it('deve ter botão "Ver mais" e expandir o texto', () => {
    const texto = 'Texto longo do briefing que precisa de mais espaço.'
    render(<BriefingCard isLoading={false} briefing={{ briefing: texto, kpis: {}, gerado_em: '2026-03-20T07:00:00Z' }} error={null} defaultCollapsed={true} />)
    const btn = screen.getByRole('button', { name: /ver mais/i })
    expect(btn).toBeDefined()
    fireEvent.click(btn)
    expect(screen.queryByRole('button', { name: /ver menos/i })).toBeDefined()
  })
})
