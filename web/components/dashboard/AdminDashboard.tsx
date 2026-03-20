'use client'

import { useMemo } from 'react'
import { KpiCard } from './KpiCard'
import { BriefingCard } from './BriefingCard'
import { MetaProgressBar } from './MetaProgressBar'
import { DraggableGrid } from './DraggableGrid'
import { useDashboard } from '@/hooks/useDashboard'
import { useBriefing } from '@/hooks/useBriefing'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import { useMetas } from '@/hooks/useMetas'
import type { KpisAdmin, CardConfig } from '@/types/dashboard'
import { Calendar } from 'lucide-react'

const DEFAULT_CARD_ORDER = ['agendamentos', 'confirmados', 'receita', 'inadimplencia']

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`
}

export function AdminDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useDashboard()
  const { data: briefing, isLoading: briefingLoading, error: briefingError } = useBriefing()
  const { data: config, mutate: saveConfig } = useDashboardConfig()
  const { data: metas } = useMetas()

  const adminKpis = kpis as KpisAdmin | undefined

  const cardOrder: string[] = config?.layout_json?.cards?.length
    ? config.layout_json.cards
    : DEFAULT_CARD_ORDER
  const hiddenCards: string[] = config?.layout_json?.hidden ?? []

  const allCards: Record<string, CardConfig> = useMemo(() => ({
    agendamentos: {
      id: 'agendamentos',
      component: (
        <KpiCard
          label="Agendamentos hoje"
          value={kpisLoading ? undefined : adminKpis?.agendamentos_hoje}
          icon={<Calendar className="h-4 w-4" />}
        />
      ),
    },
    confirmados: {
      id: 'confirmados',
      component: (
        <KpiCard
          label="Confirmados"
          value={kpisLoading ? undefined : adminKpis?.confirmados}
          subtext={adminKpis ? `${Math.round((adminKpis.confirmados / Math.max(adminKpis.agendamentos_hoje, 1)) * 100)}% da agenda` : undefined}
          variant="success"
        />
      ),
    },
    receita: {
      id: 'receita',
      component: (
        <KpiCard
          label="Receita do mês"
          value={kpisLoading ? undefined : adminKpis ? formatBRL(adminKpis.receita_mes) : undefined}
        />
      ),
    },
    inadimplencia: {
      id: 'inadimplencia',
      component: (
        <KpiCard
          label="Inadimplência"
          value={kpisLoading ? undefined : adminKpis ? `${adminKpis.taxa_no_show_mes}%` : undefined}
          subtext={adminKpis ? `${adminKpis.faturas_vencidas} faturas vencidas` : undefined}
          variant={adminKpis && adminKpis.taxa_no_show_mes > 10 ? 'danger' : 'warning'}
        />
      ),
    },
  }), [adminKpis, kpisLoading])

  const visibleCards = cardOrder
    .filter((id) => !hiddenCards.includes(id))
    .map((id) => allCards[id])
    .filter(Boolean)

  function handleReorder(ids: string[]) {
    saveConfig({ layout_json: { cards: ids, hidden: hiddenCards } })
  }

  function handleHide(id: string) {
    saveConfig({ layout_json: { cards: cardOrder, hidden: [...hiddenCards, id] } })
  }

  function handleReset() {
    saveConfig({ layout_json: { cards: DEFAULT_CARD_ORDER, hidden: [] } })
  }

  return (
    <div className="space-y-6">
      <DraggableGrid
        items={visibleCards}
        onReorder={handleReorder}
        onHide={handleHide}
        onReset={handleReset}
      />

      <BriefingCard
        isLoading={briefingLoading}
        briefing={briefing ?? null}
        error={briefingError as Error | null}
      />

      {metas && metas.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Metas do mês</h3>
          {metas.map((meta) => (
            <MetaProgressBar
              key={meta.id}
              tipo={meta.tipo}
              valor_meta={meta.valor_meta}
              valor_atual={
                meta.tipo === 'receita' ? adminKpis?.receita_mes ?? 0 :
                meta.tipo === 'atendimentos' ? adminKpis?.agendamentos_hoje ?? 0 :
                0
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
