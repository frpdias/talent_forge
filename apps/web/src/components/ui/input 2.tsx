import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id} 
            className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm',
            'bg-white border border-[var(--border)] rounded-lg',
            'text-[var(--foreground)] placeholder:text-[var(--tf-gray-400)]',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[var(--tf-accent)] focus:ring-offset-1 focus:border-[var(--tf-accent)]',
            'hover:border-[var(--border-hover)]',
            'disabled:bg-[var(--tf-gray-50)] disabled:text-[var(--tf-gray-400)] disabled:cursor-not-allowed',
            error && 'border-[var(--tf-error)] focus:ring-[var(--tf-error)] focus:border-[var(--tf-error)]',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-xs text-[var(--foreground-muted)]">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-[var(--tf-error)] flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
