import React, { useState, useRef, useEffect } from 'react';

export function Dropdown({ trigger, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] border border-[var(--color-neutral-200)] z-50 py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick?.(); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-[length:var(--font-size-base)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] disabled:opacity-50"
              disabled={item.disabled}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
