'use client'

import { useState } from 'react'
import { useCheckins } from '@/hooks/useCheckins'
import { useCheckin } from '@/hooks/useCheckin'
import { AlertaBadge } from './AlertaBadge'
import type { Agendamento, StatusAgendamento } from '@/types/checkin'

type Filtro = StatusAgendamento | 'todos'

const STATUS_LABELS: Record<Filtro, string> = {
  todos: 'Todos',
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  no_show: 'No-show',
  finalizado: 'Finalizado',
}

interface AgendamentosTabProps {
  onCheckin?: (posicaoFila: number, alertas?: Agendamento['alertas']) => void
}

export function AgendamentosTab({ onCheckin }: AgendamentosTabProps) {
  const [filtros, setFiltros] = useState<StatusAgendamento[]>(['agendado', 'confirmado'])
  const { data: agendamentos = [], isLoading } = useCheckins()
  const checkin = useCheckin()

  const toggleFiltro = (status: Filtro) => {
    if (status === 'todos') {
      setFiltros([])
      return
    }
    setFiltros(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const isTodos = filtros.length === 0

  const filtered = isTodos
    ? agendamentos
    : agendamentos.filter(a => filtros.includes(a.agendamento_status))

  if (isLoading) {
    return <div data-testid="agendamentos-skeleton" />
  }

  return (
    <div>
      <div role="group" aria-label="Filtro de status">
        {(['todos', 'agendado', 'confirmado', 'cancelado', 'no_show'] as Filtro[]).map(s => (
          <button
            key={s}
            data-testid={`chip-${s}`}
            onClick={() => toggleFiltro(s)}
            aria-pressed={s === 'todos' ? isTodos : filtros.includes(s as StatusAgendamento)}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <ul>
        {filtered.map(ag => (
          <li key={ag.agendamento_id}>
            <span>{ag.paciente_nome}</span>
            <AlertaBadge
              faturaAberta={ag.alertas?.fatura_aberta}
              diasSemVisita={ag.alertas?.ultimo_atendimento_dias ?? undefined}
            />
            <span>{ag.profissional_nome} · {ag.horario_marcado.slice(11, 16)}</span>
            <span>{ag.agendamento_status}</span>
            {ag.checkin_status === 'aguardando' && (
              <button
                data-testid={`btn-checkin-${ag.agendamento_id}`}
                onClick={() =>
                  checkin.mutate(
                    {
                      agendamento_id: ag.agendamento_id,
                      paciente_id: ag.paciente_id,
                      profissional_id: ag.profissional_id,
                    },
                    {
                      onSuccess: (data) => onCheckin?.(data.posicao_fila, ag.alertas),
                    }
                  )
                }
              >
                Fazer Check-in
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
