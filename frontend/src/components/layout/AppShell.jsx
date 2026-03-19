import React, { useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppShell({ children, rightSidebar }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="flex flex-col h-screen bg-[var(--color-neutral-50)]"
      style={{ fontFamily: 'var(--font-family)' }}
    >
      <Topbar onToggleSidebar={() => setSidebarCollapsed(c => !c)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />

        <main
          className="flex-1 overflow-y-auto p-6 min-w-0 transition-all duration-[var(--transition-normal)]"
          style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
        >
          {children}
        </main>

        {rightSidebar && (
          <aside
            className="border-l border-[var(--color-neutral-200)] bg-white overflow-y-auto flex-shrink-0"
            style={{ width: 'var(--right-sidebar-width)' }}
          >
            {rightSidebar}
          </aside>
        )}
      </div>

      <Footer />
    </div>
  );
}
