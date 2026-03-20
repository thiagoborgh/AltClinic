// web/components/checkin/AlertaBadge.tsx
import { AlertTriangle, Calendar } from 'lucide-react'

interface AlertaBadgeProps {
  faturaAberta?: number   // valor em R$, ex: 250.50
  diasSemVisita?: number  // dias desde último atendimento
}

export function AlertaBadge({ faturaAberta, diasSemVisita }: AlertaBadgeProps) {
  const temFatura = faturaAberta != null && faturaAberta > 0
  const temDias = diasSemVisita != null && diasSemVisita > 90

  if (!temFatura && !temDias) return null

  return (
    <span className="inline-flex items-center gap-1">
      {temFatura && (
        <span
          className="inline-flex items-center gap-0.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5"
          title={`Fatura em aberto: R$ ${faturaAberta!.toFixed(2)}`}
          data-testid="badge-fatura"
        >
          <AlertTriangle className="h-3 w-3" />
          R${faturaAberta!.toFixed(0)}
        </span>
      )}
      {temDias && (
        <span
          className="inline-flex items-center gap-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5"
          title={`${diasSemVisita} dias sem visita`}
          data-testid="badge-dias"
        >
          <Calendar className="h-3 w-3" />
          {diasSemVisita}d
        </span>
      )}
    </span>
  )
}
