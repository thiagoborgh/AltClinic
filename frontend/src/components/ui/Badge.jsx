import React from 'react';

const VARIANT_CLASSES = {
  default: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
  danger:  'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  info:    'bg-[var(--color-info-light)] text-[var(--color-info)]',
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
};

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-full)]',
      'text-[length:var(--font-size-xs)] font-medium',
      VARIANT_CLASSES[variant],
      className,
    ].join(' ')}>
      {children}
    </span>
  );
}
