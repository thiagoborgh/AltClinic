// web/components/checkin/FilaCard.tsx
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FilaItem, StatusFila } from '@/types/checkin'

const STATUS_LABEL: Record<StatusFila, string> = {
  aguardando_triagem: 'Aguardando triagem',
  em_triagem: 'Em triagem',
  aguardando_atendimento: 'Aguardando atendimento',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<StatusFila, string> = {
  aguardando_triagem: 'bg-yellow-100 text-yellow-800',
  em_triagem: 'bg-blue-100 text-blue-800',
  aguardando_atendimento: 'bg-purple-100 text-purple-800',
  em_atendimento: 'bg-green-100 text-green-800',
  finalizado: 'bg-gray-100 text-gray-600',
  cancelado: 'bg-red-100 text-red-700',
}

interface FilaCardProps {
  item: FilaItem
  perfil: string
  onEncaminharTriagem: (filaId: number) => void
  onRegistrarTriagem: (filaId: number) => void
  onChamar: (filaId: number) => void
  onFinalizar: (filaId: number) => void
}

export function FilaCard({
  item,
  perfil,
  onEncaminharTriagem,
  onRegistrarTriagem,
  onChamar,
  onFinalizar,
}: FilaCardProps) {
  const { fila_id, paciente_nome, profissional_nome, posicao, status,
          tempo_espera_minutos, alerta_espera_longa, triagem } = item

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-muted-foreground">#{posicao}</span>
          <div>
            <p className="font-semibold text-sm">{paciente_nome}</p>
            <p className="text-xs text-muted-foreground">{profissional_nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{tempo_espera_minutos}min</span>
          {alerta_espera_longa && (
            <AlertTriangle
              className="h-4 w-4 text-orange-500"
              data-testid="alerta-espera"
            />
          )}
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOR[status])}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {triagem?.queixa_principal && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Queixa:</span> {triagem.queixa_principal}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        {perfil === 'recepcionista' && status === 'aguardando_triagem' && (
          <button
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => onEncaminharTriagem(fila_id)}
          >
            Encaminhar para triagem
          </button>
        )}
        {perfil === 'enfermeira' && status === 'em_triagem' && (
          <button
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => onRegistrarTriagem(fila_id)}
          >
            Registrar triagem
          </button>
        )}
        {perfil === 'medico' && status === 'aguardando_atendimento' && (
          <button
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => onChamar(fila_id)}
          >
            Chamar paciente
          </button>
        )}
        {perfil === 'medico' && status === 'em_atendimento' && (
          <button
            className="text-xs px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            onClick={() => onFinalizar(fila_id)}
          >
            Finalizar
          </button>
        )}
      </div>
    </div>
  )
}
