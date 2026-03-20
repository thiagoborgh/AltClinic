'use client'

import { useMemo } from 'react'
import { KpiCard } from './KpiCard'
import { BriefingCard } from './BriefingCard'
import { DraggableGrid } from './DraggableGrid'
import { useDashboard } from '@/hooks/useDashboard'
import { useBriefing } from '@/hooks/useBriefing'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import type { KpisRecepcionista, CardConfig } from '@/types/dashboard'

const DEFAULT_CARD_ORDER = ['agenda', 'confirmacao', 'checkin', 'fila']

export function RecepcionistaDashboard() {
  const { data: kpis, isLoading } = useDashboard()
  const { data: briefing, isLoading: briefingLoading, error: briefingError } = useBriefing()
  const { data: config, mutate: saveConfig } = useDashboardConfig()

  const recKpis = kpis as KpisRecepcionista | undefined
  const cardOrder = config?.layout_json?.cards?.length ? config.layout_json.cards : DEFAULT_CARD_ORDER
  const hiddenCards = config?.layout_json?.hidden ?? []

  const allCards: Record<string, CardConfig> = useMemo(() => ({
    agenda: {
      id: 'agenda',
      component: <KpiCard label="Agenda hoje" value={isLoading ? undefined : recKpis?.agendamentos_hoje} />,
    },
    confirmacao: {
      id: 'confirmacao',
      component: (
        <KpiCard
          label="Aguardando confirmação"
          value={isLoading ? undefined : recKpis?.aguardando_confirmacao}
          variant={recKpis && recKpis.aguardando_confirmacao > 5 ? 'warning' : 'default'}
        />
      ),
    },
    checkin: {
      id: 'checkin',
      component: (
        <KpiCard
          label="Check-ins pendentes"
          value={isLoading ? undefined : recKpis?.checkins_pendentes}
          variant={recKpis && recKpis.checkins_pendentes > 3 ? 'warning' : 'default'}
        />
      ),
    },
    fila: {
      id: 'fila',
      component: <KpiCard label="Fila de espera" value={isLoading ? undefined : recKpis?.fila_atual} />,
    },
  }), [recKpis, isLoading])

  const visibleCards = cardOrder
    .filter((id) => !hiddenCards.includes(id))
    .map((id) => allCards[id])
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <DraggableGrid
        items={visibleCards}
        onReorder={(ids) => saveConfig({ layout_json: { cards: ids, hidden: hiddenCards } })}
        onHide={(id) => saveConfig({ layout_json: { cards: cardOrder, hidden: [...hiddenCards, id] } })}
        onReset={() => saveConfig({ layout_json: { cards: DEFAULT_CARD_ORDER, hidden: [] } })}
      />
      <BriefingCard
        isLoading={briefingLoading}
        briefing={briefing ?? null}
        error={briefingError as Error | null}
        defaultCollapsed={true}
      />
    </div>
  )
}
