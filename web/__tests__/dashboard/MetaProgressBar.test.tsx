import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetaProgressBar } from '@/components/dashboard/MetaProgressBar'

describe('MetaProgressBar', () => {
  it('deve calcular percentual corretamente', () => {
    render(<MetaProgressBar tipo="receita" valor_meta={60000} valor_atual={44200} />)
    expect(screen.getByText(/73%/)).toBeDefined()
  })

  it('deve mostrar valores formatados para meta de receita', () => {
    render(<MetaProgressBar tipo="receita" valor_meta={60000} valor_atual={44200} />)
    expect(screen.getByText(/R\$\s*44\.200/)).toBeDefined()
    expect(screen.getByText(/R\$\s*60\.000/)).toBeDefined()
  })

  it('deve mostrar valores sem R$ para meta de atendimentos', () => {
    render(<MetaProgressBar tipo="atendimentos" valor_meta={40} valor_atual={28} />)
    expect(screen.getByText(/28\s*\/\s*40/)).toBeDefined()
    expect(screen.getByText(/70%/)).toBeDefined()
  })

  it('deve usar cor verde quando percentual >= 80%', () => {
    const { container } = render(<MetaProgressBar tipo="receita" valor_meta={100} valor_atual={85} />)
    expect(container.innerHTML).toContain('bg-green')
  })

  it('deve usar cor vermelha quando percentual < 50%', () => {
    const { container } = render(<MetaProgressBar tipo="receita" valor_meta={100} valor_atual={40} />)
    expect(container.innerHTML).toContain('bg-red')
  })

  it('deve limitar barra a 100% mesmo se valor_atual > valor_meta', () => {
    render(<MetaProgressBar tipo="receita" valor_meta={100} valor_atual={120} />)
    expect(screen.getByText(/100%/)).toBeDefined()
  })
})
