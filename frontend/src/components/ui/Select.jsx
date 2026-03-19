import React from 'react';

export function Select({ label, error, hint, id, children, className = '', ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-700)]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          'w-full px-3 py-2 rounded-[var(--radius-md)] border text-[length:var(--font-size-base)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed bg-white',
          error ? 'border-[var(--color-danger)]' : 'border-[var(--color-neutral-300)]',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-[length:var(--font-size-xs)] text-[var(--color-danger)]">{error}</span>}
      {hint && !error && <span className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-500)]">{hint}</span>}
    </div>
  );
}
