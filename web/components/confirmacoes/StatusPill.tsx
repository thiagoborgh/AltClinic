import { cn } from '@/lib/utils'
import type { StatusConfirmacao } from '@/types/confirmacoes'

interface StatusPillProps {
  status: StatusConfirmacao
}

const STATUS_CONFIG: Record<StatusConfirmacao, { label: string; className: string }> = {
  pendente:         { label: 'Pendente',         className: 'bg-gray-100 text-gray-700' },
  confirmado:       { label: 'Confirmado',       className: 'bg-green-100 text-green-700' },
  cancelado:        { label: 'Cancelado',        className: 'bg-red-100 text-red-700' },
  whatsapp_enviado: { label: 'WhatsApp enviado', className: 'bg-blue-100 text-blue-700' },
  sem_resposta:     { label: 'Sem resposta',     className: 'bg-yellow-100 text-yellow-700' },
}

export function StatusPill({ status }: StatusPillProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendente
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
