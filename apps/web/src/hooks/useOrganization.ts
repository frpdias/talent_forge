'use client';

import { createContext, useContext } from 'react';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  setCurrentOrganization: () => {},
});

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

export { OrganizationContext };
export type { Organization, OrganizationContextType };
