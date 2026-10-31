import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  CheckCircle2,
  AlertCircle,
  Calendar,
  SlidersHorizontal,
  Trash2,
  Edit2,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
} from '../ui';
import { api } from '../../api/client';

export interface QuoteItem {
  id: string;
  rfqId: string;
  vendorId: string;
  businessName: string;
  rating: string | number;
  phone: string;
  city: string;
  baseCost: string;
  pricePerPlate?: string;
  overtimeHourlyRate?: string;
  status: string;
  decisionReason?: string;
  isWinner: boolean;
}

export interface CategoryOverview {
  status: 'NOT_STARTED' | 'OPEN' | 'AWARDED';
  quotes: QuoteItem[];
  winner: QuoteItem | null;
}

export interface WeddingOverviewItem {
  id: string;
  code: string;
  couple_name: string;
  destination_city: string;
  primary_venue: string;
  start_date: string;
  estimated_guest_count: number;
  total_budget: string;
  wedding_status: string;
  categories: {
    CATERER: CategoryOverview;
    DJ: CategoryOverview;
    DECORATOR: CategoryOverview;
    [key: string]: CategoryOverview;
  };
}

interface WeddingSourcingViewProps {
  weddingsOverview: WeddingOverviewItem[];
  weddingOptions?: Array<{ id: string; code: string; couple: string; city: string; label: string }>;
  currentWedding: WeddingOverviewItem | null;
  selectedWeddingId: string | null;
  setSelectedWeddingId: (id: string) => void;
  onOpenAssignModal: (cat: 'CATERER' | 'DJ' | 'DECORATOR') => void;
  onRefresh: () => void;
  showToast: (msg: string) => void;
  loading?: boolean;
}

