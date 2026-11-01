import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  Star,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Table as TableIcon,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  Filter,
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
  Cell,
  PieChart,
  Pie,
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
  TablePagination,
} from '../ui';
import {
  useAnalyticsStore,
  type WeddingProfit,
  type CashFlowPeriod,
  type VendorScoreItem,
  type MetricCardItem,
  type SeasonSummaryResponse,
} from '../../store/useAnalyticsStore';

export type { WeddingProfit, CashFlowPeriod, VendorScoreItem, MetricCardItem, SeasonSummaryResponse };

interface ExecutiveDashboardProps {
  selectedCouple?: string;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  selectedCouple = 'ALL',
}) => {
  // Global Analytics Zustand Store
  const {
    metrics,
    weddingProfits,
    cashFlowForecast,
    vendorScorecard,
    loading,
    fetchSeasonSummary,
  } = useAnalyticsStore();

  // View modes for individual sections ('table' | 'chart')
  const [profitViewMode, setProfitViewMode] = useState<'table' | 'chart'>('table');
  const [cashFlowViewMode, setCashFlowViewMode] = useState<'table' | 'chart'>('table');
  const [vendorViewMode, setVendorViewMode] = useState<'table' | 'chart'>('table');

  // Filter & Export States
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [packageFilter, setPackageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'High Margin' | 'On Target' | 'Audit Extras'>('ALL');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>('ALL');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Table pagination state
  const [profitPage, setProfitPage] = useState(1);
  const profitPageSize = 6;

  useEffect(() => {
    fetchSeasonSummary();
  }, [fetchSeasonSummary]);

  // Reset page when filters change
  useEffect(() => {
    setProfitPage(1);
  }, [searchTerm, cityFilter, packageFilter, statusFilter, selectedCouple]);

  // Filtered weddings for matrix
  const filteredWeddings = useMemo(() => {
    return weddingProfits.filter((w) => {
      if (selectedCouple !== 'ALL' && w.code !== selectedCouple) {
        return false;
      }
      if (cityFilter !== 'ALL' && w.city?.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }
      if (packageFilter !== 'ALL' && w.packageType !== packageFilter) {
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
  }, [weddingProfits, selectedCouple, cityFilter, packageFilter, searchTerm, statusFilter]);

  const paginatedWeddings = useMemo(() => {
    const start = (profitPage - 1) * profitPageSize;
    return filteredWeddings.slice(start, start + profitPageSize);
  }, [filteredWeddings, profitPage, profitPageSize]);

  // Pie Chart Data: Revenue Distribution by Package Type
  const packageDistributionData = useMemo(() => {
    let fullServiceRev = 0;
    let partialDayOfRev = 0;
    let fullServiceCount = 0;
    let partialDayOfCount = 0;

    filteredWeddings.forEach((w) => {
      const rev = w.clientBilledNum || 0;
      if (w.packageType === 'PARTIAL_DAY_OF') {
        partialDayOfRev += rev;
        partialDayOfCount += 1;
      } else {
        fullServiceRev += rev;
        fullServiceCount += 1;
      }
    });

    const total = fullServiceRev + partialDayOfRev;
    if (total === 0) return [];

    return [
      {
        name: 'Full-Service Planning',
        value: fullServiceRev,
        formattedValue: `₹${(fullServiceRev / 10000000).toFixed(2)} Cr`,
        pct: ((fullServiceRev / total) * 100).toFixed(1),
        count: fullServiceCount,
        color: '#714B67',
      },
      {
        name: 'Partial / Day-Of Service',
        value: partialDayOfRev,
        formattedValue: `₹${(partialDayOfRev / 10000000).toFixed(2)} Cr`,
        pct: ((partialDayOfRev / total) * 100).toFixed(1),
        count: partialDayOfCount,
        color: '#059669',
      },
    ];
  }, [filteredWeddings]);

  // Pie Chart Data: Destination Market Share (Jaipur vs Udaipur)
  const destinationDistributionData = useMemo(() => {
    const cityMap = new Map<string, { rev: number; count: number }>();
    filteredWeddings.forEach((w) => {
      const city = w.city || 'Other';
      const current = cityMap.get(city) || { rev: 0, count: 0 };
      cityMap.set(city, {
        rev: current.rev + (w.clientBilledNum || 0),
        count: current.count + 1,
      });
    });

    const total = Array.from(cityMap.values()).reduce((sum, item) => sum + item.rev, 0);
    if (total === 0) return [];

    const colorPalette = ['#714B67', '#0284C7', '#D97706', '#059669', '#64748B'];
    return Array.from(cityMap.entries()).map(([cityName, stats], index) => ({
      name: cityName,
      value: stats.rev,
      formattedValue: `₹${(stats.rev / 10000000).toFixed(2)} Cr`,
      pct: ((stats.rev / total) * 100).toFixed(1),
      count: stats.count,
      color: colorPalette[index % colorPalette.length],
    }));
  }, [filteredWeddings]);

  // Pie Chart Data: Margin Health Distribution
  const marginHealthDistributionData = useMemo(() => {
    let highMarginCount = 0;
    let onTargetCount = 0;
    let auditExtrasCount = 0;

    filteredWeddings.forEach((w) => {
      if (w.status === 'High Margin') highMarginCount++;
      else if (w.status === 'Audit Extras') auditExtrasCount++;
      else onTargetCount++;
    });

    const total = filteredWeddings.length;
    if (total === 0) return [];

    return [
      {
        name: 'High Margin (≥23.5%)',
        value: highMarginCount,
        pct: ((highMarginCount / total) * 100).toFixed(0),
        color: '#059669',
      },
      {
        name: 'On Target Plan',
        value: onTargetCount,
        pct: ((onTargetCount / total) * 100).toFixed(0),
        color: '#0284C7',
      },
      {
        name: 'Audit Extras (Overtime/Plates)',
        value: auditExtrasCount,
        pct: ((auditExtrasCount / total) * 100).toFixed(0),
        color: '#D97706',
      },
    ];
  }, [filteredWeddings]);

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

  const renderCustomPieTooltip = (props: {
    active?: boolean;
    payload?: readonly {
      payload?: {
        name: string;
        value: number;
        formattedValue?: string;
        pct: string;
        count?: number;
        color: string;
      };
    }[];
  }) => {
    if (!props.active || !props.payload || props.payload.length === 0 || !props.payload[0]?.payload) return null;
    const data = props.payload[0].payload;
    return (
      <div className="bg-white p-2.5 rounded-lg shadow-lg border border-slate-200 text-xs space-y-0.5">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
          {data.name}
        </div>
        {data.formattedValue && (
          <div className="text-slate-700 font-mono font-semibold">
            Revenue: {data.formattedValue}
          </div>
        )}
        {data.count !== undefined && (
          <div className="text-slate-500 text-[11px]">
            Weddings: {data.count} ({data.pct}%)
          </div>
        )}
        {!data.formattedValue && data.pct && (
          <div className="text-slate-600 font-medium">
            Share: {data.pct}% ({data.value} weddings)
          </div>
        )}
      </div>
    );
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
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
            Season 2026 Profitability & Cash Flow Review
          </h1>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="text-xs gap-1.5 h-8 border-slate-300"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Export Ledger</span>
          </Button>
        </div>
      </div>

      {/* Module-Aligned Filter Toolbar */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-[#714B67]" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Executive Filters:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* City Filter */}
              <div className="w-28 sm:w-32">
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

              {/* Package Filter */}
              <div className="w-32 sm:w-36">
                <Select value={packageFilter} onValueChange={(val) => setPackageFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="All Packages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Packages</SelectItem>
                    <SelectItem value="FULL_SERVICE">Full-Service</SelectItem>
                    <SelectItem value="PARTIAL_DAY_OF">Partial / Day-of</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Margin Status Filter */}
              <div className="w-32 sm:w-36">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as 'ALL' | 'High Margin' | 'On Target' | 'Audit Extras')}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="All Margins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Margins</SelectItem>
                    <SelectItem value="High Margin">High Margin (&gt;23%)</SelectItem>
                    <SelectItem value="On Target">On Target</SelectItem>
                    <SelectItem value="Audit Extras">Audit Extras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search input */}
              <div className="relative w-40 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search couple, venue..."
                  className="h-8 text-xs pl-8 bg-white border-slate-300"
                />
              </div>

              {(cityFilter !== 'ALL' || packageFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setCityFilter('ALL');
                    setPackageFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="text-xs text-[#714B67] hover:underline font-semibold cursor-pointer px-1"
                >
                  Reset
                </button>
              )}

              <Badge variant="outline" className="text-xs font-mono">
                {filteredWeddings.length} Weddings
              </Badge>
            </div>
          </div>
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

      {/* Season Visual Intelligence & Mix Breakdown (3 Interactive Pie Charts) */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#714B67]" />
              <CardTitle className="text-xs font-bold text-slate-900">
                Season Mix & Portfolio Breakdown
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              {filteredWeddings.length} Active Weddings
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Revenue by Package Type */}
            <div className="flex flex-col items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-0.5">
                Revenue by Package
              </div>
              <div className="text-[11px] text-slate-500 mb-2">
                Full-Service vs Partial Day-Of
              </div>
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={packageDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                    >
                      {packageDistributionData.map((entry, index) => (
                        <Cell key={`cell-pkg-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={renderCustomPieTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1 mt-2 text-[11px]">
                {packageDistributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate text-slate-600">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {item.pct}% ({item.formattedValue})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Destination Market Share */}
            <div className="flex flex-col items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-0.5">
                Destination Market Share
              </div>
              <div className="text-[11px] text-slate-500 mb-2">
                Jaipur vs Udaipur Portfolio
              </div>
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={destinationDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                    >
                      {destinationDistributionData.map((entry, index) => (
                        <Cell key={`cell-city-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={renderCustomPieTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1 mt-2 text-[11px]">
                {destinationDistributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate text-slate-600">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {item.pct}% ({item.formattedValue})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Season Margin Health */}
            <div className="flex flex-col items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-0.5">
                Agency Margin Health
              </div>
              <div className="text-[11px] text-slate-500 mb-2">
                P&L Status & Extra Costs Audit
              </div>
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marginHealthDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                    >
                      {marginHealthDistributionData.map((entry, index) => (
                        <Cell key={`cell-margin-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={renderCustomPieTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1 mt-2 text-[11px]">
                {marginHealthDistributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate text-slate-600">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {item.pct}% ({item.value} weddings)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 1: Wedding-by-Wedding Profitability Matrix (Read-Only) */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Season Profitability Matrix
                </CardTitle>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Contracted billing vs approved vendor payouts with agency margin health
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Local View Toggle */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded border border-slate-300">
                <button
                  type="button"
                  onClick={() => setProfitViewMode('table')}
                  title="Table View"
                  className={`p-1 rounded text-xs transition ${profitViewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setProfitViewMode('chart')}
                  title="Chart View"
                  className={`p-1 rounded text-xs transition ${profitViewMode === 'chart' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
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
            <>
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
                    paginatedWeddings.map((w) => (
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
              <TablePagination
                currentPage={profitPage}
                totalItems={filteredWeddings.length}
                pageSize={profitPageSize}
                onPageChange={setProfitPage}
                itemName="weddings"
              />
            </>
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
                      content={({ active, payload }) => {
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
                      formatter={(value, name) => [`₹${String(value)} L`, String(name)]}
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
                        content={({ active, payload }) => {
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
                        formatter={(val) => [`${String(val)}%`, 'Avg On-Time']}
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
