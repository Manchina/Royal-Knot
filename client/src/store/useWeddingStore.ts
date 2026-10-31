import { create } from 'zustand';
import { api } from '../api/client';

export interface WeddingSummary {
  id: string; // e.g. 'RW-2026-001'
  uuid?: string;
  code: string;
  couple: string;
  city: 'Udaipur' | 'Jaipur' | 'Jodhpur';
  venue: string;
  startDate: string;
  endDate?: string;
  guestCount: number;
  packageType: string;
  status: 'LIVE_BIG_DAY' | 'IN_PLANNING' | 'BOOKED' | 'ENQUIRY' | 'FINALISED' | 'FINALISED_SETTLED';
  isFinalised?: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  rawBudget?: number;
  coordinator: string;
}

interface WeddingState {
  weddings: WeddingSummary[];
  isLoading: boolean;
  error: string | null;
  selectedWeddingId: string; // 'ALL' or specific wedding code/id
  setSelectedWeddingId: (id: string) => void;
  setWeddings: (weddings: WeddingSummary[]) => void;
  getSelectedWedding: () => WeddingSummary | undefined;
  fetchWeddings: () => Promise<WeddingSummary[]>;
}

export const useWeddingStore = create<WeddingState>((set, get) => ({
  weddings: [],
  isLoading: false,
  error: null,
  selectedWeddingId: 'RW-2026-001', // default to flagship active wedding

  setSelectedWeddingId: (id: string) => {
    set({ selectedWeddingId: id });
  },

  setWeddings: (weddings: WeddingSummary[]) => {
    set({ weddings });
  },

  getSelectedWedding: () => {
    const { weddings, selectedWeddingId } = get();
    if (selectedWeddingId === 'ALL') return undefined;
    return weddings.find((w) => w.id === selectedWeddingId || w.code === selectedWeddingId);
  },

  fetchWeddings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<{ success: boolean; data: WeddingSummary[] }>('/weddings');
      if (res?.data && Array.isArray(res.data)) {
        set({ weddings: res.data, isLoading: false });
        return res.data;
      }
      set({ isLoading: false });
      return [];
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to fetch weddings' });
      return [];
    }
  },
}));

// Automatically trigger initial fetch on load so all pages receive live database data
useWeddingStore.getState().fetchWeddings().catch(() => {});
