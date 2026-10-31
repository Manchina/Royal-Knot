import { create } from 'zustand';
import { api } from '../api/client';
import type { ProjectFinancials } from '../components/billing/types';

export interface ProjectBillingItem {
  id: string;
  code: string;
  couple: string;
  brideName?: string;
  groomName?: string;
  city: string;
  venue: string;
  startDate: string;
  guestCount: number;
  packageType: string;
  status: string;
  isFinalised: boolean;
  budget: string;
  rawBudget: number;
  coordinator: string;
  baseContract: string;
  totalExtras: string;
  rawTotalExtras: number;
  extrasCount: number;
  totalInvoiced: string;
  rawTotalInvoiced: number;
  vendorCommitments: string;
  rawVendorCommitments: number;
  vendorAdvancePaid: string;
  rawVendorAdvancePaid: number;
  vendorBalanceDue: string;
  rawVendorBalanceDue: number;
  grossMargin: string;
  billsCount: number;
}

export interface BillingSummary {
  totalBudget: string;
  totalInvoiced: string;
  totalVendorCommitments: string;
  averageGrossMargin: string;
}

interface BillingState {
  projects: ProjectBillingItem[];
  summary: BillingSummary;
  currentProject: ProjectFinancials | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;

  fetchBillingProjects: () => Promise<ProjectBillingItem[]>;
  fetchProjectDossier: (projectId: string) => Promise<ProjectFinancials | null>;
  syncAwardedQuotes: (projectId: string) => Promise<{ success: boolean; syncedCount: number }>;
  createExtraCharge: (
    projectId: string,
    data: {
      category: string;
      description: string;
      qty: number;
      unitPrice: number;
      vendor: string;
      vendorId?: string;
      isBilledToClient?: boolean;
      ceremonyType?: string;
    }
  ) => Promise<boolean>;
  createVendorBill: (
    projectId: string,
    data: {
      vendorId: string;
      category: string;
      agreedBase: number;
      notes?: string;
    }
  ) => Promise<boolean>;
  reconcileVendorBill: (
    projectId: string,
    billId: string,
    data: {
      reconciledAmount: number;
      status: string;
      notes: string;
    }
  ) => Promise<boolean>;
  recordPayment: (
    projectId: string,
    invoiceId: string,
    data: {
      amount: number;
      reference: string;
    }
  ) => Promise<boolean>;
  finaliseProject: (
    projectId: string,
    data: {
      finalisedBy: string;
      settlementNotes: string;
    }
  ) => Promise<boolean>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  projects: [],
  summary: {
    totalBudget: '₹17.25 Cr',
    totalInvoiced: '₹17.38 Cr',
    totalVendorCommitments: '₹13.40 Cr',
    averageGrossMargin: '23.4%',
  },
  currentProject: null,
  loading: false,
  isLoading: false,
  error: null,

  fetchBillingProjects: async () => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.get<{
        success: boolean;
        summary?: BillingSummary;
        data: ProjectBillingItem[];
      }>('/billing/projects');
      if (res?.success && res.data) {
        set({
          projects: res.data,
          summary: res.summary || get().summary,
          loading: false,
          isLoading: false,
        });
        return res.data;
      }
      set({ loading: false, isLoading: false });
      return get().projects;
    } catch (err: any) {
      console.warn('Failed to fetch billing projects:', err);
      set({ loading: false, isLoading: false, error: err.message || 'Failed to fetch billing projects' });
      return get().projects;
    }
  },

  fetchProjectDossier: async (projectId: string) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.get<{ success: boolean; data: ProjectFinancials }>(
        `/billing/projects/${projectId}`
      );
      if (res?.success && res.data) {
        set({ currentProject: res.data, loading: false, isLoading: false });
        return res.data;
      }
      set({ loading: false, isLoading: false });
      return null;
    } catch (err: any) {
      console.warn('Failed to fetch project dossier:', err);
      set({ loading: false, isLoading: false, error: err.message || 'Failed to fetch project dossier' });
      return null;
    }
  },

  syncAwardedQuotes: async (projectId: string) => {
    set({ loading: true, isLoading: true });
    try {
      const res = await api.post<{ success: boolean; syncedCount: number }>(
        `/billing/projects/${projectId}/sync-awarded-quotes`,
        {}
      );
      if (res?.success) {
        await get().fetchProjectDossier(projectId);
        return { success: true, syncedCount: res.syncedCount || 0 };
      }
      return { success: false, syncedCount: 0 };
    } catch (err: any) {
      console.error('Error syncing quotes:', err);
      return { success: false, syncedCount: 0 };
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  createExtraCharge: async (projectId: string, data) => {
    try {
      const res = await api.post<{ success: boolean }>(`/billing/projects/${projectId}/extras`, data);
      if (res?.success) {
        await get().fetchProjectDossier(projectId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to create extra charge:', err);
      return false;
    }
  },

  createVendorBill: async (projectId: string, data) => {
    try {
      const res = await api.post<{ success: boolean }>(`/billing/projects/${projectId}/vendor-bills`, data);
      if (res?.success) {
        await get().fetchProjectDossier(projectId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to create vendor bill:', err);
      return false;
    }
  },

  reconcileVendorBill: async (projectId: string, billId: string, data) => {
    try {
      const res = await api.put<{ success: boolean }>(
        `/billing/projects/${projectId}/vendor-bills/${billId}/reconcile`,
        data
      );
      if (res?.success) {
        await get().fetchProjectDossier(projectId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to reconcile bill:', err);
      return false;
    }
  },

  recordPayment: async (projectId: string, invoiceId: string, data) => {
    try {
      const res = await api.put<{ success: boolean }>(
        `/billing/projects/${projectId}/pay-invoice`,
        {
          invoiceId,
          amount: data.amount,
          reference: data.reference,
        }
      );
      if (res?.success) {
        await get().fetchProjectDossier(projectId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to record payment:', err);
      return false;
    }
  },

  finaliseProject: async (projectId: string, data) => {
    try {
      const res = await api.put<{ success: boolean }>(
        `/billing/projects/${projectId}/finalise`,
        data
      );
      if (res?.success) {
        await get().fetchProjectDossier(projectId);
        await get().fetchBillingProjects();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to finalise project:', err);
      return false;
    }
  },
}));
