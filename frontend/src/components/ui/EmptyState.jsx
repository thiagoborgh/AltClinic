import React from 'react';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center mb-4">
          <Icon size={24} className="text-[var(--color-neutral-400)]" />
        </div>
      )}
      <h3 className="text-[length:var(--font-size-md)] font-semibold text-[var(--color-neutral-700)] mb-1">{title}</h3>
      {description && <p className="text-[length:var(--font-size-base)] text-[var(--color-neutral-500)] mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
