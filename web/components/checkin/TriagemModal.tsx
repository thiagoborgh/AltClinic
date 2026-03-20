'use client'

import { useState } from 'react'
import { useTriagem } from '@/hooks/useTriagem'
import type { TriagemPayload } from '@/types/checkin'

interface TriagemModalProps {
  filaId: number
  checkinId: number
  pacienteNome: string
  open: boolean
  onClose: () => void
}

export function TriagemModal({ filaId, checkinId, pacienteNome, open, onClose }: TriagemModalProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const triagem = useTriagem(onClose)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const queixa = (data.get('queixa_principal') as string).trim()

    if (!queixa) {
      setLocalError('Queixa principal é obrigatória')
      return
    }

    setLocalError(null)
    triagem.mutate({
      fila_espera_id: filaId,
      checkin_id: checkinId,
      pressao: (data.get('pressao') as string) || undefined,
      peso: data.get('peso') ? Number(data.get('peso')) : undefined,
      temperatura: data.get('temperatura') ? Number(data.get('temperatura')) : undefined,
      saturacao: data.get('saturacao') ? Number(data.get('saturacao')) : undefined,
      queixa_principal: queixa,
      observacoes: (data.get('observacoes') as string) || undefined,
    } as TriagemPayload)
  }

  const errorMsg = localError ?? (triagem.error ? (triagem.error as Error).message : null)

  return (
    <div role="dialog" aria-label={`Triagem — ${pacienteNome}`}>
      <h2>Triagem — {pacienteNome}</h2>
      <form onSubmit={handleSubmit}>
        <input name="pressao" placeholder="120/80" />
        <input name="peso" type="number" step="0.1" />
        <input name="temperatura" type="number" step="0.1" />
        <input name="saturacao" type="number" />
        <textarea name="queixa_principal" data-testid="queixa-input" />
        <textarea name="observacoes" />
        {errorMsg && <p data-testid="triagem-error">{errorMsg}</p>}
        <button type="button" onClick={onClose}>Cancelar</button>
        <button type="submit" data-testid="submit-triagem">Registrar</button>
      </form>
    </div>
  )
}
