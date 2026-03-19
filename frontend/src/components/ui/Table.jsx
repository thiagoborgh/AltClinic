import React from 'react';
import { Skeleton } from './Skeleton';

export function Table({ columns, data, loading, emptyMessage = 'Nenhum registro encontrado' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[length:var(--font-size-base)] border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-neutral-200)]">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-[var(--color-neutral-600)] text-[length:var(--font-size-sm)] uppercase tracking-wide">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={columns.length} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
            ))
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--color-neutral-500)]">{emptyMessage}</td></tr>
          ) : data.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-50)] transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-[var(--color-neutral-700)]">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
