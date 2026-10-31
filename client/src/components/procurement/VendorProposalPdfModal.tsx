import React from 'react';
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
  CheckCircle2,
  Star,
  Building2,
  Calendar,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
  MapPin,
  Phone
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  Button,
  Badge,
} from '../ui';
import type { QuoteItem, WeddingOverviewItem } from './WeddingSourcingView';

interface VendorProposalPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteItem | null;
  currentWedding: WeddingOverviewItem | null;
  onSelectWinner?: (quoteId: string, vendorName: string, categoryTitle: string) => void;
  isClient?: boolean;
}

export const VendorProposalPdfModal: React.FC<VendorProposalPdfModalProps> = ({
  isOpen,
  onClose,
  quote,
  currentWedding,
  onSelectWinner,
  isClient = false,
}) => {
  if (!quote) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `
=====================================================
ROYAL KNOT WEDDING CONCIERGE - VENDOR PROPOSAL
=====================================================
Quotation Reference: ${quote.quoteReference || quote.id.slice(0, 8)}
Vendor: ${quote.businessName} (${quote.city})
Contact: ${quote.phone}
Rating: ${quote.rating} / 5.0

WEDDING DOSSIER:
Wedding Project: ${currentWedding?.code || 'N/A'}
Couple: ${currentWedding?.couple_name || 'N/A'}
Venue: ${currentWedding?.primary_venue || 'N/A'} (${currentWedding?.destination_city || 'N/A'})
Guest Count: ${currentWedding?.estimated_guest_count || 400} Guests
Event Date: ${currentWedding?.start_date || 'N/A'}

FINANCIAL TERMS:
Base Contract Package: ₹${Number(quote.baseCost).toLocaleString('en-IN')}
${quote.pricePerPlate ? `Rate Per Plate: ₹${Number(quote.pricePerPlate).toLocaleString('en-IN')} / guest\n` : ''}${quote.overtimeHourlyRate ? `Overtime Surcharge: ₹${Number(quote.overtimeHourlyRate).toLocaleString('en-IN')} / hour\n` : ''}
ITEMIZED MENU & DELIVERABLES:
${(quote.lineItems && quote.lineItems.length > 0)
  ? quote.lineItems.map((item, idx) => `${idx + 1}. ${item.item} - ₹${Number(item.cost).toLocaleString('en-IN')}`).join('\n')
  : 'Standard package scope included.'}

INCLUSIONS:
${quote.inclusions || 'Standard equipment, transport & setup supervision.'}

EXCLUSIONS:
${quote.exclusions || 'Municipal permits, utility surcharge.'}

Status: ${quote.status}
Verification: Verified by Royal Knot Luxury Weddings Concierge
=====================================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Proposal-${quote.quoteReference || quote.businessName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const guestCount = currentWedding?.estimated_guest_count || 400;
  const lineItems = quote.lineItems || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-100 p-0 overflow-hidden max-h-[92vh] flex flex-col rounded-lg shadow-2xl border border-slate-300">
        {/* Top Control Bar (Screen only) */}
        <div className="bg-[#714B67] text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
                  Vendor Proposal Sheet
                </span>
                <span className="text-white/40">•</span>
                <span className="font-mono text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-white">
                  {quote.quoteReference || quote.id.slice(0, 8)}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {quote.businessName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quote.pdfUrl && (
              <a
                href={quote.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded transition cursor-pointer font-medium"
                title="Open PDF document in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Original PDF</span>
              </a>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded transition cursor-pointer font-medium"
              title="Print proposal sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded transition cursor-pointer font-medium"
              title="Export quotation text"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas (Styled like luxury ivory paper) */}
        <div className="overflow-y-auto p-6 sm:p-8 bg-slate-200/70 flex-1">
          <div className="max-w-3xl mx-auto bg-white rounded shadow-sm border border-slate-200 p-8 sm:p-10 space-y-6 text-slate-800 print:p-0 print:border-none print:shadow-none">
            {/* 1. Proposal Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] tracking-widest uppercase font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ROYAL KNOT VERIFIED PARTNER
                  </span>
                  {quote.status === 'ACCEPTED' || quote.status === 'AWARDED' ? (
                    <Badge variant="success" className="text-[10px]">AWARDED WINNER</Badge>
                  ) : quote.status === 'AUTO_REJECTED' ? (
                    <Badge variant="secondary" className="text-[10px] text-slate-500">AUTO-CLOSED</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">UNDER EVALUATION</Badge>
                  )}
                </div>
                <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                  {quote.businessName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {quote.city}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-700">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    {quote.rating} / 5.0 Rated
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {quote.phone}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-0.5 text-xs">
                <p className="font-mono text-slate-400 text-[11px]">QUOTE REF NUMBER</p>
                <p className="font-mono font-bold text-[#714B67] text-sm">
                  {quote.quoteReference || quote.id.slice(0, 8)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Issued: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* 2. Client & Wedding Project Dossier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded border border-slate-200 p-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Wedding Celebration
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {currentWedding?.couple_name || 'Royal Couple'}
                </p>
                <p className="text-slate-600">
                  Project Code: <span className="font-mono font-semibold text-[#714B67]">{currentWedding?.code}</span>
                </p>
                <p className="text-slate-500">
                  Venue: {currentWedding?.primary_venue}, {currentWedding?.destination_city}
                </p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Event Parameters
                </span>
                <div className="flex items-center sm:justify-end gap-1.5 text-slate-800 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Headcount: <strong>{guestCount} Guests</strong></span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Wedding Date: {currentWedding?.start_date ? new Date(currentWedding.start_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Season 2026'}</span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Destination: {currentWedding?.destination_city}</span>
                </div>
              </div>
            </div>

            {/* 3. Executive Financial Terms (Per Plate, Total, Overtime) */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#714B67]" />
                Commercial Proposal Summary
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-slate-200 bg-white rounded p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Base Package Total
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    ₹{Number(quote.baseCost).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    For {guestCount} Guests
                  </span>
                </div>

                <div className="border border-amber-200 bg-amber-50/50 rounded p-3 text-center">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">
                    Rate Per Plate
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-900">
                    {quote.pricePerPlate ? `₹${Number(quote.pricePerPlate).toLocaleString('en-IN')}` : 'Included'}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    Per attendee rate
                  </span>
                </div>

                <div className="border border-slate-200 bg-white rounded p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Overtime Surcharge
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {quote.overtimeHourlyRate ? `₹${Number(quote.overtimeHourlyRate).toLocaleString('en-IN')}` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Per extra hour
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Itemized Line Items & Menu Breakdown */}
            {lineItems.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Itemized Scope of Work & Menu Courses
                </h3>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center">#</th>
                        <th className="py-2 px-3">Service / Course Item</th>
                        <th className="py-2 px-3 text-right">Allocated Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {lineItems.map((li, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 text-slate-800">{li.item}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-900 font-bold">
                            ₹{Number(li.cost).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-slate-700 text-right">
                          Estimated Scope Total:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900 text-sm">
                          ₹{Number(quote.baseCost).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Inclusions vs Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="border border-emerald-200 bg-emerald-50/30 rounded p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Contract Inclusions</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px] pt-1">
                  {quote.inclusions || 'Standard setup, professional cutlery, certified warmers, and banquet stewards included.'}
                </p>
              </div>

              <div className="border border-rose-200 bg-rose-50/30 rounded p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>Exclusions & Surcharges</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px] pt-1">
                  {quote.exclusions || 'Municipal liquor permit fees, specialized ice art, and external electrical generators.'}
                </p>
              </div>
            </div>

            {/* 6. Signature & Digital Verification Block */}
            <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-800">Verified by Royal Knot Concierge</p>
                  <p className="text-[10px]">Tamper-evident quotation document logged in wedding ledger.</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="font-serif italic text-slate-700 text-sm">
                  {quote.businessName} Management
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  DIGITALLY CERTIFIED PROPOSAL
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            {quote.status === 'ACCEPTED' ? (
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                This vendor was awarded as the official partner for this wedding.
              </span>
            ) : (
              <span>Ready for client evaluation and contract award.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8"
            >
              Close
            </Button>

            {onSelectWinner && quote.status !== 'ACCEPTED' && quote.status !== 'AWARDED' && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onSelectWinner(quote.id, quote.businessName, 'Catering & Banquets');
                  onClose();
                }}
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold"
              >
                {isClient ? 'Select Vendor for My Wedding' : 'Award Contract to This Vendor'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
