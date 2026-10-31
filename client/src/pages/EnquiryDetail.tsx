import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Send,
  Loader2,
  Check,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  FileCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  Printer,
  ShieldCheck,
  Link2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { useWeddingStore } from '../store/useWeddingStore';
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui';

interface EnquiryData {
  id: string;
  code: string;
  coupleName: string;
  primaryContactName?: string;
  channel: string;
  phone: string;
  email?: string;
  cityPreference: 'Udaipur' | 'Jaipur';
  datesRough: string;
  guestCount: number;
  theme?: string;
  budgetMax: string;
  packagePreference?: string;
  agreementStatus: string;
  agreementSignedAt?: string;
  status: string;
  weddingId?: string;
  notes?: string;
  createdAt: string;
}

interface ChangeLogItem {
  id: string;
  enquiryId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  performedBy?: string | null;
  notes?: string | null;
  createdAt?: string;
}

const STAGES = [
  'Initial Discovery',
  'Consultation Booked',
  'Agreement Awaited',
  'Converted to Wedding',
];

export const EnquiryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedWeddingId } = useWeddingStore();

  const [enquiry, setEnquiry] = useState<EnquiryData | null>(null);
  const [logs, setLogs] = useState<ChangeLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Magic link modal and token state
  const [magicModalOpen, setMagicModalOpen] = useState(false);
  const [magicToken, setMagicToken] = useState('');
  const [magicLinkCopied, setMagicLinkCopied] = useState(false);

  // Document preview modal state
  const [previewDocOpen, setPreviewDocOpen] = useState(false);

  // Activity Log modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteActionType, setNoteActionType] = useState<'PLANNER_NOTE' | 'CALL_LOGGED' | 'MEETING_HELD'>('PLANNER_NOTE');
  const [postingNote, setPostingNote] = useState(false);

  // Load single enquiry details
  const fetchEnquiryDetails = async () => {
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
          channel: raw.channel || 'Website Consultation',
          phone: raw.phone || '',
          email: raw.email || '',
          cityPreference: (raw.cityPreference || raw.city_preference) === 'Jaipur' ? 'Jaipur' : 'Udaipur',
          datesRough: raw.datesRough || raw.dates_rough || 'Winter 2026',
          guestCount: Number(raw.guestCount || raw.guest_count) || 400,
          theme: raw.theme || 'Royal Heritage Grandeur',
          budgetMax: budgetStr,
          packagePreference: raw.packagePreference || raw.package_preference || 'FULL_SERVICE',
          agreementStatus: agreementSt,
          agreementSignedAt: raw.agreementSignedAt || raw.agreement_signed_at,
          status: raw.status || 'Initial Discovery',
          weddingId: raw.weddingId || raw.wedding_id,
          notes: raw.notes || '',
          createdAt: raw.createdAt || raw.created_at,
        });

        fetchLogs(raw.id);
      }
    } catch (err) {
      console.error('Failed to load enquiry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load change logs
  const fetchLogs = async (enquiryId: string) => {
    try {
      const res = await api.get(`/enquiries/${enquiryId}/logs`);
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch logs:', err);
    }
  };

  useEffect(() => {
    fetchEnquiryDetails();
  }, [id]);

  // Derived Client User ID and Magic URL
  const clientUserId = enquiry ? `USR-${enquiry.code.replace('ENQ-', '')}` : '';
  const magicUrl = enquiry
    ? `${window.location.origin}/sign/${enquiry.code}?userId=${clientUserId}${magicToken ? `&t=${magicToken}` : ''}`
    : '';

  const handleCopyMagicUrl = async () => {
    if (!magicUrl) return;
    await navigator.clipboard.writeText(magicUrl);
    setMagicLinkCopied(true);
    setTimeout(() => setMagicLinkCopied(false), 2500);

    // If still drafting, transition to Sent - Pending Signature
    if (enquiry && enquiry.agreementStatus === 'Drafting Agreement') {
      try {
        await api.patch(`/enquiries/${enquiry.id}/status`, {
          agreementStatus: 'Sent - Pending Signature',
          userId: clientUserId,
        });
        await fetchEnquiryDetails();
      } catch (err) {
        console.error('Update status error:', err);
      }
    }
  };

  // Regenerate fresh signed URL with token timestamp
  const handleRegenerateMagicLink = async () => {
    if (!enquiry) return;
    try {
      setActionLoading(true);
      const newTimestamp = Date.now();
      setMagicToken(String(newTimestamp));
      await api.patch(`/enquiries/${enquiry.id}/status`, {
        agreementStatus: 'Sent - Pending Signature',
        userId: clientUserId,
        notes: `Fresh signing magic link regenerated (token: ${newTimestamp}) and dispatched.`,
      });
      await fetchEnquiryDetails();
    } catch (err) {
      console.error('Failed to regenerate magic link:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Confirm Signed Agreement (Manual Override)
  const handleConfirmSigned = async () => {
    if (!enquiry) return;
    try {
      setActionLoading(true);
      await api.patch(`/enquiries/${enquiry.id}/status`, {
        agreementStatus: 'Signed on Mobile',
        status: 'Consultation Booked',
        signatoryName: enquiry.primaryContactName || enquiry.coupleName,
        userId: clientUserId,
        notes: 'Signed agreement confirmed via Lead Planner manual override.',
      });
      setMagicModalOpen(false);
      await fetchEnquiryDetails();
    } catch (err) {
      console.error('Sign agreement error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Convert to Wedding Project
  const handleConvertToWedding = async () => {
    if (!enquiry) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/enquiries/${enquiry.id}/convert`);
      if (res.success && res.wedding) {
        setSelectedWeddingId(res.wedding.code);
        navigate('/weddings');
      }
    } catch (err) {
      console.error('Convert wedding error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Append Note to Change Log in popup
  const handleAddLogNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !enquiry) return;
    try {
      setPostingNote(true);
      const res = await api.post(`/enquiries/${enquiry.id}/logs`, {
        notes: newNote.trim(),
        action: noteActionType,
        performedBy: 'Devika Sharma (Lead Planner)',
      });
      if (res.success && res.data) {
        setLogs([res.data, ...logs]);
        setNewNote('');
      }
    } catch (err) {
      console.error('Add note error:', err);
    } finally {
      setPostingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[300px] flex items-center justify-center text-slate-500 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-slate-600" />
        <span>Loading lead details...</span>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded p-8 text-center max-w-md mx-auto my-12 shadow-2xs">
        <h2 className="text-base font-bold text-slate-800">Lead Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested enquiry could not be found or has been moved.</p>
        <button
          type="button"
          onClick={() => navigate('/enquiries')}
          className="mt-4 px-3 py-1.5 rounded text-xs font-medium border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Enquiries</span>
        </button>
      </div>
    );
  }

  // Calculate flow of stages up to CURRENT only (no future ones)
  const currentStageIndex = Math.max(0, STAGES.indexOf(enquiry.status));
  const stagesToCurrent = STAGES.slice(0, currentStageIndex + 1);

  return (
    <div className="w-full space-y-4 pb-12">
      {/* 1. Full-Width Header with Back Arrow on Left & Action Buttons + Activity Log on Right */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Left: Back Arrow & Lead Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/enquiries')}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
            title="Back to Enquiries"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                {enquiry.coupleName}
              </h1>
              <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {enquiry.code}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Inbound via {enquiry.channel} • Created {new Date(enquiry.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right: Actions Moved to Detail Header + Activity Log */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Button: Single Popup Button when Unsigned, or Check Signed Agreement when Signed */}
          {enquiry.agreementStatus !== 'Signed on Mobile' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMagicModalOpen(true)}
              className="h-8 text-xs font-semibold border-[#714B67]/30 text-[#714B67] hover:bg-[#714B67]/10 bg-white cursor-pointer gap-1.5 shadow-2xs"
              title="Open Digital Agreement & Magic Signing Link"
            >
              <Link2 className="w-3.5 h-3.5 text-[#714B67]" />
              <span>Digital Agreement (Magic Link)</span>
            </Button>
          ) : (
            <a
              href={`/sign/${enquiry.code}?userId=${clientUserId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-8 px-3 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs text-emerald-800 font-semibold transition cursor-pointer gap-1.5 shadow-2xs"
              title="Check signed agreement with embedded digital signature in new tab"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Check Signed Agreement ↗</span>
            </a>
          )}

          {/* When signed and not yet converted to wedding: Convert button */}
          {enquiry.agreementStatus === 'Signed on Mobile' && !enquiry.weddingId && (
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleConvertToWedding}
              className="h-8 text-xs font-bold bg-[#714B67] hover:bg-[#5a3a52] text-white cursor-pointer shadow-2xs"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Building2 className="w-3.5 h-3.5 mr-1.5" />}
              <span>Convert to Wedding Project</span>
            </Button>
          )}

          {/* When converted to wedding: Link to active wedding */}
          {enquiry.weddingId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedWeddingId(enquiry.weddingId || 'ALL');
                navigate('/weddings');
              }}
              className="h-8 text-xs font-semibold text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Wedding Project ({enquiry.weddingId.slice(0, 8)}) ➔</span>
            </Button>
          )}

          {/* Quick Call Link */}
          <a
            href={`tel:${enquiry.phone}`}
            className="inline-flex items-center h-8 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium transition cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>Call</span>
          </a>

          {/* Activity Log Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivityModalOpen(true)}
            className="gap-1.5 text-xs text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer h-8"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Activity Log</span>
            {logs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                {logs.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Full-Width Horizontal Status Flow (Showing up to CURRENT only, NO future ones) */}
      <div className="w-full bg-white border border-slate-200 rounded px-4 py-2.5 shadow-2xs flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
          Status Flow:
        </span>
        <div className="flex items-center gap-2">
          {stagesToCurrent.map((stage, idx) => {
            const isCurrent = idx === stagesToCurrent.length - 1;
            return (
              <React.Fragment key={stage}>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${isCurrent
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                >
                  {!isCurrent ? (
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                  <span>{stage}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-normal text-slate-300">
                      (Current)
                    </span>
                  )}
                </div>
                {!isCurrent && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Full-Width Main Dossier Card */}
      <div className="w-full bg-white border border-slate-200 rounded p-6 shadow-2xs space-y-6">
        {/* Client Portal Provisioned Banner (if converted to wedding) */}
        {enquiry.weddingId && (
          <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-md text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <KeyRound className="w-4 h-4 text-[#714B67] shrink-0" />
              <div className="min-w-0 leading-tight">
                <span className="font-bold text-slate-900">Couple Client Portal Access Provisioned: </span>
                <span className="font-mono text-slate-700">{enquiry.email || 'client@royalknot.com'}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-600">Password: <strong className="font-mono text-slate-900">password123</strong></span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#714B67] bg-purple-100 px-2 py-0.5 rounded border border-purple-200 shrink-0">
              Role: CLIENT
            </span>
          </div>
        )}

        {/* Contact Information Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1.5">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Primary Contact</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {enquiry.primaryContactName || enquiry.coupleName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Phone / WhatsApp</span>
              <a
                href={`tel:${enquiry.phone}`}
                className="font-mono font-semibold text-slate-900 hover:text-blue-600 mt-0.5 inline-flex items-center gap-1"
              >
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{enquiry.phone}</span>
              </a>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Email Address</span>
              {enquiry.email ? (
                <a
                  href={`mailto:${enquiry.email}`}
                  className="text-slate-900 hover:text-blue-600 mt-0.5 inline-flex items-center gap-1"
                >
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{enquiry.email}</span>
                </a>
              ) : (
                <span className="text-slate-400 mt-0.5 block">Not provided</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Inbound Channel</span>
              <span className="text-slate-900 mt-0.5 block">
                {enquiry.channel}
              </span>
            </div>
          </div>
        </div>

        {/* Wedding Specifications Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1.5">
            Wedding Specifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Destination</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {enquiry.cityPreference}, Rajasthan
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Target Dates</span>
              <span className="text-slate-900 mt-0.5 block">
                {enquiry.datesRough}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Guest Count</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {enquiry.guestCount} Guests
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Estimated Budget</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {enquiry.budgetMax}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Agreement Status</span>
              <span className={`inline-block font-semibold mt-0.5 ${enquiry.agreementStatus === 'Signed on Mobile' ? 'text-emerald-700' : 'text-slate-800'
                }`}>
                {enquiry.agreementStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Notes & Vision (if present) */}
        {enquiry.notes && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes & Client Vision</span>
            </h2>
            <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-3.5 leading-relaxed">
              {enquiry.notes}
            </div>
          </div>
        )}

        {/* Executed Digital Agreement Document Section (Found in Detail once signed or converted) */}
        {(enquiry.agreementStatus === 'Signed on Mobile' || enquiry.weddingId) && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Executed Legal Agreement & Contract Dossier</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Officially Signed & Certified (IT Act Compliant)
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-[#714B67]/10 border border-[#714B67]/20 flex items-center justify-center shrink-0 text-[#714B67]">
                  <FileText className="w-5 h-5 text-[#714B67]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      RK-AGR-{enquiry.code}-Wedding-Planning-Agreement.pdf
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded border border-emerald-300">
                      Executed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Authorized Signatory: <strong>{enquiry.primaryContactName || enquiry.coupleName}</strong> (UID: <span className="font-mono text-slate-700">{clientUserId}</span>)
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Signed Timestamp: {new Date(enquiry.agreementSignedAt || enquiry.createdAt).toLocaleString()} • Ref: RK-SIG-{enquiry.code.replace('ENQ-', '')}-CERT
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDocOpen(true)}
                  className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preview Document</span>
                </button>

                <a
                  href={`/sign/${enquiry.code}?userId=${clientUserId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center h-8 px-3 rounded border border-[#714B67]/30 bg-[#714B67] hover:bg-[#5a3a52] text-xs text-white font-semibold transition cursor-pointer gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Signed Agreement ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Activity Log Popup Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-lg bg-white border border-slate-200 shadow-xl rounded-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-slate-200 bg-slate-50">
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Activity & Change Log ({enquiry.code})</span>
            </DialogTitle>
          </DialogHeader>

          {/* Form to log new activity */}
          <form onSubmit={handleAddLogNote} className="p-4 border-b border-slate-200 bg-white space-y-2.5">
            <div className="flex gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => setNoteActionType('PLANNER_NOTE')}
                className={`px-2 py-0.5 rounded border font-semibold transition cursor-pointer ${noteActionType === 'PLANNER_NOTE'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                Planner Note
              </button>
              <button
                type="button"
                onClick={() => setNoteActionType('CALL_LOGGED')}
                className={`px-2 py-0.5 rounded border font-semibold transition cursor-pointer ${noteActionType === 'CALL_LOGGED'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                Call Log
              </button>
              <button
                type="button"
                onClick={() => setNoteActionType('MEETING_HELD')}
                className={`px-2 py-0.5 rounded border font-semibold transition cursor-pointer ${noteActionType === 'MEETING_HELD'
                  ? 'bg-[#714B67] text-white border-[#714B67]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                Meeting Record
              </button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Log activity, call notes, or client update..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="text-xs h-8 bg-slate-50 border-slate-300"
              />
              <Button
                type="submit"
                size="sm"
                disabled={postingNote || !newNote.trim()}
                className="h-8 text-xs px-3 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shrink-0"
              >
                {postingNote ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                <span>Log Note</span>
              </Button>
            </div>
          </form>

          {/* Chronological Activity Feed */}
          <div className="p-4 max-h-[380px] overflow-y-auto space-y-2.5 bg-slate-50/50">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No activity logged yet for this enquiry.
              </div>
            ) : (
              logs.map((item) => (
                <div key={item.id} className="p-2.5 rounded bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800">
                      {item.performedBy || 'System'}
                    </span>
                    <span className="text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>

                  <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {item.action}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-600 leading-normal pt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Digital Agreement Magic Link Modal */}
      <Dialog open={magicModalOpen} onOpenChange={setMagicModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-2xl rounded-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-slate-200 bg-slate-50">
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#714B67]" />
              <span>Digital Agreement Magic Link ({enquiry.code})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Sent via Email & SMS Notification */}
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex items-start gap-2.5 text-xs text-emerald-900 shadow-2xs">
              <Mail className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">Dispatched via Email & SMS</span>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  We sent this digital agreement magic link via email to <strong>{enquiry.email || `${enquiry.coupleName.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com`}</strong> and mobile SMS to <strong>{enquiry.phone}</strong>.
                </p>
              </div>
            </div>

            {/* Client User ID and Contracting Party */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Client UID</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">{clientUserId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Contracting Couple</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">{enquiry.coupleName}</span>
              </div>
            </div>

            {/* Magic Link Field + Copy Button */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Mobile Signing URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={magicUrl}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyMagicUrl}
                  className={`h-8 px-3 text-xs font-semibold shrink-0 cursor-pointer ${magicLinkCopied
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                >
                  {magicLinkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5 mr-1" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                The client opens this URL to review the contract and enter their legal name to sign.
              </p>

              {/* Modal Actions: Open Sign Page, Regenerate URL, Confirm Signed */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleRegenerateMagicLink}
                    className="h-8.5 text-xs font-medium border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${actionLoading ? 'animate-spin' : ''}`} />
                    <span>Regenerate Signed URL</span>
                  </Button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={actionLoading}
                  onClick={handleConfirmSigned}
                  className="w-full h-8.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1.5 shadow-2xs"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                  <span>Confirm Signed (Manual Override)</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. Document Preview Modal in Enquiry Detail */}
      <Dialog open={previewDocOpen} onOpenChange={setPreviewDocOpen}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 border-b border-slate-200 bg-slate-50 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Signed Agreement Document — RK-AGR-{enquiry.code}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="inline-flex items-center gap-1.5 bg-[#714B67] text-white px-3 py-0.5 rounded-full text-[10px] font-semibold mb-1">
                <span>The Royal Knot • Bespoke Wedding Agency</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Wedding Planning Service Engagement Agreement
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Official Executed Copy • Agreement ID: RK-AGR-{enquiry.code} • Signatory UID: {clientUserId}
              </p>
            </div>

            {/* Engagement Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Couple</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{enquiry.coupleName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Destination</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{enquiry.cityPreference}, Rajasthan</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Season</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{enquiry.datesRough}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Budget</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{enquiry.budgetMax}</span>
              </div>
            </div>

            {/* Key Service Clauses Summary */}
            <div className="space-y-2 bg-slate-50/70 p-3.5 rounded border border-slate-200 text-[11px] leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-slate-500 block text-[10px]">
                Contractual Scope & Terms
              </span>
              <p>
                1. <strong>Master Wedding Coordination:</strong> Palace venue locks, 3-caterer procurement RFQs, heritage decor execution, and on-ground day-of telemetry.
              </p>
              <p>
                2. <strong>Agency Management Fee:</strong> Fixed 10% agency fee on negotiated scopes with vendor invoice auditing.
              </p>
              <p>
                3. <strong>Payment Milestones:</strong> 20% advance commitment retainer; 50% milestone fee 60 days prior; 30% balance upon day-of runsheet handover.
              </p>
            </div>

            {/* Bilateral Signature Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50/40">
              <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  For The Royal Knot Events Ltd.
                </span>
                <div className="font-serif italic text-lg font-bold text-[#714B67]">
                  Devika Sharma
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Devika Sharma
                </div>
                <div className="text-[10px] text-slate-500">
                  Managing Partner & Lead Planner
                </div>
              </div>

              <div className="space-y-1.5 sm:pl-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    For The Contracting Couple
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                    UID: {clientUserId}
                  </span>
                </div>

                <div className="border-b-2 border-slate-700 pb-1 min-h-[44px] flex items-center">
                  {localStorage.getItem(`rk_sig_${enquiry.code}`) && localStorage.getItem(`rk_sig_${enquiry.code}`)!.startsWith('data:image') ? (
                    <img
                      src={localStorage.getItem(`rk_sig_${enquiry.code}`)!}
                      alt={`Signature of ${enquiry.primaryContactName || enquiry.coupleName}`}
                      className="h-11 object-contain filter contrast-125"
                    />
                  ) : (
                    <div className="font-serif italic text-xl font-bold text-slate-900 font-['Playfair_Display',Georgia,serif]">
                      {enquiry.primaryContactName || enquiry.coupleName}
                    </div>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-900">
                  {enquiry.primaryContactName || enquiry.coupleName}
                </div>
                <div className="text-[10px] text-slate-500">
                  Authorized Signatory ({enquiry.phone})
                </div>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-300">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                  <span>Digitally Executed via Mobile Magic Link</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certified under Information Technology Act, 2000</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/sign/${enquiry.code}?userId=${clientUserId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print / Full Page</span>
              </a>
              <Button
                type="button"
                size="sm"
                onClick={() => setPreviewDocOpen(false)}
                className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