export const WeddingSourcingView: React.FC<WeddingSourcingViewProps> = ({
  weddingsOverview,
  weddingOptions,
  currentWedding,
  selectedWeddingId,
  setSelectedWeddingId,
  onOpenAssignModal,
  onRefresh,
  showToast,
  loading = false,
}) => {
  // Filters for Weddings Sourcing Tab
  const [sourcingCategoryFilter, setSourcingCategoryFilter] = useState<string>('ALL');
  const [sourcingStatusFilter, setSourcingStatusFilter] = useState<string>('ALL');
  const [sourcingSearch, setSourcingSearch] = useState<string>('');

  // Selected card tracking for card-click-to-select flow
  const [selectedCards, setSelectedCards] = useState<Record<string, string>>({});

  // Confirmation Modal for Awarding a Vendor
  const [awardConfirmOpen, setAwardConfirmOpen] = useState<boolean>(false);
  const [pendingAward, setPendingAward] = useState<{
    quoteId: string;
    vendorName: string;
    categoryTitle: string;
    weddingCode: string;
    coupleName: string;
  } | null>(null);

  // Unassign Confirmation Modal
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState<boolean>(false);
  const [pendingUnassign, setPendingUnassign] = useState<{
    quoteId: string;
    vendorName: string;
    categoryTitle: string;
  } | null>(null);
  const [submittingUnassign, setSubmittingUnassign] = useState<boolean>(false);

  // Edit Quote Pricing Modal
  const [editQuoteOpen, setEditQuoteOpen] = useState<boolean>(false);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [editBaseCost, setEditBaseCost] = useState<string>('');
  const [editPricePerPlate, setEditPricePerPlate] = useState<string>('');
  const [editOvertimeRate, setEditOvertimeRate] = useState<string>('');
  const [submittingQuoteEdit, setSubmittingQuoteEdit] = useState<boolean>(false);

  // Handle Card Click (select card for that category)
  const handleCardClick = (categoryKey: string, quoteId: string) => {
    setSelectedCards((prev) => ({
      ...prev,
      [categoryKey]: quoteId,
    }));
  };

  // Trigger Confirmation Modal for Awarding Vendor
  const handleRequestAward = (
    quoteId: string,
    vendorName: string,
    categoryTitle: string
  ) => {
    if (!currentWedding) return;
    setPendingAward({
      quoteId,
      vendorName,
      categoryTitle,
      weddingCode: currentWedding.code,
      coupleName: currentWedding.couple_name,
    });
    setAwardConfirmOpen(true);
  };

  // Execute Winner Selection upon Confirmation
  const handleConfirmAward = async () => {
    if (!pendingAward) return;
    try {
      const res = await api.post<{ success: boolean; message: string }>('/api/procurement/select-winner', {
        quoteId: pendingAward.quoteId,
        reason: 'Selected and confirmed by wedding planner team',
      });

      if (res?.success) {
        showToast(`Vendor "${pendingAward.vendorName}" successfully awarded contract!`);
        setAwardConfirmOpen(false);
        setPendingAward(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to select winner:', err);
      showToast('Error confirming winner. Please try again.');
    }
  };

  // Trigger Unassign Vendor
  const handleRequestUnassign = (
    quoteId: string,
    vendorName: string,
    categoryTitle: string
  ) => {
    setPendingUnassign({
      quoteId,
      vendorName,
      categoryTitle,
    });
    setUnassignConfirmOpen(true);
  };

  // Execute Unassign Vendor
  const handleConfirmUnassign = async () => {
    if (!pendingUnassign) return;
    setSubmittingUnassign(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/api/procurement/unassign-quote', {
        quoteId: pendingUnassign.quoteId,
      });

      if (res?.success) {
        showToast(`Vendor "${pendingUnassign.vendorName}" unassigned from options.`);
        setUnassignConfirmOpen(false);
        setPendingUnassign(null);
        onRefresh();
      }
    } catch (err: unknown) {
      console.error('Failed to unassign vendor:', err);
      const msg = err instanceof Error ? err.message : 'Error removing vendor option.';
      showToast(msg);
    } finally {
      setSubmittingUnassign(false);
    }
  };

  // Trigger Edit Quote Pricing
  const handleOpenEditQuote = (q: QuoteItem) => {
    setEditingQuote(q);
    setEditBaseCost(q.baseCost || '');
    setEditPricePerPlate(q.pricePerPlate || '');
    setEditOvertimeRate(q.overtimeHourlyRate || '');
    setEditQuoteOpen(true);
  };

  // Save Edit Quote Pricing
  const handleSaveQuoteEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    setSubmittingQuoteEdit(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/api/procurement/edit-quote', {
        quoteId: editingQuote.id,
        baseCost: editBaseCost,
        pricePerPlate: editPricePerPlate || undefined,
        overtimeHourlyRate: editOvertimeRate || undefined,
      });

      if (res?.success) {
        showToast(`Updated negotiated pricing for ${editingQuote.businessName}.`);
        setEditQuoteOpen(false);
        setEditingQuote(null);
        onRefresh();
      }
    } catch (err: unknown) {
      console.error('Failed to edit quote:', err);
      const msg = err instanceof Error ? err.message : 'Error updating quote.';
      showToast(msg);
    } finally {
      setSubmittingQuoteEdit(false);
    }
  };

  // Static definition of 3 categories
  const weddingCategoriesList = [
    {
      key: 'CATERER' as const,
      title: 'Royal Catering & Banquets',
      subtitle: 'Authentic multi-cuisine regional buffets, live counters & silver chinaware',
    },
    {
      key: 'DJ' as const,
      title: 'DJ & Sound Production',
      subtitle: 'Acoustics, truss lighting, LED wall displays & midnight sound console',
    },
    {
      key: 'DECORATOR' as const,
      title: 'Palace Mandap & Floral Decor',
      subtitle: 'Heritage floral aisle, regal mandap structures & palace mood draping',
    },
  ];


  // Visible filtered categories
  const visibleWeddingCategories = useMemo(() => {
    if (!currentWedding) return [];
    return weddingCategoriesList.filter((cat) => {
      const matchesCategory = sourcingCategoryFilter === 'ALL' || cat.key === sourcingCategoryFilter;
      if (!matchesCategory) return false;

      const catData = currentWedding?.categories?.[cat.key];
      const hasWinner = !!catData?.winner;
      const hasQuotes = (catData?.quotes.length || 0) > 0;

      if (sourcingStatusFilter === 'AWARDED' && !hasWinner) return false;
      if (sourcingStatusFilter === 'PENDING' && (hasWinner || !hasQuotes)) return false;
      if (sourcingStatusFilter === 'NOT_ASSIGNED' && hasQuotes) return false;

      if (sourcingSearch.trim()) {
        const q = sourcingSearch.toLowerCase();
        const matchesCatTitle = cat.title.toLowerCase().includes(q);
        const matchesQuotes = catData?.quotes.some(
          (item) => item.businessName.toLowerCase().includes(q) || item.city.toLowerCase().includes(q)
        );
        if (!matchesCatTitle && !matchesQuotes) return false;
      }

      return true;
    });
  }, [currentWedding, sourcingCategoryFilter, sourcingStatusFilter, sourcingSearch]);

  // =========================================================================
  // PLACEHOLDER 1: Loading State Placeholder
  // =========================================================================
  if (loading && !currentWedding) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-2xs space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#714B67] mx-auto" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-800">Loading Wedding Sourcing Pipelines...</h2>
          <p className="text-xs text-slate-500">Synchronizing live projects, vendor RFQs, and quotes.</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PLACEHOLDER 2: Empty Wedding Selection Placeholder
  // =========================================================================
  if (!currentWedding) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-2xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-[#714B67]">
          <Calendar className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            {weddingsOverview.length === 0 ? 'No Weddings in Sourcing Pipeline' : 'Select a Wedding Project'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {weddingsOverview.length === 0
              ? 'There are currently no active wedding projects loaded in the pipeline. Please create or import weddings to start sourcing caterers, DJs, and decorators.'
              : 'Choose a wedding project from the selector below to view category pipelines, compare quotes, and award contracts.'}
          </p>
        </div>

        {weddingsOverview.length > 0 && (
          <div className="max-w-sm mx-auto pt-2">
            <Select value={selectedWeddingId || ''} onValueChange={setSelectedWeddingId}>
              <SelectTrigger className="w-full h-9 text-xs border-slate-300 bg-white font-medium">
                <SelectValue placeholder="Choose a wedding project to view..." />
              </SelectTrigger>
              <SelectContent>
                {weddingOptions && weddingOptions.length > 0 ? (
                  weddingOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code}: {w.couple} ({w.city})
                    </SelectItem>
                  ))
                ) : (
                  weddingsOverview.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code}: {w.couple_name} ({w.destination_city})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // ACTIVE WEDDING SOURCING VIEW
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* 2. Category Tabs with Live Counts */}
      <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
        <Tabs value={sourcingCategoryFilter} onValueChange={setSourcingCategoryFilter} className="w-full">
          <TabsList className="h-9 bg-slate-100 border border-slate-200 w-full justify-start overflow-x-auto p-1">
            <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
              All Categories (3)
            </TabsTrigger>
            <TabsTrigger value="CATERER" className="text-xs px-3 font-semibold">
              Catering & Banquets ({currentWedding?.categories?.CATERER?.quotes?.length || 0})
              {currentWedding?.categories?.CATERER?.winner && ' ✓'}
            </TabsTrigger>
            <TabsTrigger value="DJ" className="text-xs px-3 font-semibold">
              DJ & Sound ({currentWedding?.categories?.DJ?.quotes?.length || 0})
              {currentWedding?.categories?.DJ?.winner && ' ✓'}
            </TabsTrigger>
            <TabsTrigger value="DECORATOR" className="text-xs px-3 font-semibold">
              Palace Decor ({currentWedding?.categories?.DECORATOR?.quotes?.length || 0})
              {currentWedding?.categories?.DECORATOR?.winner && ' ✓'}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search vendor name, pricing, or city..."
            value={sourcingSearch}
            onChange={(e) => setSourcingSearch(e.target.value)}
            className="pl-9 h-8 text-xs border-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Target Wedding Project Selector */}
          <Select value={selectedWeddingId || ''} onValueChange={setSelectedWeddingId}>
            <SelectTrigger className="w-[280px] h-8 text-xs border-slate-300 bg-white">
              <SelectValue placeholder="Select Wedding Project" />
            </SelectTrigger>
            <SelectContent>
              {weddingOptions && weddingOptions.length > 0 ? (
                weddingOptions.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code}: {w.couple} ({w.city})
                  </SelectItem>
                ))
              ) : (
                weddingsOverview.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code}: {w.couple_name} ({w.destination_city})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Status Filter Dropdown */}
          <Select value={sourcingStatusFilter} onValueChange={setSourcingStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-slate-300 bg-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AWARDED">Winner Awarded</SelectItem>
              <SelectItem value="PENDING">Pending Award</SelectItem>
              <SelectItem value="NOT_ASSIGNED">Not Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Sourcing Categories & Interactive Cards */}
      <div className="grid grid-cols-1 gap-4">
        {visibleWeddingCategories.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded p-8 text-center text-xs text-slate-400 shadow-2xs">
            No categories match the active filter criteria.
          </div>
        ) : (
          visibleWeddingCategories.map(({ key, title, subtitle }) => {
            const categoryData = currentWedding?.categories?.[key] || {
              status: 'NOT_STARTED',
              quotes: [],
              winner: null,
            };

            const quotes = categoryData.quotes;
            const winner = categoryData.winner;
            const hasWinner = !!winner;
            const activeCardId = selectedCards[key] || (winner ? winner.id : quotes[0]?.id);

            return (
              <Card key={key} className="border border-slate-200 rounded shadow-2xs bg-white overflow-hidden">
                <CardHeader className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold text-slate-900">
                        {title}
                      </CardTitle>
                      {hasWinner ? (
                        <Badge variant="success" className="text-[10px] py-0">
                          Winner Chosen
                        </Badge>
                      ) : quotes.length > 0 ? (
                        <Badge variant="secondary" className="text-[10px] py-0 text-amber-800 bg-amber-50 border-amber-200 font-semibold">
                          {quotes.length} Options Assigned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 text-slate-400">
                          Not Assigned
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenAssignModal(key)}
                      className="h-7 text-xs font-semibold text-slate-700"
                    >
                      <SlidersHorizontal className="w-3 h-3 mr-1 text-[#714B67]" />
                      {quotes.length > 0 ? 'Edit Assigned Vendors' : 'Assign Vendors'}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  {quotes.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded bg-slate-50/40">
                      <p className="text-xs text-slate-500 mb-2">
                        No vendor options assigned for {title} yet.
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenAssignModal(key)}
                        className="text-xs h-7 bg-[#714B67] hover:bg-[#5b3c53]"
                      >
                        Assign Options Now
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400 italic">
                        Click any card to select and award contract. Use action icons to edit pricing or unassign.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {quotes.map((q) => {
                          const isThisWinner = winner?.id === q.id;
                          const isSelected = activeCardId === q.id;
                          const isRejected = hasWinner && !isThisWinner;

                          return (
                            <div
                              key={q.id}
                              onClick={() => handleCardClick(key, q.id)}
                              className={`border rounded p-3 flex flex-col justify-between transition-all cursor-pointer relative ${isThisWinner
                                ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600 shadow-2xs'
                                : isSelected
                                  ? 'border-[#714B67] bg-[#714B67]/5 ring-1 ring-[#714B67]'
                                  : isRejected
                                    ? 'border-slate-200 bg-slate-50/60 opacity-60 hover:opacity-100'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="font-mono text-[10px] text-slate-400">{q.id.slice(0, 8)}</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1 font-bold text-amber-700 text-xs">
                                      <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                                      <span>{q.rating}</span>
                                      <span className="text-slate-400 font-normal">({q.city})</span>
                                    </div>

                                    {!isThisWinner && (
                                      <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          title="Edit negotiated pricing"
                                          onClick={() => handleOpenEditQuote(q)}
                                          className="p-1 text-slate-400 hover:text-[#714B67] hover:bg-slate-100 rounded cursor-pointer"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          title="Unassign vendor option"
                                          onClick={() => handleRequestUnassign(q.id, q.businessName, title)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <h3 className="font-bold text-xs text-slate-900 mb-2">
                                  {q.businessName}
                                </h3>

                                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 rounded p-2 mb-2 font-mono">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-sans">Base Rate:</span>
                                    <span className="font-bold text-slate-900">₹{Number(q.baseCost).toLocaleString('en-IN')}</span>
                                  </div>
                                  {q.pricePerPlate && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 font-sans">Per Plate:</span>
                                      <span className="font-semibold text-slate-800">₹{Number(q.pricePerPlate).toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                  {q.overtimeHourlyRate && (
                                    <div className="flex justify-between text-[11px] text-slate-500">
                                      <span className="font-sans">Overtime / hr:</span>
                                      <span>₹{Number(q.overtimeHourlyRate).toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                {isThisWinner ? (
                                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-800">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Winner Awarded</span>
                                  </div>
                                ) : (
                                  isSelected && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRequestAward(q.id, q.businessName, title);
                                      }}
                                      className="w-full text-xs h-7 bg-[#714B67] hover:bg-[#5b3c53]"
                                    >
                                      Select as Winner
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 5. Confirmation Modal for Awarding a Vendor */}
      <Dialog open={awardConfirmOpen} onOpenChange={setAwardConfirmOpen}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <div className="flex items-center gap-2 text-slate-900 mb-1">
              <AlertCircle className="w-5 h-5 text-[#714B67]" />
              <DialogTitle className="text-base font-bold">
                Confirm Vendor Award
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              Are you sure you want to award the <strong className="text-slate-900">{pendingAward?.categoryTitle}</strong> contract to <strong className="text-slate-900">{pendingAward?.vendorName}</strong> for <span className="font-mono font-semibold text-[#714B67]">{pendingAward?.weddingCode}</span> ({pendingAward?.coupleName})?
              <br /><br />
              This will confirm them as the winning vendor and auto-close competing quotes.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAwardConfirmOpen(false);
                setPendingAward(null);
              }}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmAward}
              className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold"
            >
              Confirm Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Confirmation Modal for Unassigning a Vendor Option */}
      <Dialog open={unassignConfirmOpen} onOpenChange={setUnassignConfirmOpen}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <div className="flex items-center gap-2 text-slate-900 mb-1">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <DialogTitle className="text-base font-bold">
                Unassign Vendor Option
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              Remove <strong className="text-slate-900">{pendingUnassign?.vendorName}</strong> from the <strong className="text-slate-900">{pendingUnassign?.categoryTitle}</strong> options for this wedding?
              <br /><br />
              You can re-assign them anytime from the vendor directory or edit assignments modal.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submittingUnassign}
              onClick={() => {
                setUnassignConfirmOpen(false);
                setPendingUnassign(null);
              }}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submittingUnassign}
              onClick={handleConfirmUnassign}
              className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {submittingUnassign ? 'Removing...' : 'Confirm Unassign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Modal for Editing Negotiated Quote Pricing */}
      <Dialog open={editQuoteOpen} onOpenChange={setEditQuoteOpen}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Negotiated Quote Pricing
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update base cost, per-plate rates, and overtime charges for <strong className="text-slate-800">{editingQuote?.businessName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuoteEdit} className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Base Cost (₹) *</Label>
              <Input
                type="number"
                value={editBaseCost}
                onChange={(e) => setEditBaseCost(e.target.value)}
                placeholder="e.g. 850000"
                className="mt-1 h-8 text-xs font-mono"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Price Per Plate (₹, Optional)</Label>
              <Input
                type="number"
                value={editPricePerPlate}
                onChange={(e) => setEditPricePerPlate(e.target.value)}
                placeholder="e.g. 2200"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Overtime Hourly Rate (₹, Optional)</Label>
              <Input
                type="number"
                value={editOvertimeRate}
                onChange={(e) => setEditOvertimeRate(e.target.value)}
                placeholder="e.g. 15000"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditQuoteOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingQuoteEdit}
                size="sm"
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white"
              >
                {submittingQuoteEdit ? 'Saving...' : 'Save Pricing'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
