// web/__tests__/lib/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock document.cookie
let mockCookie = ''
Object.defineProperty(document, 'cookie', {
  get: () => mockCookie,
  set: (val: string) => {
    if (val.includes('expires=Thu, 01 Jan 1970')) {
      mockCookie = ''
    } else {
      const [keyVal] = val.split(';')
      mockCookie = keyVal.trim()
    }
  },
  configurable: true,
})

describe('auth helpers', () => {
  beforeEach(() => {
    mockCookie = ''
  })

  it('setAuthToken deve salvar o token no cookie', async () => {
    const { setAuthToken } = await import('@/lib/auth')
    setAuthToken('my-jwt-token')
    expect(document.cookie).toContain('altclinic_token=my-jwt-token')
  })

  it('getAuthToken deve retornar o token do cookie', async () => {
    mockCookie = 'altclinic_token=my-jwt-token'
    const { getAuthToken } = await import('@/lib/auth')
    expect(getAuthToken()).toBe('my-jwt-token')
  })

  it('getAuthToken deve retornar null quando não há cookie', async () => {
    mockCookie = ''
    const { getAuthToken } = await import('@/lib/auth')
    expect(getAuthToken()).toBeNull()
  })

  it('clearAuthToken deve remover o cookie', async () => {
    mockCookie = 'altclinic_token=my-jwt-token'
    const { clearAuthToken } = await import('@/lib/auth')
    clearAuthToken()
    expect(mockCookie).toBe('')
  })
})
