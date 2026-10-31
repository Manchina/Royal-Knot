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

export interface CreateEnquiryPayload {
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
}

export interface RawEnquiryRow {
  id?: string;
  code?: string;
  coupleName?: string;
  couple_name?: string;
  primaryContactName?: string;
  primary_contact_name?: string;
  channel?: string;
  phone?: string;
  email?: string;
  cityPreference?: string;
  city_preference?: string;
  datesRough?: string;
  dates_rough?: string;
  guestCount?: number;
  guest_count?: number;
  theme?: string;
  budgetMax?: string | number;
  budget_max?: string | number;
  packagePreference?: string;
  package_preference?: string;
  agreementStatus?: string;
  agreement_status?: string;
  agreementSignedAt?: string;
  agreement_signed_at?: string;
  status?: string;
  weddingId?: string;
  wedding_id?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}

interface EnquiryState {
  enquiries: Enquiry[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;

  fetchEnquiries: () => Promise<Enquiry[]>;
  createEnquiry: (payload: CreateEnquiryPayload) => Promise<RawEnquiryRow | null>;
}

export const useEnquiryStore = create<EnquiryState>((set, get) => ({
  enquiries: [],
  loading: false,
  isLoading: false,
  error: null,

  fetchEnquiries: async () => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.get<{ success: boolean; data: RawEnquiryRow[] }>('/enquiries');
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
            status: (row.status as Enquiry['status']) || 'Initial Discovery',
            weddingId: row.weddingId || row.wedding_id,
            notes: row.notes || '',
            createdAt: row.createdAt || row.created_at,
          };
        });

        set({ enquiries: mapped, loading: false, isLoading: false });
        return mapped;
      }
      set({ enquiries: [], loading: false, isLoading: false });
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch enquiries';
      console.error('Failed to load enquiries from database:', err);
      set({ enquiries: [], loading: false, isLoading: false, error: message });
      return [];
    }
  },

  createEnquiry: async (payload: CreateEnquiryPayload) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.post<{ success: boolean; data: RawEnquiryRow }>('/enquiries', payload);
      if (res?.success && res.data) {
        await get().fetchEnquiries();
        return res.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create enquiry';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false, isLoading: false });
    }
  },
}));
