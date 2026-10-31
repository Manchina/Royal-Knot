import React from 'react';
import {
  Columns,
  Star,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Award,
  DollarSign,
  Clock,
  Edit2,
  Check,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  Button,
  Badge,
} from '../ui';
import type { QuoteItem, WeddingOverviewItem } from './WeddingSourcingView';

interface SideBySideCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryTitle: string;
  categorySubtitle?: string;
  quotes: QuoteItem[];
  currentWedding: WeddingOverviewItem | null;
  onSelectWinner: (quoteId: string, vendorName: string, categoryTitle: string) => void;
  onViewPdf: (quote: QuoteItem) => void;
  onEditQuote?: (quote: QuoteItem) => void;
  isClient?: boolean;
}

export const SideBySideCompareModal: React.FC<SideBySideCompareModalProps> = ({
  isOpen,
  onClose,
  categoryTitle,
  categorySubtitle,
  quotes,
  currentWedding,
  onSelectWinner,
  onViewPdf,
  onEditQuote,
  isClient = false,
}) => {
  if (!isOpen || quotes.length === 0) return null;

  const guestCount = currentWedding?.estimated_guest_count || 400;

  // Determine lowest price per plate among quotes with a valid rate
  const ratesWithPlate = quotes
    .map((q) => Number(q.pricePerPlate || 0))
    .filter((rate) => rate > 0);
  const minPlateRate = ratesWithPlate.length > 0 ? Math.min(...ratesWithPlate) : null;

  // Determine lowest overtime hourly rate
  const ratesWithOvertime = quotes
    .map((q) => Number(q.overtimeHourlyRate || 0))
    .filter((rate) => rate > 0);
  const minOvertimeRate = ratesWithOvertime.length > 0 ? Math.min(...ratesWithOvertime) : null;

  const winnerQuote = quotes.find((q) => q.isWinner || q.status === 'ACCEPTED' || q.status === 'AWARDED');
  const hasWinner = !!winnerQuote;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl bg-slate-50 p-0 overflow-hidden max-h-[94vh] flex flex-col rounded-xl shadow-2xl border border-slate-300">
        {/* Modal Top Header Bar */}
        <div className="bg-[#714B67] text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 bg-white/10 px-2 py-0.5 rounded">
                Side-by-Side Comparison Matrix
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs font-semibold text-white/90">
                {currentWedding?.code}: {currentWedding?.couple_name}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-amber-200 font-mono">
                {guestCount} Guests Required
              </span>
            </div>
            <h1 className="text-base font-bold text-white tracking-tight mt-0.5">
              {categoryTitle} — Comparing {quotes.length} Vendor Proposals
            </h1>
            {categorySubtitle && (
              <p className="text-[11px] text-white/80">{categorySubtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded transition cursor-pointer font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Matrix</span>
            </button>
          </div>
        </div>

        {/* Blueprint Context Note Banner */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-6 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Comparing quotes side by side line by line and price per plate. Awarding a winning vendor links them straight to this wedding and auto-closes competing requests.
            </span>
          </div>
          {hasWinner && (
            <Badge variant="success" className="text-[10px] shrink-0">
              Contract Awarded to {winnerQuote?.businessName}
            </Badge>
          )}
        </div>

        {/* Scrollable Matrix Table */}
        <div className="overflow-y-auto overflow-x-auto p-6 flex-1">
          <div className="min-w-[760px] space-y-4">
            {/* Grid Columns Header */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${quotes.length}, minmax(0, 1fr))`,
              }}
            >
              {quotes.map((q) => {
                const isThisWinner = q.isWinner || q.status === 'ACCEPTED' || q.status === 'AWARDED';
                const isClosed = hasWinner && !isThisWinner;

                return (
                  <div
                    key={q.id}
                    className={`rounded-lg border p-4 transition-all flex flex-col justify-between ${isThisWinner
                      ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600 shadow-sm'
                      : isClosed
                        ? 'border-slate-200 bg-slate-100/70 opacity-75'
                        : 'border-slate-300 bg-white shadow-xs hover:border-[#714B67]'
                      }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {q.quoteReference || q.id.slice(0, 8)}
                        </span>

                        {isThisWinner ? (
                          <Badge variant="success" className="text-[10px]">
                            <Award className="w-3 h-3 mr-1" />
                            Awarded Winner
                          </Badge>
                        ) : isClosed ? (
                          <Badge variant="secondary" className="text-[10px] text-slate-400">
                            Auto-Closed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                            Under Review
                          </Badge>
                        )}
                      </div>

                      {/* Business Name & Details */}
                      <h2 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.businessName}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 mb-3">
                        <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                          {q.rating}
                        </span>
                        <span>•</span>
                        <span>{q.city}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{q.phone}</span>
                      </div>
                    </div>

                    {/* Proposal PDF & Edit Quick Actions */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewPdf(q)}
                        className="flex-1 text-xs h-7 font-semibold text-[#714B67] hover:bg-[#714B67]/10 border-[#714B67]/30"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
                        View Proposal PDF
                      </Button>

                      {!isClient && !isThisWinner && onEditQuote && (
                        <button
                          type="button"
                          onClick={() => onEditQuote(q)}
                          title="Edit negotiated pricing or PDF"
                          className="p-1.5 rounded text-slate-500 hover:text-[#714B67] hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section 1: Financial Overview Comparison Cards */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-[#714B67]" />
                1. Commercial & Pricing Comparison (for {guestCount} Guests)
              </h3>

              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${quotes.length}, minmax(0, 1fr))`,
                }}
              >
                {quotes.map((q) => {
                  const plateRate = Number(q.pricePerPlate || 0);
                  const isLowestPlate = minPlateRate !== null && plateRate > 0 && plateRate === minPlateRate;
                  const overtimeRate = Number(q.overtimeHourlyRate || 0);
                  const isLowestOvertime = minOvertimeRate !== null && overtimeRate > 0 && overtimeRate === minOvertimeRate;

                  return (
                    <div key={q.id} className="space-y-2.5 bg-slate-50/70 rounded p-3.5 border border-slate-200 text-xs">
                      {/* Per Plate Rate */}
                      <div className="flex justify-between items-baseline border-b border-slate-200/60 pb-2">
                        <div>
                          <span className="text-[11px] text-slate-500 block font-medium">Rate Per Plate</span>
                          {isLowestPlate && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                              Best Value Plate
                            </span>
                          )}
                        </div>
                        <span className={`text-base font-mono font-bold ${isLowestPlate ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {q.pricePerPlate ? `₹${Number(q.pricePerPlate).toLocaleString('en-IN')}` : 'N/A'}
                        </span>
                      </div>

                      {/* Total Base Cost */}
                      <div className="flex justify-between items-baseline border-b border-slate-200/60 pb-2">
                        <span className="text-[11px] text-slate-500 font-medium">Total Base Package</span>
                        <span className="text-sm font-mono font-bold text-slate-800">
                          ₹{Number(q.baseCost).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Overtime Rate */}
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium">Overtime / Hour</span>
                          {isLowestOvertime && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-emerald-700" />
                              Lowest Overtime
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-mono font-bold ${isLowestOvertime ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {q.overtimeHourlyRate ? `₹${Number(q.overtimeHourlyRate).toLocaleString('en-IN')}/hr` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Line-by-Line Menu & Service Breakdown */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Columns className="w-4 h-4 text-[#714B67]" />
                2. Line-by-Line Menu & Scope Breakdown
              </h3>

              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${quotes.length}, minmax(0, 1fr))`,
                }}
              >
                {quotes.map((q) => {
                  const lineItems = q.lineItems || [];

                  return (
                    <div key={q.id} className="border border-slate-200 rounded overflow-hidden flex flex-col justify-between">
                      {lineItems.length > 0 ? (
                        <div className="divide-y divide-slate-100 text-xs">
                          {lineItems.map((item, idx) => (
                            <div key={idx} className="p-2.5 flex justify-between items-start gap-2 hover:bg-slate-50/60">
                              <span className="text-slate-700 font-medium">
                                <span className="font-mono text-slate-400 mr-1.5 text-[11px]">{idx + 1}.</span>
                                {item.item}
                              </span>
                              <span className="font-mono text-slate-900 font-bold shrink-0">
                                ₹{Number(item.cost).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-slate-400 text-xs italic">
                          Standard comprehensive package inclusions.
                        </div>
                      )}

                      <div className="bg-slate-50 p-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-bold font-mono">
                        <span className="text-slate-600 font-sans">Scope Sum:</span>
                        <span className="text-slate-900">₹{Number(q.baseCost).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Inclusions Comparison */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                3. Equipment, Chinaware & Staffing Inclusions
              </h3>

              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${quotes.length}, minmax(0, 1fr))`,
                }}
              >
                {quotes.map((q) => (
                  <div key={q.id} className="border border-emerald-100 bg-emerald-50/20 rounded p-3.5 text-xs text-slate-700">
                    <p className="leading-relaxed">
                      {q.inclusions || 'Standard banquet equipment, warmers, and staffing included.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Exclusions Comparison */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Clock className="w-4 h-4 text-rose-600" />
                4. Exclusions & Disclaimers
              </h3>

              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${quotes.length}, minmax(0, 1fr))`,
                }}
              >
                {quotes.map((q) => (
                  <div key={q.id} className="border border-rose-100 bg-rose-50/20 rounded p-3.5 text-xs text-slate-700">
                    <p className="leading-relaxed">
                      {q.exclusions || 'Taxes, specialized local administration permits, and venue utility surcharges.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Decision & Contract Award Action Row */}
            <div className="bg-slate-100/90 rounded-lg border border-slate-300 p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#714B67]" />
                5. Selection & Contract Award
              </h3>
              <p className="text-xs text-slate-500">
                Pick the preferred vendor proposal below. The system will automatically link them straight to this wedding and auto-close the other quotes.
              </p>

              <div
                className="grid gap-4 pt-2"
                style={{
                  gridTemplateColumns: `repeat(${quotes.length}, minmax(0, 1fr))`,
                }}
              >
                {quotes.map((q) => {
                  const isThisWinner = q.isWinner || q.status === 'ACCEPTED' || q.status === 'AWARDED';
                  const isClosed = hasWinner && !isThisWinner;

                  return (
                    <div key={q.id}>
                      {isThisWinner ? (
                        <div className="w-full h-9 bg-emerald-600 text-white rounded flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs">
                          <Check className="w-4 h-4" />
                          <span>Awarded Partner</span>
                        </div>
                      ) : isClosed ? (
                        <div className="w-full h-9 bg-slate-200 text-slate-500 rounded flex items-center justify-center text-xs font-medium border border-slate-300">
                          Auto-Closed
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => {
                            onSelectWinner(q.id, q.businessName, categoryTitle);
                            onClose();
                          }}
                          className="w-full h-9 bg-[#714B67] hover:bg-[#5b3c53] text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          Select as Winner
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {hasWinner
              ? `Decision locked for ${currentWedding?.code}. Winner is linked to project.`
              : 'Reviewing proposals for client confirmation.'}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8"
          >
            Close Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
