import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
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
} from '../components/ui';
import { api } from '../api/client';

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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Filter & Modal States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'High Margin' | 'On Target' | 'Audit Extras'>('ALL');
  const [selectedWedding, setSelectedWedding] = useState<WeddingProfit | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Live PostgreSQL States
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [weddingProfits, setWeddingProfits] = useState<WeddingProfit[]>([]);
  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowPeriod[]>([]);
  const [vendorScorecard, setVendorScorecard] = useState<VendorScoreItem[]>([]);

  // Fetch real PostgreSQL analytics from backend
  const fetchSeasonSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/season-summary');
      if (res && res.success) {
        // Map icons for metric cards
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
  const filteredWeddings = weddingProfits.filter((w) => {
    const matchesSearch =
      w.couple.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Download real CSV ledger of season
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
      {/* Control Panel: Header & Live DB Indicator */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Executive Financial Management
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSeasonSummary}
            disabled={loading}
            className="text-xs gap-1.5 h-8 border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="text-xs gap-1.5 h-8 border-slate-300"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Financial Ledger</span>
          </Button>
        </div>
      </div>

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
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                        m.positive
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

      {/* Wedding-by-Wedding Profitability Matrix */}
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

            {/* Filter & Search Controls */}
            <div className="flex items-center gap-2">
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

              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search code, couple, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-slate-300"
                />
              </div>

              <Badge variant="outline" className="text-xs font-mono py-1">
                {filteredWeddings.length} Weddings
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
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
                <TableHead className="font-bold text-slate-700 text-xs text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Audit & Bill</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredWeddings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-xs text-slate-500">
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
                    <TableCell className="py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWedding(w)}
                        className="h-6 px-2 text-xs text-slate-700"
                      >
                        Audit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Flow Forecast (Scene 6: Milestone Inflows vs Pending Vendor Disbursements) */}
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
            <Badge variant="outline" className="text-xs font-mono font-semibold py-0.5">
              Live Inflow Matching
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      {/* Vendor Scorecard (Scene 6: Reliability based on check-in arrival history) */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Vendor Reliability Scorecard & Check-in Benchmarks
              </CardTitle>
              <div className="text-xs text-slate-500">
                Aggregated punctuality and SLA compliance computed from Day-of Coordinator arrival check-ins
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              {vendorScorecard.length} Partners Audited
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {vendorScorecard.map((v) => {
              const onTimeScore = parseInt(v.onTimeArrivalPct, 10) || 100;
              return (
                <div
                  key={v.id}
                  className="p-3 rounded border border-slate-200 bg-slate-50/40 flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        {v.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                        <span>{v.rating}</span>
                      </div>
                    </div>
                    <div className="font-bold text-xs text-slate-900 truncate" title={v.vendor}>
                      {v.vendor}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {v.eventsDelivered} Events &bull; {v.city}
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">On-Time Arrival:</span>
                      <span className="font-bold text-emerald-800 text-xs font-mono">
                        {v.onTimeArrivalPct}
                      </span>
                    </div>
                    <Progress value={onTimeScore} className="h-1.5" />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>Status:</span>
                      <span
                        className={`font-semibold ${
                          v.reliability === 'High Reliability'
                            ? 'text-emerald-700'
                            : v.reliability === 'Satisfactory'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {v.reliability}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Wedding P&L Audit Detail */}
      {selectedWedding && (
        <Dialog open={!!selectedWedding} onOpenChange={() => setSelectedWedding(null)}>
          <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {selectedWedding.code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedWedding.city}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {selectedWedding.couple}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {selectedWedding.venue} &bull; {selectedWedding.date}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Contracted Client Invoice</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {selectedWedding.clientBilled}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Approved Vendor Accounts</div>
                  <div className="text-sm font-bold font-mono text-slate-700 mt-0.5">
                    {selectedWedding.vendorCosts}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Net Project Margin
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Direct margin after coordinator & operational allocations
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-emerald-900">
                    {selectedWedding.netProfit}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    {selectedWedding.marginPct}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-slate-600 text-xs border-t border-slate-100 pt-2">
                <div className="flex justify-between">
                  <span>Assigned Planner:</span>
                  <span className="font-semibold text-slate-900">{selectedWedding.leadPlanner}</span>
                </div>
                <div className="flex justify-between">
                  <span>Audited Guest Headcount:</span>
                  <span className="font-semibold text-slate-900">{selectedWedding.guests} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span>Reconciliation Status:</span>
                  <span className="font-bold text-slate-900">{selectedWedding.status}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedWedding(null)}>
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const targetCode = selectedWedding.code;
                  setSelectedWedding(null);
                  navigate(`/billing/${targetCode}`);
                }}
                className="gap-1.5"
              >
                <span>Open Invoicing & Extra Plates Audit</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Export Report */}
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
