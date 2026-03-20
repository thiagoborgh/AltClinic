// web/types/checkin.ts

/** Status do agendamento (tabela agendamentos_lite.status) */
export type StatusAgendamento =
  | 'agendado' | 'confirmado' | 'cancelado' | 'no_show' | 'finalizado'

/**
 * Status do check-in — backend: COALESCE(c.status, 'aguardando')
 * 'aguardando' = sem check-in ainda (c.id IS NULL)
 * 'presente' = check-in criado (antes do atendimento começar)
 */
export type CheckinStatus = 'aguardando' | 'presente'

/** Item retornado pelo GET /api/checkins */
export interface Agendamento {
  agendamento_id: number          // nota: backend retorna 'agendamento_id', não 'id'
  paciente_id: number
  paciente_nome: string
  profissional_id: number
  profissional_nome: string
  horario_marcado: string         // nota: backend retorna 'horario_marcado', não 'data_hora'
  agendamento_status: StatusAgendamento  // backend: a.status AS agendamento_status
  checkin_status: CheckinStatus          // 'aguardando' = botão check-in visível
  alertas?: {
    fatura_aberta: number
    ultimo_atendimento_dias: number | null
  }
}

/** Status do item na fila de espera */
export type StatusFila =
  | 'aguardando_triagem' | 'em_triagem' | 'aguardando_atendimento'
  | 'em_atendimento' | 'finalizado' | 'cancelado'

/** Item retornado pelo GET /api/fila */
export interface FilaItem {
  fila_id: number
  checkin_id: number
  paciente_id: number
  paciente_nome: string
  profissional_id: number
  profissional_nome: string
  posicao: number
  status: StatusFila
  tempo_espera_minutos: number
  alerta_espera_longa: boolean
  triagem?: {
    pressao?: string
    peso?: number
    temperatura?: number
    saturacao?: number
    queixa_principal: string
    observacoes?: string
  } | null  // backend retorna null quando não há triagem (não undefined)
}

/** Payload do POST /api/checkins */
export interface CheckinPayload {
  agendamento_id: number
  paciente_id: number
  profissional_id: number
  observacao?: string
}

/** Payload do POST /api/fila/triagens */
export interface TriagemPayload {
  fila_espera_id: number
  checkin_id: number
  pressao?: string
  peso?: number
  temperatura?: number
  saturacao?: number
  queixa_principal: string
  observacoes?: string
}
