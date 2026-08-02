import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({
  open,
  title,
  children,
  onClose,
  footer
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-auto">{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
