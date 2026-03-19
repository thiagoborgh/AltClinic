import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function Topbar({ onToggleSidebar }) {
  let tenantConfig = {};
  try {
    const ctx = useTheme();
    tenantConfig = ctx.tenantConfig || {};
  } catch (_) {}

  return (
    <header
      className="flex items-center justify-between px-4 bg-white border-b border-[var(--color-neutral-200)] z-30 flex-shrink-0"
      style={{ height: 'var(--topbar-height)' }}
    >
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        )}
        {tenantConfig.logo_url ? (
          <img src={tenantConfig.logo_url} alt={tenantConfig.nome_exibicao || 'Logo'} className="h-7 object-contain" />
        ) : (
          <span className="font-semibold text-[length:var(--font-size-md)] text-[var(--color-primary)]">
            {tenantConfig.nome_exibicao || 'AltClinic'}
          </span>
        )}
      </div>
    </header>
  );
}
