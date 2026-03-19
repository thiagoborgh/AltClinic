import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  fullscreen: 'max-w-full h-full m-0 rounded-none',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className={['relative bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] flex flex-col w-full', SIZE_CLASSES[size]].join(' ')}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-neutral-200)]">
          <h2 id="modal-title" className="text-[length:var(--font-size-lg)] font-semibold text-[var(--color-neutral-900)]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-neutral-100)]" aria-label="Fechar">✕</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-4 border-t border-[var(--color-neutral-200)] flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
