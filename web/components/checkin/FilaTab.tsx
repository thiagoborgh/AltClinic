'use client'

import { useState } from 'react'
import { useFila } from '@/hooks/useFila'
import { useFilaActions } from '@/hooks/useFilaActions'
import { useTenant } from '@/contexts/TenantContext'
import { FilaCard } from './FilaCard'
import { TriagemModal } from './TriagemModal'

type TriagemState = { filaId: number; checkinId: number; pacienteNome: string } | null

export function FilaTab() {
  const { user } = useTenant()
  const { data: fila = [], isLoading } = useFila(user?.tenant_id)
  const { encaminharTriagem, chamarAtendimento, finalizar } = useFilaActions()
  const [triagemAberta, setTriagemAberta] = useState<TriagemState>(null)

  if (isLoading) {
    return <div data-testid="fila-skeleton" />
  }

  const perfil = user?.perfil ?? ''

  const handleRegistrarTriagem = (filaId: number) => {
    const item = fila.find((f) => f.fila_id === filaId)
    if (!item) return
    setTriagemAberta({
      filaId: item.fila_id,
      checkinId: item.checkin_id,
      pacienteNome: item.paciente_nome,
    })
  }

  return (
    <div>
      {fila.length === 0 ? (
        <p data-testid="fila-vazia">Nenhum paciente na fila</p>
      ) : (
        <ul>
          {[...fila].sort((a, b) => a.posicao - b.posicao).map((item) => (
            <li key={item.fila_id}>
              <FilaCard
                item={item}
                perfil={perfil}
                onEncaminharTriagem={(filaId) => encaminharTriagem.mutate(filaId)}
                onRegistrarTriagem={handleRegistrarTriagem}
                onChamar={(filaId) => chamarAtendimento.mutate(filaId)}
                onFinalizar={(filaId) => finalizar.mutate(filaId)}
              />
            </li>
          ))}
        </ul>
      )}

      {triagemAberta && (
        <TriagemModal
          filaId={triagemAberta.filaId}
          checkinId={triagemAberta.checkinId}
          pacienteNome={triagemAberta.pacienteNome}
          open={true}
          onClose={() => setTriagemAberta(null)}
        />
      )}
    </div>
  )
}
