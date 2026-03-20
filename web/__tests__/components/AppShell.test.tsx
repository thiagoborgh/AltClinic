import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from '@/components/layout/AppShell'

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}))
vi.mock('@/components/layout/Topbar', () => ({
  Topbar: () => <header data-testid="topbar">Topbar</header>,
}))
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    user: { nome: 'Test', perfil: 'admin', id: 1, tenant_id: 'abc', tenant_slug: 'a', tenant_nome: 'Clínica A' },
    isLoading: false,
  }),
}))

describe('AppShell', () => {
  it('deve renderizar Sidebar, Topbar e children', () => {
    render(
      <AppShell>
        <div data-testid="content">Conteúdo</div>
      </AppShell>
    )
    expect(screen.getByTestId('sidebar')).toBeDefined()
    expect(screen.getByTestId('topbar')).toBeDefined()
    expect(screen.getByTestId('content')).toBeDefined()
  })
})
