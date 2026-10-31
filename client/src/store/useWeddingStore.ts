import { create } from 'zustand';
import { api } from '../api/client';
import { isUUID } from '../lib/utils';

export interface WeddingSummary {
  id: string; // e.g. 'RW-2026-001' or UUID
  code: string;
  couple: string;
  city: string;
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
  coordinator: string;
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

export const SYSTEM_WEDDINGS: WeddingSummary[] = [
  // Ongoing Projects fallback
  {
    id: 'RW-2026-001',
    code: 'RW-2026-001',
    couple: 'Aanya Singhania & Raghav Mehra',
    city: 'Udaipur',
    venue: 'The Oberoi Udaivilas',
    startDate: 'Dec 10 - 13, 2026',
    guestCount: 400,
    packageType: 'Full-Service Royal Wedding',
    status: 'LIVE_BIG_DAY',
    isFinalised: false,
    budget: '₹3.50 Cr',
    coordinator: 'Karan Verma',
  },
  {
    id: 'RW-2026-002',
    code: 'RW-2026-002',
    couple: 'Kriti Maheshwari & Siddharth Jain',
    city: 'Jaipur',
    venue: 'Rambagh Palace',
    startDate: 'Nov 20 - 23, 2026',
    guestCount: 420,
    packageType: 'Full-Service Royal Wedding',
    status: 'IN_PLANNING',
    isFinalised: false,
    budget: '₹2.75 Cr',
    coordinator: 'Devika Sharma',
  },
  {
    id: 'RW-2026-003',
    code: 'RW-2026-003',
    couple: 'Simran Bajaj & Armaan Gill',
    city: 'Jaipur',
    venue: 'Alila Fort Bishangarh',
    startDate: 'Jan 14 - 17, 2027',
    guestCount: 500,
    packageType: 'Day-of Execution',
    status: 'BOOKED',
    isFinalised: false,
    budget: '₹3.00 Cr',
    coordinator: 'Karan Verma',
  },
];

interface WeddingState {
  weddings: WeddingSummary[];
  weddingOptions: WeddingOption[];
  selectedWeddingId: string; // wedding UUID or code
  loading: boolean;
  setSelectedWeddingId: (id: string) => void;
  getSelectedWedding: () => WeddingSummary | undefined;
  fetchWeddings: () => Promise<void>;
  fetchWeddingOptions: () => Promise<WeddingOption[]>;
}

export const useWeddingStore = create<WeddingState>((set, get) => ({
  weddings: SYSTEM_WEDDINGS,
  weddingOptions: SYSTEM_WEDDINGS.map((w) => ({
    id: w.id,
    code: w.code,
    couple: w.couple,
    city: w.city,
    venue: w.venue,
    guestCount: w.guestCount,
    status: w.status,
    label: `${w.code}: ${w.couple} (${w.city} • ${w.guestCount} Guests)`,
  })),
  selectedWeddingId: 'RW-2026-001',
  loading: false,

  setSelectedWeddingId: (id: string) => {
    set({ selectedWeddingId: id });
  },

  getSelectedWedding: () => {
    const { weddings, selectedWeddingId } = get();
    if (selectedWeddingId === 'ALL') return undefined;
    return weddings.find((w) => isUUID(selectedWeddingId) ? w.id === selectedWeddingId : (w.code === selectedWeddingId || w.id === selectedWeddingId));
  },

  fetchWeddings: async () => {
    set({ loading: true });
    try {
      const res = await api.get<{ success: boolean; data: any[] }>('/api/weddings');
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const liveWeddings: WeddingSummary[] = res.data.map((w) => ({
          id: w.id,
          code: w.code,
          couple: w.couple || 'Royal Couple',
          city: w.city || 'Jaipur',
          venue: w.venue || 'Luxury Heritage Palace',
          startDate: w.startDate ? new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Winter 2026',
          endDate: w.endDate ? new Date(w.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
          guestCount: w.guestCount || 400,
          packageType: w.packageType || 'Full-Service Royal Wedding',
          status: w.status || 'IN_PLANNING',
          budget: w.budget ? `₹${(Number(w.budget) / 10000000).toFixed(2)} Cr` : '₹2.50 Cr',
          coordinator: w.coordinator || 'Lead Planner',
        }));

        const liveOptions: WeddingOption[] = res.data.map((w) => ({
          id: w.id,
          code: w.code,
          couple: w.couple || 'Royal Couple',
          city: w.city || 'Jaipur',
          venue: w.venue,
          guestCount: w.guestCount,
          status: w.status,
          label: `${w.code}: ${w.couple} (${w.city} • ${w.guestCount} Guests)`,
        }));

        set({
          weddings: liveWeddings,
          weddingOptions: liveOptions,
          loading: false,
        });

        // Set active selected wedding if current one is not valid
        const currentSelected = get().selectedWeddingId;
        const exists = liveWeddings.some((w) => isUUID(currentSelected) ? w.id === currentSelected : (w.code === currentSelected || w.id === currentSelected));
        if (!exists && liveWeddings.length > 0) {
          set({ selectedWeddingId: liveWeddings[0].id });
        }
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.warn('Using local fallback weddings:', err);
      set({ loading: false });
    }
  },

  fetchWeddingOptions: async () => {
    try {
      const res = await api.get<{ success: boolean; data: WeddingOption[] }>('/api/weddings/options');
      if (res?.success && Array.isArray(res.data)) {
        set({ weddingOptions: res.data });
        return res.data;
      }
      return get().weddingOptions;
    } catch (err) {
      console.warn('Failed to fetch options, using store fallback:', err);
      return get().weddingOptions;
    }
  },
}));

// Helper function to fetch live wedding options directly
export async function getWeddingOptions(): Promise<WeddingOption[]> {
  try {
    const res = await api.get<{ success: boolean; data: WeddingOption[] }>('/api/weddings/options');
    return res?.data || [];
  } catch (err) {
    console.warn('getWeddingOptions API error:', err);
    return [];
  }
}
