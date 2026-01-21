import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--tf-gray-100)] text-[var(--tf-gray-700)]',
    success: 'bg-[var(--tf-success-subtle)] text-[var(--tf-success)]',
    warning: 'bg-[var(--tf-warning-subtle)] text-[var(--tf-warning)]',
    danger: 'bg-[var(--tf-error-subtle)] text-[var(--tf-error)]',
    info: 'bg-[var(--tf-accent-subtle)] text-[var(--tf-accent)]',
    secondary: 'bg-[var(--tf-gray-200)] text-[var(--tf-gray-600)]',
    outline: 'bg-transparent border border-[var(--border)] text-[var(--tf-gray-600)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
