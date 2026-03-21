export type StatusConfirmacao =
  | 'pendente'
  | 'confirmado'
  | 'cancelado'
  | 'whatsapp_enviado'
  | 'sem_resposta'

export type PerfilUsuario =
  | 'admin' | 'admin_master' | 'recepcionista'
  | 'medico' | 'enfermeira' | 'financeiro'

export interface Confirmacao {
  agendamento_id: number
  horario: string
  procedimento: string
  paciente_id: number
  paciente_nome: string
  paciente_telefone: string
  profissional_id: number
  profissional_nome: string
  confirmacao_id: number | null
  status: StatusConfirmacao
  canal: string | null
  enviado_em: string | null
  respondido_em: string | null
}

export interface ResumoConfirmacoes {
  total: number
  confirmados: number
  cancelados: number
  pendentes: number
  whatsapp_enviado: number
  sem_resposta: number
  taxa_confirmacao: string
}
