import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  ShieldCheck,
  Loader2,
  Crown,
} from 'lucide-react';
import { api } from '../api/client';
import {
  Button,
  Badge,
  Input,
  Label,
} from '../components/ui';

interface EnquiryData {
  id: string;
  code: string;
  coupleName: string;
  primaryContactName?: string;
  phone: string;
  email?: string;
  cityPreference: 'Udaipur' | 'Jaipur';
  datesRough: string;
  guestCount: number;
  budgetMax: string;
  agreementStatus: string;
  agreementSignedAt?: string;
  status: string;
  weddingId?: string;
  createdAt: string;
}

export const SignAgreement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState<EnquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatoryName, setSignatoryName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const fetchEnquiry = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/enquiries/${id}`);
      if (res.success && res.data) {
        const raw = res.data;
        const budgetRaw = raw.budgetMax || raw.budget_max;
        let budgetStr = '₹2.50 Cr';
        if (budgetRaw) {
          const cr = Number(budgetRaw) / 10000000;
          budgetStr = `₹${cr.toFixed(2)} Cr`;
        }

        const rawAgreement = raw.agreementStatus || raw.agreement_status || 'Drafting Agreement';
        let agreementSt = 'Drafting Agreement';
        if (String(rawAgreement).includes('Signed')) agreementSt = 'Signed on Mobile';
        else if (String(rawAgreement).includes('Sent')) agreementSt = 'Sent - Pending Signature';

        setEnquiry({
          id: raw.id,
          code: raw.code || `ENQ-${String(raw.id).slice(0, 8)}`,
          coupleName: raw.coupleName || raw.couple_name || 'Couple Consultation',
          primaryContactName: raw.primaryContactName || raw.primary_contact_name,
          phone: raw.phone || '',
          email: raw.email || '',
          cityPreference: (raw.cityPreference || raw.city_preference) === 'Jaipur' ? 'Jaipur' : 'Udaipur',
          datesRough: raw.datesRough || raw.dates_rough || 'Winter 2026',
          guestCount: Number(raw.guestCount || raw.guest_count) || 400,
          budgetMax: budgetStr,
          agreementStatus: agreementSt,
          agreementSignedAt: raw.agreementSignedAt || raw.agreement_signed_at,
          status: raw.status || 'Initial Discovery',
          weddingId: raw.weddingId || raw.wedding_id,
          createdAt: raw.createdAt || raw.created_at,
        });

        setSignatoryName(raw.primaryContactName || raw.coupleName || '');
        if (agreementSt === 'Signed on Mobile') {
          setSignedSuccess(true);
        }
      }
    } catch (err) {
      console.error('Failed to load enquiry for signing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiry();
  }, [id]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiry || !termsAccepted || !signatoryName.trim()) return;

    try {
      setSigning(true);
      const res = await api.patch(`/enquiries/${enquiry.id}/status`, {
        agreementStatus: 'Signed on Mobile',
        status: 'Consultation Booked',
        notes: `Signed digitally via mobile magic link by ${signatoryName.trim()}.`,
      });

      if (res.success) {
        setSignedSuccess(true);
        setEnquiry((prev) => prev ? { ...prev, agreementStatus: 'Signed on Mobile' } : null);
      }
    } catch (err) {
      console.error('Signing error:', err);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-[#714B67]" />
          <span>Loading Royal Knot Digital Agreement...</span>
        </div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md text-center shadow-md">
          <Crown className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h1 className="text-base font-bold text-slate-900">Agreement Not Found</h1>
          <p className="text-xs text-slate-500 mt-1">This signing link may be invalid or expired.</p>
          <Button onClick={() => navigate('/')} className="mt-4 text-xs bg-slate-900">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#714B67] text-white px-3.5 py-1 rounded-full text-xs font-semibold shadow-xs">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>The Royal Knot • Bespoke Wedding Agency</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
            Digital Wedding Planning Service Agreement
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Agreement Document ID: RK-AGR-{enquiry.code}
          </p>
        </div>

        {/* The Digital Contract Sheet */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
          {/* Document Parties & Summary */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Client Specification
              </span>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                {enquiry.code}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Contracting Couple</span>
                <span className="font-bold text-slate-900 text-sm">{enquiry.coupleName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Contact</span>
                <span className="font-semibold text-slate-900">{enquiry.primaryContactName || enquiry.coupleName} ({enquiry.phone})</span>
              </div>
            </div>
          </div>

          {/* Key Engagement Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>Destination</span>
              </span>
              <span className="font-bold text-slate-900 mt-0.5 block">{enquiry.cityPreference}, Rajasthan</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Target Season</span>
              </span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{enquiry.datesRough}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-500" />
                <span>Guest Count</span>
              </span>
              <span className="font-bold text-slate-900 mt-0.5 block">{enquiry.guestCount} Guests</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-500" />
                <span>Est. Budget</span>
              </span>
              <span className="font-bold text-slate-900 mt-0.5 block">{enquiry.budgetMax}</span>
            </div>
          </div>

          {/* Service Agreement Clauses */}
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Terms of Royal Engagement
            </h3>

            <div className="space-y-2.5 bg-slate-50/70 border border-slate-200 rounded p-4 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-[20px]">1.</span>
                <p>
                  <strong>Scope of Full-Service Planning:</strong> The Royal Knot shall act as the master wedding planning agency, overseeing palace venue contracts, curated 3-caterer procurement RFQs, floral and heritage decor execution, and on-ground minute-by-minute day-of telemetry.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-[20px]">2.</span>
                <p>
                  <strong>Agency Management Fee:</strong> A fixed 10% agency coordination fee is applied to all negotiated vendor scopes, including multi-venue booking governance and vendor invoice auditing.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-[20px]">3.</span>
                <p>
                  <strong>Payment Milestones:</strong> 20% advance commitment retainer upon digital agreement execution; 50% milestone fee 60 days prior to event; 30% final balance upon day-of master runsheet handover.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-[20px]">4.</span>
                <p>
                  <strong>Client Portal Provisioning:</strong> Upon signing and project conversion, the couple shall be provisioned dedicated credentials to the Royal Knot Client Portal for vendor quote sign-offs and guest approvals.
                </p>
              </div>
            </div>
          </div>

          {/* E-Signature Section */}
          <div className="border-t border-slate-200 pt-5">
            {signedSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center space-y-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Agreement Digitally Signed & Validated
                </h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Thank you, <strong>{enquiry.coupleName}</strong>. Your royal destination wedding agreement has been securely executed on mobile. Your lead planner Devika Sharma will initiate venue locks immediately.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    size="sm"
                    className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  >
                    Return to Homepage
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSign} className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <Label htmlFor="signatory" className="text-xs font-bold text-slate-800">
                    Signatory Full Name
                  </Label>
                  <Input
                    id="signatory"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    required
                    placeholder="Enter full name of Bride / Groom"
                    className="bg-white text-xs h-9 border-slate-300"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="mt-0.5 rounded border-slate-300 text-[#714B67] focus:ring-[#714B67] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-700 cursor-pointer select-none">
                    I / We confirm that we have reviewed the wedding terms, agency fee schedule, and destination parameters, and hereby digitally execute this agreement.
                  </label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={signing || !termsAccepted || !signatoryName.trim()}
                    className="w-full bg-[#714B67] hover:bg-[#5a3a52] text-white text-xs font-bold h-10 shadow-xs cursor-pointer gap-2"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Digitally Signing Agreement...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>Sign & Confirm Royal Knot Agreement on Mobile</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>256-Bit Encrypted Mobile Digital Contract • Information Technology Act Compliant</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
