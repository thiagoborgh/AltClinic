'use client'

import { useMemo } from 'react'
import { KpiCard } from './KpiCard'
import { BriefingCard } from './BriefingCard'
import { DraggableGrid } from './DraggableGrid'
import { useDashboard } from '@/hooks/useDashboard'
import { useBriefing } from '@/hooks/useBriefing'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import type { KpisMedico, CardConfig } from '@/types/dashboard'

const DEFAULT_CARD_ORDER = ['pacientes', 'primeira', 'retornos', 'duracao']

export function MedicoDashboard() {
  const { data: kpis, isLoading } = useDashboard()
  const { data: briefing, isLoading: briefingLoading, error: briefingError } = useBriefing()
  const { data: config, mutate: saveConfig } = useDashboardConfig()

  const medKpis = kpis as KpisMedico | undefined
  const cardOrder = config?.layout_json?.cards?.length ? config.layout_json.cards : DEFAULT_CARD_ORDER
  const hiddenCards = config?.layout_json?.hidden ?? []

  const allCards: Record<string, CardConfig> = useMemo(() => ({
    pacientes: {
      id: 'pacientes',
      component: <KpiCard label="Pacientes hoje" value={isLoading ? undefined : medKpis?.pacientes_hoje} />,
    },
    primeira: {
      id: 'primeira',
      component: <KpiCard label="Primeiras consultas" value={isLoading ? undefined : medKpis?.primeira_consulta} />,
    },
    retornos: {
      id: 'retornos',
      component: <KpiCard label="Retornos" value={isLoading ? undefined : medKpis?.retornos} />,
    },
    duracao: {
      id: 'duracao',
      component: (
        <KpiCard
          label="Duração média"
          value={isLoading ? undefined : medKpis ? `${medKpis.duracao_media_min} min` : undefined}
        />
      ),
    },
  }), [medKpis, isLoading])

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
      />
    </div>
  )
}
