import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('glass-card rounded-xl p-3', className)}>{children}</div>;
}

export function CardTitle({ children, subtitle }: PropsWithChildren<{ subtitle?: string }>) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-wine-900 dark:text-cream">{children}</h3>
      {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}
