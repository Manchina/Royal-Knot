import { create } from 'zustand';

export interface EditHistoryRecord {
  date: string;
  action: string;
  by: string;
  details: string;
}

export interface ExtraCharge {
  id: string;
  weddingId: string;
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  vendor: string;
  status: 'ADDED_TO_CLIENT_INVOICE' | 'PENDING_APPROVAL';
  approvedBy: string;
  lastEditedAt?: string;
  editHistory?: EditHistoryRecord[];
}

export interface VendorBill {
  weddingId: string;
  vendor: string;
  category: string;
  agreedBase: string;
  extras: string;
  totalPayable: string;
  advancePaid: string;
  balanceDue: string;
  status: 'RECONCILED_MATCHED' | 'SETTLEMENT_CLEARED' | 'DISPUTED';
}

interface BillingState {
  extraCharges: ExtraCharge[];
  vendorBills: VendorBill[];
  finalisedProjects: Record<string, { finalisedDate: string; finalisedBy: string }>;
  addExtraCharge: (extra: Omit<ExtraCharge, 'id'>) => ExtraCharge;
  finaliseProject: (weddingId: string, finalisedBy?: string) => void;
  getProjectExtras: (weddingId: string) => ExtraCharge[];
  getProjectVendorBills: (weddingId: string) => VendorBill[];
}

