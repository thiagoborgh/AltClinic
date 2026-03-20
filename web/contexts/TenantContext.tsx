'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getAuthToken } from '@/lib/auth'

export interface TenantUser {
  id: number
  nome: string
  email: string
  perfil: string
  tenant_id: string
  tenant_slug: string
  tenant_nome: string
  permissoes?: Record<string, string[]>
}

interface TenantContextType {
  user: TenantUser | null
  isLoading: boolean
  setUser: (user: TenantUser | null) => void
}

const TenantContext = createContext<TenantContextType>({
  user: null,
  isLoading: true,
  setUser: () => {},
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TenantUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      try {
        const parts = token.split('.')
        const payload = JSON.parse(atob(parts[1]))
        setUser(payload as TenantUser)
      } catch {
        setUser(null)
      }
    }
    setIsLoading(false)
  }, [])

  return (
    <TenantContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
