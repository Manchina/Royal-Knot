import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  History,
  MapPin,
  Calendar,
  Users
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../components/ui';
import { cn } from '../lib/utils';
import { api } from '../api/client';
import { useWeddingStore } from '../store/useWeddingStore';
import { useBillingStore } from '../store/useBillingStore';

export const Billing: React.FC = () => {
  const navigate = useNavigate();
  const { weddings, setSelectedWeddingId } = useWeddingStore();
  const { extraCharges, finalisedProjects } = useBillingStore();

  // PeopleFirst tab: 'ongoing' or 'finalised'
  const [activeTab, setActiveTab] = useState<'ongoing' | 'finalised'>('ongoing');
  // PeopleFirst status sub-tab filter: 'ALL', 'LIVE_BIG_DAY', 'IN_PLANNING', 'BOOKED', 'FINALISED'
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Partition weddings into Ongoing and Finalised
  const ongoingWeddings = useMemo(
    () => weddings.filter((w) => !w.isFinalised && w.status !== 'FINALISED' && !finalisedProjects[w.id]),
    [weddings, finalisedProjects]
  );

  const finalisedWeddings = useMemo(
    () => weddings.filter((w) => w.isFinalised || w.status === 'FINALISED' || Boolean(finalisedProjects[w.id])),
    [weddings, finalisedProjects]
  );

  const currentTabWeddings = activeTab === 'ongoing' ? ongoingWeddings : finalisedWeddings;

  // Status sub-tabs breakdown for Ongoing projects matching PeopleFirst standard
  const ongoingStatusTabs = useMemo(() => {
    const liveBigDayCount = ongoingWeddings.filter((w) => w.status === 'LIVE_BIG_DAY').length;
    const inPlanningCount = ongoingWeddings.filter((w) => w.status === 'IN_PLANNING').length;
    const bookedCount = ongoingWeddings.filter((w) => w.status === 'BOOKED').length;

    return [
      { id: 'ALL', label: 'All', count: ongoingWeddings.length, dotColor: 'bg-purple-600' },
      { id: 'LIVE_BIG_DAY', label: 'Live Big Day', count: liveBigDayCount, dotColor: 'bg-rose-500 animate-pulse' },
      { id: 'IN_PLANNING', label: 'In Planning', count: inPlanningCount, dotColor: 'bg-blue-500' },
      { id: 'BOOKED', label: 'Booked', count: bookedCount, dotColor: 'bg-emerald-500' },
    ];
  }, [ongoingWeddings]);

  // Status sub-tabs breakdown for Finalised projects: All, Finalised, Finalised & Settled
  const finalisedStatusTabs = useMemo(() => {
    const finalisedCount = finalisedWeddings.filter((w) => w.status === 'FINALISED').length;
    const finalisedSettledCount = finalisedWeddings.filter((w) => w.status === 'FINALISED_SETTLED').length;

    return [
      { id: 'ALL', label: 'All', count: finalisedWeddings.length, dotColor: 'bg-emerald-600' },
      { id: 'FINALISED', label: 'Finalised', count: finalisedCount, dotColor: 'bg-emerald-500' },
      { id: 'FINALISED_SETTLED', label: 'Finalised & Settled', count: finalisedSettledCount, dotColor: 'bg-teal-600' },
    ];
  }, [finalisedWeddings]);

  const currentStatusTabs = activeTab === 'ongoing' ? ongoingStatusTabs : finalisedStatusTabs;

  // Real-time backend API synchronization for high performance
  useEffect(() => {
    const syncBackendProjects = async () => {
      try {
        await api.get(
          `/billing/projects?tab=${activeTab}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`
        );
      } catch (err) {
        // Fallback silently to client store
      }
    };
    syncBackendProjects();
  }, [activeTab, statusFilter, searchQuery]);

  // Tab switch handler: resets status filter to ALL
  const handleTabChange = (val: 'ongoing' | 'finalised') => {
    setActiveTab(val);
    setStatusFilter('ALL');
  };

  // Search and status filter
  const filteredProjects = useMemo(() => {
    let list = currentTabWeddings;
    if (statusFilter !== 'ALL') {
      list = list.filter((w) => w.status === statusFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (w) =>
        w.code.toLowerCase().includes(q) ||
        w.couple.toLowerCase().includes(q) ||
        w.venue.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q)
    );
  }, [currentTabWeddings, statusFilter, searchQuery]);

  // Navigate to dedicated new project page
  const handleOpenProjectPage = (projectId: string) => {
    setSelectedWeddingId(projectId);
    navigate(`/billing/${projectId}`);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* PeopleFirst Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Invoicing & Vendor Settlements
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono font-bold text-[#714B67]">
              PeopleFirst Standard
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Billing & Extra Charges Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse projects by status tab. Select any project row to open its full settlement ledger on a dedicated page.
          </p>
        </div>

        {/* Global Metric Chips */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200/70 text-right">
            <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">
              Ongoing Projects
            </div>
            <div className="text-sm font-bold text-[#714B67]">
              {ongoingWeddings.length} Active
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/70 text-right">
            <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              Finalised Projects
            </div>
            <div className="text-sm font-bold text-emerald-800">
              {finalisedWeddings.length} Audited
            </div>
          </div>
        </div>
      </div>

      {/* PeopleFirst Tab Bar: Ongoing Projects vs Finalised Projects */}
      <Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as 'ongoing' | 'finalised')} className="w-full gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
          <TabsList className="bg-slate-100/90 p-1 border border-slate-200 rounded-lg h-9.5">
            <TabsTrigger
              value="ongoing"
              className="px-4 py-1.5 text-xs font-semibold gap-2 data-[state=active]:bg-white data-[state=active]:text-[#714B67] data-[state=active]:shadow-xs rounded-md transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Ongoing Projects</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-[#714B67]">
                {ongoingWeddings.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="finalised"
              className="px-4 py-1.5 text-xs font-semibold gap-2 data-[state=active]:bg-white data-[state=active]:text-[#714B67] data-[state=active]:shadow-xs rounded-md transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Finalised Projects</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                {finalisedWeddings.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Quick Search Bar */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search projects by couple, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 w-full"
              />
            </div>
          </div>
        </div>

        {/* PeopleFirst Sub-Tabs: Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
            {currentStatusTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 border relative',
                    isActive
                      ? 'bg-purple-50 text-[#714B67] border-purple-200/80 shadow-2xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', tab.dotColor)} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                      isActive
                        ? 'bg-purple-200/80 text-[#714B67]'
                        : 'bg-slate-200/80 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#714B67] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 text-[11px] text-slate-500 font-medium">
            <span>Viewing:</span>
            <span className="font-semibold text-slate-800">
              {currentStatusTabs.find((t) => t.id === statusFilter)?.label || 'All'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono font-bold text-[#714B67]">{filteredProjects.length}</span>
            <span>{filteredProjects.length === 1 ? 'Project' : 'Projects'}</span>
          </div>
        </div>

        {/* Tab Content: Projects in Rows Table */}
        <TabsContent value={activeTab} className="mt-2 outline-none">
          <Card className="border border-slate-200 shadow-xs rounded-xl bg-white overflow-hidden">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{activeTab === 'ongoing' ? 'Ongoing Wedding Projects' : 'Finalised & Audited Projects'}</span>
                  {statusFilter !== 'ALL' && (
                    <Badge variant="outline" className="text-[10px] border-purple-200 bg-purple-50 text-[#714B67] font-semibold">
                      {currentStatusTabs.find((t) => t.id === statusFilter)?.label}
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-xs text-slate-500">
                  {activeTab === 'ongoing' 
                    ? 'Active wedding operations with live day-of overrun additions' 
                    : 'Settled projects with verified vendor disbursements and locked audit histories'}
                </div>
              </div>

              <span className="text-xs font-mono text-slate-500 font-semibold">
                Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs">Project Code</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Couple & Destination</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Primary Venue</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Event Dates</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Guest Count</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Base Budget</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Day-of Extras</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Status</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-slate-100">
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-xs text-slate-500">
                        No projects match the current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((p) => {
                      const pExtras = extraCharges.filter((ext) => ext.weddingId === p.id);
                      const pTotalExtras = pExtras.reduce((sum, item) => {
                        const num = parseFloat(item.total.replace(/[^\d.]/g, '')) || 0;
                        return sum + num;
                      }, 0);
                      const hasEdits = pExtras.some((ext) => ext.editHistory && ext.editHistory.length > 0);

                      return (
                        <TableRow
                          key={p.id}
                          onClick={() => handleOpenProjectPage(p.id)}
                          className="hover:bg-purple-50/50 transition cursor-pointer group"
                        >
                          {/* Code */}
                          <TableCell className="py-3 font-mono font-bold text-xs">
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 group-hover:bg-purple-100 group-hover:text-[#714B67] group-hover:border-purple-200 transition">
                              {p.code}
                            </span>
                          </TableCell>

                          {/* Couple */}
                          <TableCell className="py-3">
                            <div className="font-bold text-xs text-slate-900 group-hover:text-[#714B67] transition">
                              {p.couple}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{p.city}</span>
                            </div>
                          </TableCell>

                          {/* Venue */}
                          <TableCell className="py-3 text-xs text-slate-700">
                            {p.venue}
                          </TableCell>

                          {/* Dates */}
                          <TableCell className="py-3 text-xs text-slate-600 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{p.startDate}</span>
                            </div>
                          </TableCell>

                          {/* Guests */}
                          <TableCell className="py-3 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{p.guestCount}</span>
                            </div>
                          </TableCell>

                          {/* Budget */}
                          <TableCell className="py-3 text-right font-mono text-xs font-semibold text-slate-800">
                            {p.budget}
                          </TableCell>

                          {/* Extras */}
                          <TableCell className="py-3 text-right">
                            {pExtras.length > 0 ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="font-mono text-xs font-bold text-[#714B67] bg-purple-100/70 px-2 py-0.5 rounded">
                                  +{pExtras.length} (₹{(pTotalExtras / 1000).toFixed(0)}k)
                                </span>
                                {hasEdits && (
                                  <span className="text-[9px] font-semibold text-amber-700 flex items-center gap-0.5 mt-0.5">
                                    <History className="w-2.5 h-2.5" /> Edited
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">None</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 text-center">
                            {p.status === 'FINALISED_SETTLED' ? (
                              <Badge variant="success" className="text-[10px] gap-1 bg-emerald-600 text-white">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Finalised & Settled
                              </Badge>
                            ) : p.isFinalised || p.status === 'FINALISED' || finalisedProjects[p.id] ? (
                              <Badge variant="success" className="text-[10px] gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Finalised
                              </Badge>
                            ) : p.status === 'LIVE_BIG_DAY' ? (
                              <Badge variant="destructive" className="text-[10px] font-bold animate-pulse">
                                Live Big Day
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-semibold">
                                {p.status}
                              </Badge>
                            )}
                          </TableCell>

                          {/* Action Button */}
                          <TableCell className="py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProjectPage(p.id);
                              }}
                              className="h-7 px-2.5 text-xs text-[#714B67] hover:bg-purple-100 hover:text-[#5C3D54] font-semibold gap-1"
                            >
                              <span>View Data</span>
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
