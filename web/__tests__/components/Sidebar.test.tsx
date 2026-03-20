import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'
import * as TenantContext from '@/contexts/TenantContext'

// Mock TenantContext
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(() => ({
    user: {
      id: 1, nome: 'João Admin', perfil: 'admin',
      tenant_id: 'abc', tenant_slug: 'clinica-a', tenant_nome: 'Clínica A',
    },
    isLoading: false,
  })),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}))

describe('Sidebar', () => {
  it('deve renderizar links de navegação para admin', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Pacientes')).toBeDefined()
    expect(screen.getByText('Financeiro')).toBeDefined()
    expect(screen.getByText('Configurações')).toBeDefined()
  })

  it('deve ocultar links sem permissão para recepcionista', () => {
    vi.mocked(TenantContext.useTenant).mockReturnValue({
      user: { perfil: 'recepcionista', nome: 'Ana', id: 2, email: 'ana@test.com', tenant_id: 'abc', tenant_slug: 'clinica-a', tenant_nome: 'Clínica A' },
      isLoading: false,
      setUser: vi.fn(),
    })
    render(<Sidebar />)
    expect(screen.queryByText('Relatórios')).toBeNull()
    expect(screen.queryByText('Configurações')).toBeNull()
  })

  it('deve mostrar o nome da clínica', () => {
    render(<Sidebar />)
    expect(screen.getByText('Clínica A')).toBeDefined()
  })
})
