'use client'

import { useState } from 'react'
import { useConfirmacoes } from '@/hooks/useConfirmacoes'
import { useConfirmacoesSSE } from '@/hooks/useConfirmacoesSSE'
import { useTenant } from '@/contexts/TenantContext'
import { KpiResumo } from '@/components/confirmacoes/KpiResumo'
import { ConfirmacoesTable } from '@/components/confirmacoes/ConfirmacoesTable'
import type { PerfilUsuario } from '@/types/confirmacoes'

function amanha(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function AgendaPage() {
  const { user, isLoading } = useTenant()
  const [data, setData] = useState<string>(amanha)

  const query = useConfirmacoes(data)
  const confirmacoes = query.data?.confirmacoes ?? []
  const resumo = query.data?.resumo

  useConfirmacoesSSE(user?.tenant_slug)

  if (isLoading || !user) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const perfil = user.perfil as PerfilUsuario

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold">Confirmação de Agendamentos</h1>
          <p className="text-sm text-muted-foreground">{user.tenant_nome}</p>
        </div>
        <input
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm bg-background"
        />
      </div>

      <KpiResumo resumo={resumo} />

      {query.isLoading ? (
        <div className="h-40 bg-muted rounded animate-pulse" />
      ) : (
        <ConfirmacoesTable confirmacoes={confirmacoes} perfil={perfil} />
      )}
    </div>
  )
}
