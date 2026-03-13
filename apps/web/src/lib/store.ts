import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Organization {
  id: string;
  name: string;
  orgType: string;
  slug: string;
  role?: string;
  parentOrgId?: string | null;
}

interface OrgStore {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  // Contexto do módulo PHP — empresa cliente selecionada
  phpContextOrgId: string | null;
  phpContextOrgName: string | null;
  setPhpContextOrg: (id: string | null, name?: string | null) => void;
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set) => ({
      currentOrg: null,
      organizations: [],
      setCurrentOrg: (org) => set({ currentOrg: org }),
      setOrganizations: (orgs) => set({ organizations: orgs }),
      phpContextOrgId: null,
      phpContextOrgName: null,
      setPhpContextOrg: (id, name = null) => set({ phpContextOrgId: id, phpContextOrgName: name }),
    }),
    {
      name: 'talentforge-org',
      storage: createJSONStorage(() => {
        // Safe storage for SSR - return a no-op storage on server
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      skipHydration: true,
    }
  )
);
