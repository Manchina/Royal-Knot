import { sql } from 'drizzle-orm';
import { enquiries } from '../../db/schema';

export const matchEnquiry = (param: string) => sql`(${enquiries.id}::text = ${param} OR ${enquiries.code} = ${param})`;

export interface CreateEnquiryBody {
  coupleName: string;
  primaryContactName?: string;
  phone: string;
  email?: string;
  channel?: string;
  cityPreference: string;
  datesRough: string;
  guestCount?: number;
  theme?: string;
  budgetMax?: number;
  packagePreference?: string;
  notes?: string;
}

export interface UpdateStatusBody {
  status?: string;
  agreementStatus?: string;
  notes?: string;
  signatoryName?: string;
  userId?: string;
}
