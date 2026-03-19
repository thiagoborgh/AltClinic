import React from 'react';

export function Input({
  label, error, hint, id,
  className = '', ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-700)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full px-3 py-2 rounded-[var(--radius-md)] border text-[length:var(--font-size-base)]',
          'transition-colors duration-[var(--transition-fast)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
          'disabled:opacity-50 disabled:bg-[var(--color-neutral-50)] disabled:cursor-not-allowed',
          error
            ? 'border-[var(--color-danger)] bg-[var(--color-danger-light)]'
            : 'border-[var(--color-neutral-300)] bg-white',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <span className="text-[length:var(--font-size-xs)] text-[var(--color-danger)]">{error}</span>}
      {hint && !error && <span className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-500)]">{hint}</span>}
    </div>
  );
}
