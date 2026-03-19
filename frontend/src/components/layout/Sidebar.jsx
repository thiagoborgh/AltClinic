import React from 'react';
import { SidebarItem } from './SidebarItem';

// Items de navegação padrão — expandível por perfil
const NAV_ITEMS = [
  { to: '/dashboard',      label: 'Dashboard',      icon: null },
  { to: '/pacientes',      label: 'Pacientes',      icon: null },
  { to: '/agendamentos',   label: 'Agendamentos',   icon: null },
  { to: '/checkin',        label: 'Check-in',       icon: null },
  { to: '/fila-espera',    label: 'Fila de Espera', icon: null },
  { to: '/crm',            label: 'CRM',            icon: null },
  { to: '/financeiro',     label: 'Financeiro',     icon: null },
  { to: '/whatsapp',       label: 'WhatsApp',       icon: null },
  { to: '/relatorios',     label: 'Relatórios',     icon: null },
  { to: '/configuracoes',  label: 'Configurações',  icon: null },
];

export function Sidebar({ collapsed }) {
  return (
    <aside
      className="fixed left-0 top-[var(--topbar-height)] h-[calc(100vh-var(--topbar-height))] bg-[var(--color-sidebar-bg)] overflow-y-auto z-20 transition-all duration-[var(--transition-normal)] flex flex-col"
      style={{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
    >
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map(item => (
          <SidebarItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  );
}
