'use client'

import { useState } from 'react'
import { AgendamentosTab } from '@/components/checkin/AgendamentosTab'
import { FilaTab } from '@/components/checkin/FilaTab'
import type { Agendamento } from '@/types/checkin'

type Tab = 'agendamentos' | 'fila'

export default function CheckinPage() {
  const [activeTab, setActiveTab] = useState<Tab>('agendamentos')

  const handleCheckin = (posicaoFila: number, alertas?: Agendamento['alertas']) => {
    let msg = `Check-in realizado! Posição na fila: ${posicaoFila}`
    if (alertas?.fatura_aberta && alertas.fatura_aberta > 0) {
      msg += ` | Fatura em aberto: R$ ${alertas.fatura_aberta.toFixed(2)}`
    }
    if (alertas?.ultimo_atendimento_dias && alertas.ultimo_atendimento_dias > 90) {
      msg += ` | ${alertas.ultimo_atendimento_dias} dias sem visita`
    }
    console.log(msg)
    setActiveTab('fila')
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Check-in de Pacientes</h1>

      <div role="tablist" className="flex gap-2">
        <button
          role="tab"
          data-testid="tab-agendamentos"
          aria-selected={activeTab === 'agendamentos'}
          onClick={() => setActiveTab('agendamentos')}
          className={activeTab === 'agendamentos' ? 'font-bold border-b-2 border-primary' : ''}
        >
          Agendamentos do dia
        </button>
        <button
          role="tab"
          data-testid="tab-fila"
          aria-selected={activeTab === 'fila'}
          onClick={() => setActiveTab('fila')}
          className={activeTab === 'fila' ? 'font-bold border-b-2 border-primary' : ''}
        >
          Fila de espera
        </button>
      </div>

      <div role="tabpanel">
        {activeTab === 'agendamentos' ? (
          <AgendamentosTab onCheckin={handleCheckin} />
        ) : (
          <FilaTab />
        )}
      </div>
    </div>
  )
}
