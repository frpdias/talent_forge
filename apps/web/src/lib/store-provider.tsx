'use client';

import { useEffect, useRef } from 'react';
import { useOrgStore } from './store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      useOrgStore.persist.rehydrate();
      initialized.current = true;
    }
  }, []);

  return <>{children}</>;
}
