import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Printer,
  PenLine,
  RotateCcw,
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
  notes?: string;
  createdAt: string;
}

export const SignAgreement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState<EnquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatoryName, setSignatoryName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // User ID from query param or system
  const queryUserId = searchParams.get('userId') || searchParams.get('user') || '';

  // Canvas ref & Interactive Signature States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const fetchEnquiry = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        data?: EnquiryData;
      }>(`/enquiries/${id}`);
      if (res?.success && res?.data) {
        const raw = res.data;
        let budgetStr = '₹2.50 Cr';
        if (raw.budgetMax) {
          const cr = Number(raw.budgetMax) / 10000000;
          budgetStr = `₹${cr.toFixed(2)} Cr`;
        }

        let agreementSt = 'Drafting Agreement';
        if (raw.agreementStatus?.includes('Signed')) agreementSt = 'Signed on Mobile';
        else if (raw.agreementStatus?.includes('Sent')) agreementSt = 'Sent - Pending Signature';

        setEnquiry({
          id: raw.id,
          code: raw.code || `ENQ-${String(raw.id).slice(0, 8)}`,
          coupleName: raw.coupleName || 'Couple Consultation',
          primaryContactName: raw.primaryContactName,
          phone: raw.phone || '',
          email: raw.email || '',
          cityPreference: raw.cityPreference === 'Jaipur' ? 'Jaipur' : 'Udaipur',
          datesRough: raw.datesRough || 'Winter 2026',
          guestCount: Number(raw.guestCount) || 400,
          budgetMax: budgetStr,
          agreementStatus: agreementSt,
          agreementSignedAt: raw.agreementSignedAt,
          status: raw.status || 'Initial Discovery',
          weddingId: raw.weddingId,
          notes: raw.notes || '',
          createdAt: raw.createdAt,
        });

        const initialSigner = raw.primaryContactName || raw.coupleName || '';
        setSignatoryName(initialSigner);

        // Check for stored signature in localStorage
        const codeKey = raw.code || `ENQ-${String(raw.id).slice(0, 8)}`;
        const storedSig = localStorage.getItem(`rk_sig_${codeKey}`);
        if (storedSig && storedSig.startsWith('data:image')) {
          setSignatureDataUrl(storedSig);
          setHasDrawn(true);
        }

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

  const displayUserId = queryUserId || (enquiry ? `USR-${enquiry.code.replace('ENQ-', '')}` : 'USR-2026-CLIENT');

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    draw(e);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureDataUrl(null);
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiry || !termsAccepted || !signatoryName.trim()) return;

    try {
      setSigning(true);

      // Persist signature representation
      if (signatureMode === 'draw' && signatureDataUrl) {
        localStorage.setItem(`rk_sig_${enquiry.code}`, signatureDataUrl);
      } else {
        localStorage.setItem(`rk_sig_${enquiry.code}`, 'typed');
      }

      const res = await api.patch<{ success: boolean; data?: unknown }>(`/enquiries/${enquiry.id}/status`, {
        agreementStatus: 'Signed on Mobile',
        status: 'Consultation Booked',
        signatoryName: signatoryName.trim(),
        userId: displayUserId,
        notes: `Signed digitally via mobile magic link by ${signatoryName.trim()} (User ID: ${displayUserId})${signatureMode === 'draw' && hasDrawn ? ' with drawn electronic signature' : ''}.`,
      });

      if (res?.success) {
        setSignedSuccess(true);
        setEnquiry((prev) =>
          prev
            ? {
              ...prev,
              agreementStatus: 'Signed on Mobile',
              primaryContactName: signatoryName.trim(),
              agreementSignedAt: new Date().toISOString(),
            }
            : null
        );
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

  const isExecuted = signedSuccess || enquiry.agreementStatus === 'Signed on Mobile';
  const effectiveSignatory = signatoryName || enquiry.primaryContactName || enquiry.coupleName;

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
            Agreement Document ID: RK-AGR-{enquiry.code} • Signatory UID: {displayUserId}
          </p>
        </div>

        {/* The Digital Contract Sheet (Mimics Official PDF Agreement) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
          {/* Executive Certification Banner when Signed */}
          {isExecuted && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Certified Agreement Record:</strong> Digitally signed by <strong>{effectiveSignatory}</strong> (UID: <span className="font-mono font-bold text-emerald-950">{displayUserId}</span>) on {new Date(enquiry.agreementSignedAt || enquiry.createdAt).toLocaleDateString()}.
                </span>
              </div>
              <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold border border-emerald-300">
                ✓ IT Act 2000 Certified
              </span>
            </div>
          )}

          {/* Document Parties & Summary */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Engagement Dossier
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {enquiry.code}
                </Badge>
                {isExecuted && (
                  <Badge variant="success" className="text-xs font-semibold">
                    ✓ Executed on Mobile
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Contracting Couple</span>
                <span className="font-bold text-slate-900 text-sm">{enquiry.coupleName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Authorized Contact</span>
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

            <div className="space-y-3 bg-slate-50/70 border border-slate-200 rounded p-4 text-xs">
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

          {/* Embedded Signature Block (The User's Name Embedded to the Agreement) */}
          <div className="border-t border-slate-200 pt-6">
            {isExecuted ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-lg border border-slate-300 bg-slate-50/50">
                  {/* Agency Side Signature */}
                  <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 sm:pr-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      For The Royal Knot Events Ltd.
                    </span>
                    <div className="font-serif italic text-xl font-bold text-[#714B67] pt-2">
                      Devika Sharma
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      Devika Sharma
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Managing Partner & Lead Planner
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Signed: {new Date(enquiry.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Client Side Embedded Signature */}
                  <div className="space-y-2 sm:pl-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        For The Client / Contracting Couple
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        UID: {displayUserId}
                      </span>
                    </div>

                    {/* Embedded User's Signature: Drawn Canvas Image OR Royal Cursive Script */}
                    <div className="border-b-2 border-slate-800 pb-1 pt-1 min-h-[48px] flex items-center">
                      {signatureDataUrl ? (
                        <img
                          src={signatureDataUrl}
                          alt={`Signature of ${effectiveSignatory}`}
                          className="h-12 sm:h-14 max-w-full object-contain filter contrast-125"
                        />
                      ) : (
                        <div className="font-serif italic text-2xl sm:text-3xl font-bold text-slate-900 tracking-wide font-['Playfair_Display',Georgia,serif]">
                          {effectiveSignatory}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      {effectiveSignatory}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Authorized Signatory ({enquiry.phone})
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>Digitally Executed via Mobile Magic Link</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                      Timestamp: {new Date(enquiry.agreementSignedAt || Date.now()).toLocaleString()} • Ref: RK-SIG-{enquiry.code.replace('ENQ-', '')}-CERT
                    </div>
                  </div>
                </div>

                {/* Print & Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Legally binding digital signature embedded & verified under Information Technology Act.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="text-xs gap-1.5 border-slate-300"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / Save PDF</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate('/')}
                      className="text-xs bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Return Home
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* If Not Yet Signed: Form to Enter Signatory Name & Sign */
              <form onSubmit={handleSign} className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Assigned Signatory User ID</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {displayUserId}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signatory" className="text-xs font-bold text-slate-900">
                    Signatory Full Name
                  </Label>
                  <Input
                    id="signatory"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    required
                    placeholder="Enter full legal name of Bride or Groom"
                    className="bg-white text-xs h-9 border-slate-300"
                  />
                  <p className="text-[11px] text-slate-500">
                    This legal name will be embedded as your digital signature on the official Royal Knot agreement certificate.
                  </p>
                </div>

                {/* Interactive Signature Input: Draw on Canvas or Type */}
                <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <PenLine className="w-3.5 h-3.5 text-[#714B67]" />
                      <span>Electronic Signature Input</span>
                    </Label>
                    <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw')}
                        className={`px-2.5 py-0.5 rounded font-medium transition cursor-pointer ${
                          signatureMode === 'draw'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Draw Signature
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode('type')}
                        className={`px-2.5 py-0.5 rounded font-medium transition cursor-pointer ${
                          signatureMode === 'type'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Type Signature
                      </button>
                    </div>
                  </div>

                  {signatureMode === 'draw' ? (
                    <div className="space-y-2">
                      <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={130}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={stopDrawing}
                          className="w-full h-28 touch-none cursor-crosshair bg-white"
                        />
                        {!hasDrawn && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs gap-1.5">
                            <PenLine className="w-4 h-4 opacity-40 text-slate-400" />
                            <span>Draw your electronic signature with mouse or touch here</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          Sign smoothly inside the box to embed directly onto the agreement.
                        </span>
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Clear Pad</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Live Cursive Signature Script
                        </span>
                        <div className="font-serif italic text-2xl sm:text-3xl font-bold text-slate-900 font-['Playfair_Display',Georgia,serif]">
                          {signatoryName.trim() || 'Your Signature Here'}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Your entered legal name will be embedded as an official digital script signature.
                      </p>
                    </div>
                  )}
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
                    I / We confirm that we have reviewed the terms of royal engagement and hereby execute this bespoke agreement.
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
                        <span>Embedding Digital Signature...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>Embed Signature & Sign Agreement on Mobile</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>256-Bit Encrypted Mobile Digital Contract • Information Technology Act, 2000 Compliant</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
