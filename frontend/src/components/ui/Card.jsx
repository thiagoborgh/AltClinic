import React from 'react';

export function Card({ children, className = '', padding = true, shadow = true }) {
  return (
    <div className={[
      'bg-white rounded-[var(--radius-lg)]',
      shadow ? 'shadow-[var(--shadow-sm)] border border-[var(--color-neutral-200)]' : '',
      padding ? 'p-4' : '',
      className,
    ].join(' ')}>
      {children}
    </div>
  );
}
