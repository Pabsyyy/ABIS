'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      closeButton
      visibleToasts={4}
      gap={10}
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 72, right: 16, left: 16 }}
      containerAriaLabel="Notifications"
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-white font-sans text-foreground shadow-xl',
          title: 'text-sm font-semibold text-primary',
          description: 'text-xs text-muted',
          success: 'border-l-4 border-l-success',
          error: 'border-l-4 border-l-red-500',
          warning: 'border-l-4 border-l-warning',
          info: 'border-l-4 border-l-accent',
          closeButton: 'border-border bg-white text-muted hover:text-foreground',
        },
      }}
    />
  );
}
