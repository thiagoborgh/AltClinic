// web/types/dashboard.ts
// Tipos espelham exatamente os campos retornados pelo backend (src/routes/dashboard-ia.js)

import type { ReactNode } from 'react'

export interface KpisAdmin {
  perfil: 'admin'
  agendamentos_hoje: number
  confirmados: number
  no_shows: number
  receita_mes: number
  meta_receita: number
  inadimplencia_valor: number
  faturas_vencidas: number
  taxa_no_show_mes: number       // percentual, ex: 12
  metas: Record<string, number>  // { receita: 60000, atendimentos: 40, ... }
  calculado_em: string
}

export interface KpisFinanceiro {
  perfil: 'financeiro'
  receita_mes: number
  meta_receita: number
  faturas_vencidas: number
  valor_vencido: number
  cobradas_hoje: number
  calculado_em: string
}

export interface KpisRecepcionista {
  perfil: 'recepcionista'
  agendamentos_hoje: number
  aguardando_confirmacao: number  // status agendado/pendente
  checkins_pendentes: number      // status check_in
  fila_atual: number              // fila_espera.status = 'aguardando'
  calculado_em: string
}

export interface KpisMedico {
  perfil: 'medico'
  pacientes_hoje: number
  primeira_consulta: number
  retornos: number
  duracao_media_min: number
  calculado_em: string
}

// Backend usa calcularKpisAdmin() como fallback para enfermeira
export type KpisEnfermeira = KpisAdmin

export type KpisQualquer = KpisAdmin | KpisFinanceiro | KpisRecepcionista | KpisMedico | KpisEnfermeira

export interface Briefing {
  briefing: string
  kpis: Record<string, unknown>
  gerado_em: string
}

export interface DashboardConfig {
  layout_json: { cards: string[]; hidden: string[] }
  alertas_config_json: Record<string, boolean>
  horario_briefing: string
}

export interface Meta {
  id: number
  tipo: 'receita' | 'atendimentos' | 'no_show_max' | 'inadimplencia_max'
  valor_meta: number
  mes: string
}

export interface CardConfig {
  id: string
  component: ReactNode
}
