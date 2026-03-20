import { cn } from '@/lib/utils'

interface MetaProgressBarProps {
  tipo: string
  valor_meta: number
  valor_atual: number
  className?: string
}

const LABELS: Record<string, string> = {
  receita:           'Meta de Receita',
  atendimentos:      'Meta de Atendimentos',
  no_show_max:       'No-show Máximo',
  inadimplencia_max: 'Inadimplência Máxima',
}

function formatBRL(valor: number): string {
  return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatValue(tipo: string, valor: number): string {
  if (tipo === 'receita' || tipo === 'inadimplencia_max') {
    return `R$ ${formatBRL(valor)}`
  }
  return String(valor)
}

function barColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function MetaProgressBar({ tipo, valor_meta, valor_atual, className }: MetaProgressBarProps) {
  const pct = valor_meta > 0 ? Math.min(100, Math.floor((valor_atual / valor_meta) * 100)) : 0
  const label = LABELS[tipo] ?? tipo

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatValue(tipo, valor_atual)} / {formatValue(tipo, valor_meta)}
      </p>
    </div>
  )
}
