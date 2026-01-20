import * as React from 'react';
import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef, useState, useRef, useEffect } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, onValueChange, value, children, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // If using Radix-style children (SelectTrigger, SelectContent, etc.)
    if (children && !options) {
      return (
        <SelectRoot value={value as string} onValueChange={onValueChange}>
          {children}
        </SelectRoot>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          value={value}
          className={cn(
            'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          onChange={handleChange}
          {...props}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Context for Select state
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

// Root component that manages state
const SelectRoot = ({ 
  children, 
  value, 
  onValueChange 
}: { 
  children: React.ReactNode; 
  value?: string; 
  onValueChange?: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ 
      value: value || '', 
      onValueChange: onValueChange || (() => {}), 
      isOpen, 
      setIsOpen 
    }}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Additional Select components for shadcn/ui compatibility
export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => context?.setIsOpen(!context?.isOpen)}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ placeholder }: { placeholder?: string; children?: React.ReactNode }) => {
  const context = React.useContext(SelectContext);
  
  // Find the label for the current value from siblings
  const [label, setLabel] = useState<string | null>(null);
  
  useEffect(() => {
    // This will be set by SelectItem when value matches
    if (!context?.value) {
      setLabel(null);
    }
  }, [context?.value]);
  
  return <span className="block truncate">{context?.value ? (label || context.value) : placeholder}</span>;
};

export const SelectContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  
  if (!context?.isOpen) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    >
      <div className="p-1 max-h-60 overflow-auto">{children}</div>
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

export const SelectItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; children: React.ReactNode }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  const isSelected = context?.value === value;
  
  const handleClick = () => {
    context?.onValueChange(value);
    context?.setIsOpen(false);
  };
  
  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none',
        'hover:bg-gray-100 focus:bg-gray-100',
        isSelected && 'bg-gray-100 font-medium',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      )}
      <span className={cn(isSelected && "pl-6")}>{children}</span>
    </div>
  );
});
SelectItem.displayName = 'SelectItem';
