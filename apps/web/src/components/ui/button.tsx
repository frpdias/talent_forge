import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium 
      rounded-lg transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      active:scale-[0.98]
    `;
    
    const variants = {
      primary: 'bg-[var(--tf-primary)] text-white hover:bg-[var(--tf-primary-hover)] focus:ring-[var(--tf-primary)] shadow-sm hover:shadow-md',
      secondary: 'bg-[var(--tf-gray-100)] text-[var(--tf-gray-700)] hover:bg-[var(--tf-gray-200)] focus:ring-[var(--tf-gray-400)]',
      outline: 'border border-[var(--border)] bg-white text-[var(--tf-gray-700)] hover:bg-[var(--tf-gray-50)] hover:border-[var(--border-hover)] focus:ring-[var(--tf-accent)]',
      ghost: 'text-[var(--tf-gray-600)] hover:bg-[var(--tf-gray-100)] hover:text-[var(--tf-gray-900)] focus:ring-[var(--tf-gray-400)]',
      danger: 'bg-[var(--tf-error)] text-white hover:bg-[var(--tf-error-light)] focus:ring-[var(--tf-error)] shadow-sm',
      success: 'bg-[var(--tf-success)] text-white hover:bg-[var(--tf-success-light)] focus:ring-[var(--tf-success)] shadow-sm',
    };

    const sizes = {
      xs: 'px-2.5 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
