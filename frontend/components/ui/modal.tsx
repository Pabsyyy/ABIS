'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, description, open, onClose, children, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-white shadow-xl',
          wide ? 'max-w-2xl' : 'max-w-lg'
        )}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-primary">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-background-light hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
