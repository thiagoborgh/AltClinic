'use client'
import { createContext, useContext } from 'react'

const TenantContext = createContext<any>(null)
export function TenantProvider({ children }: { children: React.ReactNode }) {
  return <TenantContext.Provider value={null}>{children}</TenantContext.Provider>
}
export function useTenant() { return useContext(TenantContext) }
