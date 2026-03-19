import React from 'react';

export function Textarea({ label, error, hint, id, rows = 3, className = '', ...props }) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-[length:var(--font-size-sm)] font-medium text-[var(--color-neutral-700)]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={[
          'w-full px-3 py-2 rounded-[var(--radius-md)] border text-[length:var(--font-size-base)] resize-y',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-[var(--color-danger)]' : 'border-[var(--color-neutral-300)]',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <span className="text-[length:var(--font-size-xs)] text-[var(--color-danger)]">{error}</span>}
      {hint && !error && <span className="text-[length:var(--font-size-xs)] text-[var(--color-neutral-500)]">{hint}</span>}
    </div>
  );
}
