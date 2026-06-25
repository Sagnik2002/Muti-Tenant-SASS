import { create } from 'zustand';
import { organizationsApi } from '../api/organizations';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
}

interface OrgState {
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;

  fetchOrganizations: () => Promise<void>;
  setCurrentOrg: (org: Organization) => void;
  createOrganization: (data: { name: string; slug: string }) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set, get) => ({
  organizations: [],
  currentOrg: JSON.parse(localStorage.getItem('currentOrg') || 'null'),
  isLoading: false,

  fetchOrganizations: async () => {
    set({ isLoading: true });
    try {
      const response = await organizationsApi.list();
      const orgs = response.data.data;
      set({ organizations: orgs, isLoading: false });

      // If no current org selected, pick the first one
      if (!get().currentOrg && orgs.length > 0) {
        get().setCurrentOrg(orgs[0]);
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentOrg: (org) => {
    localStorage.setItem('currentOrg', JSON.stringify(org));
    set({ currentOrg: org });
  },

  createOrganization: async (data) => {
    set({ isLoading: true });
    try {
      await organizationsApi.create(data);
      await get().fetchOrganizations();
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to create organization');
    }
  },
}));
