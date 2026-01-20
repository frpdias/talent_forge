'use client';

import { AuthProvider } from '@/lib/auth';
import { StoreProvider } from '@/lib/store-provider';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>{children}</AuthProvider>
    </StoreProvider>
  );
}
