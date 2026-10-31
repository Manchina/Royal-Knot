import { create } from 'zustand';
import { api } from '../api/client';

export interface Enquiry {
  id: string;
  dbId?: string;
  couple: string;
  primaryContactName?: string;
  channel: string;
  phone: string;
  email?: string;
  cityPreference: 'Udaipur' | 'Jaipur';
  datesRough: string;
  guestCount: number;
  theme: string;
  budgetMax: string;
  packagePreference?: string;
  agreementStatus: 'Signed on Mobile' | 'Sent - Pending Signature' | 'Drafting Agreement';
  agreementSignedAt?: string;
  status: 'Consultation Booked' | 'Agreement Awaited' | 'Initial Discovery' | 'Converted to Wedding';
  weddingId?: string;
  notes?: string;
  createdAt?: string;
}

export const SYSTEM_ENQUIRIES: Enquiry[] = [
  {
    id: 'ENQ-2026-104',
    couple: 'Kriti Maheshwari & Siddharth Jain',
    channel: 'WhatsApp Inquiry',
    phone: '+91 98290 11223',
    cityPreference: 'Udaipur',
    datesRough: 'Dec 2026 (Winter Wedding)',
    guestCount: 420,
    theme: 'Royal Heritage / Palace Romance',
    budgetMax: '₹2.50 Cr',
    agreementStatus: 'Signed on Mobile',
    agreementSignedAt: 'Oct 29, 2026',
    status: 'Consultation Booked',
  },
  {
    id: 'ENQ-2026-103',
    couple: 'Simran Bajaj & Armaan Gill',
    channel: 'Instagram DM',
    phone: '+91 98110 44556',
    cityPreference: 'Jaipur',
    datesRough: 'Nov 2026',
    guestCount: 500,
    theme: 'Regal Fortress Chic',
    budgetMax: '₹3.00 Cr',
    agreementStatus: 'Sent - Pending Signature',
    status: 'Agreement Awaited',
  },
  {
    id: 'ENQ-2026-102',
    couple: 'Niharika Verma & Kabir Saxena',
    channel: 'Phone Call Referral',
    phone: '+91 99887 66554',
    cityPreference: 'Udaipur',
    datesRough: 'Jan 2027',
    guestCount: 380,
    theme: 'Lakeside Candlelight',
    budgetMax: '₹1.80 Cr',
    agreementStatus: 'Drafting Agreement',
    status: 'Initial Discovery',
  },
];

interface EnquiryState {
  enquiries: Enquiry[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;

  fetchEnquiries: () => Promise<Enquiry[]>;
  createEnquiry: (payload: {
    coupleName: string;
    phone: string;
    email?: string;
    channel?: string;
    cityPreference: string;
    datesRough?: string;
    budgetMax?: number;
    guestCount?: number;
    theme?: string;
    packagePreference?: string;
    notes?: string;
  }) => Promise<any>;
}

export const useEnquiryStore = create<EnquiryState>((set, get) => ({
  enquiries: SYSTEM_ENQUIRIES,
  loading: false,
  isLoading: false,
  error: null,

  fetchEnquiries: async () => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.get<{ success: boolean; data: any[] }>('/enquiries');
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Enquiry[] = res.data.map((row) => {
          const budgetNum = Number(row.budgetMax || row.budget_max) || 0;
          let budgetStr = '₹2.50 Cr';
          if (budgetNum >= 10000000) {
            budgetStr = `₹${(budgetNum / 10000000).toFixed(2)} Cr`;
          } else if (budgetNum >= 100000) {
            budgetStr = `₹${(budgetNum / 100000).toFixed(0)} Lakh`;
          }

          const rawAgreement = row.agreementStatus || row.agreement_status || 'Drafting Agreement';
          let agreementSt: 'Signed on Mobile' | 'Sent - Pending Signature' | 'Drafting Agreement' = 'Drafting Agreement';
          if (String(rawAgreement).includes('Signed')) agreementSt = 'Signed on Mobile';
          else if (String(rawAgreement).includes('Sent')) agreementSt = 'Sent - Pending Signature';

          const signedAt = row.agreementSignedAt || row.agreement_signed_at;
          const cityPref = (row.cityPreference || row.city_preference) === 'Jaipur' ? 'Jaipur' : 'Udaipur';

          return {
            id: row.code || `ENQ-${String(row.id || '').slice(0, 8)}`,
            dbId: row.id,
            couple: row.coupleName || row.couple_name || 'Couple Consultation',
            primaryContactName: row.primaryContactName || row.primary_contact_name,
            channel: row.channel || 'Website Consultation',
            phone: row.phone || '',
            email: row.email || '',
            cityPreference: cityPref,
            datesRough: row.datesRough || row.dates_rough || 'Winter 2026',
            guestCount: Number(row.guestCount || row.guest_count) || 400,
            theme: row.theme || 'Royal Heritage',
            budgetMax: budgetStr,
            packagePreference: row.packagePreference || row.package_preference || 'FULL_SERVICE',
            agreementStatus: agreementSt,
            agreementSignedAt: signedAt ? new Date(signedAt).toLocaleDateString() : undefined,
            status: row.status || 'Initial Discovery',
            weddingId: row.weddingId || row.wedding_id,
            notes: row.notes || '',
            createdAt: row.createdAt || row.created_at,
          };
        });

        set({ enquiries: mapped, loading: false, isLoading: false });
        return mapped;
      }
      set({ loading: false, isLoading: false });
      return get().enquiries;
    } catch (err: any) {
      console.warn('Failed to load enquiries from API, using fallback store:', err);
      set({ loading: false, isLoading: false, error: err.message || 'Failed to fetch enquiries' });
      return get().enquiries;
    }
  },

  createEnquiry: async (payload) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.post<{ success: boolean; data: any }>('/enquiries', payload);
      if (res?.success) {
        await get().fetchEnquiries();
        return res.data;
      }
      return null;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create enquiry' });
      throw err;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },
}));
