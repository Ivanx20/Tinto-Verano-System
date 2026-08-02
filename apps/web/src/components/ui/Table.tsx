import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from './Input';

export function DataTable<T extends { id: number }>({ columns, data, search, onSearch, actions }: { columns: Array<{ key: keyof T | string; header: string; render?: (row: T) => ReactNode }>; data: T[]; search?: string; onSearch?: (value: string) => void; actions?: (row: T) => ReactNode }) {
  return (
    <div>
      {onSearch && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input className="h-10 pl-9" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Buscar..." />
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-3xl border border-wine-100/70 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-wine-100/70 text-sm dark:divide-white/10">
            <thead className="bg-wine-50/80 dark:bg-white/5">
              <tr>
                {columns.map((column) => <th key={String(column.key)} className="px-5 py-4 text-left font-bold text-wine-900 dark:text-cream">{column.header}</th>)}
                {actions && <th className="px-5 py-4 text-right font-bold text-wine-900 dark:text-cream">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-wine-100/60 bg-white/50 dark:divide-white/10 dark:bg-transparent">
              {data.map((row) => (
                <tr key={row.id} className="transition hover:bg-gold-300/10">
                  {columns.map((column) => <td key={String(column.key)} className="px-5 py-4 text-zinc-700 dark:text-zinc-200">{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? '')}</td>)}
                  {actions && <td className="px-5 py-4 text-right">{actions(row)}</td>}
                </tr>
              ))}
              {!data.length && <tr><td className="px-5 py-10 text-center text-zinc-500" colSpan={columns.length + (actions ? 1 : 0)}>No hay registros para mostrar.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
