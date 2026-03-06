'use client';

import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
    const message = title || description || '';
    const options = { duration };
    
    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, {
          ...options,
          description: title ? description : undefined,
        });
        break;
      case 'success':
        sonnerToast.success(message, {
          ...options,
          description: title ? description : undefined,
        });
        break;
      default:
        sonnerToast(message, {
          ...options,
          description: title ? description : undefined,
        });
    }
  };

  return { toast };
}

// Simpler toast function for direct usage
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
  message: (message: string) => sonnerToast(message),
};
