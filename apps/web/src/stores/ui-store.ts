import { create } from 'zustand';

interface UIState {
  currentOrganizationId: string | null;
  setCurrentOrganizationId: (orgId: string | null) => void;
  activeTab: 'overview' | 'settings' | 'members';
  setActiveTab: (tab: 'overview' | 'settings' | 'members') => void;
  isCreateOrgModalOpen: boolean;
  setCreateOrgModalOpen: (open: boolean) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentOrganizationId: localStorage.getItem('invoiceflow_active_org_id'),
  setCurrentOrganizationId: (orgId) => {
    if (orgId) {
      localStorage.setItem('invoiceflow_active_org_id', orgId);
    } else {
      localStorage.removeItem('invoiceflow_active_org_id');
    }
    set({ currentOrganizationId: orgId });
  },
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isCreateOrgModalOpen: false,
  setCreateOrgModalOpen: (open) => set({ isCreateOrgModalOpen: open }),
  token: localStorage.getItem('invoiceflow_jwt_token'),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('invoiceflow_jwt_token', token);
    } else {
      localStorage.removeItem('invoiceflow_jwt_token');
    }
    set({ token });
  },
  clearAuth: () => {
    localStorage.removeItem('invoiceflow_jwt_token');
    localStorage.removeItem('invoiceflow_active_org_id');
    set({ token: null, currentOrganizationId: null, activeTab: 'overview' });
  },
}));
