import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export function Badge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'green' | 'red' | 'gray' | 'wine' }) {
  const tones = {
    gold: 'bg-gold-300/20 text-gold-500 ring-gold-400/30',
    green: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300',
    red: 'bg-red-100 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300',
    gray: 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300',
    wine: 'bg-wine-100 text-wine-700 ring-wine-200 dark:bg-wine-500/20 dark:text-cream'
  };
  return <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1', tones[tone])}>{children}</span>;
}
