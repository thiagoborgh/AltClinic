'use client'

import { useState } from 'react'
import { Bot, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Briefing } from '@/types/dashboard'

interface BriefingCardProps {
  isLoading: boolean
  briefing: Briefing | null | undefined
  error: Error | null
  defaultCollapsed?: boolean
}

function formatTimestamp(gerado_em: string): string {
  try {
    const d = new Date(gerado_em)
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return `Gerado hoje às ${hh}:${mm}`
  } catch {
    return 'Gerado hoje'
  }
}

export function BriefingCard({ isLoading, briefing, error, defaultCollapsed = false }: BriefingCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (isLoading) {
    return (
      <div data-testid="briefing-skeleton" className="rounded-xl border bg-card p-4 space-y-2">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
        <div className="h-3 w-3/5 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (error || !briefing) {
    return (
      <div className="rounded-xl border bg-card p-4 flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <p className="text-sm">Briefing indisponível hoje</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Briefing IA</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatTimestamp(briefing.gerado_em)}</span>
      </div>

      <p className={`text-sm text-foreground leading-relaxed ${collapsed ? 'line-clamp-3' : ''}`}>
        {briefing.briefing}
      </p>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <><ChevronDown className="h-3 w-3 mr-1" /> Ver mais</>
        ) : (
          <><ChevronUp className="h-3 w-3 mr-1" /> Ver menos</>
        )}
      </Button>
    </div>
  )
}
