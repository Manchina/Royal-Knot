import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Star,
  Users,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Database,
  Table as TableIcon,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Progress,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';
import { api } from '../../api/client';

export interface WeddingProfit {
  id?: string;
  code: string;
  couple: string;
  venue: string;
  city: string;
  guests: number;
  clientBilled: string;
  clientBilledNum?: number;
  vendorCosts: string;
  vendorCostsNum?: number;
  netProfit: string;
  netProfitNum?: number;
  marginPct: string;
  marginPctNum?: number;
  status: 'High Margin' | 'On Target' | 'Audit Extras';
  leadPlanner: string;
  date: string;
}

export interface CashFlowPeriod {
  period: string;
  milestoneInflows: string;
  vendorPayables: string;
  netCashDelta: string;
  status: 'SURPLUS' | 'DEFICIT';
}

export interface VendorScoreItem {
  id: string;
  vendor: string;
  category: string;
  city: string;
  rating: string;
  onTimeArrivalPct: string;
  eventsDelivered: number;
  avgDelayMins: number;
  reliability: 'High Reliability' | 'Satisfactory' | 'Watchlist';
}

interface ExecutiveDashboardProps {
  selectedCouple?: string;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  selectedCouple = 'ALL',
}) => {
  const navigate = useNavigate();

  // View modes for individual sections ('table' | 'chart')
  const [profitViewMode, setProfitViewMode] = useState<'table' | 'chart'>('table');
  const [cashFlowViewMode, setCashFlowViewMode] = useState<'table' | 'chart'>('table');
  const [vendorViewMode, setVendorViewMode] = useState<'table' | 'chart'>('table');

  // Filter & Export States
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'High Margin' | 'On Target' | 'Audit Extras'>('ALL');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>('ALL');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Live PostgreSQL States
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [weddingProfits, setWeddingProfits] = useState<WeddingProfit[]>([]);
  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowPeriod[]>([]);
  const [vendorScorecard, setVendorScorecard] = useState<VendorScoreItem[]>([]);

  // Fetch PostgreSQL analytics from backend
  const fetchSeasonSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/api/analytics/season-summary');
      if (res && res.success) {
        const iconMap = [TrendingUp, DollarSign, Calendar, Users];
        const mappedMetrics = (res.metrics || []).map((m: any, i: number) => ({
          ...m,
          icon: iconMap[i % iconMap.length],
        }));
        setMetrics(mappedMetrics);
        setWeddingProfits(res.weddingProfits || []);
        setCashFlowForecast(res.cashFlowForecast || []);
        setVendorScorecard(res.vendorScorecard || []);
        setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load season summary from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasonSummary();
  }, []);

  // Filtered weddings for matrix
  const filteredWeddings = useMemo(() => {
    return weddingProfits.filter((w) => {
      if (selectedCouple !== 'ALL' && w.code !== selectedCouple) {
        return false;
      }
      if (cityFilter !== 'ALL' && w.city?.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }
      const matchesSearch =
        w.couple.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [weddingProfits, selectedCouple, cityFilter, searchTerm, statusFilter]);

  // Navigate to Billing Module with active filters
  const handleGoToBillingModule = () => {
    const params = new URLSearchParams();
    if (cityFilter !== 'ALL') params.set('city', cityFilter);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    navigate(`/billing?${params.toString()}`);
  };

  // Filtered vendors for scorecard
  const filteredVendors = useMemo(() => {
    if (vendorCategoryFilter === 'ALL') return vendorScorecard;
    return vendorScorecard.filter((v) => v.category === vendorCategoryFilter);
  }, [vendorScorecard, vendorCategoryFilter]);

  // Vendor categories list for filter
  const vendorCategories = useMemo(() => {
    const cats = new Set(vendorScorecard.map((v) => v.category));
    return ['ALL', ...Array.from(cats)];
  }, [vendorScorecard]);

  // Chart Data: Profitability Matrix (Revenue vs Costs in Crores)
  const profitabilityChartData = useMemo(() => {
    return filteredWeddings.map((w) => {
      const revCr = w.clientBilledNum ? Number((w.clientBilledNum / 10000000).toFixed(2)) : 0;
      const costCr = w.vendorCostsNum ? Number((w.vendorCostsNum / 10000000).toFixed(2)) : 0;
      const profitLakhs = w.netProfitNum ? Number((w.netProfitNum / 100000).toFixed(2)) : 0;
      const marginPct = parseFloat(w.marginPct) || 0;
      return {
        code: w.code,
        couple: w.couple.split('&')[0].trim(),
        fullCouple: w.couple,
        venue: w.venue,
        revenueCr: revCr,
        costCr: costCr,
        profitLakhs,
        marginPct,
        status: w.status,
      };
    });
  }, [filteredWeddings]);

  // Chart Data: Cash Flow Forecast (Inflows vs Payables in Lakhs)
  const cashFlowChartData = useMemo(() => {
    return cashFlowForecast.map((c) => {
      const inflows = parseFloat(c.milestoneInflows.replace(/[^\d.]/g, '')) || 0;
      const payables = parseFloat(c.vendorPayables.replace(/[^\d.]/g, '')) || 0;
      const rawDelta = c.netCashDelta.replace(/[^\d.-]/g, '');
      const delta = parseFloat(rawDelta) || 0;
      return {
        period: c.period,
        inflows,
        payables,
        netDelta: delta,
        status: c.status,
      };
    });
  }, [cashFlowForecast]);

  // Chart Data: Vendor Punctuality Ranking
  const vendorChartData = useMemo(() => {
    return filteredVendors.map((v) => {
      const onTimePct = parseInt(v.onTimeArrivalPct, 10) || 100;
      return {
        name: v.vendor.length > 18 ? v.vendor.slice(0, 16) + '..' : v.vendor,
        fullName: v.vendor,
        category: v.category,
        city: v.city,
        onTimePct,
        rating: parseFloat(v.rating) || 5.0,
        events: v.eventsDelivered,
        delay: v.avgDelayMins,
        reliability: v.reliability,
      };
    });
  }, [filteredVendors]);

  // Chart Data: Category Breakdown
  const categoryChartData = useMemo(() => {
    const map: Record<string, { total: number; sumOnTime: number; vendors: number }> = {};
    vendorScorecard.forEach((v) => {
      const cat = v.category;
      const onTime = parseInt(v.onTimeArrivalPct, 10) || 100;
      if (!map[cat]) map[cat] = { total: 0, sumOnTime: 0, vendors: 0 };
      map[cat].vendors += 1;
      map[cat].sumOnTime += onTime;
    });
    return Object.entries(map).map(([category, d]) => ({
      category,
      avgOnTime: Math.round(d.sumOnTime / d.vendors),
      vendors: d.vendors,
    }));
  }, [vendorScorecard]);

  // Vendor Reliability Summary Counts
  const vendorReliabilityCounts = useMemo(() => {
    const counts = { high: 0, satisfactory: 0, watchlist: 0 };
    vendorScorecard.forEach((v) => {
      if (v.reliability === 'High Reliability') counts.high++;
      else if (v.reliability === 'Satisfactory') counts.satisfactory++;
      else counts.watchlist++;
    });
    return counts;
  }, [vendorScorecard]);

  // Download CSV ledger of season
  const handleExportCsv = () => {
    const headers = ['Event Code', 'Couple', 'City', 'Venue', 'Guests', 'Client Billed', 'Vendor Costs', 'Net Margin', 'Margin %', 'Status', 'Lead Planner'];
    const rows = weddingProfits.map((w) => [
      w.code,
      `"${w.couple.replace(/"/g, '""')}"`,
      w.city,
      `"${w.venue.replace(/"/g, '""')}"`,
      w.guests,
      `"${w.clientBilled}"`,
      `"${w.vendorCosts}"`,
      `"${w.netProfit}"`,
      w.marginPct,
      w.status,
      w.leadPlanner,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `royal_knot_season_2026_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Control Panel: Header, Global View Mode & Live DB Indicator */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Executive Financial Overview
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <Database className="w-3 h-3 text-emerald-600" />
              Live PostgreSQL
            </span>
            {lastRefreshed && (
              <span className="text-[10px] text-slate-400 font-mono">
                Sync {lastRefreshed}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
            Season 2026 Profitability & Cash Flow Review
          </h1>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="text-xs gap-1.5 h-8 border-slate-300"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Export Ledger</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleGoToBillingModule}
            className="text-xs gap-1.5 h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold shadow-2xs"
            title="Open Billing & Extra Charges Module with current filters"
          >
            <span>Go to Billing Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>



      {/* SECTION 1: Wedding-by-Wedding Profitability Matrix (Read-Only) */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Season Profitability Matrix
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono py-0.5">
                  Direct PostgreSQL
                </Badge>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Contracted billing vs approved vendor payouts with agency margin health
              </div>
            </div>

            {/* Filter, Search & Local Section View Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-32">
                <Select
                  value={cityFilter}
                  onValueChange={(val) => setCityFilter(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Cities</SelectItem>
                    <SelectItem value="Udaipur">Udaipur</SelectItem>
                    <SelectItem value="Jaipur">Jaipur</SelectItem>
                    <SelectItem value="Jodhpur">Jodhpur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as any)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="All Margins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Margins</SelectItem>
                    <SelectItem value="High Margin">High Margin (&gt;30%)</SelectItem>
                    <SelectItem value="On Target">On Target</SelectItem>
                    <SelectItem value="Audit Extras">Audit Extras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search code, couple, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-slate-300"
                />
              </div>

              {/* Local View Toggle */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded border border-slate-300">
                <button
                  type="button"
                  onClick={() => setProfitViewMode('table')}
                  title="Table View"
                  className={`p-1 rounded text-xs transition ${
                    profitViewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setProfitViewMode('chart')}
                  title="Chart View"
                  className={`p-1 rounded text-xs transition ${
                    profitViewMode === 'chart' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <Badge variant="outline" className="text-xs font-mono py-1">
                {filteredWeddings.length} Weddings
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {profitViewMode === 'table' ? (
            <Table>
              <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 text-xs">Event Code / Couple</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Venue & Destination</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Guests</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Invoiced (Client)</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Vendor Bills</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Net Profit</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Margin</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-center">Reconciliation Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filteredWeddings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-500">
                      No matching weddings found for the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWeddings.map((w) => (
                    <TableRow key={w.code} className="hover:bg-slate-50 transition">
                      <TableCell className="py-2.5">
                        <div className="font-bold text-xs text-slate-900">{w.couple}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{w.code}</div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="text-slate-800 text-xs font-medium">{w.venue}</div>
                        <div className="text-[11px] text-slate-500">{w.city}</div>
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-xs">{w.guests}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-semibold text-xs text-slate-900">
                        {w.clientBilled}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-xs text-slate-600">
                        {w.vendorCosts}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-emerald-800">
                        {w.netProfit}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-slate-800">
                        {w.marginPct}
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        <Badge
                          variant={
                            w.status === 'High Margin'
                              ? 'success'
                              : w.status === 'On Target'
                                ? 'info'
                                : 'warning'
                          }
                          className="text-[11px] font-semibold"
                        >
                          {w.status === 'Audit Extras' ? (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          ) : (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {w.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">
                  Revenue vs Approved Vendor Payouts vs Agency Net Profit (in ₹ Crores)
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#714B67]" /> Client Invoiced
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Vendor Payouts
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Agency Margin
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitabilityChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}Cr`} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1 font-sans">
                            <div className="font-bold text-slate-900">{data.code} &bull; {data.fullCouple}</div>
                            <div className="text-[11px] text-slate-500">{data.venue}</div>
                            <div className="pt-1.5 space-y-0.5 border-t border-slate-100">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-600">Client Revenue:</span>
                                <span className="font-bold text-[#714B67]">₹{data.revenueCr} Cr</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-600">Vendor Bills:</span>
                                <span className="font-bold text-slate-700">₹{data.costCr} Cr</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-600">Net Agency Margin:</span>
                                <span className="font-bold text-emerald-700">₹{data.profitLakhs} L ({data.marginPct.toFixed(1)}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="revenueCr" name="Client Invoiced" fill="#714B67" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="costCr" name="Vendor Payouts" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="marginPct" name="Margin %" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.length === 0 && loading ? (
          <div className="col-span-4 p-8 text-center text-slate-500 bg-white border border-slate-200 rounded">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400 mb-2" />
            Loading real financial metrics from PostgreSQL...
          </div>
        ) : (
          metrics.map((m, i) => {
            const Icon = m.icon || TrendingUp;
            return (
              <Card key={i} className="border border-slate-200 shadow-2xs rounded bg-white">
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {m.label}
                    </span>
                    <div className="p-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                    {m.value}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-slate-100">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${m.positive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                    >
                      {m.positive ? (
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-0.5" />
                      )}
                      {m.change}
                    </span>
                    <span className="text-slate-500 text-[11px] truncate">{m.sub}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      {/* SECTION 2: Cash Flow Forecast */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Cash Flow Forecast (Receivables vs Vendor Disbursements)
              </CardTitle>
              <div className="text-xs text-slate-500 mt-0.5">
                Staged milestone inflows from clients vs scheduled vendor disbursements
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded border border-slate-300">
                <button
                  onClick={() => setCashFlowViewMode('table')}
                  title="Table View"
                  className={`p-1 rounded text-xs transition ${cashFlowViewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCashFlowViewMode('chart')}
                  title="Chart View"
                  className={`p-1 rounded text-xs transition ${cashFlowViewMode === 'chart' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-semibold py-0.5">
                Live Inflow Matching
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cashFlowViewMode === 'table' ? (
            <Table>
              <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 text-xs">Period / Month</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Milestone Inflows (Client)</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Scheduled Vendor Payables</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Net Monthly Cash Delta</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-center">Liquidity Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {cashFlowForecast.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-xs text-slate-500">
                      No cash flow schedule recorded in database.
                    </TableCell>
                  </TableRow>
                ) : (
                  cashFlowForecast.map((c, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50 transition">
                      <TableCell className="py-2.5 font-bold text-xs text-slate-900 font-mono">
                        {c.period}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-semibold text-xs text-slate-900">
                        {c.milestoneInflows}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-xs text-slate-600">
                        {c.vendorPayables}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-emerald-800">
                        {c.netCashDelta}
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        <Badge
                          variant={c.status === 'SURPLUS' ? 'success' : 'warning'}
                          className="text-[11px] font-bold"
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">
                  Scheduled Inflows vs Vendor Outflows & Net Monthly Liquidity (in ₹ Lakhs)
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Milestone Inflows
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-600" /> Scheduled Payables
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#714B67]" /> Net Cash Delta
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowChartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}L`} />
                    <Tooltip
                      formatter={(value: any, name: any) => [`₹${value} L`, name]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                    />
                    <Bar dataKey="inflows" name="Milestone Inflows" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="payables" name="Scheduled Payables" fill="#D97706" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netDelta" name="Net Cash Surplus" fill="#714B67" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: Vendor Reliability Scorecard (Read-Only) */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Vendor Reliability Scorecard & Check-in Benchmarks
              </CardTitle>
              <div className="text-xs text-slate-500 mt-0.5">
                Aggregated punctuality and SLA compliance computed from Day-of Coordinator arrival check-ins
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-36">
                <Select
                  value={vendorCategoryFilter}
                  onValueChange={(val) => setVendorCategoryFilter(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === 'ALL' ? 'All Categories' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center bg-slate-200/70 p-0.5 rounded border border-slate-300">
                <button
                  onClick={() => setVendorViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${vendorViewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-[#714B67]" />
                  <span>Table View</span>
                </button>
                <button
                  onClick={() => setVendorViewMode('chart')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${vendorViewMode === 'chart'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#714B67]" />
                  <span>Chart View</span>
                </button>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-semibold">
                {filteredVendors.length} Partners Audited
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {vendorViewMode === 'table' ? (
            <div>
              <div className="p-3 border-b border-slate-100 bg-slate-50/40 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-semibold">High Reliability Partners</div>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">{vendorReliabilityCounts.high} Vendors</div>
                </div>
                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                  <div className="text-[11px] text-blue-700 font-semibold">Satisfactory Partners</div>
                  <div className="text-lg font-bold font-mono text-blue-900 mt-0.5">{vendorReliabilityCounts.satisfactory} Vendors</div>
                </div>
                <div className="p-2 rounded bg-amber-50 border border-amber-200">
                  <div className="text-[11px] text-amber-700 font-semibold">Watchlist / Delayed</div>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-0.5">{vendorReliabilityCounts.watchlist} Vendors</div>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs">Partner Business Name</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Category</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Base City</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Events Delivered</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Avg Delay</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Verified On-Time %</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Rating</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">SLA Reliability Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredVendors.map((v) => {
                    const onTimeScore = parseInt(v.onTimeArrivalPct, 10) || 100;
                    return (
                      <TableRow key={v.id} className="hover:bg-slate-50 transition">
                        <TableCell className="py-2.5 font-bold text-xs text-slate-900">
                          {v.vendor}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {v.category}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-slate-600">
                          {v.city}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs text-slate-700">
                          {v.eventsDelivered} Events
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs">
                          {v.avgDelayMins > 0 ? (
                            <span className="text-amber-700 font-semibold">+{v.avgDelayMins}m</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">0m</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-center w-36">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={onTimeScore} className="h-1.5 w-16" />
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {v.onTimeArrivalPct}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                            <span>{v.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge
                            variant={
                              v.reliability === 'High Reliability'
                                ? 'success'
                                : v.reliability === 'Satisfactory'
                                  ? 'info'
                                  : 'warning'
                            }
                            className="text-[11px] font-semibold"
                          >
                            {v.reliability === 'Watchlist' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {v.reliability === 'High Reliability' && <ShieldCheck className="w-3 h-3 mr-1" />}
                            {v.reliability}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Partner On-Time Arrival Punctuality Ranking (%)
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      Target SLA benchmark: 90% verified on-time check-in arrival
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> &gt;= 90% SLA Achieved
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Watchlist (&lt; 90%)
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={vendorChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `${val}%`} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={120} />
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white p-2.5 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1 font-sans">
                              <div className="font-bold text-slate-900">{d.fullName}</div>
                              <div className="text-[11px] text-slate-500">{d.category} &bull; {d.city}</div>
                              <div className="pt-1 space-y-0.5 border-t border-slate-100">
                                <div className="flex justify-between gap-4">
                                  <span>On-Time Arrival:</span>
                                  <span className="font-bold text-emerald-700">{d.onTimePct}%</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Events Delivered:</span>
                                  <span className="font-bold text-slate-800">{d.events}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Avg Delay:</span>
                                  <span className="font-bold text-slate-800">{d.delay} mins</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Reliability Status:</span>
                                  <span className="font-bold text-amber-700">{d.reliability}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine x={90} stroke="#DC2626" strokeDasharray="3 3" label={{ value: 'SLA 90%', fill: '#DC2626', fontSize: 10 }} />
                      <Bar dataKey="onTimePct" radius={[0, 4, 4, 0]}>
                        {vendorChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.onTimePct >= 90 ? '#059669' : '#D97706'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Category Average Punctuality (%)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {categoryChartData.length} Categories
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => `${val}%`} />
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, 'Avg On-Time']}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Bar dataKey="avgOnTime" name="Avg On-Time %" fill="#714B67" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Export Report (High-Level Ledger Export) */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Export Season 2026 Financial Ledger
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Export consolidated audit records directly queried from PostgreSQL database into formatted CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-slate-600 space-y-2">
            <p className="p-2.5 rounded bg-slate-50 border border-slate-200">
              Includes gross revenue, verified vendor payables, extra plates adjustments, and net agency margin calculations across all {weddingProfits.length} destination weddings.
            </p>
            <div className="text-[11px] text-slate-500">
              File: <code className="text-emerald-700 font-mono">royal_knot_season_2026_ledger.csv</code>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleExportCsv} className="gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV File</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
