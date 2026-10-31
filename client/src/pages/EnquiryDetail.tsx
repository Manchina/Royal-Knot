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

  // Action: Confirm Signed Agreement
  const handleSignAgreement = async () => {
    if (!enquiry) return;
    try {
      setActionLoading(true);
      await api.patch(`/enquiries/${enquiry.id}/status`, {
        agreementStatus: 'Signed on Mobile',
        status: 'Consultation Booked',
      });
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
          {/* Action Button depending on status */}
          {enquiry.agreementStatus !== 'Signed on Mobile' ? (
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleSignAgreement}
              className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <FileCheck className="w-3.5 h-3.5 mr-1.5" />}
              <span>Confirm Signed Agreement</span>
            </Button>
          ) : !enquiry.weddingId ? (
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={handleConvertToWedding}
              className="h-8 text-xs font-bold bg-[#714B67] hover:bg-[#5a3a52] text-white cursor-pointer shadow-2xs"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Building2 className="w-3.5 h-3.5 mr-1.5" />}
              <span>Convert to Wedding Project</span>
            </Button>
          ) : (
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${
                    isCurrent
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
              <span className={`inline-block font-semibold mt-0.5 ${
                enquiry.agreementStatus === 'Signed on Mobile' ? 'text-emerald-700' : 'text-slate-800'
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
                className={`px-2 py-0.5 rounded border font-semibold transition cursor-pointer ${
                  noteActionType === 'PLANNER_NOTE'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Planner Note
              </button>
              <button
                type="button"
                onClick={() => setNoteActionType('CALL_LOGGED')}
                className={`px-2 py-0.5 rounded border font-semibold transition cursor-pointer ${
                  noteActionType === 'CALL_LOGGED'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Call Log
              </button>
              <button
                type="button"
                onClick={() => setNoteActionType('MEETING_HELD')}
                className={`px-2 py-0.5 rounded border font-semibold transition cursor-pointer ${
                  noteActionType === 'MEETING_HELD'
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
    </div>
  );
};
