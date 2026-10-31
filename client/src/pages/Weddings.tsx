import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Building2,
  ArrowRight
} from 'lucide-react';
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

interface Wedding {
  id: string;
  couple: string;
  dates: string;
  city: 'Udaipur' | 'Jaipur';
  venue: string;
  guests: number;
  package: string;
  theme: string;
  budget: string;
  stage: string;
  coordinator: string;
  progress: number;
}

export const Weddings: React.FC = () => {
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newModalOpen, setNewModalOpen] = useState<boolean>(false);

  // Form states for creating a new wedding
  const [newCouple, setNewCouple] = useState('');
  const [newCity, setNewCity] = useState<'Udaipur' | 'Jaipur'>('Udaipur');
  const [newVenue, setNewVenue] = useState('');
  const [newGuests, setNewGuests] = useState('400');
  const [newBudget, setNewBudget] = useState('₹1.80 Cr');
  const [newPackage, setNewPackage] = useState('Full-Service Planning');

  const [weddings, setWeddings] = useState<Wedding[]>([
    {
      id: 'RW-2026-001',
      couple: 'Aanya Singhania & Raghav Mehra',
      dates: 'Nov 14 - 16, 2026',
      city: 'Udaipur',
      venue: 'City Palace Complex & Jagmandir Island',
      guests: 450,
      package: 'Full-Service Planning',
      theme: 'Royal Heritage & Mewar Regal',
      budget: '₹1.85 Cr',
      stage: 'Tasting & Decor Lock',
      coordinator: 'Devika Sharma',
      progress: 68,
    },
    {
      id: 'RW-2026-002',
      couple: 'Pooja Oberoi & Devendra Rathore',
      dates: 'Dec 02 - 04, 2026',
      city: 'Jaipur',
      venue: 'Rambagh Palace & Jaigarh Fort',
      guests: 520,
      package: 'Full-Service Planning',
      theme: 'Rajputana Elegance & Marwar Gold',
      budget: '₹2.40 Cr',
      stage: 'Vendor Quote RFQ Finalization',
      coordinator: 'Karan Verma',
      progress: 45,
    },
    {
      id: 'RW-2026-003',
      couple: 'Ishita Kapoor & Vikram Chauhan',
      dates: 'Dec 18 - 20, 2026',
      city: 'Jaipur',
      venue: 'Fairmont & Nahargarh Haveli',
      guests: 380,
      package: 'Partial / Day-of Service',
      theme: 'Desert Fort Chic',
      budget: '₹95 Lakh',
      stage: 'Minute-by-Minute Run Sheet Cueing',
      coordinator: 'Priya Joshi',
      progress: 82,
    },
    {
      id: 'RW-2026-004',
      couple: 'Ananya Bansal & Rohan Agarwal',
      dates: 'Jan 08 - 10, 2027',
      city: 'Udaipur',
      venue: 'The Oberoi Udaivilas & Lake Pichola',
      guests: 400,
      package: 'Full-Service Planning',
      theme: 'Lake Palace Chic & Candlelight',
      budget: '₹2.10 Cr',
      stage: 'Initial Consultation & Agreement Signed',
      coordinator: 'Devika Sharma',
      progress: 25,
    },
  ]);

  const handleCreateWedding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouple) return;

    const newProject: Wedding = {
      id: `RW-2027-${String(weddings.length + 1).padStart(3, '0')}`,
      couple: newCouple,
      dates: 'Feb 12 - 14, 2027',
      city: newCity,
      venue: newVenue || (newCity === 'Udaipur' ? 'Taj Lake Palace' : 'Alila Fort Bishangarh'),
      guests: parseInt(newGuests, 10) || 400,
      package: newPackage,
      theme: 'Royal Rajputana Celebration',
      budget: newBudget,
      stage: 'Master Checklist Initialization',
      coordinator: 'Devika Sharma',
      progress: 10,
    };

    setWeddings([newProject, ...weddings]);
    setNewModalOpen(false);
    setNewCouple('');
    setNewVenue('');
  };

  const filtered = weddings.filter((w) => {
    const matchesCity = cityFilter === 'ALL' || w.city === cityFilter;
    const matchesSearch =
      w.couple.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCity && matchesSearch;
  });

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
          </TabsList>
        </Tabs>
      </div>

      {/* Wedding Cards Grid */}
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
                  <span className="text-[11px] text-slate-500">Active Milestone:</span>
                  <span className="font-bold text-slate-800">{w.stage}</span>
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

            <CardFooter className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Standard Operations Lifecycle
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Run Sheet
                </Button>
                <Button variant="default" size="sm" className="h-7 text-xs gap-1">
                  Workspace
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Modal: New Wedding Project */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create Wedding Project
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Initialize project records with auto-generated master checklist and stage payment rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWedding} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="couple">Couple Identifier / Name</Label>
              <Input
                id="couple"
                placeholder="Bride & Groom Names"
                value={newCouple}
                onChange={(e) => setNewCouple(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="city">Destination City</Label>
                <Select
                  value={newCity}
                  onValueChange={(val) => setNewCity(val as 'Udaipur' | 'Jaipur')}
                >
                  <SelectTrigger id="city" className="h-8 text-xs border-slate-300">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Udaipur">Udaipur (Lakes & Palaces)</SelectItem>
                    <SelectItem value="Jaipur">Jaipur (Forts & Heritage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="guests">Audited Guest Headcount</Label>
                <Input
                  id="guests"
                  type="number"
                  placeholder="450"
                  value={newGuests}
                  onChange={(e) => setNewGuests(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="venue">Palace Venue Location</Label>
              <Input
                id="venue"
                placeholder="e.g. City Palace Complex, Udaipur"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="budget">Contract Budget (₹)</Label>
                <Input
                  id="budget"
                  placeholder="₹2.20 Cr"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="package">Package Tier</Label>
                <Select
                  value={newPackage}
                  onValueChange={(val) => setNewPackage(val)}
                >
                  <SelectTrigger id="package" className="h-8 text-xs border-slate-300">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-Service Planning">Full-Service Planning</SelectItem>
                    <SelectItem value="Partial / Day-of Service">Partial / Day-of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setNewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Save & Open Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
