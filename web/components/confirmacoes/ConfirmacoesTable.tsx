'use client'

import { useState } from 'react'
import { useConfirmacaoActions } from '@/hooks/useConfirmacaoActions'
import { StatusPill } from './StatusPill'
import type { Confirmacao, StatusConfirmacao, PerfilUsuario } from '@/types/confirmacoes'

type Filtro = StatusConfirmacao | 'todos'

const FILTRO_LABELS: Record<Filtro, string> = {
  todos:            'Todos',
  pendente:         'Pendente',
  confirmado:       'Confirmado',
  cancelado:        'Cancelado',
  whatsapp_enviado: 'WhatsApp enviado',
  sem_resposta:     'Sem resposta',
}

const FILTROS: Filtro[] = ['todos', 'pendente', 'confirmado', 'cancelado', 'whatsapp_enviado', 'sem_resposta']

// Perfis com permissão de ação
const PODE_AGIR = new Set<PerfilUsuario>(['admin', 'admin_master', 'recepcionista'])

interface ConfirmacoesTableProps {
  confirmacoes: Confirmacao[]
  perfil: PerfilUsuario
}

export function ConfirmacoesTable({ confirmacoes, perfil }: ConfirmacoesTableProps) {
  const [filtros, setFiltros] = useState<StatusConfirmacao[]>(['pendente', 'whatsapp_enviado'])
  const { confirmar, cancelar, enviarWhatsApp } = useConfirmacaoActions()
  const podeAgir = PODE_AGIR.has(perfil)

  const toggleFiltro = (f: Filtro) => {
    if (f === 'todos') { setFiltros([]); return }
    setFiltros(prev =>
      prev.includes(f as StatusConfirmacao)
        ? prev.filter(s => s !== f)
        : [...prev, f as StatusConfirmacao]
    )
  }

  const isTodos = filtros.length === 0
  const filtered = isTodos
    ? confirmacoes
    : confirmacoes.filter(c => filtros.includes(c.status))

  return (
    <div className="space-y-4">
      {/* Chips de filtro */}
      <div role="group" aria-label="Filtro de status" className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button
            key={f}
            data-testid={`chip-${f}`}
            onClick={() => toggleFiltro(f)}
            aria-pressed={f === 'todos' ? isTodos : filtros.includes(f as StatusConfirmacao)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              (f === 'todos' ? isTodos : filtros.includes(f as StatusConfirmacao))
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border'
            }`}
          >
            {FILTRO_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nenhum agendamento encontrado</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Horário</th>
                <th className="p-3 text-left font-medium">Paciente</th>
                <th className="p-3 text-left font-medium">Profissional</th>
                <th className="p-3 text-left font-medium">Procedimento</th>
                <th className="p-3 text-left font-medium">Status</th>
                {podeAgir && <th className="p-3 text-left font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.agendamento_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono">{c.horario.slice(11, 16)}</td>
                  <td className="p-3">{c.paciente_nome}</td>
                  <td className="p-3 text-muted-foreground">{c.profissional_nome}</td>
                  <td className="p-3">{c.procedimento}</td>
                  <td className="p-3"><StatusPill status={c.status} /></td>
                  {podeAgir && (
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {(c.status === 'pendente' || c.status === 'whatsapp_enviado') && (
                          <button
                            data-testid={`btn-confirmar-${c.agendamento_id}`}
                            onClick={() => confirmar.mutate(c.agendamento_id)}
                            className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                          >
                            Confirmar
                          </button>
                        )}
                        {c.status === 'pendente' && (
                          <button
                            data-testid={`btn-whatsapp-${c.agendamento_id}`}
                            onClick={() => enviarWhatsApp.mutate(c.agendamento_id)}
                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                          >
                            WhatsApp
                          </button>
                        )}
                        {(c.status === 'pendente' || c.status === 'whatsapp_enviado') && (
                          <button
                            data-testid={`btn-cancelar-${c.agendamento_id}`}
                            onClick={() => cancelar.mutate({ agendamento_id: c.agendamento_id })}
                            className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
