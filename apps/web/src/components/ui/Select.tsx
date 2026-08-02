import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export type SelectOption = {
  value: string;
  label: string;
};

export function Select({
  options,
  value,
  onChange,
  placeholder,
  className
}: {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className={clsx('relative', open ? 'z-[120]' : 'z-10', className)}>
      <button
        type="button"
        className="input-premium flex h-10 w-full items-center justify-between text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selected ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400'}>{selected?.label ?? placeholder ?? 'Seleccionar'}</span>
        <ChevronDown className={clsx('h-4 w-4 text-zinc-500 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-[130] mt-1 max-h-60 overflow-auto rounded-xl border border-wine-100 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-slate-900">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition',
                  active ? 'bg-wine-700 text-cream' : 'text-zinc-700 hover:bg-wine-50 dark:text-zinc-100 dark:hover:bg-white/10'
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
