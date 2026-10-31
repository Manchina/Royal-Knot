import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Building2,
  ArrowRight,
  LayoutList,
  LayoutGrid,
  SlidersHorizontal,
  Loader2,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useWeddingStore } from '../store/useWeddingStore';
import { weddingIntakeSchema, formatZodErrors } from '../lib/validations';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Badge,
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
} from '../components/ui';

export const Weddings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { weddings, loading, fetchWeddings, createWedding, setSelectedWeddingId } = useWeddingStore();

  // Filters & View Mode initialized from URL search params
  const [stageFilter, setStageFilter] = useState<string>(
    () => searchParams.get('stage') || searchParams.get('status') || 'ALL'
  );
  const [cityFilter, setCityFilter] = useState<string>(
    () => searchParams.get('city') || 'ALL'
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    () => searchParams.get('search') || ''
  );
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  // Sync state if URL query params change
  useEffect(() => {
    const urlStage = searchParams.get('stage') || searchParams.get('status');
    const urlCity = searchParams.get('city');
    const urlSearch = searchParams.get('search');
    if (urlStage) setStageFilter(urlStage);
    if (urlCity) setCityFilter(urlCity);
    if (urlSearch) setSearchTerm(urlSearch);
  }, [searchParams]);

  // New Wedding Modal
  const [newModalOpen, setNewModalOpen] = useState<boolean>(false);
  const [newBrideName, setNewBrideName] = useState('');
  const [newGroomName, setNewGroomName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState<'Udaipur' | 'Jaipur' | 'Jodhpur'>('Udaipur');
  const [newVenue, setNewVenue] = useState('');
  const [newStartDate, setNewStartDate] = useState('2026-11-20');
  const [newEndDate, setNewEndDate] = useState('2026-11-23');
  const [newGuests, setNewGuests] = useState('400');
  const [newBudget, setNewBudget] = useState('25000000');
  const [newPackage, setNewPackage] = useState('Full-Service Royal Wedding');
  const [newTheme, setNewTheme] = useState('Palace Royal Heritage');
  const [submittingNew, setSubmittingNew] = useState(false);
  const [weddingErrors, setWeddingErrors] = useState<Record<string, string>>({});

  const clearWeddingError = (field: string) => {
    setWeddingErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    fetchWeddings();
  }, [fetchWeddings]);

  const validateWeddingForm = (): boolean => {
    const result = weddingIntakeSchema.safeParse({
      brideName: newBrideName,
      groomName: newGroomName,
      phone: newPhone,
      email: newEmail,
      city: newCity,
      startDate: newStartDate,
      budget: Number(newBudget),
    });

    if (!result.success) {
      setWeddingErrors(formatZodErrors(result.error));
      return false;
    }

    setWeddingErrors({});
    return true;
  };

  // Handle Create Wedding
  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateWeddingForm()) return;

    setSubmittingNew(true);
    try {
      const created = await createWedding({
        brideName: newBrideName.trim(),
        groomName: newGroomName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        city: newCity,
        venue: newVenue.trim() || (newCity === 'Udaipur' ? 'The Oberoi Udaivilas' : 'Rambagh Palace'),
        startDate: newStartDate,
        endDate: newEndDate || newStartDate,
        guestCount: parseInt(newGuests, 10) || 400,
        budget: Number(newBudget) || 25000000,
        packageType: newPackage,
        theme: newTheme,
      });

      if (created) {
        setNewModalOpen(false);
        setNewBrideName('');
        setNewGroomName('');
        setNewPhone('');
        setNewEmail('');
        setNewVenue('');
        setWeddingErrors({});
      }
    } catch (err) {
      console.error('Failed to create wedding:', err);
    } finally {
      setSubmittingNew(false);
    }
  };

  // Pipeline counts
  const stageCounts = useMemo(() => {
    const counts = {
      ALL: weddings.length,
      IN_PLANNING: 0,
      LIVE_BIG_DAY: 0,
      BOOKED: 0,
      FINALISED: 0,
    };

    weddings.forEach((w) => {
      const st = w.status?.toUpperCase() || '';
      if (st.includes('LIVE')) counts.LIVE_BIG_DAY++;
      else if (st.includes('PLAN')) counts.IN_PLANNING++;
      else if (st.includes('BOOK')) counts.BOOKED++;
      else if (st.includes('FINAL')) counts.FINALISED++;
      else counts.IN_PLANNING++;
    });

    return counts;
  }, [weddings]);

  // Filtered weddings
  const filteredWeddings = useMemo(() => {
    return weddings.filter((w) => {
      // Stage filter
      if (stageFilter !== 'ALL') {
        const st = w.status?.toUpperCase() || '';
        if (stageFilter === 'LIVE_BIG_DAY' && !st.includes('LIVE')) return false;
        if (stageFilter === 'IN_PLANNING' && !st.includes('PLAN')) return false;
        if (stageFilter === 'BOOKED' && !st.includes('BOOK')) return false;
        if (stageFilter === 'FINALISED' && !st.includes('FINAL')) return false;
      }

      // City filter
      if (cityFilter !== 'ALL') {
        if (!w.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesCouple = w.couple?.toLowerCase().includes(q);
        const matchesCode = w.code?.toLowerCase().includes(q);
        const matchesVenue = w.venue?.toLowerCase().includes(q);
        const matchesCity = w.city?.toLowerCase().includes(q);
        const matchesCoordinator = w.coordinator?.toLowerCase().includes(q);
        if (!matchesCouple && !matchesCode && !matchesVenue && !matchesCity && !matchesCoordinator) {
          return false;
        }
      }

      return true;
    });
  }, [weddings, stageFilter, cityFilter, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [stageFilter, cityFilter, searchTerm]);

  const paginatedWeddings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredWeddings.slice(start, start + pageSize);
  }, [filteredWeddings, page, pageSize]);

  const formatBudget = (raw: string | number) => {
    const val = Number(raw);
    if (!val || isNaN(val)) return '₹2.50 Cr';
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  };

  const getStageBadge = (status: string) => {
    const st = status?.toUpperCase() || '';
    if (st.includes('LIVE')) {
      return <Badge variant="success" className="text-[10px] py-0 font-bold">LIVE BIG DAY</Badge>;
    }
    if (st.includes('PLAN')) {
      return <Badge variant="secondary" className="text-[10px] py-0 bg-purple-50 text-[#714B67] border-purple-200 font-semibold">IN PLANNING</Badge>;
    }
    if (st.includes('BOOK')) {
      return <Badge variant="outline" className="text-[10px] py-0 border-blue-200 text-blue-700 bg-blue-50/50 font-semibold">BOOKED</Badge>;
    }
    if (st.includes('FINAL')) {
      return <Badge variant="outline" className="text-[10px] py-0 border-slate-300 text-slate-600 font-semibold">FINALISED</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] py-0">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* 1. Odoo Control Panel Header with generous breathing room */}
      <div className="bg-white border border-slate-200 rounded p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Project Operations
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono font-bold text-[#714B67]">
              Weddings Portfolio
            </span>
          </div>
          <div className="flex items-center gap-2.5 pt-0.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Active Wedding Projects
            </h1>
            <Badge variant="outline" className="text-xs py-0.5 font-mono text-slate-600 border-slate-300">
              {filteredWeddings.length} Projects
            </Badge>
            {loading && <Loader2 className="w-4 h-4 text-[#714B67] animate-spin" />}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/procurement')}
            className="h-8 text-xs font-semibold text-slate-700"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
            Vendor Sourcing
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setNewModalOpen(true)}
            className="h-8 text-xs bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Wedding Project
          </Button>
        </div>
      </div>

      {/* 2. Pipeline Stages Tabs with Live Counts (Matching Enquiries.tsx) */}
      <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
        <Tabs value={stageFilter} onValueChange={setStageFilter} className="w-full">
          <TabsList className="h-9 bg-slate-100 border border-slate-200 w-full justify-start overflow-x-auto p-1">
            <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
              All Weddings ({stageCounts.ALL})
            </TabsTrigger>
            <TabsTrigger value="IN_PLANNING" className="text-xs px-3 font-semibold">
              In Planning ({stageCounts.IN_PLANNING})
            </TabsTrigger>
            <TabsTrigger value="LIVE_BIG_DAY" className="text-xs px-3 font-semibold">
              Live Big Day ({stageCounts.LIVE_BIG_DAY})
            </TabsTrigger>
            <TabsTrigger value="BOOKED" className="text-xs px-3 font-semibold">
              Booked ({stageCounts.BOOKED})
            </TabsTrigger>
            <TabsTrigger value="FINALISED" className="text-xs px-3 font-semibold">
              Finalised ({stageCounts.FINALISED})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 3. Filter Toolbar with Search, City Selector, and View Mode Toggle */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search couple, venue, or RW code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs border-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* City Dropdown Filter */}
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-slate-300 bg-white">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Cities</SelectItem>
              <SelectItem value="Udaipur">Udaipur</SelectItem>
              <SelectItem value="Jaipur">Jaipur</SelectItem>
              <SelectItem value="Jodhpur">Jodhpur</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center border border-slate-200 rounded p-0.5 bg-slate-100">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-[#714B67]' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View (Odoo List)"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white shadow-2xs text-[#714B67]' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Portfolio View (Table View vs Card View) */}
      {viewMode === 'table' ? (
        /* ========================================================================= */
        /* VIEW 1: ODOO LIST / TABLE VIEW                                            */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 text-slate-700">
              <TableRow>
                <TableHead className="w-[120px] text-xs font-bold">Code</TableHead>
                <TableHead className="text-xs font-bold">Couple & Package</TableHead>
                <TableHead className="text-xs font-bold">Destination & Venue</TableHead>
                <TableHead className="text-xs font-bold">Dates</TableHead>
                <TableHead className="text-xs font-bold">Guests</TableHead>
                <TableHead className="text-xs font-bold">Budget</TableHead>
                <TableHead className="text-xs font-bold">Coordinator</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-right text-xs font-bold pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWeddings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-slate-400">
                    No wedding projects match the current filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedWeddings.map((w) => (
                  <TableRow
                    key={w.id}
                    onClick={() => navigate(`/weddings/${w.code || w.id}`)}
                    className="hover:bg-purple-50/30 cursor-pointer transition-colors"
                  >
                    {/* Code */}
                    <TableCell className="font-mono text-xs font-bold text-[#714B67]">
                      {w.code}
                    </TableCell>

                    {/* Couple & Package */}
                    <TableCell>
                      <div className="font-bold text-xs text-slate-900">{w.couple}</div>
                      <div className="text-[11px] text-slate-500">{w.packageType}</div>
                    </TableCell>

                    {/* Destination & Venue */}
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">{w.venue}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{w.city}</span>
                      </div>
                    </TableCell>

                    {/* Dates */}
                    <TableCell className="text-xs text-slate-700">
                      <div>{new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </TableCell>

                    {/* Guests */}
                    <TableCell className="text-xs text-slate-700 font-mono">
                      {w.guestCount}
                    </TableCell>

                    {/* Budget */}
                    <TableCell className="font-mono font-bold text-xs text-slate-900">
                      {formatBudget(w.budget)}
                    </TableCell>

                    {/* Coordinator */}
                    <TableCell className="text-xs text-slate-700">
                      {w.coordinator || 'Karan Verma'}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {getStageBadge(w.status)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/weddings/${w.code || w.id}`)}
                          className="h-7 text-xs text-[#714B67] hover:text-[#5b3c53] font-semibold"
                        >
                          Dossier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWeddingId(w.id);
                            navigate('/procurement');
                          }}
                          className="h-7 text-xs text-slate-700 font-medium"
                          title="Open Sourcing"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={page}
            totalItems={filteredWeddings.length}
            pageSize={pageSize}
            onPageChange={setPage}
            itemName="weddings"
          />
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: KANBAN / CARDS VIEW                                               */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedWeddings.map((w) => (
              <Card key={w.id} className="border border-slate-200 shadow-2xs rounded bg-white flex flex-col justify-between hover:border-slate-300 transition-all">
                <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#714B67]">{w.code}</span>
                        <Badge variant="outline" className="text-[10px] py-0 border-slate-300">
                          {w.city}
                        </Badge>
                        {getStageBadge(w.status)}
                      </div>
                      <CardTitle 
                        onClick={() => navigate(`/weddings/${w.code || w.id}`)}
                        className="text-sm font-bold text-slate-900 pt-0.5 cursor-pointer hover:text-[#714B67]"
                      >
                        {w.couple}
                      </CardTitle>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-500">Contract Budget</div>
                      <div className="text-sm font-bold font-mono text-slate-900">{formatBudget(w.budget)}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{w.venue}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{w.guestCount} Guests</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Package Tier:</span>
                      <span className="font-bold text-slate-800">{w.packageType}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Lead Planner:</span>
                      <span className="font-semibold text-slate-900">{w.coordinator || 'Karan Verma'}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    {w.theme || 'Palace Royal Heritage'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedWeddingId(w.id);
                        navigate('/procurement');
                      }}
                    >
                      <SlidersHorizontal className="w-3 h-3 mr-1 text-[#714B67]" />
                      Sourcing
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs bg-[#714B67] hover:bg-[#5b3c53] text-white"
                      onClick={() => navigate(`/weddings/${w.code || w.id}`)}
                    >
                      <span>View Dossier</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <TablePagination
              currentPage={page}
              totalItems={filteredWeddings.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemName="weddings"
            />
          </div>
        </div>
      )}

      {/* 5. New Wedding Project Modal */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              New Wedding Project Intake
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a newly booked royal wedding project. This will initialize vendor RFQ pipelines and run sheets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWedding} noValidate className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Bride's Name <span className="text-rose-500 font-bold">*</span>
                </Label>
                <Input
                  value={newBrideName}
                  onChange={(e) => {
                    setNewBrideName(e.target.value);
                    if (weddingErrors.brideName) setWeddingErrors((prev) => ({ ...prev, brideName: undefined as unknown as string }));
                  }}
                  placeholder="e.g. Radhika"
                  className={`mt-1 h-8 text-xs ${weddingErrors.brideName ? 'border-rose-400 bg-rose-50/20' : ''}`}
                  required
                />
                {weddingErrors.brideName && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {weddingErrors.brideName}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Groom's Name <span className="text-rose-500 font-bold">*</span>
                </Label>
                <Input
                  value={newGroomName}
                  onChange={(e) => {
                    setNewGroomName(e.target.value);
                    clearWeddingError('groomName');
                  }}
                  placeholder="e.g. Anant"
                  className={`mt-1 h-8 text-xs ${weddingErrors.groomName ? 'border-rose-400 bg-rose-50/20' : ''}`}
                  required
                />
                {weddingErrors.groomName && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {weddingErrors.groomName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Contact Phone <span className="text-rose-500 font-bold">*</span>
                </Label>
                <Input
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value);
                    clearWeddingError('phone');
                  }}
                  placeholder="+91 98290 12345"
                  className={`mt-1 h-8 text-xs ${weddingErrors.phone ? 'border-rose-400 bg-rose-50/20' : ''}`}
                  required
                />
                {weddingErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {weddingErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Contact Email
                </Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    clearWeddingError('email');
                  }}
                  placeholder="client@royalknot.com"
                  className={`mt-1 h-8 text-xs ${weddingErrors.email ? 'border-rose-400 bg-rose-50/20' : ''}`}
                />
                {weddingErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {weddingErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Destination City <span className="text-rose-500 font-bold">*</span>
                </Label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value as 'Udaipur' | 'Jaipur' | 'Jodhpur')}
                  className="mt-1 w-full h-8 text-xs bg-white border border-slate-200 rounded px-2 text-slate-800"
                >
                  <option value="Udaipur">Udaipur</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Jodhpur">Jodhpur</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Primary Palace Venue</Label>
                <Input
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. Taj Lake Palace"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Start Date <span className="text-rose-500 font-bold">*</span>
                </Label>
                <Input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => {
                    setNewStartDate(e.target.value);
                    clearWeddingError('startDate');
                  }}
                  className={`mt-1 h-8 text-xs ${weddingErrors.startDate ? 'border-rose-400 bg-rose-50/20' : ''}`}
                  required
                />
                {weddingErrors.startDate && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {weddingErrors.startDate}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">End Date</Label>
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Guest Count</Label>
                <Input
                  type="number"
                  value={newGuests}
                  onChange={(e) => setNewGuests(e.target.value)}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Total Budget (₹) <span className="text-rose-500 font-bold">*</span>
                </Label>
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => {
                    setNewBudget(e.target.value);
                    clearWeddingError('budget');
                  }}
                  placeholder="25000000"
                  className={`mt-1 h-8 text-xs font-mono ${weddingErrors.budget ? 'border-rose-400 bg-rose-50/20' : ''}`}
                />
                {weddingErrors.budget && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {weddingErrors.budget}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Package Type</Label>
                <Input
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                  placeholder="Full-Service Royal Wedding"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Wedding Theme</Label>
                <Input
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  placeholder="Palace Royal Heritage"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewModalOpen(false);
                  setWeddingErrors({});
                }}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingNew}
                size="sm"
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white"
              >
                {submittingNew ? 'Creating...' : 'Initialize Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
