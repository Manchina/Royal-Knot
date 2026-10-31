import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Users,
  CreditCard,
  TrendingUp,
  Receipt,
  Building2,
  DollarSign,
  LayoutList,
  LayoutGrid,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import { api } from '../api/client';
import { useWeddingStore } from '../store/useWeddingStore';

interface ProjectBillingItem {
  id: string;
  code: string;
  couple: string;
  brideName?: string;
  groomName?: string;
  city: string;
  venue: string;
  startDate: string;
  guestCount: number;
  packageType: string;
  status: string;
  isFinalised: boolean;
  budget: string;
  rawBudget: number;
  coordinator: string;
  baseContract: string;
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
  billsCount: number;
}

export const Billing: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedWeddingId } = useWeddingStore();

  const [projects, setProjects] = useState<ProjectBillingItem[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const [activeTab, _setActiveTab] = useState<'ongoing' | 'finalised'>('ongoing');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [summary, setSummary] = useState({
    totalBudget: '₹17.25 Cr',
    totalInvoiced: '₹17.38 Cr',
    totalVendorCommitments: '₹13.40 Cr',
    averageGrossMargin: '23.4%',
  });

  // Fetch live projects from backend API
  const fetchBillingProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        summary?: {
          totalBudget: string;
          totalInvoiced: string;
          totalVendorCommitments: string;
          averageGrossMargin: string;
        };
        data?: {
          ongoing: ProjectBillingItem[];
          finalised: ProjectBillingItem[];
          activeList: ProjectBillingItem[];
        };
      }>(`/billing/projects?tab=${activeTab}&status=${stageFilter}&city=${cityFilter}&search=${encodeURIComponent(searchQuery)}`);

      if (res?.success && res.data) {
        const combined = [...(res.data.ongoing || []), ...(res.data.finalised || [])];
        setProjects(combined);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.warn('Failed to load billing projects from API, using fallback store:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingProjects();
  }, [activeTab, stageFilter, cityFilter, searchQuery]);

  // Counts for Stage Filter Pills
  const stageCounts = useMemo(() => {
    return {
      ALL: projects.length,
      LIVE_BIG_DAY: projects.filter((p) => p.status === 'LIVE_BIG_DAY').length,
      IN_PLANNING: projects.filter((p) => p.status === 'IN_PLANNING').length,
      BOOKED: projects.filter((p) => p.status === 'BOOKED').length,
      FINALISED: projects.filter((p) => p.status === 'FINALISED').length,
      FINALISED_SETTLED: projects.filter((p) => p.status === 'FINALISED_SETTLED').length,
    };
  }, [projects]);

  // Filtered List
  const filteredList = useMemo(() => {
    return projects.filter((p) => {
      // Stage check
      if (stageFilter !== 'ALL' && p.status !== stageFilter) return false;

      // City check
      if (cityFilter !== 'ALL' && p.city.toLowerCase() !== cityFilter.toLowerCase()) return false;

      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.code.toLowerCase().includes(q) ||
          p.couple.toLowerCase().includes(q) ||
          p.venue.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [projects, stageFilter, cityFilter, searchQuery]);

  // Helper for status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE_BIG_DAY':
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 gap-1.5 font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Live Big Day
          </Badge>
        );
      case 'IN_PLANNING':
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 gap-1.5 font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Planning
          </Badge>
        );
      case 'BOOKED':
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1.5 font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Booked
          </Badge>
        );
      case 'FINALISED_SETTLED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5 font-semibold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Finalised & Settled
          </Badge>
        );
      case 'FINALISED':
        return (
          <Badge className="bg-teal-50 text-teal-700 border border-teal-200 gap-1.5 font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Audit Complete
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600">
            {status}
          </Badge>
        );
    }
  };

  const handleOpenLedger = (projectId: string) => {
    setSelectedWeddingId(projectId);
    navigate(`/billing/${projectId}`);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Header Banner matching Weddings & Enquiries */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Financial Registry & Commercial Operations
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono font-bold text-[#714B67]">
              Odoo Commercial ERP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#714B67]" />
            Billing & Vendor Settlements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Contract revenue, winning RFQ vendor disbursements, audited extra charge overruns, and milestone accounts reconciliation.
          </p>
        </div>


      </div>

      {/* 2. Executive KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Managed Budget</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">{summary.totalBudget}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>Across {projects.length} luxury weddings</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#714B67] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoiced to Clients</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono tracking-tight">{summary.totalInvoiced}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-medium">
                <Check className="w-3 h-3" />
                <span>Milestones + Audited Extras</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vendor Commitments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">{summary.totalVendorCommitments}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                <CreditCard className="w-3 h-3 text-slate-400" />
                <span>Agreed POs & Sourced Bills</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Realized Gross Margin</p>
              <p className="text-2xl font-bold text-purple-700 mt-1 font-mono tracking-tight">{summary.averageGrossMargin}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>Agency Spread & Markup</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#714B67] flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Stage Pills Filter Toolbar (Matching Weddings.tsx & Enquiries.tsx) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-xs w-fit">
        {[
          { id: 'ALL', label: 'All Projects', count: stageCounts.ALL },
          { id: 'LIVE_BIG_DAY', label: 'Live Big Day', count: stageCounts.LIVE_BIG_DAY },
          { id: 'IN_PLANNING', label: 'In Planning', count: stageCounts.IN_PLANNING },
          { id: 'BOOKED', label: 'Booked', count: stageCounts.BOOKED },
          { id: 'FINALISED', label: 'Finalised', count: stageCounts.FINALISED },
          { id: 'FINALISED_SETTLED', label: 'Settled & Closed', count: stageCounts.FINALISED_SETTLED },
        ].map((tab) => {
          const isActive = stageFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              className={`px-3 py-1.5 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-[#714B67] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search and Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (RW-2026), couple name, venue, or coordinator..."
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          <div className="w-40 shrink-0">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-9 text-xs border-slate-200 bg-slate-50">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Destination Cities</SelectItem>
                <SelectItem value="Udaipur">Udaipur</SelectItem>
                <SelectItem value="Jaipur">Jaipur</SelectItem>
                <SelectItem value="Jodhpur">Jodhpur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 border border-slate-200 rounded p-0.5 bg-slate-50 self-end md:self-auto shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            title="Table View"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'cards' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Projects Content Display */}
      {viewMode === 'table' ? (
        <Card className="border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-200">
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Project & Couple</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">City & Venue</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Budget (Base)</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Invoiced Total</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Vendor Bills</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Vendor Balance</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Margin</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">No wedding projects found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria or stage filter.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((project) => (
                    <TableRow
                      key={project.id}
                      onClick={() => handleOpenLedger(project.id)}
                      className="border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                            {project.code.slice(-3)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 group-hover:text-[#714B67] transition-colors">
                              {project.couple}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                              <span>{project.code}</span>
                              <span>•</span>
                              <span>{project.guestCount} Guests</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="text-xs font-medium text-slate-800">{project.city}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{project.venue}</div>
                      </TableCell>

                      <TableCell className="py-3.5 font-mono text-xs font-semibold text-slate-800">
                        {project.budget}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="font-mono text-xs font-bold text-emerald-700">{project.totalInvoiced}</div>
                        {project.extrasCount > 0 && (
                          <div className="text-[10px] text-amber-600 font-medium">
                            +{project.extrasCount} extra charges
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="font-mono text-xs font-medium text-slate-800">{project.vendorCommitments}</div>
                        <div className="text-[10px] text-slate-500">{project.billsCount} vendor bills</div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <span className={`font-mono text-xs font-bold ${project.rawVendorBalanceDue === 0 ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                          {project.vendorBalanceDue}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-[#714B67] border border-purple-200/50">
                          {project.grossMargin}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5">
                        {renderStatusBadge(project.status)}
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((project) => (
            <Card
              key={project.id}
              onClick={() => handleOpenLedger(project.id)}
              className="border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <CardHeader className="p-4 border-b border-slate-100 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#714B67] bg-[#714B67]/10 px-1.5 py-0.5 rounded">
                      {project.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 group-hover:text-[#714B67] transition-colors">
                      {project.couple}
                    </h3>
                  </div>
                  {renderStatusBadge(project.status)}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {project.city}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {project.guestCount} guests
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Contract Base:</span>
                  <span className="font-mono font-bold text-slate-800">{project.budget}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Client Invoiced:</span>
                  <span className="font-mono font-bold text-emerald-700">{project.totalInvoiced}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vendor Commitments:</span>
                  <span className="font-mono font-semibold text-slate-800">{project.vendorCommitments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-slate-900">{project.vendorBalanceDue}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Gross Margin:</span>
                  <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {project.grossMargin}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Coordinator: <strong className="text-slate-700">{project.coordinator}</strong>
                </span>
                <span className="font-bold text-[#714B67] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open Ledger <ArrowRight className="w-3 h-3" />
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
