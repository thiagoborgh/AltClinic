import React from 'react';

const SIZE_CLASSES = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base', xl: 'w-14 h-14 text-lg' };

export function Avatar({ src, name, size = 'md', className = '' }) {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  return src ? (
    <img src={src} alt={name} className={['rounded-full object-cover', SIZE_CLASSES[size], className].join(' ')} />
  ) : (
    <div className={[
      'rounded-full flex items-center justify-center font-semibold',
      'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
      SIZE_CLASSES[size], className,
    ].join(' ')}>
      {initials}
    </div>
  );
}
