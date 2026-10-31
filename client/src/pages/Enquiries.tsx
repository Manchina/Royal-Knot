import { useState } from 'react';
import { 
  Plus, 
  Phone, 
  FileCheck, 
  Clock, 
  ChevronRight
} from 'lucide-react';

export const Enquiries: React.FC = () => {
  const [enquiries] = useState([
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
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">Couple Enquiries & Lead Intake</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Manage inquiries across WhatsApp, calls, and referrals. Rough dates, guest counts, and service agreements.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF385C] text-white rounded-xl text-xs font-semibold hover:bg-[#E00B41] transition shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>New Lead Intake</span>
        </button>
      </div>

      {/* Enquiry Cards */}
      <div className="space-y-4">
        {enquiries.map((enq) => (
          <div
            key={enq.id}
            className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-neutral-400">{enq.id}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700">
                    {enq.channel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-[#FF385C]">
                    Prefers {enq.cityPreference}
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#222222]">{enq.couple}</h3>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-neutral-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{enq.phone}</span>
                  </div>
                  <div>
                    Guests: <strong className="text-neutral-800">{enq.guestCount}</strong>
                  </div>
                  <div>
                    Rough Date: <strong className="text-neutral-800">{enq.datesRough}</strong>
                  </div>
                  <div>
                    Theme: <strong className="text-neutral-800">{enq.theme}</strong>
                  </div>
                  <div>
                    Max Budget: <strong className="text-emerald-600">{enq.budgetMax}</strong>
                  </div>
                </div>
              </div>

              {/* Right Agreement & Status Badge */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
                <div className="flex items-center gap-2">
                  {enq.agreementStatus.includes('Signed') ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileCheck className="w-3.5 h-3.5" /> {enq.agreementStatus}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> {enq.agreementStatus}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition">
                    Send Service Agreement
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition flex items-center gap-1">
                    View Proposal <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
