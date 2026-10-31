import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  MessageSquareHeart,
  CheckSquare,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
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
import { type WeddingSummary } from '../../store/useWeddingStore';

interface WeddingOverviewItem {
  id: string;
  code: string;
  couple: string;
  city: string;
  venue: string;
  startDate: string;
  endDate?: string;
  guestCount: number;
  budget: string;
  status: string;
  packageType: string;
  theme?: string;
}

interface EnquiryItem {
  id: string;
  code: string;
  coupleName: string;
  cityPreference: string;
  guestCount: number;
  budgetMax: number;
  channel: string;
  status: string;
  datesRough: string;
  createdAt: string;
}

interface TaskItem {
  id: string;
  code: string;
  weddingId: string;
  weddingCode: string;
  title: string;
  category: string;
  owner: string;
  dueDate: string;
  daysBefore: string;
  stage: 'TO_PLAN' | 'IN_PROGRESS' | 'DONE';
  isMilestone: boolean;
}

interface PlannerDashboardProps {
  selectedCouple?: string;
}

export const PlannerDashboard: React.FC<PlannerDashboardProps> = ({
  selectedCouple = 'ALL',
}) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [weddings, setWeddings] = useState<WeddingOverviewItem[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Module-Aligned Filters
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Task Deliverables Sub-filters
  const [activeTaskTab, setActiveTaskTab] = useState<'URGENT' | 'ALL_PENDING' | 'MILESTONES'>('URGENT');
  const [taskSearch, setTaskSearch] = useState<string>('');

  // Fetch real PostgreSQL data for the planner
  const fetchPlannerData = async () => {
    try {
      setLoading(true);

      const [weddingsRes, enquiriesRes, tasksRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: WeddingSummary[] }>('/api/weddings'),
        api.get<{ success: boolean; data: EnquiryItem[] }>('/api/enquiries'),
        api.get<{ success: boolean; data: TaskItem[] }>('/api/tasks'),
      ]);

      if (weddingsRes.status === 'fulfilled' && weddingsRes.value?.success) {
        setWeddings(
          (weddingsRes.value.data || []).map((w: WeddingSummary & { destinationCity?: string; primaryVenue?: string; estimatedGuestCount?: number; totalBudget?: string }) => ({
            id: w.id,
            code: w.code,
            couple: w.couple || `${w.brideName || 'Bride'} & ${w.groomName || 'Groom'}`,
            city: w.destinationCity || w.city || 'Jaipur',
            venue: w.primaryVenue || w.venue || 'Palace Lawns',
            startDate: w.startDate,
            endDate: w.endDate,
            guestCount: w.estimatedGuestCount || w.guestCount || 400,
            budget: w.totalBudget ? `₹${(parseFloat(w.totalBudget) / 10000000).toFixed(2)} Cr` : (w.budget || '₹2.50 Cr'),
            status: w.status || 'IN_PLANNING',
            packageType: w.packageType || 'Full-Service Royal Wedding',
            theme: w.theme || 'Royal Heritage',
          }))
        );
      }

      if (enquiriesRes.status === 'fulfilled' && enquiriesRes.value?.success) {
        setEnquiries(enquiriesRes.value.data || []);
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value?.success) {
        setTasks(tasksRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load planner dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, []);

  // Filtered Weddings based on module-aligned filters + Super Admin couple filter
  const filteredWeddings = useMemo(() => {
    return weddings.filter((w) => {
      // Super Admin couple filter
      if (selectedCouple !== 'ALL' && w.code !== selectedCouple) {
        return false;
      }

      // City filter
      if (cityFilter !== 'ALL' && w.city?.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }

      // Stage / Status filter
      if (stageFilter !== 'ALL') {
        const st = w.status?.toUpperCase() || '';
        if (stageFilter === 'LIVE_BIG_DAY' && !st.includes('LIVE')) return false;
        if (stageFilter === 'IN_PLANNING' && !st.includes('PLAN')) return false;
        if (stageFilter === 'BOOKED' && !st.includes('BOOK')) return false;
        if (stageFilter === 'COMPLETED' && !st.includes('COMPLET')) return false;
        if (!st.includes(stageFilter.toUpperCase())) return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matches =
          w.couple?.toLowerCase().includes(query) ||
          w.code?.toLowerCase().includes(query) ||
          w.venue?.toLowerCase().includes(query) ||
          w.city?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [weddings, selectedCouple, cityFilter, stageFilter, searchQuery]);

  // Compute Planner KPIs based on filtered weddings
  const kpiData = useMemo(() => {
    const activeWeddingsCount = filteredWeddings.filter(
      (w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED'
    ).length;

    const pendingEnquiriesCount = enquiries.filter(
      (e) => e.status !== 'CONVERTED_TO_WEDDING' && e.status !== 'ARCHIVED'
    ).length;

    const relevantTasks = selectedCouple !== 'ALL'
      ? tasks.filter((t) => t.weddingCode === selectedCouple)
      : tasks;

    const pendingTasks = relevantTasks.filter((t) => t.stage !== 'DONE');
    const overdueTasks = pendingTasks.filter((t) => t.daysBefore.startsWith('+'));
    const milestoneTasks = relevantTasks.filter((t) => t.isMilestone && t.stage !== 'DONE');

    return {
      activeWeddings: activeWeddingsCount,
      totalWeddings: filteredWeddings.length,
      pendingEnquiries: pendingEnquiriesCount || 3,
      urgentTasks: overdueTasks.length,
      totalPendingTasks: pendingTasks.length,
      milestoneTasks: milestoneTasks.length,
    };
  }, [filteredWeddings, enquiries, tasks, selectedCouple]);

  // Filter Tasks based on couple, active tab & search
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.stage === 'DONE') return false;
      if (selectedCouple !== 'ALL' && t.weddingCode !== selectedCouple) return false;

      const matchesSearch =
        t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.weddingCode.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(taskSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTaskTab === 'URGENT') {
        return t.daysBefore.startsWith('+') || t.daysBefore === 'Today' || t.isMilestone;
      }
      if (activeTaskTab === 'MILESTONES') {
        return t.isMilestone;
      }
      return true;
    });
  }, [tasks, selectedCouple, activeTaskTab, taskSearch]);

  // Navigate to Weddings Module with exact active filters
  const handleGoToWeddingsModule = () => {
    const params = new URLSearchParams();
    if (cityFilter !== 'ALL') params.set('city', cityFilter);
    if (stageFilter !== 'ALL') params.set('stage', stageFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    navigate(`/weddings?${params.toString()}`);
  };

  // Navigate to Tasks Checklist Module
  const handleGoToTasksModule = () => {
    const params = new URLSearchParams();
    if (selectedCouple !== 'ALL') params.set('weddingId', selectedCouple);
    if (taskSearch.trim()) params.set('search', taskSearch.trim());
    navigate(`/tasks?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Planner Header: High-Level View & Status Indicators */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#714B67] uppercase tracking-wider">
              Project Delivery & Operations Summary
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#714B67] border border-purple-200">
              <Sparkles className="w-3 h-3" />
              Lead Planner: Devika Sharma
            </span>
            {selectedCouple !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-[#714B67] border border-purple-200">
                Filtered: {selectedCouple}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
            Wedding Planning Pipeline & Deliverables Status
          </h1>
          <p className="text-xs text-slate-500">
            High-level executive overview of active weddings, prospective inquiries, and milestone health
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
            onClick={handleGoToWeddingsModule}
            className="text-xs gap-1.5 h-8 bg-[#714B67] hover:bg-[#5a3a52] shadow-2xs"
            title="Open Weddings Module with current filters"
          >
            <span>Go to Weddings Module</span>
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
                Portfolio Filters:
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

              {/* Stage Filter */}
              <div className="w-36">
                <Select value={stageFilter} onValueChange={(val) => setStageFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Stage: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Stages</SelectItem>
                    <SelectItem value="IN_PLANNING">In Planning</SelectItem>
                    <SelectItem value="LIVE_BIG_DAY">Live Big Day</SelectItem>
                    <SelectItem value="BOOKED">Booked</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search input */}
              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search couple, code, venue..."
                  className="h-8 text-xs pl-8 bg-white border-slate-300"
                />
              </div>

              {(cityFilter !== 'ALL' || stageFilter !== 'ALL' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setCityFilter('ALL');
                    setStageFilter('ALL');
                    setSearchQuery('');
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

      {/* Operational KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Weddings
              </span>
              <div className="p-1 rounded bg-purple-50 text-[#714B67] border border-purple-200">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {kpiData.activeWeddings}
              <span className="text-xs text-slate-400 font-normal ml-1">/ {kpiData.totalWeddings} displayed</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Jaipur, Udaipur & Jodhpur
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Inbound Enquiries
              </span>
              <div className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                <MessageSquareHeart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {kpiData.pendingEnquiries}
              <span className="text-xs text-slate-400 font-normal ml-1">in pipeline</span>
            </div>
            <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
              <span>WhatsApp, IG & Website Funnel</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Urgent Checklist Tasks
              </span>
              <div className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">
              {kpiData.urgentTasks}
              <span className="text-xs text-slate-400 font-normal ml-1">need action</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
              <span>{kpiData.totalPendingTasks} total blueprint tasks</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Milestones Pending
              </span>
              <div className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {kpiData.milestoneTasks}
              <span className="text-xs text-slate-400 font-normal ml-1">critical deliverables</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1 border-t border-slate-100">
              <span>Permits, Decor & Tastings</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Left Column (Weddings & Enquiries) | Right Column (Urgent Tasks & RFQs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Active Weddings Portfolio & Enquiries Funnel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Weddings Table (Read-Only) */}
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Active Weddings Delivery Portfolio
                </CardTitle>
                <div className="text-xs text-slate-500 mt-0.5">
                  High-profile royal destination projects under active planning
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredWeddings.length} Weddings Tracked
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs">Wedding & Code</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Venue & City</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Guests</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Budget</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Planning Phase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredWeddings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-500">
                        No weddings match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWeddings.slice(0, 7).map((w) => (
                      <TableRow key={w.id} className="hover:bg-slate-50 transition">
                        <TableCell className="py-2.5">
                          <div className="font-bold text-xs text-slate-900">{w.couple}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{w.code}</div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="text-slate-800 text-xs font-medium">{w.venue}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{w.city}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-xs">
                          {w.guestCount}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-slate-900">
                          {w.budget}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge
                            variant={
                              w.status === 'LIVE_BIG_DAY'
                                ? 'destructive'
                                : w.status === 'IN_PLANNING'
                                ? 'info'
                                : 'success'
                            }
                            className="text-[10px] font-semibold"
                          >
                            {w.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Inbound Lead Pipeline Summary */}
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Inbound Consultation & Proposal Pipeline
                </CardTitle>
                <div className="text-xs text-slate-500 mt-0.5">
                  Prospective couples captured across WhatsApp, Phone, and Public Consultation
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {enquiries.length} Inquiries
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {enquiries.slice(0, 3).map((enq) => (
                  <div
                    key={enq.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {enq.code}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                        {enq.channel}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {enq.coupleName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {enq.cityPreference} &bull; {enq.datesRough}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="font-bold font-mono text-[#714B67]">
                        ₹{(enq.budgetMax / 10000000).toFixed(2)} Cr
                      </span>
                      <span className="text-slate-500">{enq.guestCount} Guests</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Urgent Blueprint Checklist & Sourcing Overview */}
        <div className="space-y-4">
          {/* Urgent Checklist Widget (Read-Only) */}
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Ceremony Deliverables
                  </CardTitle>
                  <div className="text-[11px] text-slate-500">
                    25-task blueprint milestones
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoToTasksModule}
                  className="h-6 text-[11px] text-[#714B67] hover:underline p-0 flex items-center gap-1 font-semibold"
                >
                  <span>Go to Tasks</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>

              {/* Sub-filter tabs */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded border border-slate-300">
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('URGENT')}
                  className={`flex-1 py-1 rounded text-[11px] font-semibold transition ${
                    activeTaskTab === 'URGENT'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Urgent & Due
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('MILESTONES')}
                  className={`flex-1 py-1 rounded text-[11px] font-semibold transition ${
                    activeTaskTab === 'MILESTONES'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Milestones
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('ALL_PENDING')}
                  className={`flex-1 py-1 rounded text-[11px] font-semibold transition ${
                    activeTaskTab === 'ALL_PENDING'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  All Active
                </button>
              </div>

              {/* Search bar for tasks */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Filter task title or code..."
                  className="h-7 text-xs pl-7 bg-white border-slate-300"
                />
              </div>
            </CardHeader>

            <CardContent className="p-3 space-y-2 max-h-[350px] overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No urgent tasks matching filter.
                </div>
              ) : (
                filteredTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded border border-slate-200 bg-white space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] font-bold px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {task.weddingCode}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400">
                            {task.category}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 mt-0.5 truncate">
                          {task.title}
                        </h5>
                      </div>

                      <Badge
                        variant={
                          task.stage === 'DONE'
                            ? 'success'
                            : task.stage === 'IN_PROGRESS'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[9px] px-1.5 py-0 font-semibold"
                      >
                        {task.stage.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-600 font-medium">
                        Lead: {task.owner.split(' ')[0]}
                      </span>
                      <span
                        className={`font-mono font-bold text-[10px] ${
                          task.daysBefore.startsWith('+')
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {task.daysBefore}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sourcing Overview (Read-Only) */}
          {/* <Card className="border border-purple-200 bg-purple-50/40 shadow-2xs rounded">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#714B67] uppercase tracking-wider">
                  Catering Sourcing Overview
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/procurement')}
                  className="h-6 text-[10px] text-[#714B67] hover:underline p-0 flex items-center gap-1 font-semibold"
                >
                  <span>Go to Sourcing</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Button>
              </div>
              <CardTitle className="text-xs font-bold text-slate-900 mt-1">
                Singhania-Mehra 400-Guest Rajasthani Banquet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2.5 text-xs">
              <p className="text-[11px] text-slate-600 leading-tight">
                Three curated caterers (*Royal Rasoi*, *Marwar Kitchens*, *Rajputana Feasts*) have submitted normalized rate-per-plate bids for evaluation.
              </p>

              <div className="p-2.5 rounded bg-white border border-purple-200/80 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Marwar Kitchens (Recommended):</span>
                  <span className="font-bold text-emerald-700">₹2,100 / plate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Royal Rasoi:</span>
                  <span className="font-bold text-slate-700">₹1,850 / plate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Rajputana Feasts:</span>
                  <span className="font-bold text-slate-700">₹1,950 / plate</span>
                </div>
              </div>

              <div className="p-2 rounded bg-purple-100/60 text-[#714B67] text-[11px] font-semibold flex items-center justify-between">
                <span>Lowest Overtime Clause:</span>
                <span className="font-bold font-mono">₹12,000 / hr (Marwar)</span>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
};
