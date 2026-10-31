import { useState, useMemo } from 'react';
import {
  Plus,
  User,
  CreditCard,
  Search,
  Check,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  Filter,
  X,
  Bookmark,
  Clock,
  Truck,
  CalendarClock,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import { useWeddingStore } from '../store/useWeddingStore';
import { api } from '../api/client';

export interface Task {
  id: string;
  code?: string;
  weddingId: string;
  weddingCode?: string;
  weddingTheme?: string;
  destinationCity?: string;
  title: string;
  category: 'FINANCE' | 'VENUE' | 'VENDORS' | 'DESIGN' | 'PERMITS' | 'DAY_OF' | 'CEREMONIES' | string;
  owner: string;
  stage: 'DONE' | 'IN_PROGRESS' | 'TO_PLAN';
  stagePayment?: string;
  daysBefore?: string;
  dueDate?: string;
  isMilestone?: boolean;
  notes?: string;
}

export const Tasks: React.FC = () => {
  const queryClient = useQueryClient();
  const { weddings, selectedWeddingId, setSelectedWeddingId } = useWeddingStore();

  // Filters State
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [milestonesOnly, setMilestonesOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Confirmation Pop-up state for marking as finished
  const [taskToFinish, setTaskToFinish] = useState<Task | null>(null);

  // Modal State for adding regular checklist task
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Modal State for adding Day-Of Wedding Task (accepts time instead of date)
  const [dayOfModalOpen, setDayOfModalOpen] = useState<boolean>(false);
  const [dayOfType, setDayOfType] = useState<'MINUTE_TO_MINUTE' | 'VENDOR_TELEMETRY'>('MINUTE_TO_MINUTE');
  const [dayOfTaskWeddingId, setDayOfTaskWeddingId] = useState<string>('');
  const [dayOfTitle, setDayOfTitle] = useState('');
  const [dayOfTime, setDayOfTime] = useState('14:30');
  const [dayOfOwner, setDayOfOwner] = useState('Karan Verma');
  const [dayOfVenue, setDayOfVenue] = useState('Palace Main Lawn');
  const [dayOfVendorId, setDayOfVendorId] = useState('');
  const [dayOfGate, setDayOfGate] = useState('Palace North Service Gate');
  const [dayOfRemarks, setDayOfRemarks] = useState('');
  const [dayOfIsMilestone, setDayOfIsMilestone] = useState(false);
  const [newTaskWeddingId, setNewTaskWeddingId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('VENUE');
  const [newOwner, setNewOwner] = useState('Devika Sharma');
  const [newDays, setNewDays] = useState('20 Days');

  // Check if any non-default filter is currently applied
  const hasActiveFilters =
    activeStageFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    ownerFilter !== 'ALL' ||
    milestonesOnly ||
    searchTerm.trim().length > 0;

  const handleResetFilters = () => {
    setActiveStageFilter('ALL');
    setCategoryFilter('ALL');
    setOwnerFilter('ALL');
    setMilestonesOnly(false);
    setSearchTerm('');
  };

  // Query tasks from backend Fastify API
  const {
    data: apiResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'tasks',
      selectedWeddingId,
      activeStageFilter,
      categoryFilter,
      ownerFilter,
      milestonesOnly,
      searchTerm,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedWeddingId && selectedWeddingId !== 'ALL') {
        params.append('weddingId', selectedWeddingId);
      }
      if (activeStageFilter && activeStageFilter !== 'ALL') {
        params.append('stage', activeStageFilter);
      }
      if (categoryFilter && categoryFilter !== 'ALL') {
        params.append('category', categoryFilter);
      }
      if (ownerFilter && ownerFilter !== 'ALL') {
        params.append('owner', ownerFilter);
      }
      if (milestonesOnly) {
        params.append('isMilestone', 'true');
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      return await api.get<{
        success: boolean;
        data: Task[];
        stats: { total: number; toPlan: number; inProgress: number; done: number };
      }>(`/tasks?${params.toString()}`);
    },
    retry: 1,
  });

  // Explicit stage update mutation (setting stage to DONE, IN_PROGRESS, or TO_PLAN)
  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: 'DONE' | 'IN_PROGRESS' | 'TO_PLAN' }) => {
      return await api.patch(`/tasks/${id}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskToFinish(null);
    },
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      weddingId: string;
      title: string;
      category: string;
      ownerName: string;
      daysBefore: string;
    }) => {
      return await api.post('/tasks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setModalOpen(false);
      setNewTitle('');
      setNewDays('20 Days');
    },
  });

  // Fetch registered active vendors for Vendor Arrival Telemetry selection
  const { data: vendorsRes } = useQuery({
    queryKey: ['day-of-vendors'],
    queryFn: async () => {
      return await api.get<{
        success: boolean;
        data: { id: string; businessName: string; category: string; contactPerson?: string; phone?: string }[];
      }>('/day-of/vendors');
    },
  });
  const registeredVendors = vendorsRes?.data || [];

  // Create Day-Of Wedding Task mutation (supports selecting either "Minute to Minute" or "Vendor Arrival Telemetry")
  const createDayOfTaskMutation = useMutation({
    mutationFn: async (payload: {
      type: 'MINUTE_TO_MINUTE' | 'VENDOR_TELEMETRY';
      weddingId: string;
      title: string;
      time: string;
      ownerName: string;
      venue?: string;
      vendorId?: string;
      gate?: string;
      remarks?: string;
      isMilestone: boolean;
    }) => {
      if (payload.type === 'MINUTE_TO_MINUTE') {
        // 1. Post to Checklist tasks
        const taskRes = await api.post('/tasks', {
          weddingId: payload.weddingId,
          title: `[Minute to Minute] ${payload.title}`,
          category: 'DAY_OF',
          ownerName: payload.ownerName,
          daysBefore: `@ ${payload.time} (Wedding Day)`,
          notes: `[Minute to Minute] Execution Time: ${payload.time} | Venue: ${payload.venue || 'Palace Grounds'}`,
          isMilestone: payload.isMilestone,
        });

        // 2. Also register into live Day-Of Run Sheet
        try {
          await api.post('/day-of/run-sheet', {
            weddingId: payload.weddingId,
            timeSlot: payload.time,
            activityTitle: payload.title,
            location: payload.venue,
            ownerName: payload.ownerName,
            status: 'UPCOMING',
          });
        } catch {
          // Run sheet registration optional
        }

        return taskRes;
      } else {
        // VENDOR_TELEMETRY
        const selectedVendor = registeredVendors.find((v) => v.id === payload.vendorId);
        const vendorName = selectedVendor ? selectedVendor.businessName : 'Vendor Partner';
        const vendorCategory = selectedVendor ? selectedVendor.category : 'VENDORS';

        // 1. Post to Checklist tasks
        const taskRes = await api.post('/tasks', {
          weddingId: payload.weddingId,
          title: `[Vendor Telemetry] ${vendorName} (${vendorCategory}) Gate Arrival`,
          category: 'DAY_OF',
          ownerName: payload.ownerName || 'Karan Verma',
          daysBefore: `@ ${payload.time} (Wedding Day)`,
          notes: `[Vendor Arrival Telemetry] Scheduled: ${payload.time} | Gate: ${payload.gate || 'North Gate'} | Remarks: ${payload.remarks || 'Check-in required'}`,
          isMilestone: payload.isMilestone,
        });

        // 2. Register into live Day-Of Vendor Check-ins
        try {
          await api.post('/day-of/vendor-checkins', {
            weddingId: payload.weddingId,
            vendorId: payload.vendorId || (registeredVendors[0]?.id || ''),
            scheduledArrivalTime: payload.time,
            remarks: `Gate: ${payload.gate || 'Main Service Gate'}${payload.remarks ? ` • ${payload.remarks}` : ''}`,
            status: 'SCHEDULED',
          });
        } catch {
          // Telemetry registration optional
        }

        return taskRes;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['day-of-run-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['day-of-vendor-checkins'] });
      setDayOfModalOpen(false);
      setDayOfTitle('');
      setDayOfTime('14:30');
      setDayOfVenue('Palace Main Lawn');
      setDayOfRemarks('');
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Resolve tasks list and statistics purely from backend API
  const tasks: Task[] = useMemo(() => {
    return apiResponse?.data || [];
  }, [apiResponse]);

  const stats = useMemo(() => {
    return (
      apiResponse?.stats || {
        total: 0,
        toPlan: 0,
        inProgress: 0,
        done: 0,
      }
    );
  }, [apiResponse]);

  // Handle clicking the checkbox in Status column:
  // - If task is already DONE -> uncheck it (move back to IN_PROGRESS)
  // - If task is NOT done -> show Confirmation Pop-up before completing
  const handleCheckboxClick = (task: Task) => {
    if (task.stage === 'DONE') {
      // Uncheck task: smoothly move back to In Progress
      updateStageMutation.mutate({ id: task.id, stage: 'IN_PROGRESS' });
    } else {
      // Trigger confirmation dialog
      setTaskToFinish(task);
    }
  };

  // Confirm finish inside pop-up
  const handleConfirmFinish = () => {
    if (!taskToFinish) return;
    updateStageMutation.mutate({ id: taskToFinish.id, stage: 'DONE' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this checklist item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createMutation.mutate({
      weddingId: newTaskWeddingId,
      title: newTitle.trim(),
      category: newCategory,
      ownerName: newOwner.trim(),
      daysBefore: newDays.trim(),
    });
  };



  return (
    <div className="space-y-4">
      {/* Odoo Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Checklists & Milestones
            </span>
            {isFetching && (
              <span className="flex items-center gap-1 text-[11px] text-[#714B67] animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Syncing...</span>
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Checklists & Stage Milestones
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setNewTaskWeddingId(selectedWeddingId && selectedWeddingId !== 'ALL' ? selectedWeddingId : '');
              createMutation.reset();
              setModalOpen(true);
            }}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDayOfTaskWeddingId(selectedWeddingId && selectedWeddingId !== 'ALL' ? selectedWeddingId : '');
              createDayOfTaskMutation.reset();
              setDayOfModalOpen(true);
            }}
            className="gap-1.5 h-8 text-xs font-semibold bg-[#714B67]/10 text-[#714B67] hover:bg-[#714B67]/20 border border-[#714B67]/30"
            title="Add specialized wedding day task with exact execution time"
          >
            <Clock className="w-3.5 h-3.5 text-[#714B67]" />
            <span>Day-Of Task</span>
          </Button>
        </div>
      </div>

      {/* Backend connection banner if in offline fallback */}
      {isError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Unable to reach checklist service. Please verify backend connection.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-6 text-[11px] border-amber-300 hover:bg-amber-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col gap-2.5 shadow-2xs">
        {/* Top Filter Row: Search & Project Selector on Left, Stage Tabs on Right */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search task, owner, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs border-slate-300 w-full"
              />
            </div>

            {/* Project / Wedding Selector - Positioned directly to the right of Search Bar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0 hidden sm:inline">
                Project:
              </span>
              <select
                value={selectedWeddingId}
                onChange={(e) => {
                  setSelectedWeddingId(e.target.value);
                  if (e.target.value !== 'ALL') {
                    setNewTaskWeddingId(e.target.value);
                  }
                }}
                className="h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-[#714B67] cursor-pointer max-w-[240px] truncate shadow-2xs"
                title="Filter by Wedding Project"
              >
                <option value="ALL">All Weddings (Agency View)</option>
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code}: {w.couple}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Tabs value={activeStageFilter} onValueChange={setActiveStageFilter} className="w-full lg:w-auto shrink-0">
            <TabsList className="h-8 bg-slate-100 border border-slate-200">
              <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
                All Tasks ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="TO_PLAN" className="text-xs px-3 font-semibold">
                To Plan ({stats.toPlan})
              </TabsTrigger>
              <TabsTrigger value="IN_PROGRESS" className="text-xs px-3 font-semibold">
                In Progress ({stats.inProgress})
              </TabsTrigger>
              <TabsTrigger value="DONE" className="text-xs px-3 font-semibold">
                Completed ({stats.done})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Bottom Filter Row: Category Dropdown, Assignee Dropdown, Milestone Pill & Reset */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <div className="w-36">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-7 text-xs border-slate-300 bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="VENUE">Venue & Permits</SelectItem>
                <SelectItem value="FINANCE">Finance & Invoices</SelectItem>
                <SelectItem value="VENDORS">Vendors & Catering</SelectItem>
                <SelectItem value="DESIGN">Design & Theming</SelectItem>
                <SelectItem value="PERMITS">Permits & Clearances</SelectItem>
                <SelectItem value="CEREMONIES">Ceremonies Itinerary</SelectItem>
                <SelectItem value="DAY_OF">Day-of Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee / Owner Filter */}
          <div className="w-36">
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="h-7 text-xs border-slate-300 bg-white">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Assignees</SelectItem>
                <SelectItem value="Devika Sharma">Devika Sharma</SelectItem>
                <SelectItem value="Karan Verma">Karan Verma</SelectItem>
                <SelectItem value="Finance Team">Finance Team</SelectItem>
                <SelectItem value="Aarav Mehta">Aarav Mehta</SelectItem>
                <SelectItem value="Priya Joshi">Priya Joshi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Milestones Only Toggle Pill */}
          <button
            type="button"
            onClick={() => setMilestonesOnly(!milestonesOnly)}
            className={`h-7 px-2.5 rounded text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
              milestonesOnly
                ? 'bg-[#714B67] text-white border-[#714B67]'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3 h-3 ${milestonesOnly ? 'fill-current' : ''}`} />
            <span>Milestones Only</span>
          </button>

          {/* Clear Filters Button (Visible only when filters applied) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-7 px-2 rounded text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1 transition ml-auto cursor-pointer"
              title="Reset all active filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-12 text-center font-bold text-slate-700 text-xs">Done</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Task Name & Identifier</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Category</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Owner</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Stage Status</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Timeline</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Payment Milestone</TableHead>
                <TableHead className="w-16 text-center font-bold text-slate-700 text-xs pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-[#714B67] animate-spin" />
                      <span>Loading wedding checklists from database...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500 text-xs">
                    <div className="space-y-1">
                      <div className="text-slate-700 font-medium">No tasks found</div>
                      <div className="text-slate-400 text-[11px]">
                        No checklist items match the current filters.
                      </div>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 h-7 text-xs"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((t, idx) => {
                  const isDone = t.stage === 'DONE';
                  const isInProgress = t.stage === 'IN_PROGRESS';
                  const displayCode = t.code || `TSK-${String(idx + 1).padStart(2, '0')}`;

                  return (
                    <TableRow key={t.id} className="hover:bg-slate-50 transition group">
                      {/* Column 1: Intuitive Completion Checkbox */}
                      <TableCell className="text-center py-2.5">
                        <button
                          type="button"
                          onClick={() => handleCheckboxClick(t)}
                          disabled={updateStageMutation.isPending}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-white border-slate-300 hover:border-emerald-600 text-transparent hover:text-slate-300'
                          }`}
                          title={isDone ? 'Click to reopen task' : 'Click to mark as finished'}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isDone ? 'text-white' : ''}`} />
                        </button>
                      </TableCell>

                      {/* Column 2: Task Name & Code */}
                      <TableCell className="py-2.5">
                        <div
                          className={`font-semibold text-xs ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span>{displayCode}</span>
                          {t.weddingCode && (
                            <>
                              <span>•</span>
                              <span className="text-[#714B67] font-semibold">{t.weddingCode}</span>
                            </>
                          )}
                          {t.isMilestone && (
                            <span className="text-amber-700 font-sans font-medium text-[9px] bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              ★ Milestone
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Column 3: Category */}
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {t.category}
                        </Badge>
                      </TableCell>

                      {/* Column 4: Assignee */}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.owner}</span>
                        </div>
                      </TableCell>

                      {/* Column 5: Stage Status Badge & Quick Selector */}
                      <TableCell className="py-2.5">
                        <div className="inline-block">
                          <select
                            value={t.stage}
                            onChange={(e) => {
                              const newStage = e.target.value as 'DONE' | 'IN_PROGRESS' | 'TO_PLAN';
                              if (newStage === 'DONE') {
                                setTaskToFinish(t);
                              } else {
                                updateStageMutation.mutate({ id: t.id, stage: newStage });
                              }
                            }}
                            className={`h-6 text-[11px] font-semibold rounded px-2 border cursor-pointer focus:outline-none transition ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="TO_PLAN">To Plan</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Completed</option>
                          </select>
                        </div>
                      </TableCell>

                      {/* Column 6: Timeline */}
                      <TableCell className="py-2.5 font-mono text-xs text-slate-600">
                        {t.category === 'DAY_OF' || (t.daysBefore && t.daysBefore.startsWith('@')) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#714B67] bg-[#714B67]/10 px-2 py-0.5 rounded border border-[#714B67]/20">
                            <Clock className="w-3 h-3" />
                            <span>{t.daysBefore?.replace('(Wedding Day)', '').trim() || 'Day-Of'}</span>
                          </span>
                        ) : (
                          t.daysBefore || (t.dueDate ? t.dueDate.split('T')[0] : '—')
                        )}
                      </TableCell>

                      {/* Column 7: Payment Milestone */}
                      <TableCell className="py-2.5">
                        {t.stagePayment ? (
                          <Badge variant="odoo" className="text-[10px] gap-1 font-mono">
                            <CreditCard className="w-3 h-3 text-[#714B67]" />
                            {t.stagePayment}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Column 8: Action (Only Real Action: Delete) */}
                      <TableCell className="py-2.5 text-center pr-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="text-slate-300 hover:text-rose-600 transition p-1.5 rounded hover:bg-rose-50 cursor-pointer"
                          title="Delete task item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Modal: Mark Task as Finished */}
      <Dialog
        open={Boolean(taskToFinish)}
        onOpenChange={(open) => {
          if (!open) setTaskToFinish(null);
        }}
      >
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <DialogTitle className="text-base font-bold text-slate-900">
                Mark Task as Finished?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
              Are you sure you want to mark this task as completed? This will set the milestone status to completed and record the completion timestamp.
            </DialogDescription>
          </DialogHeader>

          {taskToFinish && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 my-2 text-xs space-y-1.5">
              <div className="font-semibold text-slate-900 text-sm">
                {taskToFinish.title}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span className="font-mono text-slate-400">{taskToFinish.code || taskToFinish.id.slice(0, 8)}</span>
                <span>•</span>
                <span className="font-semibold text-[#714B67]">{taskToFinish.category}</span>
                <span>•</span>
                <span>Assignee: <strong className="text-slate-700">{taskToFinish.owner}</strong></span>
              </div>
              {taskToFinish.stagePayment && (
                <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1 pt-1">
                  <CreditCard className="w-3 h-3" />
                  <span>Linked Milestone: {taskToFinish.stagePayment}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTaskToFinish(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5"
              disabled={updateStageMutation.isPending}
              onClick={handleConfirmFinish}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{updateStageMutation.isPending ? 'Marking Finished...' : 'Yes, Mark Finished'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Custom Task */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create Project Task
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Attach specialized operational task to event checklist in PostgreSQL database.
            </DialogDescription>
          </DialogHeader>

          {createMutation.isError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {(createMutation.error as any)?.response?.data?.message ||
                  (createMutation.error as any)?.message ||
                  'Failed to create task.'}
              </span>
            </div>
          )}

          <form onSubmit={handleAddTask} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="task_wedding">Related Wedding Project</Label>
              <select
                id="task_wedding"
                value={newTaskWeddingId}
                onChange={(e) => setNewTaskWeddingId(e.target.value)}
                className="w-full h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code}: {w.couple} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task_title">Task Description</Label>
              <Input
                id="task_title"
                placeholder="e.g. Vintage Car Baraat Escort Permits"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="cat">Category</Label>
                <Select
                  value={newCategory}
                  onValueChange={(val) => setNewCategory(val)}
                >
                  <SelectTrigger id="cat" className="h-8 text-xs border-slate-300">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINANCE">FINANCE</SelectItem>
                    <SelectItem value="VENUE">VENUE</SelectItem>
                    <SelectItem value="VENDORS">VENDORS</SelectItem>
                    <SelectItem value="DESIGN">DESIGN</SelectItem>
                    <SelectItem value="PERMITS">PERMITS</SelectItem>
                    <SelectItem value="CEREMONIES">CEREMONIES</SelectItem>
                    <SelectItem value="DAY_OF">DAY_OF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="timeline">Timeline (Days Before)</Label>
                <Input
                  id="timeline"
                  placeholder="e.g. 15 Days"
                  value={newDays}
                  onChange={(e) => setNewDays(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="owner">Assignee Owner</Label>
              <Input
                id="owner"
                placeholder="Devika Sharma"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={createMutation.isPending || !newTitle.trim()}
              >
                {createMutation.isPending ? 'Saving...' : 'Add to Checklist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Day-Of Wedding Task (Accepts exact time instead of date) */}
      <Dialog open={dayOfModalOpen} onOpenChange={setDayOfModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#714B67]" />
              <span>Create Day-Of Wedding Task</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Attach time-critical wedding day task. Accepts exact execution time instead of date because it runs on the live wedding day.
            </DialogDescription>
          </DialogHeader>

          {createDayOfTaskMutation.isError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {(createDayOfTaskMutation.error as any)?.response?.data?.message ||
                  (createDayOfTaskMutation.error as any)?.message ||
                  'Failed to create Day-Of task.'}
              </span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!dayOfTaskWeddingId) {
                alert('Please select a wedding project.');
                return;
              }
              if (dayOfType === 'MINUTE_TO_MINUTE') {
                if (!dayOfTitle.trim()) return;
                createDayOfTaskMutation.mutate({
                  type: 'MINUTE_TO_MINUTE',
                  weddingId: dayOfTaskWeddingId || (selectedWeddingId !== 'ALL' ? selectedWeddingId : 'RW-2026-001'),
                  title: dayOfTitle.trim(),
                  time: dayOfTime,
                  ownerName: dayOfOwner.trim(),
                  venue: dayOfVenue.trim(),
                  isMilestone: dayOfIsMilestone,
                });
              } else {
                createDayOfTaskMutation.mutate({
                  type: 'VENDOR_TELEMETRY',
                  weddingId: dayOfTaskWeddingId || (selectedWeddingId !== 'ALL' ? selectedWeddingId : 'RW-2026-001'),
                  title: '',
                  vendorId: dayOfVendorId || (registeredVendors[0]?.id || ''),
                  time: dayOfTime,
                  ownerName: dayOfOwner.trim(),
                  gate: dayOfGate.trim(),
                  remarks: dayOfRemarks.trim(),
                  isMilestone: dayOfIsMilestone,
                });
              }
            }}
            className="space-y-3 py-2"
          >
            {/* 2 Fields Selection: User can ONLY select one either "Minute to Minute" or "Vendor Arrival Telemetry" */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Day-Of Execution Stream (Select One)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDayOfType('MINUTE_TO_MINUTE')}
                  className={`p-2.5 rounded border text-left flex items-start gap-2.5 transition cursor-pointer ${
                    dayOfType === 'MINUTE_TO_MINUTE'
                      ? 'bg-[#714B67]/10 border-[#714B67] text-[#714B67] ring-1 ring-[#714B67]'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dayOfTypeSelector"
                    checked={dayOfType === 'MINUTE_TO_MINUTE'}
                    onChange={() => setDayOfType('MINUTE_TO_MINUTE')}
                    className="mt-0.5 text-[#714B67] focus:ring-[#714B67]"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-[#714B67]" />
                      <span>Minute to Minute</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Ceremonies, cues & run sheet timeline
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDayOfType('VENDOR_TELEMETRY');
                    if (!dayOfVendorId && registeredVendors.length > 0) {
                      setDayOfVendorId(registeredVendors[0].id);
                    }
                  }}
                  className={`p-2.5 rounded border text-left flex items-start gap-2.5 transition cursor-pointer ${
                    dayOfType === 'VENDOR_TELEMETRY'
                      ? 'bg-[#714B67]/10 border-[#714B67] text-[#714B67] ring-1 ring-[#714B67]'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dayOfTypeSelector"
                    checked={dayOfType === 'VENDOR_TELEMETRY'}
                    onChange={() => {
                      setDayOfType('VENDOR_TELEMETRY');
                      if (!dayOfVendorId && registeredVendors.length > 0) {
                        setDayOfVendorId(registeredVendors[0].id);
                      }
                    }}
                    className="mt-0.5 text-[#714B67] focus:ring-[#714B67]"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#714B67]" />
                      <span>Vendor Arrival Telemetry</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Vendor dispatch & gate check-ins
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dayof_wedding">Related Wedding Project</Label>
              <select
                id="dayof_wedding"
                value={dayOfTaskWeddingId}
                onChange={(e) => setDayOfTaskWeddingId(e.target.value)}
                required
                className="w-full h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
              >
                <option value="">-- Select a Wedding Project --</option>
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code}: {w.couple} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Stream 1: Minute to Minute Fields */}
            {dayOfType === 'MINUTE_TO_MINUTE' ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="dayof_title">Day-Of Task / Activity Cue</Label>
                  <Input
                    id="dayof_title"
                    placeholder="e.g. Groom vintage car Baraat arrival & drummers assembly"
                    value={dayOfTitle}
                    onChange={(e) => setDayOfTitle(e.target.value)}
                    required
                    className="border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="dayof_time" className="flex items-center gap-1 text-[#714B67] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Execution Time (HH:MM)</span>
                    </Label>
                    <Input
                      id="dayof_time"
                      type="time"
                      value={dayOfTime}
                      onChange={(e) => setDayOfTime(e.target.value)}
                      required
                      className="border-[#714B67]/40 focus:border-[#714B67]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="dayof_venue">Venue / Location</Label>
                    <Input
                      id="dayof_venue"
                      placeholder="e.g. Main Palace Driveway"
                      value={dayOfVenue}
                      onChange={(e) => setDayOfVenue(e.target.value)}
                      className="border-slate-300"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Stream 2: Vendor Arrival Telemetry Fields */
              <>
                <div className="space-y-1">
                  <Label htmlFor="dayof_vendor">Assigned Vendor Partner</Label>
                  <select
                    id="dayof_vendor"
                    value={dayOfVendorId || (registeredVendors[0]?.id || '')}
                    onChange={(e) => setDayOfVendorId(e.target.value)}
                    className="w-full h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                  >
                    {registeredVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.businessName} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="dayof_time" className="flex items-center gap-1 text-[#714B67] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Scheduled Arrival (HH:MM)</span>
                    </Label>
                    <Input
                      id="dayof_time"
                      type="time"
                      value={dayOfTime}
                      onChange={(e) => setDayOfTime(e.target.value)}
                      required
                      className="border-[#714B67]/40 focus:border-[#714B67]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="dayof_gate">Service Gate / Checkpoint</Label>
                    <Input
                      id="dayof_gate"
                      placeholder="e.g. Palace North Service Gate"
                      value={dayOfGate}
                      onChange={(e) => setDayOfGate(e.target.value)}
                      className="border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dayof_remarks">Telemetry Remarks / Notes</Label>
                  <Input
                    id="dayof_remarks"
                    placeholder="e.g. Mandap floral crates delivery & setup crew"
                    value={dayOfRemarks}
                    onChange={(e) => setDayOfRemarks(e.target.value)}
                    className="border-slate-300"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="dayof_owner">Responsible Field Lead</Label>
                <Input
                  id="dayof_owner"
                  placeholder="Karan Verma"
                  value={dayOfOwner}
                  onChange={(e) => setDayOfOwner(e.target.value)}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayOfIsMilestone}
                    onChange={(e) => setDayOfIsMilestone(e.target.checked)}
                    className="rounded border-slate-300 text-[#714B67] focus:ring-[#714B67]"
                  />
                  <span>Mark as Key Milestone</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDayOfModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={
                  createDayOfTaskMutation.isPending ||
                  (dayOfType === 'MINUTE_TO_MINUTE' && !dayOfTitle.trim())
                }
                className="bg-[#714B67] hover:bg-[#5a3a52] text-white"
              >
                {createDayOfTaskMutation.isPending
                  ? 'Scheduling...'
                  : dayOfType === 'MINUTE_TO_MINUTE'
                  ? 'Add Minute-to-Minute Cue'
                  : 'Schedule Vendor Telemetry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
