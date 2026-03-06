import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            open,
            onOpenChange,
          });
        }
        return child;
      })}
    </div>
  );
};

const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

const DialogContent: React.FC<DialogContentProps & { open?: boolean; onOpenChange?: (open: boolean) => void }> = ({
  className,
  children,
  open,
  onOpenChange,
}) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
};

const DialogHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)}>
      {children}
    </div>
  );
};

const DialogTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h2>
  );
};

const DialogDescription: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <p className={cn('text-sm text-gray-500', className)}>
      {children}
    </p>
  );
};

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription };
