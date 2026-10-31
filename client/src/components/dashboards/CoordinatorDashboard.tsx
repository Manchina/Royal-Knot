import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Users,
  MapPin,
  Flame,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Button,
} from '../ui';
import { api } from '../../api/client';

interface RunSheetItem {
  id: string;
  weddingId: string;
  timeSlot: string;
  activityTitle: string;
  location: string;
  owner: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  notes?: string;
}

interface VendorCheckinItem {
  id: string;
  vendorId: string;
  vendor: string;
  category: string;
  phone: string;
  scheduled: string;
  actual?: string;
  status: 'ARRIVED' | 'RUNNING_LATE' | 'SCHEDULED';
  delayMinutes: number;
}

interface IncidentItem {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'INVESTIGATING' | 'RESOLVED';
  assignedTo: string;
  time: string;
  resolutionNotes?: string;
}

interface CoordinatorDashboardProps {
  selectedCouple?: string;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  selectedCouple = 'ALL',
}) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [activeWeddingCode, setActiveWeddingCode] = useState<string>(
    selectedCouple !== 'ALL' ? selectedCouple : 'RW-2026-001'
  );

  // Sync when selectedCouple prop changes
  useEffect(() => {
    if (selectedCouple && selectedCouple !== 'ALL') {
      setActiveWeddingCode(selectedCouple);
    }
  }, [selectedCouple]);

  const [runSheet, setRunSheet] = useState<RunSheetItem[]>([]);
  const [checkins, setCheckins] = useState<VendorCheckinItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [headcount, setHeadcount] = useState<{ contracted: number; actual: number; extraRate: number }>({
    contracted: 400,
    actual: 460,
    extraRate: 2100,
  });

  // Module-Aligned Filters
  const [runSheetStatusFilter, setRunSheetStatusFilter] = useState<string>('ALL');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>('ALL');
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch Day-Of Operations Telemetry from PostgreSQL
  const fetchDayOfData = async (targetCode: string) => {
    try {
      setLoading(true);

      const [runSheetRes, checkinsRes, incidentsRes, headcountRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: any[] }>(`/api/day-of/run-sheet?weddingId=${targetCode}`),
        api.get<{ success: boolean; data: any[] }>(`/api/day-of/vendor-checkins?weddingId=${targetCode}`),
        api.get<{ success: boolean; data: any[] }>(`/api/day-of/incidents?weddingId=${targetCode}`),
        api.get<{ success: boolean; data: any }>(`/api/day-of/headcount?weddingId=${targetCode}`),
      ]);

      if (runSheetRes.status === 'fulfilled' && runSheetRes.value?.success) {
        setRunSheet(runSheetRes.value.data || []);
      }

      if (checkinsRes.status === 'fulfilled' && checkinsRes.value?.success) {
        setCheckins(checkinsRes.value.data || []);
      }

      if (incidentsRes.status === 'fulfilled' && incidentsRes.value?.success) {
        setIncidents(incidentsRes.value.data || []);
      }

      if (headcountRes.status === 'fulfilled' && headcountRes.value?.success && headcountRes.value.data) {
        setHeadcount({
          contracted: headcountRes.value.data.contractedCount || 400,
          actual: headcountRes.value.data.actualCount || 460,
          extraRate: headcountRes.value.data.ratePerPlate || 2100,
        });
      }
    } catch (err) {
      console.error('Failed to load day-of dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayOfData(activeWeddingCode);
  }, [activeWeddingCode]);

  // Filtered Run Sheet
  const filteredRunSheet = useMemo(() => {
    return runSheet.filter((item) => {
      if (runSheetStatusFilter !== 'ALL' && item.status !== runSheetStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.activityTitle.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.owner.toLowerCase().includes(q) ||
          item.timeSlot.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [runSheet, runSheetStatusFilter, searchQuery]);

  // Filtered Vendor Checkins
  const filteredCheckins = useMemo(() => {
    return checkins.filter((c) => {
      if (vendorCategoryFilter !== 'ALL' && !c.category.toUpperCase().includes(vendorCategoryFilter.toUpperCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.vendor.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [checkins, vendorCategoryFilter, searchQuery]);

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (incidentSeverityFilter !== 'ALL' && inc.severity !== incidentSeverityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          inc.title.toLowerCase().includes(q) ||
          inc.assignedTo.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [incidents, incidentSeverityFilter, searchQuery]);

  // Compute Live KPIs
  const currentSlot = useMemo(() => {
    const inProgress = runSheet.find((r) => r.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;
    const upcoming = runSheet.find((r) => r.status === 'UPCOMING');
    return upcoming || runSheet[0];
  }, [runSheet]);

  const vendorArrivalStats = useMemo(() => {
    const total = filteredCheckins.length || checkins.length || 18;
    const arrived = filteredCheckins.filter((c) => c.status === 'ARRIVED').length;
    const late = filteredCheckins.filter((c) => c.status === 'RUNNING_LATE').length;
    return { total, arrived, late };
  }, [filteredCheckins, checkins]);

  const openIncidents = useMemo(() => {
    return filteredIncidents.filter((i) => i.status === 'INVESTIGATING');
  }, [filteredIncidents]);

  const extraGuestsCount = Math.max(0, headcount.actual - headcount.contracted);
  const extraChargesTotal = extraGuestsCount * headcount.extraRate;

  // Navigate to Day-Of Ops Module
  const handleGoToDayOfModule = () => {
    navigate(`/day-of?weddingId=${activeWeddingCode}`);
  };

  return (
    <div className="space-y-4">
      {/* Live Operations Header & Wedding Selector */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              BIG DAY COMMAND CENTER &bull; LIVE TELEMETRY
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Coordinator: Karan Verma (Taj Lake Palace)
            </span>
            {selectedCouple !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-[#714B67] border border-purple-200">
                Filtered: {selectedCouple}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            Real-Time Ground Operations & Live Incident Status
          </h1>
          <p className="text-xs text-slate-500">
            High-level live monitoring of minute-by-minute cues, gate check-in punctuality, and ground incidents
          </p>
        </div>

        {/* Live Wedding Project Switcher & Go to Module */}
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
            onClick={handleGoToDayOfModule}
            className="text-xs gap-1.5 h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold shadow-2xs"
            title="Open Day-Of Operations Module with active wedding project"
          >
            <span>Go to Day-Of Module</span>
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
                Ground Telemetry Filters:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Run-Sheet Status Filter */}
              <div className="w-32">
                <Select value={runSheetStatusFilter} onValueChange={(val) => setRunSheetStatusFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Cue: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Run Cues</SelectItem>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vendor Category Filter */}
              <div className="w-36">
                <Select value={vendorCategoryFilter} onValueChange={(val) => setVendorCategoryFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Vendors: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Vendors</SelectItem>
                    <SelectItem value="CATERER">Catering</SelectItem>
                    <SelectItem value="DECORATOR">Decor</SelectItem>
                    <SelectItem value="DJ">Sound & DJ</SelectItem>
                    <SelectItem value="FLORIST">Florist</SelectItem>
                    <SelectItem value="PHOTO">Photography</SelectItem>
                    <SelectItem value="LOGISTICS">Logistics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Incident Severity Filter */}
              <div className="w-32">
                <Select value={incidentSeverityFilter} onValueChange={(val) => setIncidentSeverityFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="Incident: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Incidents</SelectItem>
                    <SelectItem value="HIGH">High Severity</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search input */}
              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter cue, vendor..."
                  className="h-8 text-xs pl-8 bg-white border-slate-300"
                />
              </div>

              {(runSheetStatusFilter !== 'ALL' || vendorCategoryFilter !== 'ALL' || incidentSeverityFilter !== 'ALL' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setRunSheetStatusFilter('ALL');
                    setVendorCategoryFilter('ALL');
                    setIncidentSeverityFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#714B67] hover:underline font-semibold cursor-pointer px-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Operational Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Current Activity
              </span>
              <div className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {currentSlot ? currentSlot.activityTitle : 'Varmala & Pheras Assembly'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="font-mono font-bold text-[#714B67]">
                {currentSlot ? currentSlot.timeSlot : '17:30 PM'}
              </span>
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                {currentSlot?.status || 'IN PROGRESS'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Vendor Gate Check-Ins
              </span>
              <div className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {vendorArrivalStats.arrived} / {vendorArrivalStats.total}
              <span className="text-xs text-slate-400 font-normal ml-1">On-Site</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-amber-700 font-bold">
                {vendorArrivalStats.late} Running Late
              </span>
              <span className="text-slate-400">Gate Telemetry</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Incidents
              </span>
              <div className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">
              {openIncidents.length}
              <span className="text-xs text-slate-400 font-normal ml-1">Investigating</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>{filteredIncidents.filter((i) => i.status === 'RESOLVED').length} Resolved</span>
              <span className="font-semibold text-rose-600">Active Radar</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Banquet Extra Plates
              </span>
              <div className="p-1 rounded bg-purple-50 text-[#714B67] border border-purple-200">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {headcount.actual}
              <span className="text-xs text-rose-600 font-bold ml-1">
                (+{extraGuestsCount} Extras)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-slate-500">Contracted: {headcount.contracted}</span>
              <span className="font-mono font-bold text-emerald-700">
                +₹{(extraChargesTotal / 1000).toFixed(0)}k Due
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Ground Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Live Run-Sheet Timeline (Read-Only) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Minute-by-Minute Ceremony Run Sheet
                </CardTitle>
                <div className="text-xs text-slate-500 mt-0.5">
                  Synchronized schedule for florists, sound, baraat, and dining
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredRunSheet.length} Timed Activities
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs w-24">Time</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Activity & Venue</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Lead</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredRunSheet.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-xs text-slate-500">
                        No run sheet activities match the current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRunSheet.slice(0, 7).map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition">
                        <TableCell className="py-2.5 font-mono font-bold text-xs text-slate-900">
                          {item.timeSlot}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="font-bold text-xs text-slate-900">{item.activityTitle}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-slate-700 font-medium">
                          {item.owner || 'Karan V.'}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge
                            variant={
                              item.status === 'COMPLETED'
                                ? 'success'
                                : item.status === 'IN_PROGRESS'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-[10px] font-semibold"
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Active Incidents Log (Read-Only) */}
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>Ground Incidents & Dispatch Log</span>
                </CardTitle>
                <div className="text-xs text-slate-500 mt-0.5">
                  Real-time issue logging (generator requests, delay mitigation)
                </div>
              </div>
              <Badge variant="destructive" className="text-xs font-mono">
                {openIncidents.length} Unresolved
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 space-y-2.5">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active incidents recorded for this event.
                </div>
              ) : (
                filteredIncidents.slice(0, 4).map((inc) => (
                  <div
                    key={inc.id}
                    className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                      inc.status === 'INVESTIGATING'
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{inc.title}</span>
                        <Badge
                          variant={inc.severity === 'HIGH' ? 'destructive' : 'warning'}
                          className="text-[9px] px-1 py-0"
                        >
                          {inc.severity}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Assigned: <span className="font-semibold">{inc.assignedTo}</span> &bull; {inc.time}
                      </div>
                      {inc.resolutionNotes && (
                        <div className="text-[11px] text-emerald-800 font-medium">
                          Note: {inc.resolutionNotes}
                        </div>
                      )}
                    </div>

                    <Badge
                      variant={inc.status === 'INVESTIGATING' ? 'warning' : 'success'}
                      className="text-[10px] shrink-0"
                    >
                      {inc.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Vendor Arrival Radar & Extra Banquet Count */}
        <div className="space-y-4">
          {/* Vendor Gate Arrival Radar (Read-Only) */}
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Vendor Gate Arrival Board
                </CardTitle>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Scheduled arrival vs Palace Gate check-in
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {filteredCheckins.length} Gate Bids
              </Badge>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-[350px] overflow-y-auto">
              {filteredCheckins.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No vendor check-in records for this filter.
                </div>
              ) : (
                filteredCheckins.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded border border-slate-200 bg-white space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                        {c.vendor}
                      </span>
                      <Badge
                        variant={
                          c.status === 'ARRIVED'
                            ? 'success'
                            : c.status === 'RUNNING_LATE'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[9px] px-1 py-0 font-semibold"
                      >
                        {c.status === 'RUNNING_LATE' ? `+${c.delayMinutes}m Late` : c.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{c.category}</span>
                      <span className="font-mono">Sched: {c.scheduled}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Extra Banquet Plates Live Reconciler (Read-Only Status) */}
          {/* <Card className="border border-amber-200 bg-amber-50/40 shadow-2xs rounded">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Banquet Headcount Audit
                </span>
                <Badge variant="warning" className="text-[10px] font-mono">
                  +{extraGuestsCount} Overrun
                </Badge>
              </div>
              <CardTitle className="text-xs font-bold text-slate-900 mt-1">
                Singhania-Mehra 460-Plate Tally
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2.5 text-xs">
              <p className="text-[11px] text-slate-600 leading-tight">
                Palace gate security has recorded 460 total attendees against the contracted 400 guests. 60 extra plates are queued for client billing.
              </p>

              <div className="p-2.5 rounded bg-white border border-amber-200 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Contracted Count:</span>
                  <span className="font-bold text-slate-900">{headcount.contracted} plates</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Actual Banquet Headcount:</span>
                  <span className="font-bold text-amber-800">{headcount.actual} plates</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-600">Extra Charge (@ ₹{headcount.extraRate}):</span>
                  <span className="font-bold text-emerald-800">₹{(extraChargesTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
};
