import { create } from 'zustand';
import { api } from '../api/client';
import type { VendorItem } from '../components/procurement/VendorDirectoryView';
import type { WeddingOverviewItem } from '../components/procurement/WeddingSourcingView';

interface ProcurementState {
  vendorsList: VendorItem[];
  vendorCounts: Record<string, number>;
  weddingsOverview: WeddingOverviewItem[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;

  fetchProcurementData: () => Promise<{
    vendors: VendorItem[];
    counts: Record<string, number>;
    weddingsOverview: WeddingOverviewItem[];
  }>;
  createVendor: (payload: {
    businessName: string;
    category: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    city: string;
    pricingEstimate?: string;
    specialties?: string;
  }) => Promise<VendorItem | null>;
  assignVendorOptions: (payload: {
    weddingId: string;
    category: string;
    vendorIds: string[];
  }) => Promise<boolean>;
}

export const useProcurementStore = create<ProcurementState>((set, get) => ({
  vendorsList: [],
  vendorCounts: {},
  weddingsOverview: [],
  loading: false,
  isLoading: false,
  error: null,

  fetchProcurementData: async () => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const [vendorsRes, overviewRes] = await Promise.all([
        api.get<{ success: boolean; data: VendorItem[]; counts: Record<string, number> }>('/api/procurement/vendors'),
        api.get<{ success: boolean; data: WeddingOverviewItem[] }>('/api/procurement/weddings-overview'),
      ]);

      const vendors = vendorsRes?.data || [];
      const counts = vendorsRes?.counts || {};
      const weddingsOverview = overviewRes?.data || [];

      set({
        vendorsList: vendors,
        vendorCounts: counts,
        weddingsOverview,
        loading: false,
        isLoading: false,
      });

      return { vendors, counts, weddingsOverview };
    } catch (err: any) {
      console.error('Failed to load procurement data:', err);
      set({ loading: false, isLoading: false, error: err.message || 'Failed to fetch procurement data' });
      return {
        vendors: get().vendorsList,
        counts: get().vendorCounts,
        weddingsOverview: get().weddingsOverview,
      };
    }
  },

  createVendor: async (payload) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.post<{ success: boolean; data: VendorItem }>('/api/procurement/vendors', payload);
      if (res?.success) {
        await get().fetchProcurementData();
        return res.data;
      }
      return null;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create vendor' });
      throw err;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },

  assignVendorOptions: async (payload) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.post<{ success: boolean; message: string }>('/api/procurement/assign-options', payload);
      if (res?.success) {
        await get().fetchProcurementData();
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Failed to assign vendor options' });
      throw err;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },
}));
