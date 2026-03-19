import React, { useState } from 'react';

export function Tabs({ tabs, defaultTab, onChange }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const handleChange = (id) => { setActive(id); onChange?.(id); };
  const current = tabs.find(t => t.id === active);

  return (
    <div>
      <div className="flex border-b border-[var(--color-neutral-200)] gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={[
              'px-4 py-2 text-[length:var(--font-size-base)] font-medium transition-colors',
              'border-b-2 -mb-px',
              active === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{current?.content}</div>
    </div>
  );
}
