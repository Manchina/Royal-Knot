import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Building2,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { useWeddingStore } from '../store/useWeddingStore';
import { api } from '../api/client';
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
  Progress,
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

export const Weddings: React.FC = () => {
  const navigate = useNavigate();
  const { weddings, fetchWeddings, setSelectedWeddingId, isLoading } = useWeddingStore();
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newModalOpen, setNewModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states for creating a new wedding
  const [newCouple, setNewCouple] = useState('');
  const [newCity, setNewCity] = useState<'Udaipur' | 'Jaipur' | 'Jodhpur'>('Udaipur');
  const [newVenue, setNewVenue] = useState('');
  const [newGuests, setNewGuests] = useState('400');
  const [newBudget, setNewBudget] = useState('₹2.50 Cr');
  const [newPackage, setNewPackage] = useState('Full-Service Planning');

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouple) return;

    setIsSubmitting(true);
    try {
      await api.post('/weddings', {
        couple: newCouple,
        city: newCity,
        venue: newVenue || (newCity === 'Udaipur' ? 'The Oberoi Udaivilas' : newCity === 'Jaipur' ? 'Rambagh Palace' : 'Umaid Bhawan Palace'),
        guestCount: parseInt(newGuests, 10) || 400,
        packageType: newPackage === 'Full-Service Planning' ? 'FULL_SERVICE' : 'DAY_OF',
        budget: newBudget,
      });

      await fetchWeddings();
      setNewModalOpen(false);
      setNewCouple('');
      setNewVenue('');
    } catch (err: any) {
      console.error('Failed to create wedding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedWeddings = useMemo(() => {
    return weddings.map((w) => {
      let progress = 35;
      if (w.status === 'FINALISED_SETTLED' || w.status === 'FINALISED') {
        progress = 100;
      } else if (w.status === 'LIVE_BIG_DAY') {
        progress = 90;
      } else if (w.status === 'IN_PLANNING') {
        progress = 60;
      }

      return {
        id: w.code || w.id,
        couple: w.couple,
        dates: w.startDate,
        city: w.city,
        venue: w.venue,
        guests: w.guestCount,
        package: w.packageType,
        theme: 'Royal Palace Celebration',
        budget: w.budget,
        stage: w.status.replace(/_/g, ' '),
        coordinator: w.coordinator,
        progress,
      };
    });
  }, [weddings]);

  const filtered = useMemo(() => {
    return formattedWeddings.filter((w) => {
      const matchesCity = cityFilter === 'ALL' || w.city === cityFilter;
      const matchesSearch =
        w.couple.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCity && matchesSearch;
    });
  }, [formattedWeddings, cityFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Project Operations
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Weddings Portfolio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setNewModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Wedding Project</span>
          </Button>
        </div>
      </div>

      {/* Odoo Filter & Search Toolbar */}
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

        <Tabs value={cityFilter} onValueChange={setCityFilter} className="w-full md:w-auto">
          <TabsList className="h-8 bg-slate-100 border border-slate-200">
            <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
              All Locations ({weddings.length})
            </TabsTrigger>
            <TabsTrigger value="Udaipur" className="text-xs px-3 font-semibold">
              Udaipur ({weddings.filter((w) => w.city === 'Udaipur').length})
            </TabsTrigger>
            <TabsTrigger value="Jaipur" className="text-xs px-3 font-semibold">
              Jaipur ({weddings.filter((w) => w.city === 'Jaipur').length})
            </TabsTrigger>
            <TabsTrigger value="Jodhpur" className="text-xs px-3 font-semibold">
              Jodhpur ({weddings.filter((w) => w.city === 'Jodhpur').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Wedding Cards Grid */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-500 text-xs">
          Loading wedding projects from database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-500 text-xs space-y-2">
          <div className="font-semibold text-slate-700">No wedding projects found</div>
          <div className="text-slate-400">Try adjusting your search or city filter.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((w) => (
            <Card key={w.id} className="border border-slate-200 shadow-2xs rounded bg-white flex flex-col justify-between">
              <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{w.id}</span>
                      <Badge variant="odoo" className="text-[10px]">
                        {w.city}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {w.package}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 pt-0.5">
                      {w.couple}
                    </CardTitle>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-slate-500">Contract Budget</div>
                    <div className="text-sm font-bold font-mono text-slate-900">{w.budget}</div>
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
                      <span>{w.dates}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{w.guests} Guests</span>
                    </div>
                  </div>
                </div>

                {/* Current Active Stage & Coordinator */}
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500">Active Stage:</span>
                    <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">{w.stage}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Assigned Coordinator:</span>
                    <span className="font-semibold text-slate-900">{w.coordinator}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Workflow Completion</span>
                    <span className="font-bold font-mono text-slate-900">{w.progress}%</span>
                  </div>
                  <Progress value={w.progress} className="h-1.5" />
                </div>
              </CardContent>

              <CardFooter className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={`/sign/ENQ-2026-101`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#714B67] hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  title="View signed wedding agreement"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Signed Agreement (PDF) ↗</span>
                </a>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs cursor-pointer"
                    onClick={() => {
                      setSelectedWeddingId(w.id);
                      navigate('/tasks');
                    }}
                  >
                    <span>Checklists</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs cursor-pointer"
                    onClick={() => {
                      setSelectedWeddingId(w.id);
                      navigate('/billing');
                    }}
                  >
                    <span>Billing & P&L</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for New Wedding Project */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create Wedding Project
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Initialize a new destination wedding file into the database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWedding} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="couple_name">Couple Names</Label>
              <Input
                id="couple_name"
                placeholder="e.g. Radhika Merchant & Anant Ambani"
                value={newCouple}
                onChange={(e) => setNewCouple(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="city_sel">Destination City</Label>
                <Select
                  value={newCity}
                  onValueChange={(val: 'Udaipur' | 'Jaipur' | 'Jodhpur') => setNewCity(val)}
                >
                  <SelectTrigger id="city_sel" className="h-8 text-xs">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Udaipur">Udaipur</SelectItem>
                    <SelectItem value="Jaipur">Jaipur</SelectItem>
                    <SelectItem value="Jodhpur">Jodhpur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pkg_sel">Package Type</Label>
                <Select
                  value={newPackage}
                  onValueChange={setNewPackage}
                >
                  <SelectTrigger id="pkg_sel" className="h-8 text-xs">
                    <SelectValue placeholder="Package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-Service Planning">Full-Service Royal</SelectItem>
                    <SelectItem value="Partial / Day-of Service">Day-of Execution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="venue_name">Primary Venue Hall / Palace</Label>
              <Input
                id="venue_name"
                placeholder="e.g. Jagmandir Island Palace"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="guests_count">Estimated Guests</Label>
                <Input
                  id="guests_count"
                  type="number"
                  placeholder="400"
                  value={newGuests}
                  onChange={(e) => setNewGuests(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="budget_val">Initial Contract Budget</Label>
                <Input
                  id="budget_val"
                  placeholder="₹2.50 Cr"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting || !newCouple}
              >
                {isSubmitting ? 'Creating...' : 'Create Wedding'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
