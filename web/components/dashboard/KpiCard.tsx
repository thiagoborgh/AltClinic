import { cn } from '@/lib/utils'

interface KpiCardProps {
  icon?: React.ReactNode
  label: string
  value: string | number | undefined
  subtext?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantClasses: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: 'text-foreground',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger:  'text-destructive',
}

export function KpiCard({ icon, label, value, subtext, variant = 'default', className }: KpiCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-1', className)}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      {value === undefined ? (
        <div data-testid="kpi-skeleton" className="h-8 w-24 bg-muted rounded animate-pulse" />
      ) : (
        <p className={cn('text-2xl font-bold', variantClasses[variant])}>{value}</p>
      )}
      {subtext && (
        <p className="text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  )
}
