import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TenantProvider, useTenant } from '@/contexts/TenantContext'

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
  getAuthToken: vi.fn(() => null),
}))

function TestConsumer() {
  const { user, isLoading } = useTenant()
  if (isLoading) return <div>loading</div>
  if (!user) return <div>no user</div>
  return <div>{user.nome}</div>
}

describe('TenantContext', () => {
  it('deve exibir loading inicial e depois no user quando sem token', async () => {
    const { findByText } = render(
      <TenantProvider><TestConsumer /></TenantProvider>
    )
    await findByText('no user')
  })

  it('deve extrair user do JWT quando token existe', async () => {
    const { getAuthToken } = await import('@/lib/auth')
    const payload = { id: 1, nome: 'Maria', email: 'maria@test.com', perfil: 'admin', tenant_id: 'abc', tenant_slug: 'clinica-a', tenant_nome: 'Clínica A' }
    // Criar JWT fake (sem assinar — só para testar extração do payload)
    const fakeJwt = `header.${btoa(JSON.stringify(payload))}.signature`
    vi.mocked(getAuthToken).mockReturnValue(fakeJwt)

    const { findByText } = render(
      <TenantProvider><TestConsumer /></TenantProvider>
    )
    await findByText('Maria')
  })
})
