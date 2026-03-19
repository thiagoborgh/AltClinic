import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const TYPE_CLASSES = {
    success: 'bg-[var(--color-success)] text-white',
    danger:  'bg-[var(--color-danger)] text-white',
    warning: 'bg-[var(--color-warning)] text-white',
    info:    'bg-[var(--color-neutral-800)] text-white',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={['px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] text-[length:var(--font-size-base)]', TYPE_CLASSES[t.type]].join(' ')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
