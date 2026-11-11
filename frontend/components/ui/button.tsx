import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

const variants = {
  default: 'bg-accent text-white hover:bg-accent-light',
  primary: 'bg-primary text-primary-foreground hover:bg-secondary',
  outline: 'border border-border bg-white text-foreground hover:bg-background-light',
  ghost: 'text-foreground hover:bg-background-light',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-success text-white hover:opacity-90',
} as const;

const sizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
