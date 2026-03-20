// web/__tests__/lib/api.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        response: { use: vi.fn() },
      },
    })),
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  clearAuthToken: vi.fn(),
}))

describe('api client', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.clearAllMocks())

  it('deve criar instância axios com baseURL /api', async () => {
    const { default: api } = await import('@/lib/api')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: '/api' })
    )
  })

  it('deve configurar interceptor de resposta', async () => {
    const { default: api } = await import('@/lib/api')
    // @ts-ignore
    expect(api.interceptors.response.use).toHaveBeenCalled()
  })
})
