import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-neutral-200)] bg-white px-6 py-2 text-[length:var(--font-size-xs)] text-[var(--color-neutral-400)] flex-shrink-0">
      AltClinic © {new Date().getFullYear()}
    </footer>
  );
}
