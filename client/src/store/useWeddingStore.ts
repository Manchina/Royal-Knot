import { create } from 'zustand';

export interface WeddingSummary {
  id: string; // e.g. 'RW-2026-001'
  code: string;
  couple: string;
  city: 'Udaipur' | 'Jaipur';
  venue: string;
  startDate: string;
  guestCount: number;
  packageType: string;
  status: 'LIVE_BIG_DAY' | 'IN_PLANNING' | 'BOOKED' | 'ENQUIRY';
  budget: string;
  coordinator: string;
}

export const SYSTEM_WEDDINGS: WeddingSummary[] = [
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
    budget: '₹3.00 Cr',
    coordinator: 'Karan Verma',
  },
];

interface WeddingState {
  weddings: WeddingSummary[];
  selectedWeddingId: string; // 'ALL' or specific wedding id like 'RW-2026-001'
  setSelectedWeddingId: (id: string) => void;
  getSelectedWedding: () => WeddingSummary | undefined;
}

export const useWeddingStore = create<WeddingState>((set, get) => ({
  weddings: SYSTEM_WEDDINGS,
  selectedWeddingId: 'RW-2026-001', // default to active flagship wedding

  setSelectedWeddingId: (id: string) => {
    set({ selectedWeddingId: id });
  },

  getSelectedWedding: () => {
    const { weddings, selectedWeddingId } = get();
    if (selectedWeddingId === 'ALL') return undefined;
    return weddings.find((w) => w.id === selectedWeddingId);
  },
}));
