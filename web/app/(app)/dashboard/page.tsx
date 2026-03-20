'use client'

import { useTenant } from '@/contexts/TenantContext'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { FinanceiroDashboard } from '@/components/dashboard/FinanceiroDashboard'
import { RecepcionistaDashboard } from '@/components/dashboard/RecepcionistaDashboard'
import { MedicoDashboard } from '@/components/dashboard/MedicoDashboard'
import { EnfermeiraDashboard } from '@/components/dashboard/EnfermeiraDashboard'

export default function DashboardPage() {
  const { user, isLoading } = useTenant()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) return null

  const perfil = user.perfil

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">
          {perfil === 'medico' ? `Bom dia, Dr(a). ${user.nome.split(' ')[0]}!` : `Bom dia, ${user.nome.split(' ')[0]}!`}
        </h1>
        <p className="text-sm text-muted-foreground">{user.tenant_nome}</p>
      </div>

      {(perfil === 'admin' || perfil === 'admin_master') && <AdminDashboard />}
      {perfil === 'financeiro' && <FinanceiroDashboard />}
      {perfil === 'recepcionista' && <RecepcionistaDashboard />}
      {perfil === 'medico' && <MedicoDashboard />}
      {perfil === 'enfermeira' && <EnfermeiraDashboard />}
    </div>
  )
}
