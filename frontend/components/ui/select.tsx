import { InputHTMLAttributes, forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[72px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className
      )}
      {...props}
    />
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function Badge({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info'; children: React.ReactNode }) {
  const tones = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-slate-100 text-slate-700',
    info: 'bg-blue-100 text-blue-800',
  } as const;
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', tones[tone])}>{children}</span>;
}
