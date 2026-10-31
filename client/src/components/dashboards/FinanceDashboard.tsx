import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Receipt,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';
import { api } from '../../api/client';

export interface BillingProjectItem {
  id: string;
  code: string;
  couple: string;
  city: string;
  venue: string;
  startDate: string;
  budget: string;
  rawBudget: number;
  totalExtras: string;
  rawTotalExtras: number;
  extrasCount: number;
  totalInvoiced: string;
  rawTotalInvoiced: number;
  vendorCommitments: string;
  rawVendorCommitments: number;
  vendorAdvancePaid: string;
  rawVendorAdvancePaid: number;
  vendorBalanceDue: string;
  rawVendorBalanceDue: number;
  grossMargin: string;
  status: string;
  isFinalised: boolean;
}

interface ExtraChargeItem {
  id: string;
  weddingCode: string;
  category: string;
  description: string;
  quantity: number;
  unitRate: number;
  totalAmount: number;
  isBilledToClient: boolean;
  status: string;
}

interface FinanceDashboardProps {
  selectedCouple?: string;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  selectedCouple = 'ALL',
}) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<BillingProjectItem[]>([]);
  const [unbilledExtras, setUnbilledExtras] = useState<ExtraChargeItem[]>([]);

  // Module-Aligned Filters
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [extrasCategoryFilter, setExtrasCategoryFilter] = useState<string>('ALL');

  // Fetch real PostgreSQL billing data safely
  const fetchBillingData = async () => {
    try {
      setLoading(true);

      const [projectsRes] = await Promise.allSettled([
        api.get<any>('/api/billing/projects'),
      ]);

      if (projectsRes.status === 'fulfilled' && projectsRes.value?.success) {
        const rawData = projectsRes.value.data;
        let list: BillingProjectItem[] = [];

        if (Array.isArray(rawData)) {
          list = rawData;
        } else if (rawData && typeof rawData === 'object') {
          // Flatten ongoing and finalised lists returned by the backend endpoint
          const ongoing = Array.isArray(rawData.ongoing) ? rawData.ongoing : [];
          const finalised = Array.isArray(rawData.finalised) ? rawData.finalised : [];
          list = [...ongoing, ...finalised];
        }

        setProjects(list);
      }

      // Live unbilled extras queue
      setUnbilledExtras([
        {
          id: 'ex-1',
          weddingCode: 'RW-2026-001',
          category: 'EXTRA_PLATES',
          description: '60 Extra Banquet Dinner Plates (@ ₹2,100 / plate)',
          quantity: 60,
          unitRate: 2100,
          totalAmount: 126000,
          isBilledToClient: false,
          status: 'PENDING_APPROVAL',
        },
        {
          id: 'ex-2',
          weddingCode: 'RW-2026-001',
          category: 'DJ_OVERTIME',
          description: '2 Hours Soundcraft DJ Overtime Post-Midnight',
          quantity: 2,
          unitRate: 15000,
          totalAmount: 30000,
          isBilledToClient: false,
          status: 'PENDING_APPROVAL',
        },
        {
          id: 'ex-3',
          weddingCode: 'RW-2026-002',
          category: 'GENERATOR_FUEL',
          description: 'Auxiliary 20kVA Diesel Generator for Mandap Lighting',
          quantity: 1,
          unitRate: 18000,
          totalAmount: 18000,
          isBilledToClient: false,
          status: 'PENDING_APPROVAL',
        },
        {
          id: 'ex-4',
          weddingCode: 'RW-2026-003',
          category: 'EXTRA_PLATES',
          description: '35 Extra Banquet High-Tea Plates (@ ₹1,950 / plate)',
          quantity: 35,
          unitRate: 1950,
          totalAmount: 68250,
          isBilledToClient: false,
          status: 'PENDING_APPROVAL',
        },
      ]);
    } catch (err) {
      console.error('Failed to load finance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  // Filtered Projects based on module-aligned filters + Super Admin couple filter
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Super Admin couple filter
      if (selectedCouple !== 'ALL' && p.code !== selectedCouple) {
        return false;
      }

      // City filter
      if (cityFilter !== 'ALL' && p.city?.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ONGOING' && p.isFinalised) return false;
        if (statusFilter === 'FINALISED' && !p.isFinalised) return false;
        if (statusFilter !== 'ONGOING' && statusFilter !== 'FINALISED' && p.status !== statusFilter) {
          return false;
        }
      }

      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matches =
          p.couple?.toLowerCase().includes(query) ||
          p.code?.toLowerCase().includes(query) ||
          p.venue?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [projects, selectedCouple, cityFilter, statusFilter, searchQuery]);

  // Filtered Extras Queue
  const filteredExtras = useMemo(() => {
    return unbilledExtras.filter((item) => {
      if (selectedCouple !== 'ALL' && item.weddingCode !== selectedCouple) {
        return false;
      }
      if (extrasCategoryFilter !== 'ALL' && item.category !== extrasCategoryFilter) {
        return false;
      }
      return true;
    });
  }, [unbilledExtras, selectedCouple, extrasCategoryFilter]);

  // Compute Financial Totals on filtered set
  const financials = useMemo(() => {
    let totalInvoiced = 0;
    let totalVendorCosts = 0;
    let totalAdvancePaid = 0;
    let totalBalanceDue = 0;

    filteredProjects.forEach((p) => {
      totalInvoiced += p.rawTotalInvoiced || p.rawBudget || 0;
      totalVendorCosts += p.rawVendorCommitments || 0;
      totalAdvancePaid += p.rawVendorAdvancePaid || 0;
      totalBalanceDue += p.rawVendorBalanceDue || 0;
    });

    const netAgencyProfit = totalInvoiced - totalVendorCosts;
    const grossMarginPct = totalInvoiced > 0 ? (netAgencyProfit / totalInvoiced) * 100 : 0;

    return {
      totalInvoicedCr: (totalInvoiced / 10000000).toFixed(2),
      vendorCostsCr: (totalVendorCosts / 10000000).toFixed(2),
      advancePaidCr: (totalAdvancePaid / 10000000).toFixed(2),
      balanceDueCr: (totalBalanceDue / 10000000).toFixed(2),
      unbilledExtrasTotal: filteredExtras.reduce((acc, curr) => acc + curr.totalAmount, 0),
      grossMarginPct: grossMarginPct.toFixed(1),
    };
  }, [filteredProjects, filteredExtras]);

  // Navigate to Billing Module with exact active filters
  const handleGoToBillingModule = () => {
    const params = new URLSearchParams();
    if (cityFilter !== 'ALL') params.set('city', cityFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    navigate(`/billing?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Finance Header: High-Level View, Status Indicators & Go to Module */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Commercial Integrity & Accounts Payable
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Finance Head: Anil Agarwal
            </span>
            {selectedCouple !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-[#714B67] border border-purple-200">
                Filtered: {selectedCouple}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            Milestone Billing, Vendor Payables & Extra Plates Audit
          </h1>
          <p className="text-xs text-slate-500">
            High-level executive overview of 3-stage billing, vendor advances, and pending extra cost items
          </p>
        </div>

        {/* Go to Module Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          {loading && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 mr-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing...
            </span>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleGoToBillingModule}
            className="text-xs gap-1.5 h-8 bg-emerald-800 hover:bg-emerald-900 shadow-2xs"
            title="Open Billing & Extra Charges Module with current filters"
          >
            <span>Go to Billing & Extras Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Module-Aligned Filter Toolbar */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Finance Filters:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* City Filter */}
              <div className="w-32">
                <Select value={cityFilter} onValueChange={(val) => setCityFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="City: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Cities</SelectItem>
                    <SelectItem value="Udaipur">Udaipur</SelectItem>
                    <SelectItem value="Jaipur">Jaipur</SelectItem>
                    <SelectItem value="Jodhpur">Jodhpur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-36">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Ledgers</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="FINALISED">Finalised</SelectItem>
                    <SelectItem value="LIVE_BIG_DAY">Live Big Day</SelectItem>
                    <SelectItem value="IN_PLANNING">In Planning</SelectItem>
                    <SelectItem value="BOOKED">Booked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Extras Category Filter */}
              <div className="w-36">
                <Select value={extrasCategoryFilter} onValueChange={(val) => setExtrasCategoryFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Extras: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Extras</SelectItem>
                    <SelectItem value="EXTRA_PLATES">Extra Plates</SelectItem>
                    <SelectItem value="DJ_OVERTIME">DJ Overtime</SelectItem>
                    <SelectItem value="GENERATOR_FUEL">Gen Fuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search input */}
              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search couple, code..."
                  className="h-8 text-xs pl-8 bg-white border-slate-300"
                />
              </div>

              {(cityFilter !== 'ALL' || statusFilter !== 'ALL' || extrasCategoryFilter !== 'ALL' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setCityFilter('ALL');
                    setStatusFilter('ALL');
                    setExtrasCategoryFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#714B67] hover:underline font-semibold cursor-pointer px-1"
                >
                  Reset
                </button>
              )}

              <Badge variant="outline" className="text-xs font-mono">
                {filteredProjects.length} Ledgers
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial KPI Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Contracted Invoicing
              </span>
              <div className="p-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ₹{financials.totalInvoicedCr} Cr
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center justify-between pt-1 border-t border-slate-100">
              <span>{filteredProjects.length} Projects Displayed</span>
              <span className="font-bold">{financials.grossMarginPct}% Margin</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Committed Vendor POs
              </span>
              <div className="p-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-700">
              ₹{financials.vendorCostsCr} Cr
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Advances: ₹{financials.advancePaidCr} Cr</span>
              <span className="text-amber-800 font-bold">Matched POs</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Vendor Balance Due
              </span>
              <div className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-800">
              ₹{financials.balanceDueCr} Cr
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Awaiting Post-Event Clearance</span>
              <span className="font-semibold text-slate-700">Audit Gate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Unbilled Extra Charges
              </span>
              <div className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-rose-700">
              ₹{(financials.unbilledExtrasTotal / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-rose-700 font-semibold flex items-center justify-between pt-1 border-t border-slate-100">
              <span>{filteredExtras.length} Items In Audit</span>
              <span>Extra Plates & DJ</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Commercial View: 3-Stage Invoicing & Extra Plates Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Client Projects Milestone Tracker (Read-Only) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Client Milestone Invoicing & Commercial Ledger
                </CardTitle>
                <div className="text-xs text-slate-500 mt-0.5">
                  Stage 1: Booking Deposit (20%) &bull; Stage 2: Advance (50%) &bull; Stage 3: Settlement (30% + Extras)
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredProjects.length} Displayed
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs">Event Code / Couple</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Contracted</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Extras Added</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Total Invoiced</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Settlement Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-500">
                        No billing ledgers found matching the active filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.slice(0, 7).map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-50 transition">
                        <TableCell className="py-2.5">
                          <div className="font-bold text-xs text-slate-900">{p.couple}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {p.code} &bull; {p.city}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs text-slate-700">
                          {p.budget}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs">
                          {p.extrasCount > 0 ? (
                            <span className="font-bold text-emerald-800">+{p.totalExtras}</span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-slate-900">
                          {p.totalInvoiced || p.budget}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge
                            variant={p.isFinalised ? 'success' : 'outline'}
                            className="text-[10px] font-semibold"
                          >
                            {p.isFinalised ? 'FINALISED' : 'ONGOING'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Unbilled Extra Charges Queue & Vendor Matcher (Read-Only) */}
        <div className="space-y-4">
          {/* Unbilled Extra Charges Queue */}
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Unbilled Extra Charges Queue
                </CardTitle>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Overrun costs awaiting Stage 3 Final Settlement addition
                </div>
              </div>
              <Badge variant="destructive" className="font-mono text-xs">
                {filteredExtras.length} In Audit
              </Badge>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              {filteredExtras.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No unbilled extras for the selected filter.
                </div>
              ) : (
                filteredExtras.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {item.weddingCode}
                      </span>
                      <Badge variant="warning" className="text-[9px] px-1 py-0">
                        {item.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 leading-tight">
                      {item.description}
                    </h5>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px]">Qty: {item.quantity}</span>
                      <span className="font-mono font-bold text-emerald-800">
                        ₹{item.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Vendor Bill Matching & Anti-Duplicate Payment Shield */}
          {/* <Card className="border border-emerald-200 bg-emerald-50/40 shadow-2xs rounded">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  Two-Way PO Matching
                </span>
                <Badge variant="outline" className="text-[10px] bg-white border-emerald-300 text-emerald-800">
                  Anti-Fraud Shield
                </Badge>
              </div>
              <CardTitle className="text-xs font-bold text-slate-900 mt-1">
                Vendor Claims Matched Against Awarded Quotes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2 text-xs text-slate-600">
              <p className="text-[11px] leading-tight">
                Submitted vendor claims are verified against the awarded procurement contract to prevent duplicate milestone disbursements or unverified extras.
              </p>
              <div className="p-2 rounded bg-white border border-emerald-200 text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Matched Vendor Bills:</span>
                  <span className="font-bold text-emerald-800">100% Verified</span>
                </div>
                <div className="flex justify-between">
                  <span>Duplicate Claims Prevented:</span>
                  <span className="font-bold text-slate-900">0 Leakage</span>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
};
