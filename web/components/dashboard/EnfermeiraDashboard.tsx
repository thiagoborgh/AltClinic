'use client'

// Enfermeira usa KpisAdmin como fallback no backend (default case em calcularKpisPorPerfil)
// Exibe os mesmos KPIs de admin com foco nos dados do dia

import { AdminDashboard } from './AdminDashboard'

export function EnfermeiraDashboard() {
  return <AdminDashboard />
}
