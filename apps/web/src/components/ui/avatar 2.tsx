import * as React from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function Avatar({ name, src, size = 'md', className, children }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  if (children) {
    return (
      <div className={cn('rounded-full', sizes[size], className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium',
        sizes[size],
        className
      )}
    >
      {name && getInitials(name)}
    </div>
  );
}

export function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-full flex items-center justify-center font-medium w-full h-full', className)}>
      {children}
    </div>
  );
}
