import { useState } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  User, 
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Radio,
  Check,
  Building2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import { useWeddingStore } from '../store/useWeddingStore';
import { api } from '../api/client';

interface Incident {
  id: string;
  weddingId: string;
  weddingCode?: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTo: string;
  status: 'INVESTIGATING' | 'RESOLVED';
  time: string;
  resolutionNotes?: string;
}

interface ScheduleItem {
  id: string;
  weddingId: string;
  time: string;
  timeSlot: string;
  event: string;
  venue: string;
  location?: string;
  owner: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  notes?: string;
}

interface VendorCheckin {
  id: string;
  weddingId: string;
  vendorId: string;
  vendor: string;
  category: string;
  scheduled: string;
  actual: string;
  status: 'ARRIVED_ON_TIME' | 'RUNNING_LATE' | 'SCHEDULED';
  delay: number;
  remarks?: string;
}

export const DayOf: React.FC = () => {
  const queryClient = useQueryClient();
  const { weddings, selectedWeddingId, setSelectedWeddingId } = useWeddingStore();

  // Active Tab: Minute-by-Minute Run Sheet vs Vendor Arrival Telemetry
  const [activeTab, setActiveTab] = useState<'run-sheet' | 'vendor-arrivals'>('run-sheet');

  // Modals State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Form states for Incident
  const [incidentWeddingId, setIncidentWeddingId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newAssignee, setNewAssignee] = useState('Karan Verma');

  // Form states for Schedule Item
  const [scheduleWeddingId, setScheduleWeddingId] = useState<string>('');
  const [newScheduleTime, setNewScheduleTime] = useState('14:30');
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleVenue, setNewScheduleVenue] = useState('Palace Courtyard');
  const [newScheduleOwner, setNewScheduleOwner] = useState('Karan Verma');

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  // 1. Incidents Query
  const { data: incidentsRes, isLoading: incidentsLoading } = useQuery({
    queryKey: ['day-of-incidents', selectedWeddingId],
    queryFn: async () => {
      return await api.get<{ success: boolean; data: Incident[] }>(
        `/day-of/incidents?weddingId=${selectedWeddingId}`
      );
    },
  });
  const incidents: Incident[] = incidentsRes?.data || [];

  // 2. Run Sheet Query
  const { data: runSheetRes, isLoading: runSheetLoading } = useQuery({
    queryKey: ['day-of-run-sheet', selectedWeddingId],
    queryFn: async () => {
      return await api.get<{ success: boolean; data: ScheduleItem[] }>(
        `/day-of/run-sheet?weddingId=${selectedWeddingId}`
      );
    },
  });
  const schedule: ScheduleItem[] = runSheetRes?.data || [];

  // 3. Vendor Check-ins Query
  const { data: checkinsRes, isLoading: checkinsLoading } = useQuery({
    queryKey: ['day-of-vendor-checkins', selectedWeddingId],
    queryFn: async () => {
      return await api.get<{ success: boolean; data: VendorCheckin[] }>(
        `/day-of/vendor-checkins?weddingId=${selectedWeddingId}`
      );
    },
  });
  const vendorCheckins: VendorCheckin[] = checkinsRes?.data || [];

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  // Report Incident Mutation
  const reportIncidentMutation = useMutation({
    mutationFn: async (payload: {
      weddingId: string;
      title: string;
      severity: string;
      ownerName: string;
    }) => {
      return await api.post('/day-of/incidents', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-of-incidents'] });
      setReportModalOpen(false);
      setNewTitle('');
    },
  });

  // Resolve Incident Mutation
  const resolveIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch(`/day-of/incidents/${id}`, { status: 'RESOLVED' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-of-incidents'] });
    },
  });

  // Create Run Sheet Item Mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (payload: {
      weddingId: string;
      timeSlot: string;
      activityTitle: string;
      location: string;
      ownerName: string;
    }) => {
      return await api.post('/day-of/run-sheet', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-of-run-sheet'] });
      setScheduleModalOpen(false);
      setNewScheduleTitle('');
    },
  });

  // Delete Run Sheet Item Mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/day-of/run-sheet/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-of-run-sheet'] });
    },
  });

  // Update Run Sheet Item Status Mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING' }) => {
      return await api.patch(`/day-of/run-sheet/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-of-run-sheet'] });
    },
  });

  // Update Vendor Check-in Mutation
  const updateCheckinMutation = useMutation({
    mutationFn: async ({ id, status, delayMinutes }: { id: string; status: string; delayMinutes?: number }) => {
      return await api.patch(`/day-of/vendor-checkins/${id}`, { status, delayMinutes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-of-vendor-checkins'] });
    },
  });

  // Handlers
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!incidentWeddingId) {
      alert('Please select a wedding project for this incident.');
      return;
    }

    reportIncidentMutation.mutate({
      weddingId: incidentWeddingId || (selectedWeddingId !== 'ALL' ? selectedWeddingId : 'RW-2026-001'),
      title: newTitle.trim(),
      severity: newSeverity,
      ownerName: newAssignee,
    });
  };

  const handleCreateScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTitle.trim()) return;
    if (!scheduleWeddingId) {
      alert('Please select a wedding project for this schedule cue.');
      return;
    }

    createScheduleMutation.mutate({
      weddingId: scheduleWeddingId || (selectedWeddingId !== 'ALL' ? selectedWeddingId : 'RW-2026-001'),
      timeSlot: newScheduleTime,
      activityTitle: newScheduleTitle.trim(),
      location: newScheduleVenue.trim(),
      ownerName: newScheduleOwner.trim(),
    });
  };

  const activeWedding = weddings.find((w) => w.id === selectedWeddingId || w.code === selectedWeddingId);

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
              Field Operations Command Center
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono font-bold text-[#714B67]">
              {!selectedWeddingId
                ? 'No Project Selected (Select Below)'
                : selectedWeddingId === 'ALL'
                ? 'All Live Weddings'
                : `${selectedWeddingId} • ${activeWedding?.couple || 'Active Project'}`}
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Day-Of Live Execution & Telemetry
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Project:</span>
          <select
            value={selectedWeddingId || ''}
            onChange={(e) => setSelectedWeddingId(e.target.value)}
            className="h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] cursor-pointer max-w-[240px] truncate"
          >
            <option value="">-- Select a Wedding Project --</option>
            <option value="ALL">All Weddings (Agency View)</option>
            {weddings.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code}: {w.couple} ({w.city})
              </option>
            ))}
          </select>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => { setIncidentWeddingId(selectedWeddingId && selectedWeddingId !== 'ALL' ? selectedWeddingId : ''); setReportModalOpen(true); }}
            className="gap-1.5 h-8 text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Log Incident</span>
          </Button>
        </div>
      </div>

      {/* Incidents Command Bar */}
      <Card className="border border-rose-200 bg-rose-50/40 shadow-2xs rounded">
        <CardHeader className="p-3 pb-2 border-b border-rose-200/80 bg-rose-50">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Active Operational Incidents</span>
            </div>
            <Badge variant="destructive" className="text-[10px] font-mono">
              {incidents.filter((i) => i.status === 'INVESTIGATING').length} Pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-3 space-y-2">
          {incidentsLoading ? (
            <div className="text-xs text-slate-400 py-2">Loading active incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded flex items-center justify-between">
              <span>All clear. Zero unresolved incidents logged for this project.</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          ) : (
            incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3 rounded bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={inc.severity === 'HIGH' ? 'destructive' : inc.severity === 'MEDIUM' ? 'warning' : 'secondary'}
                    className="text-[10px] font-mono uppercase"
                  >
                    {inc.severity}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono text-[#714B67] bg-[#714B67]/5 border-[#714B67]/20">{inc.weddingCode || 'RW-2026-001'}</Badge>
                  <span className="font-bold text-slate-900">{inc.title}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-500 text-[11px]">
                    Assigned: <strong className="text-slate-800">{inc.assignedTo}</strong> ({inc.time})
                  </span>
                  {inc.status === 'INVESTIGATING' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resolveIncidentMutation.isPending}
                      onClick={() => resolveIncidentMutation.mutate(inc.id)}
                      className="h-6 text-xs text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                    >
                      Mark Resolved
                    </Button>
                  ) : (
                    <Badge variant="success" className="text-[10px]">
                      Resolved
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Primary Tabs: Minute-by-Minute Run Sheet & Vendor Arrival Telemetry */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded p-2 shadow-2xs">
          <TabsList className="h-8 bg-slate-100 border border-slate-200">
            <TabsTrigger value="run-sheet" className="text-xs px-4 font-semibold gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Minute-by-Minute Run Sheet ({schedule.length})</span>
            </TabsTrigger>
            <TabsTrigger value="vendor-arrivals" className="text-xs px-4 font-semibold gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Vendor Arrival Telemetry ({vendorCheckins.length})</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'run-sheet' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => { setScheduleWeddingId(selectedWeddingId && selectedWeddingId !== 'ALL' ? selectedWeddingId : ''); setScheduleModalOpen(true); }}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Schedule Item</span>
            </Button>
          )}
        </div>

        {/* Tab 1: Minute-by-Minute Run Sheet */}
        <TabsContent value="run-sheet" className="space-y-3 mt-0">
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Live Timeline & Cues
                  </CardTitle>
                  <div className="text-xs text-slate-500">
                    Minute-by-minute execution run sheet for on-ground team coordinators
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {schedule.length} Timeline Slots
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {runSheetLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading run sheet timeline from database...</div>
              ) : schedule.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">No run sheet items recorded yet</div>
                  <div className="text-slate-400">Click &quot;Add Schedule Item&quot; to cue ceremonies and transitions.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedule.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 items-start relative pb-3 border-b border-slate-100 last:border-0 last:pb-0 group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING' =
                            item.status === 'UPCOMING'
                              ? 'IN_PROGRESS'
                              : item.status === 'IN_PROGRESS'
                              ? 'COMPLETED'
                              : 'UPCOMING';
                          updateScheduleMutation.mutate({ id: item.id, status: nextStatus });
                        }}
                        disabled={updateScheduleMutation.isPending}
                        className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border shrink-0 mt-0.5 cursor-pointer hover:opacity-85 transition shadow-2xs ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-[#714B67] border-[#714B67] text-white hover:bg-[#5a3a52]'
                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={`Status: ${item.status}. Click to cycle: Upcoming → In Progress → Completed`}
                      >
                        {item.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.time}
                          </span>
                          <div className="flex items-center gap-2">
                            <select
                              value={item.status}
                              onChange={(e) => {
                                updateScheduleMutation.mutate({
                                  id: item.id,
                                  status: e.target.value as 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING',
                                });
                              }}
                              className={`h-5 text-[10px] font-bold rounded px-1.5 border cursor-pointer focus:outline-none transition ${
                                item.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : item.status === 'IN_PROGRESS'
                                  ? 'bg-[#714B67]/10 text-[#714B67] border-[#714B67]/30'
                                  : 'bg-slate-50 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="UPCOMING">UPCOMING</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteScheduleMutation.mutate(item.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                              title="Delete schedule cue"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="font-bold text-xs text-slate-900 mt-1">
                          {item.event}
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.venue}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.owner}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Vendor Arrival Telemetry */}
        <TabsContent value="vendor-arrivals" className="space-y-3 mt-0">
          <Card className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Vendor Arrival Telemetry & Dispatch
                  </CardTitle>
                  <div className="text-xs text-slate-500">
                    Live vendor gate check-in times, punctuality tracking, and delay alerts
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {vendorCheckins.length} Registered Vendors
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {checkinsLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading vendor telemetry records...</div>
              ) : vendorCheckins.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No vendor check-in records found for this wedding.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="font-bold text-slate-700 text-xs">Vendor & Category</TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs">Scheduled Arrival</TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs">Actual Gate Time</TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs">Status</TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs">Punctuality</TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {vendorCheckins.map((v) => (
                      <TableRow key={v.id} className="hover:bg-slate-50 transition">
                        <TableCell className="py-2.5">
                          <div className="font-bold text-xs text-slate-900">{v.vendor}</div>
                          <div className="text-[11px] text-slate-500">{v.category}</div>
                          {v.remarks && <div className="text-[10px] text-slate-400 italic mt-0.5">{v.remarks}</div>}
                        </TableCell>

                        <TableCell className="py-2.5 font-mono text-xs text-slate-600">
                          {v.scheduled}
                        </TableCell>

                        <TableCell className="py-2.5 font-mono text-xs font-bold text-slate-800">
                          {v.actual}
                        </TableCell>

                        <TableCell className="py-2.5">
                          {v.status === 'ARRIVED_ON_TIME' ? (
                            <Badge variant="success" className="text-[10px]">
                              On Time
                            </Badge>
                          ) : v.status === 'RUNNING_LATE' ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Late ({v.delay}m)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Scheduled
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 text-xs text-slate-600">
                          {v.delay > 0 ? (
                            <span className="text-rose-600 font-semibold font-mono">+{v.delay} min delay</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">On Schedule</span>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {v.status !== 'ARRIVED_ON_TIME' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCheckinMutation.mutate({ id: v.id, status: 'ARRIVED_ON_TIME', delayMinutes: 0 })}
                                className="h-6 text-[11px] text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Check In
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateCheckinMutation.mutate({ id: v.id, status: 'RUNNING_LATE', delayMinutes: 20 })}
                                className="h-6 text-[10px] text-amber-700 hover:text-amber-800 cursor-pointer"
                              >
                                Flag Late (+20m)
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Log Operational Incident */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Log Live Day-Of Incident</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Trigger operational dispatch and track issue resolution with on-ground coordinators.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportIncident} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="inc_wedding">Target Wedding Project</Label>
              <select
                id="inc_wedding"
                value={incidentWeddingId}
                onChange={(e) => setIncidentWeddingId(e.target.value)}
                required
                className="w-full h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] cursor-pointer"
              >
                <option value="">-- Select a Wedding Project --</option>
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code}: {w.couple} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="inc_title">Incident Description</Label>
              <Input
                id="inc_title"
                placeholder="e.g. Vintage groom car stalled at North gate checkpoint"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="inc_sev">Severity Level</Label>
                <Select
                  value={newSeverity}
                  onValueChange={(val: 'HIGH' | 'MEDIUM' | 'LOW') => setNewSeverity(val)}
                >
                  <SelectTrigger id="inc_sev" className="h-8 text-xs">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High (Immediate Action)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (15-30m Window)</SelectItem>
                    <SelectItem value="LOW">Low (Monitor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="inc_owner">Assigned Lead</Label>
                <Input
                  id="inc_owner"
                  placeholder="Karan Verma"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={reportIncidentMutation.isPending || !newTitle.trim()}
              >
                {reportIncidentMutation.isPending ? 'Logging...' : 'Dispatch & Log'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Schedule Item to Run Sheet */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#714B67]" />
              <span>Add Run Sheet Schedule Item</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Attach a minute-by-minute ceremony or logistical cue to the wedding timeline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateScheduleItem} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="sched_wedding">Target Wedding Project</Label>
              <select
                id="sched_wedding"
                value={scheduleWeddingId}
                onChange={(e) => setScheduleWeddingId(e.target.value)}
                required
                className="w-full h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] cursor-pointer"
              >
                <option value="">-- Select a Wedding Project --</option>
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code}: {w.couple} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="sched_time">Time Slot (HH:MM)</Label>
                <Input
                  id="sched_time"
                  type="time"
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sched_venue">Location / Venue</Label>
                <Input
                  id="sched_venue"
                  placeholder="e.g. Zenana Courtyard"
                  value={newScheduleVenue}
                  onChange={(e) => setNewScheduleVenue(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sched_title">Activity / Ceremony Title</Label>
              <Input
                id="sched_title"
                placeholder="e.g. Sunset Varmala & Rose Petal Shower"
                value={newScheduleTitle}
                onChange={(e) => setNewScheduleTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sched_owner">Responsible Coordinator</Label>
              <Input
                id="sched_owner"
                placeholder="Karan Verma"
                value={newScheduleOwner}
                onChange={(e) => setNewScheduleOwner(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScheduleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={createScheduleMutation.isPending || !newScheduleTitle.trim()}
              >
                {createScheduleMutation.isPending ? 'Adding...' : 'Add to Run Sheet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
