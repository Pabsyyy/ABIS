import { toast } from 'sonner';

const base = { duration: 4000 };

export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, { ...base, ...(description ? { description } : {}) }),
  error: (message: string, description?: string) =>
    toast.error(message, { ...base, duration: 6000, ...(description ? { description } : {}) }),
  info: (message: string, description?: string) =>
    toast.info(message, { ...base, ...(description ? { description } : {}) }),
  warning: (message: string, description?: string) =>
    toast.warning(message, { ...base, duration: 5000, ...(description ? { description } : {}) }),
};
