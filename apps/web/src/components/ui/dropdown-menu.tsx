import * as React from 'react';
import { cn } from '@/lib/utils';

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const DropdownMenuTrigger: React.FC<{
  asChild?: boolean;
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};

const DropdownMenuContent: React.FC<{
  className?: string;
  children: React.ReactNode;
  open?: boolean;
}> = ({ className, children, open }) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50',
        className
      )}
    >
      <div className="py-1" role="menu">
        {children}
      </div>
    </div>
  );
};

const DropdownMenuItem: React.FC<{
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ className, children, onClick }) => {
  return (
    <button
      className={cn(
        'flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        className
      )}
      role="menuitem"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
