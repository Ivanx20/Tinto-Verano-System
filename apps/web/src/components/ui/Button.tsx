import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
  const styles = {
    primary: 'bg-gradient-to-r from-wine-700 to-wine-500 text-cream shadow-lg shadow-wine-900/20 hover:scale-[1.01]',
    secondary: 'border border-wine-100 bg-white text-wine-700 hover:bg-wine-50 dark:border-white/10 dark:bg-white/10 dark:text-cream',
    ghost: 'text-wine-700 hover:bg-wine-50 dark:text-cream dark:hover:bg-white/10'
  };
  return <button className={clsx(base, styles[variant], className)} {...props} />;
}
