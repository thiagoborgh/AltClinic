import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export function applyTenantTheme(tenantConfig) {
  const root = document.documentElement;
  if (tenantConfig?.cor_primaria) {
    root.style.setProperty('--color-primary', tenantConfig.cor_primaria);
  }
  if (tenantConfig?.cor_primaria_dark) {
    root.style.setProperty('--color-primary-dark', tenantConfig.cor_primaria_dark);
  }
}

export function resetTenantTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--color-primary');
  root.style.removeProperty('--color-primary-dark');
}

export function ThemeProvider({ children, tenantConfig }) {
  useEffect(() => {
    if (tenantConfig) applyTenantTheme(tenantConfig);
    return () => resetTenantTheme();
  }, [tenantConfig]);

  return (
    <ThemeContext.Provider value={{ tenantConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
