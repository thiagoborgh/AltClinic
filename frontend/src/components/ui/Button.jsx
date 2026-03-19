import React from 'react';
import { Spinner } from './Spinner';

const VARIANT_CLASSES = {
  primary:   'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white',
  secondary: 'bg-white border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]',
  ghost:     'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
  danger:    'bg-[var(--color-danger)] hover:bg-red-700 text-white',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-[length:var(--font-size-sm)] h-7',
  md: 'px-4 py-2 text-[length:var(--font-size-base)] h-9',
  lg: 'px-6 py-2.5 text-[length:var(--font-size-md)] h-11',
};

export function Button({
  children, variant = 'primary', size = 'md',
  disabled = false, loading = false,
  onClick, type = 'button', className = '', ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)]',
        'transition-colors duration-[var(--transition-fast)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
