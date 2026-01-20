import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Organization {
  id: string;
  name: string;
  orgType: string;
  slug: string;
  role?: string;
}

interface OrgStore {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set) => ({
      currentOrg: null,
      organizations: [],
      setCurrentOrg: (org) => set({ currentOrg: org }),
      setOrganizations: (orgs) => set({ organizations: orgs }),
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
