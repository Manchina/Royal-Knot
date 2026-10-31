import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  Award,
  DollarSign,
  Clock,
  X,
  Check,
  Info,
  Plus,
  Star,
  CheckCircle2,
  ChevronDown,
  Layers
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
  isClient = false,
}) => {
  if (!isOpen || quotes.length === 0) return null;

  // Deduplicate quotes by vendorId or quoteReference
  const uniqueQuotes = useMemo(() => {
    const seen = new Set<string>();
    return quotes.filter((q) => {
      const key = q.vendorId || q.quoteReference || q.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [quotes]);

  // Chrome Tabs: openQuoteIds tracks which vendor tabs are currently active in the comparison
  // By default, open the first 2 or 3 distinct vendors so it's clean and uncluttered
  const [openQuoteIds, setOpenQuoteIds] = useState<string[]>(() => {
    return uniqueQuotes.slice(0, Math.min(uniqueQuotes.length, 3)).map((q) => q.id);
  });

  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Active quotes corresponding to open tabs
  const activeQuotes = useMemo(() => {
    return uniqueQuotes.filter((q) => openQuoteIds.includes(q.id));
  }, [uniqueQuotes, openQuoteIds]);

  // Available quotes that are not currently in open tabs
  const unaddedQuotes = useMemo(() => {
    return uniqueQuotes.filter((q) => !openQuoteIds.includes(q.id));
  }, [uniqueQuotes, openQuoteIds]);

  // Handle closing a tab
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenQuoteIds((prev) => prev.filter((quoteId) => quoteId !== id));
  };

  // Handle adding a vendor tab
  const handleAddTab = (id: string) => {
    if (!openQuoteIds.includes(id)) {
      setOpenQuoteIds((prev) => [...prev, id]);
    }
    setAddMenuOpen(false);
  };

  // Handle opening all quotes
  const handleOpenAll = () => {
    setOpenQuoteIds(uniqueQuotes.map((q) => q.id));
    setAddMenuOpen(false);
  };

  // Handle reset to top 2 quotes
  const handleResetTop2 = () => {
    setOpenQuoteIds(uniqueQuotes.slice(0, 2).map((q) => q.id));
    setAddMenuOpen(false);
  };

  const guestCount = currentWedding?.estimated_guest_count || 400;

  // Determine lowest price per plate among active quotes
  const activePlateRates = activeQuotes
    .map((q) => Number(q.pricePerPlate || 0))
    .filter((rate) => rate > 0);
  const minPlateRate = activePlateRates.length > 0 ? Math.min(...activePlateRates) : null;

  // Determine lowest overtime hourly rate among active quotes
  const activeOvertimeRates = activeQuotes
    .map((q) => Number(q.overtimeHourlyRate || 0))
    .filter((rate) => rate > 0);
  const minOvertimeRate = activeOvertimeRates.length > 0 ? Math.min(...activeOvertimeRates) : null;

  const winnerQuote = uniqueQuotes.find((q) => q.isWinner || q.status === 'ACCEPTED' || q.status === 'AWARDED');
  const hasWinner = !!winnerQuote;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl bg-slate-100 p-0 overflow-hidden max-h-[94vh] flex flex-col rounded-xl shadow-2xl border border-slate-300">
        {/* ========================================================================= */}
        {/* 1. CHROME BROWSER WINDOW TITLEBAR & TAB STRIP                             */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white select-none">
          {/* Top Window Meta Bar */}
          <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              {/* Window Controls Dots */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-white/10 px-2 py-0.5 rounded">
                Comparison Workspace
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-200">
                {currentWedding?.code}: {currentWedding?.couple_name}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-amber-200/90 font-mono">
                {categoryTitle} ({guestCount} Guests)
              </span>
              {categorySubtitle && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400 hidden md:inline">{categorySubtitle}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded transition cursor-pointer"
                title="Print comparison table"
              >
                <Printer className="w-3 h-3" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
                title="Close comparison window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chrome Tabs Strip */}
          <div className="px-3 pt-2 flex items-center gap-1 overflow-x-auto border-b border-slate-700/60 bg-slate-950/40">
            {activeQuotes.map((q) => {
              const isThisWinner = q.isWinner || q.status === 'ACCEPTED' || q.status === 'AWARDED';

              return (
                <div
                  key={q.id}
                  className="group relative flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-900 rounded-t-lg text-xs font-medium border-t-2 border-t-[#714B67] shadow-sm max-w-[240px] shrink-0 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-[#714B67] shrink-0" />
                  <span className="truncate font-semibold text-slate-800 text-[11px]">
                    {q.businessName}
                  </span>

                  {isThisWinner ? (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.2 rounded shrink-0">
                      Winner
                    </span>
                  ) : q.pricePerPlate ? (
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      ₹{Number(q.pricePerPlate).toLocaleString('en-IN')}
                    </span>
                  ) : null}

                  {/* Close Tab Button (x) */}
                  <button
                    type="button"
                    onClick={(e) => handleCloseTab(q.id, e)}
                    className="p-0.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer ml-0.5"
                    title={`Close tab for ${q.businessName}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Chrome "+" Add Tab Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer border border-slate-700"
                title="Add vendor proposal tab to compare"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px]">Add Tab</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Dropdown Menu for Adding Tabs */}
              {addMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-slate-800">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Available Proposals</span>
                    <span>{unaddedQuotes.length} unadded</span>
                  </div>

                  {unaddedQuotes.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      All {uniqueQuotes.length} vendor options are currently open in tabs.
                    </div>
                  ) : (
                    unaddedQuotes.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleAddTab(q.id)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="truncate mr-2">
                          <p className="font-semibold text-slate-800 truncate">{q.businessName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {q.quoteReference || q.city} • {q.rating} ★
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {q.pricePerPlate && (
                            <span className="font-mono text-[11px] font-bold text-[#714B67]">
                              ₹{Number(q.pricePerPlate).toLocaleString('en-IN')}/pl
                            </span>
                          )}
                          <span className="block text-[9px] text-emerald-600 font-bold">+ Open Tab</span>
                        </div>
                      </button>
                    ))
                  )}

                  <div className="border-t border-slate-100 p-1.5 bg-slate-50 flex items-center justify-between gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={handleOpenAll}
                      className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition font-medium cursor-pointer"
                    >
                      Open All ({uniqueQuotes.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleResetTop2}
                      className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition font-medium cursor-pointer"
                    >
                      Reset to Top 2
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right side tab strip info */}
            <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-400 py-1 pr-2">
              <span className="hidden sm:inline font-medium">
                {activeQuotes.length} of {uniqueQuotes.length} tabs open
              </span>
              {activeQuotes.length < uniqueQuotes.length && (
                <button
                  type="button"
                  onClick={handleOpenAll}
                  className="text-amber-300 hover:underline text-[11px] cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informative Sub-banner */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Comparing {activeQuotes.length} vendor proposal{activeQuotes.length === 1 ? '' : 's'} side-by-side line by line and price per plate. Awarding a winning vendor links them straight to this wedding and auto-closes competing requests.
            </span>
          </div>
          {hasWinner && (
            <Badge variant="success" className="text-[10px] shrink-0">
              Contract Awarded to {winnerQuote?.businessName}
            </Badge>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. SIDE-BY-SIDE MATRIX CONTENT                                            */}
        {/* ========================================================================= */}
        <div className="overflow-y-auto overflow-x-auto p-5 sm:p-6 flex-1">
          {activeQuotes.length === 0 ? (
            /* Empty State when all tabs closed */
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center max-w-md mx-auto my-6 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#714B67] mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Vendor Proposal Tabs Open</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Add tabs based on your interest to compare vendors side by side without clutter.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {uniqueQuotes.map((q) => (
                  <Button
                    key={q.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTab(q.id)}
                    className="text-xs h-7"
                  >
                    <Plus className="w-3 h-3 mr-1 text-[#714B67]" />
                    {q.businessName}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Columns Header (1, 2, or 3 columns matching open tabs) */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${activeQuotes.length}, minmax(0, 1fr))`,
                }}
              >
                {activeQuotes.map((q, idx) => {
                  const isThisWinner = q.isWinner || q.status === 'ACCEPTED' || q.status === 'AWARDED';
                  const isClosed = hasWinner && !isThisWinner;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-lg border p-4 transition-all flex flex-col justify-between ${
                        isThisWinner
                          ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600 shadow-sm'
                          : isClosed
                          ? 'border-slate-200 bg-slate-100/70 opacity-75'
                          : 'border-slate-300 bg-white shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Tab #{idx + 1} • {q.quoteReference || q.id.slice(0, 8)}
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

                      {/* Proposal PDF Action (No edit clutter!) */}
                      <div className="pt-2 border-t border-slate-200/80">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onViewPdf(q)}
                          className="w-full text-xs h-7 font-semibold text-[#714B67] hover:bg-[#714B67]/10 border-[#714B67]/30"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
                          View Proposal PDF
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Section 1: Financial Overview Comparison Cards */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <DollarSign className="w-4 h-4 text-[#714B67]" />
                  1. Commercial Terms & Pricing (for {guestCount} Guests)
                </h3>

                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${activeQuotes.length}, minmax(0, 1fr))`,
                  }}
                >
                  {activeQuotes.map((q) => {
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
                            {isLowestPlate && activeQuotes.length > 1 && (
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
                            {isLowestOvertime && activeQuotes.length > 1 && (
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
                  <FileText className="w-4 h-4 text-[#714B67]" />
                  2. Line-by-Line Menu & Scope Breakdown
                </h3>

                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${activeQuotes.length}, minmax(0, 1fr))`,
                  }}
                >
                  {activeQuotes.map((q) => {
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
                            Standard comprehensive package scope included.
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
                    gridTemplateColumns: `repeat(${activeQuotes.length}, minmax(0, 1fr))`,
                  }}
                >
                  {activeQuotes.map((q) => (
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
                    gridTemplateColumns: `repeat(${activeQuotes.length}, minmax(0, 1fr))`,
                  }}
                >
                  {activeQuotes.map((q) => (
                    <div key={q.id} className="border border-rose-100 bg-rose-50/20 rounded p-3.5 text-xs text-slate-700">
                      <p className="leading-relaxed">
                        {q.exclusions || 'Taxes, specialized local administration permits, and venue utility surcharges.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Selection & Contract Award Action Row */}
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
                    gridTemplateColumns: `repeat(${activeQuotes.length}, minmax(0, 1fr))`,
                  }}
                >
                  {activeQuotes.map((q) => {
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
                            {isClient ? 'Select for My Wedding' : 'Award Contract'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
