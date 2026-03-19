import React from 'react';

export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={['animate-pulse bg-[var(--color-neutral-200)] rounded-[var(--radius-md)]', className].join(' ')}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={['space-y-2', className].join(' ')}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}
