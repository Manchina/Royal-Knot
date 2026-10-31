import { create } from 'zustand';

export interface WeddingSummary {
  id: string; // e.g. 'RW-2026-001'
  code: string;
  couple: string;
  city: 'Udaipur' | 'Jaipur' | 'Jodhpur';
  venue: string;
  startDate: string;
  guestCount: number;
  packageType: string;
  status: 'LIVE_BIG_DAY' | 'IN_PLANNING' | 'BOOKED' | 'ENQUIRY' | 'FINALISED';
  isFinalised?: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  coordinator: string;
}

export const SYSTEM_WEDDINGS: WeddingSummary[] = [
  // Ongoing Projects
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
  // Finalised Projects (Audited and settled)
  {
    id: 'RW-2025-010',
    code: 'RW-2025-010',
    couple: 'Pooja Agarwal & Rohan Kapoor',
    city: 'Jodhpur',
    venue: 'Umaid Bhawan Palace',
    startDate: 'Feb 12 - 15, 2026',
    guestCount: 450,
    packageType: 'Heritage Royal Extravaganza',
    status: 'FINALISED',
    isFinalised: true,
    finalisedDate: 'Feb 20, 2026',
    finalisedBy: 'Aditya Singhal (Super Admin)',
    budget: '₹4.20 Cr',
    coordinator: 'Devika Sharma',
  },
  {
    id: 'RW-2025-011',
    code: 'RW-2025-011',
    couple: 'Meera Singhal & Arjun Chawla',
    city: 'Udaipur',
    venue: 'Taj Lake Palace',
    startDate: 'Jan 22 - 25, 2026',
    guestCount: 350,
    packageType: 'Bespoke Island Wedding',
    status: 'FINALISED',
    isFinalised: true,
    finalisedDate: 'Feb 05, 2026',
    finalisedBy: 'Karan Verma (Lead Planner)',
    budget: '₹3.80 Cr',
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
