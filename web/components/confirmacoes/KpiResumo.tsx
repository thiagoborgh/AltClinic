import { KpiCard } from '@/components/dashboard/KpiCard'
import type { ResumoConfirmacoes } from '@/types/confirmacoes'

interface KpiResumoProps {
  resumo?: ResumoConfirmacoes
}

export function KpiResumo({ resumo }: KpiResumoProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard label="Confirmados"  value={resumo?.confirmados}      variant="success" />
      <KpiCard label="Pendentes"    value={resumo?.pendentes}        variant="warning" />
      <KpiCard label="Cancelados"   value={resumo?.cancelados}       variant="danger"  />
      <KpiCard label="Taxa"         value={resumo?.taxa_confirmacao} variant="default" />
    </div>
  )
}