export const useBillingStore = create<BillingState>((set, get) => ({
  extraCharges: [
    // RW-2026-001 (Ongoing)
    {
      id: 'EXT-01',
      weddingId: 'RW-2026-001',
      category: 'EXTRA_PLATES',
      description: '60 Unexpected Guests turned up at the Grand Durbar Banquet',
      qty: 60,
      unitPrice: '₹2,100 / plate',
      total: '₹1,26,000',
      vendor: 'Marwar Gourmet Kitchens',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Finance Manager',
      lastEditedAt: '2026-10-30T18:00:00Z',
      editHistory: [
        {
          date: 'Oct 30, 2026 06:00 PM',
          action: 'HEADCOUNT_ADJUSTMENT',
          by: 'Lead Planner Devika',
          details: 'Adjusted from 50 to 60 extra covers verified with banquet captain signoff',
        },
      ],
    },
    {
      id: 'EXT-02',
      weddingId: 'RW-2026-001',
      category: 'DJ_OVERTIME',
      description: 'Sangeet party extended by 2.5 hours past 01:00 AM curfew',
      qty: 2.5,
      unitPrice: '₹12,000 / hr',
      total: '₹30,000',
      vendor: 'Desert Beat Sounds',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Lead Planner',
    },
    // RW-2026-002 (Ongoing)
    {
      id: 'EXT-03',
      weddingId: 'RW-2026-002',
      category: 'VINTAGE_CAR',
      description: 'Vintage Rolls Royce Phantom for Groom Baraat entry procession',
      qty: 1,
      unitPrice: '₹55,000 / day',
      total: '₹55,000',
      vendor: 'Royal Rajputana Fleet',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Devika Sharma',
    },
    {
      id: 'EXT-04',
      weddingId: 'RW-2026-002',
      category: 'ADDITIONAL_POWER',
      description: 'Silent Diesel Generator backup (125 kVA) for palace lawn',
      qty: 2,
      unitPrice: '₹15,000 / unit',
      total: '₹30,000',
      vendor: 'Jaipur Power Grid Rentals',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Devika Sharma',
    },
    // RW-2025-010 (Finalised)
    {
      id: 'EXT-10',
      weddingId: 'RW-2025-010',
      category: 'SPECIAL_FIREWORKS',
      description: 'Green Eco-Friendly Pyro Show over palace dome during Varmala',
      qty: 1,
      unitPrice: '₹1,90,000',
      total: '₹1,90,000',
      vendor: 'Rajputana Pyro Arts',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Devika Sharma',
      lastEditedAt: '2026-02-18T14:30:00Z',
      editHistory: [
        {
          date: 'Feb 18, 2026 02:30 PM',
          action: 'DISCOUNT_REVISION',
          by: 'Aditya Singhal (Super Admin)',
          details: 'Negotiated ₹10,000 vendor volume discount applied to final invoice settlement',
        },
      ],
    },
    {
      id: 'EXT-11',
      weddingId: 'RW-2025-010',
      category: 'ROYAL_PROCESSION',
      description: '4 Dappled Marwari Horses with silver ceremonial saddlery',
      qty: 4,
      unitPrice: '₹37,500 / horse',
      total: '₹1,50,000',
      vendor: 'Jodhpur Royal Stables',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Devika Sharma',
    },
    // RW-2025-011 (Finalised)
    {
      id: 'EXT-12',
      weddingId: 'RW-2025-011',
      category: 'BOAT_SHUTTLE_OVERRUN',
      description: 'Extra lake speedboats running till 03:00 AM for wedding attendees',
      qty: 6,
      unitPrice: '₹35,000 / boat-hr',
      total: '₹2,10,000',
      vendor: 'Lake Pichola Royal Charters',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Karan Verma',
      lastEditedAt: '2026-02-04T11:00:00Z',
      editHistory: [
        {
          date: 'Feb 04, 2026 11:00 AM',
          action: 'FUEL_SURCHARGE_WAIVER',
          by: 'Karan Verma',
          details: 'Waived midnight fuel surcharge as per VIP season contract addendum clause 4.2',
        },
      ],
    },
  ],

  vendorBills: [
    // RW-2026-001
    {
      weddingId: 'RW-2026-001',
      vendor: 'Marwar Gourmet Kitchens',
      category: 'Catering & Banquets',
      agreedBase: '₹8,40,000',
      extras: '+₹1,26,000 (60 Plates)',
      totalPayable: '₹9,66,000',
      advancePaid: '₹4,20,000',
      balanceDue: '₹5,46,000',
      status: 'RECONCILED_MATCHED',
    },
    {
      weddingId: 'RW-2026-001',
      vendor: 'Jaipur Floral Wonders',
      category: 'Mandap & Courtyard Decor',
      agreedBase: '₹14,00,000',
      extras: '₹0',
      totalPayable: '₹14,00,000',
      advancePaid: '₹7,00,000',
      balanceDue: '₹7,00,000',
      status: 'RECONCILED_MATCHED',
    },
    {
      weddingId: 'RW-2026-001',
      vendor: 'Desert Beat Sounds',
      category: 'Sound & DJ Tech Rider',
      agreedBase: '₹3,50,000',
      extras: '+₹30,000 (Overtime)',
      totalPayable: '₹3,80,000',
      advancePaid: '₹1,75,000',
      balanceDue: '₹2,05,000',
      status: 'RECONCILED_MATCHED',
    },
    // RW-2026-002
    {
      weddingId: 'RW-2026-002',
      vendor: 'Royal Rajputana Fleet',
      category: 'Luxury Transport & Baraat',
      agreedBase: '₹2,20,000',
      extras: '+₹55,000 (Vintage Car)',
      totalPayable: '₹2,75,000',
      advancePaid: '₹1,50,000',
      balanceDue: '₹1,25,000',
      status: 'RECONCILED_MATCHED',
    },
    {
      weddingId: 'RW-2026-002',
      vendor: 'Jaipur Power Grid Rentals',
      category: 'Technical & Infrastructure',
      agreedBase: '₹1,80,000',
      extras: '+₹30,000 (Genset)',
      totalPayable: '₹2,10,000',
      advancePaid: '₹1,00,000',
      balanceDue: '₹1,10,000',
      status: 'RECONCILED_MATCHED',
    },
    // RW-2026-003
    {
      weddingId: 'RW-2026-003',
      vendor: 'Bishangarh Hospitality',
      category: 'Fort Venue & Banquets',
      agreedBase: '₹22,00,000',
      extras: '₹0',
      totalPayable: '₹22,00,000',
      advancePaid: '₹11,00,000',
      balanceDue: '₹11,00,000',
      status: 'RECONCILED_MATCHED',
    },
    // RW-2025-010 (Finalised)
    {
      weddingId: 'RW-2025-010',
      vendor: 'Rajputana Pyro Arts',
      category: 'Special Effects & Pyros',
      agreedBase: '₹3,00,000',
      extras: '+₹1,90,000 (Palace Pyro)',
      totalPayable: '₹4,90,000',
      advancePaid: '₹4,90,000',
      balanceDue: '₹0 (Settled)',
      status: 'SETTLEMENT_CLEARED',
    },
    {
      weddingId: 'RW-2025-010',
      vendor: 'Jodhpur Royal Stables',
      category: 'Baraat Royal Regalia',
      agreedBase: '₹2,50,000',
      extras: '+₹1,50,000 (Marwari Horses)',
      totalPayable: '₹4,00,000',
      advancePaid: '₹4,00,000',
      balanceDue: '₹0 (Settled)',
      status: 'SETTLEMENT_CLEARED',
    },
    // RW-2025-011 (Finalised)
    {
      weddingId: 'RW-2025-011',
      vendor: 'Lake Pichola Royal Charters',
      category: 'Water Transport & Ferry Logistics',
      agreedBase: '₹6,50,000',
      extras: '+₹2,10,000 (Midnight Ferry)',
      totalPayable: '₹8,60,000',
      advancePaid: '₹8,60,000',
      balanceDue: '₹0 (Settled)',
      status: 'SETTLEMENT_CLEARED',
    },
  ],

  finalisedProjects: {
    'RW-2025-010': {
      finalisedDate: 'Feb 20, 2026',
      finalisedBy: 'Aditya Singhal (Super Admin)',
    },
    'RW-2025-011': {
      finalisedDate: 'Feb 05, 2026',
      finalisedBy: 'Karan Verma (Lead Planner)',
    },
  },

  addExtraCharge: (extraData) => {
    const { extraCharges } = get();
    const newExtra: ExtraCharge = {
      ...extraData,
      id: `EXT-0${extraCharges.length + 1}`,
    };
    set({ extraCharges: [...extraCharges, newExtra] });
    return newExtra;
  },

  finaliseProject: (weddingId, finalisedBy = 'Aditya Singhal (Super Admin)') => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    set((state) => ({
      finalisedProjects: {
        ...state.finalisedProjects,
        [weddingId]: { finalisedDate: today, finalisedBy },
      },
      vendorBills: state.vendorBills.map((vb) =>
        vb.weddingId === weddingId
          ? { ...vb, balanceDue: '₹0 (Settled)', status: 'SETTLEMENT_CLEARED' }
          : vb
      ),
    }));
  },

  getProjectExtras: (weddingId) => {
    return get().extraCharges.filter((ext) => ext.weddingId === weddingId);
  },

  getProjectVendorBills: (weddingId) => {
    return get().vendorBills.filter((vb) => vb.weddingId === weddingId);
  },
}));
