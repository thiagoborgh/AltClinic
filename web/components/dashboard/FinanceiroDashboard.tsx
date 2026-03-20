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
import type { KpisFinanceiro, CardConfig } from '@/types/dashboard'

const DEFAULT_CARD_ORDER = ['receita', 'meta_receita', 'vencidas', 'cobradas']

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`
}

export function FinanceiroDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useDashboard()
  const { data: briefing, isLoading: briefingLoading, error: briefingError } = useBriefing()
  const { data: config, mutate: saveConfig } = useDashboardConfig()
  const { data: metas } = useMetas()

  const finKpis = kpis as KpisFinanceiro | undefined

  const cardOrder = config?.layout_json?.cards?.length ? config.layout_json.cards : DEFAULT_CARD_ORDER
  const hiddenCards = config?.layout_json?.hidden ?? []

  const allCards: Record<string, CardConfig> = useMemo(() => ({
    receita: {
      id: 'receita',
      component: (
        <KpiCard
          label="Receita do mês"
          value={kpisLoading ? undefined : finKpis ? formatBRL(finKpis.receita_mes) : undefined}
          variant="success"
        />
      ),
    },
    meta_receita: {
      id: 'meta_receita',
      component: (
        <KpiCard
          label="Meta de receita"
          value={kpisLoading ? undefined : finKpis ? formatBRL(finKpis.meta_receita) : undefined}
        />
      ),
    },
    vencidas: {
      id: 'vencidas',
      component: (
        <KpiCard
          label="Faturas vencidas"
          value={kpisLoading ? undefined : finKpis?.faturas_vencidas}
          subtext={finKpis ? formatBRL(finKpis.valor_vencido) + ' em aberto' : undefined}
          variant={finKpis && finKpis.faturas_vencidas > 5 ? 'danger' : 'warning'}
        />
      ),
    },
    cobradas: {
      id: 'cobradas',
      component: (
        <KpiCard
          label="Cobranças hoje"
          value={kpisLoading ? undefined : finKpis?.cobradas_hoje}
          subtext="enviadas via WhatsApp"
        />
      ),
    },
  }), [finKpis, kpisLoading])

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

      {metas && metas.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Metas do mês</h3>
          {metas.map((meta) => (
            <MetaProgressBar
              key={meta.id}
              tipo={meta.tipo}
              valor_meta={meta.valor_meta}
              valor_atual={meta.tipo === 'receita' ? finKpis?.receita_mes ?? 0 : 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
