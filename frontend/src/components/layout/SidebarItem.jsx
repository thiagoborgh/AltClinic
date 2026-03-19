import React from 'react';
import { NavLink } from 'react-router-dom';

export function SidebarItem({ to, icon: Icon, label, badge, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => [
        'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] mx-2 mb-1',
        'text-[var(--color-sidebar-text)] transition-colors duration-[var(--transition-fast)]',
        'hover:bg-[var(--color-sidebar-item-active)] hover:text-[var(--color-sidebar-text-active)]',
        isActive ? 'bg-[var(--color-sidebar-item-active)] text-[var(--color-sidebar-text-active)] font-medium' : '',
      ].join(' ')}
    >
      {Icon && <Icon size={18} className="flex-shrink-0" />}
      {!collapsed && (
        <>
          <span className="flex-1 text-[length:var(--font-size-base)]">{label}</span>
          {badge > 0 && (
            <span className="bg-[var(--color-primary)] text-white text-[length:var(--font-size-xs)] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
