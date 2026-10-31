import { create } from 'zustand';
import { api } from '../api/client';
import { isUUID } from '../lib/utils';

export interface WeddingSummary {
  id: string; // e.g. 'RW-2026-001' or UUID
  uuid?: string;
  code: string;
  couple: string;
  brideName?: string;
  groomName?: string;
  clientPhone?: string;
  clientEmail?: string;
  city: string;
  venue: string;
  startDate: string;
  endDate?: string;
  guestCount: number;
  packageType: string;
  status: 'LIVE_BIG_DAY' | 'IN_PLANNING' | 'BOOKED' | 'ENQUIRY' | 'FINALISED' | 'FINALISED_SETTLED' | string;
  isFinalised?: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  rawBudget?: number;
  agencyFee?: string;
  theme?: string;
  coordinator: string;
  coordinatorPhone?: string;
}

export interface WeddingOption {
  id: string;
  code: string;
  couple: string;
  city: string;
  venue?: string;
  guestCount?: number;
  status?: string;
  label: string;
}

interface WeddingState {
  weddings: WeddingSummary[];
  weddingOptions: WeddingOption[];
  selectedWeddingId: string; // wedding UUID or code
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  setSelectedWeddingId: (id: string) => void;
  setWeddings: (weddings: WeddingSummary[]) => void;
  getSelectedWedding: () => WeddingSummary | undefined;
  fetchWeddings: () => Promise<WeddingSummary[]>;
  fetchWeddingOptions: () => Promise<WeddingOption[]>;
  createWedding: (payload: any) => Promise<WeddingSummary | null>;
}

export const useWeddingStore = create<WeddingState>((set, get) => ({
  weddings: [],
  weddingOptions: [],
  selectedWeddingId: '',
  loading: false,
  isLoading: false,
  error: null,

  setSelectedWeddingId: (id: string) => {
    set({ selectedWeddingId: id });
  },

  setWeddings: (weddings: WeddingSummary[]) => {
    set({ weddings });
  },

  getSelectedWedding: () => {
    const { weddings, selectedWeddingId } = get();
    if (!selectedWeddingId || selectedWeddingId === 'ALL') return undefined;
    return weddings.find((w) =>
      isUUID(selectedWeddingId)
        ? w.id === selectedWeddingId || w.uuid === selectedWeddingId
        : w.code === selectedWeddingId || w.id === selectedWeddingId || w.uuid === selectedWeddingId
    );
  },

  fetchWeddings: async () => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.get<{ success: boolean; data: any[] }>('/weddings');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const liveWeddings: WeddingSummary[] = res.data.map((w) => ({
          id: w.id || w.code,
          uuid: w.uuid || (isUUID(w.id) ? w.id : undefined),
          code: w.code,
          couple: w.couple || `${w.brideName || 'Bride'} & ${w.groomName || 'Groom'}`,
          brideName: w.brideName,
          groomName: w.groomName,
          clientPhone: w.clientPhone,
          clientEmail: w.clientEmail,
          city: w.city || 'Jaipur',
          venue: w.venue || 'Luxury Heritage Palace',
          startDate: w.startDate
            ? new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Winter 2026',
          endDate: w.endDate
            ? new Date(w.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : undefined,
          guestCount: w.guestCount || 400,
          packageType: w.packageType || 'Full-Service Royal Wedding',
          status: w.status || 'IN_PLANNING',
          isFinalised: !!w.isFinalised,
          finalisedDate: w.finalisedDate,
          finalisedBy: w.finalisedBy,
          budget: w.budget
            ? (typeof w.budget === 'string' && w.budget.startsWith('₹') ? w.budget : `₹${(Number(w.budget) / 10000000).toFixed(2)} Cr`)
            : '₹2.50 Cr',
          rawBudget: w.rawBudget || (w.budget ? Number(w.budget) : undefined),
          agencyFee: w.agencyFee
            ? (typeof w.agencyFee === 'string' && w.agencyFee.startsWith('₹') ? w.agencyFee : `₹${(Number(w.agencyFee) / 100000).toFixed(0)} Lakh`)
            : undefined,
          theme: w.theme,
          coordinator: w.coordinator || 'Lead Planner',
          coordinatorPhone: w.coordinatorPhone,
        }));

        const liveOptions: WeddingOption[] = res.data.map((w) => ({
          id: w.id || w.code,
          code: w.code,
          couple: w.couple || `${w.brideName || 'Bride'} & ${w.groomName || 'Groom'}`,
          city: w.city || 'Jaipur',
          venue: w.venue,
          guestCount: w.guestCount,
          status: w.status,
          label: `${w.code}: ${w.couple || `${w.brideName || 'Bride'} & ${w.groomName || 'Groom'}`} (${w.city} • ${w.guestCount} Guests)`,
        }));

        set({
          weddings: liveWeddings,
          weddingOptions: liveOptions,
          loading: false,
          isLoading: false,
        });

        // Set active selected wedding if current one is not valid
        const currentSelected = get().selectedWeddingId;
        const exists = liveWeddings.some((w) =>
          isUUID(currentSelected)
            ? w.id === currentSelected || w.uuid === currentSelected
            : w.code === currentSelected || w.id === currentSelected
        );
        if (currentSelected && !exists) {
          set({ selectedWeddingId: '' });
        }

        return liveWeddings;
      } else {
        set({ weddings: [], weddingOptions: [], loading: false, isLoading: false });
        return [];
      }
    } catch (err: any) {
      console.error('Failed to fetch weddings from database:', err);
      set({ weddings: [], weddingOptions: [], loading: false, isLoading: false, error: err.message || 'Failed to fetch weddings' });
      return [];
    }
  },

  fetchWeddingOptions: async () => {
    try {
      const res = await api.get<{ success: boolean; data: WeddingOption[] }>('/weddings/options');
      if (res?.data && Array.isArray(res.data)) {
        set({ weddingOptions: res.data });
        return res.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch wedding options from database:', err);
      return [];
    }
  },

  createWedding: async (payload: any) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.post<{ success: boolean; data: any }>('/weddings', payload);
      if (res?.success && res.data) {
        await get().fetchWeddings();
        await get().fetchWeddingOptions();
        if (res.data.id || res.data.code) {
          set({ selectedWeddingId: res.data.id || res.data.code });
        }
        return res.data;
      }
      return null;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create wedding' });
      throw err;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },
}));

// Helper function to fetch live wedding options directly
export async function getWeddingOptions(): Promise<WeddingOption[]> {
  try {
    const res = await api.get<{ success: boolean; data: WeddingOption[] }>('/weddings/options');
    return res?.data || [];
  } catch (err) {
    console.warn('getWeddingOptions API error:', err);
    return [];
  }
}

// Automatically trigger initial fetch on load so all pages receive live database data
useWeddingStore.getState().fetchWeddings().catch(() => {});
