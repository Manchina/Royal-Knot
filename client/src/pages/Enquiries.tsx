import { useState, useEffect } from 'react';
import {
  Plus,
  Phone,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';

interface Enquiry {
  id: string;
  dbId?: string;
  couple: string;
  primaryContactName?: string;
  channel: string;
  phone: string;
  email?: string;
  cityPreference: 'Udaipur' | 'Jaipur';
  datesRough: string;
  guestCount: number;
  theme: string;
  budgetMax: string;
  packagePreference?: string;
  agreementStatus: 'Signed on Mobile' | 'Sent - Pending Signature' | 'Drafting Agreement';
  agreementSignedAt?: string;
  status: 'Consultation Booked' | 'Agreement Awaited' | 'Initial Discovery' | 'Converted to Wedding';
  weddingId?: string;
  notes?: string;
  createdAt?: string;
}
export const Enquiries: React.FC = () => {
  const navigate = useNavigate();
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [_loading, setLoading] = useState<boolean>(false);

  // New lead form state
  const [newCouple, setNewCouple] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newChannel, setNewChannel] = useState<string>('Website Consultation');
  const [newCity, setNewCity] = useState<'Udaipur' | 'Jaipur'>('Udaipur');
  const [newBudget, setNewBudget] = useState('₹2.50 Cr');
  const [newGuests, setNewGuests] = useState('400');

  const [enquiries, setEnquiries] = useState<Enquiry[]>([
    {
      id: 'ENQ-2026-104',
      couple: 'Kriti Maheshwari & Siddharth Jain',
      channel: 'WhatsApp Inquiry',
      phone: '+91 98290 11223',
      cityPreference: 'Udaipur',
      datesRough: 'Dec 2026 (Winter Wedding)',
      guestCount: 420,
      theme: 'Royal Heritage / Palace Romance',
      budgetMax: '₹2.50 Cr',
      agreementStatus: 'Signed on Mobile',
      agreementSignedAt: 'Oct 29, 2026',
      status: 'Consultation Booked',
    },
    {
      id: 'ENQ-2026-103',
      couple: 'Simran Bajaj & Armaan Gill',
      channel: 'Instagram DM',
      phone: '+91 98110 44556',
      cityPreference: 'Jaipur',
      datesRough: 'Nov 2026',
      guestCount: 500,
      theme: 'Regal Fortress Chic',
      budgetMax: '₹3.00 Cr',
      agreementStatus: 'Sent - Pending Signature',
      status: 'Agreement Awaited',
    },
    {
      id: 'ENQ-2026-102',
      couple: 'Niharika Verma & Kabir Saxena',
      channel: 'Phone Call Referral',
      phone: '+91 99887 66554',
      cityPreference: 'Udaipur',
      datesRough: 'Jan 2027',
      guestCount: 380,
      theme: 'Lakeside Candlelight',
      budgetMax: '₹1.80 Cr',
      agreementStatus: 'Drafting Agreement',
      status: 'Initial Discovery',
    },
  ]);

  // Load enquiries from backend API
  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enquiries');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Enquiry[] = res.data.map((row: any) => {
          const budgetRaw = row.budgetMax || row.budget_max;
          let budgetStr = '₹2.50 Cr';
          if (budgetRaw) {
            const cr = Number(budgetRaw) / 10000000;
            budgetStr = `₹${cr.toFixed(2)} Cr`;
          }

          const rawAgreement = row.agreementStatus || row.agreement_status || 'Drafting Agreement';
          let agreementSt: any = 'Drafting Agreement';
          if (String(rawAgreement).includes('Signed')) agreementSt = 'Signed on Mobile';
          else if (String(rawAgreement).includes('Sent')) agreementSt = 'Sent - Pending Signature';

          const signedAt = row.agreementSignedAt || row.agreement_signed_at;
          const cityPref = (row.cityPreference || row.city_preference) === 'Jaipur' ? 'Jaipur' : 'Udaipur';

          return {
            id: row.code || `ENQ-${String(row.id || '').slice(0, 8)}`,
            dbId: row.id,
            couple: row.coupleName || row.couple_name || 'Couple Consultation',
            primaryContactName: row.primaryContactName || row.primary_contact_name,
            channel: row.channel || 'Website Consultation',
            phone: row.phone || '',
            email: row.email || '',
            cityPreference: cityPref,
            datesRough: row.datesRough || row.dates_rough || 'Winter 2026',
            guestCount: Number(row.guestCount || row.guest_count) || 400,
            theme: row.theme || 'Royal Heritage',
            budgetMax: budgetStr,
            packagePreference: row.packagePreference || row.package_preference || 'FULL_SERVICE',
            agreementStatus: agreementSt,
            agreementSignedAt: signedAt ? new Date(signedAt).toLocaleDateString() : undefined,
            status: row.status || 'Initial Discovery',
            weddingId: row.weddingId || row.wedding_id,
            notes: row.notes || '',
            createdAt: row.createdAt || row.created_at,
          };
        });
        setEnquiries(mapped);
      }
    } catch (e) {
      console.warn('Using seeded / local enquiries fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouple) return;

    try {
      const budgetNum = parseFloat(newBudget.replace(/[^0-9.]/g, '')) * 10000000 || 25000000;
      const res = await api.post('/enquiries', {
        coupleName: newCouple,
        phone: newPhone || '+91 98000 00000',
        channel: newChannel,
        cityPreference: newCity,
        guestCount: parseInt(newGuests, 10) || 400,
        budgetMax: budgetNum,
        datesRough: 'Winter 2026',
      });

      if (res.success) {
        await fetchEnquiries();
      }
    } catch (err) {
      console.warn('Local lead creation fallback:', err);
      const newEnq: Enquiry = {
        id: `ENQ-2026-${100 + enquiries.length + 2}`,
        couple: newCouple,
        channel: newChannel,
        phone: newPhone || '+91 98000 00000',
        cityPreference: newCity,
        datesRough: 'Winter 2026',
        guestCount: parseInt(newGuests, 10) || 400,
        theme: 'Palace Regal',
        budgetMax: newBudget,
        agreementStatus: 'Drafting Agreement',
        status: 'Initial Discovery',
      };
      setEnquiries([newEnq, ...enquiries]);
    }

    setModalOpen(false);
    setNewCouple('');
    setNewPhone('');
  };



  const filtered = enquiries.filter((e) => {
    const matchesStage = stageFilter === 'ALL' || e.status === stageFilter;
    const matchesChannel = channelFilter === 'ALL' || (e.channel || '').includes(channelFilter);
    const matchesCity = cityFilter === 'ALL' || e.cityPreference === cityFilter;
    const matchesSearch =
      (e.couple || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.phone || '').includes(searchTerm) ||
      (e.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesChannel && matchesCity && matchesSearch;
  });

  const stageCounts = {
    ALL: enquiries.length,
    'Initial Discovery': enquiries.filter((e) => e.status === 'Initial Discovery').length,
    'Consultation Booked': enquiries.filter((e) => e.status === 'Consultation Booked').length,
    'Agreement Awaited': enquiries.filter((e) => e.status === 'Agreement Awaited').length,
    'Converted to Wedding': enquiries.filter((e) => e.status === 'Converted to Wedding').length,
  };

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            CRM & Lead Pipeline
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Client Enquiries & Intake
          </h1>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Lead Intake</span>
        </Button>
      </div>

      {/* 1. Pipeline Stages Tabs with Live Counts */}
      <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
        <Tabs value={stageFilter} onValueChange={setStageFilter} className="w-full">
          <TabsList className="h-9 bg-slate-100 border border-slate-200 w-full justify-start overflow-x-auto p-1">
            <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
              All Stages ({stageCounts.ALL})
            </TabsTrigger>
            <TabsTrigger value="Initial Discovery" className="text-xs px-3 font-semibold">
              Initial Discovery ({stageCounts['Initial Discovery']})
            </TabsTrigger>
            <TabsTrigger value="Consultation Booked" className="text-xs px-3 font-semibold">
              Consultation Booked ({stageCounts['Consultation Booked']})
            </TabsTrigger>
            <TabsTrigger value="Agreement Awaited" className="text-xs px-3 font-semibold">
              Agreement Awaited ({stageCounts['Agreement Awaited']})
            </TabsTrigger>
            <TabsTrigger value="Converted to Wedding" className="text-xs px-3 font-semibold">
              Converted ({stageCounts['Converted to Wedding']})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2. Filter & Search Toolbar (Search, Channel Filter Dropdown, City Filter Dropdown) */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search couple, phone, or enquiry ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs border-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Channel Filter Dropdown */}
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs border-slate-300 bg-white">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Channels</SelectItem>
              <SelectItem value="Website">Website Leads</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Phone">Phone Calls</SelectItem>
            </SelectContent>
          </Select>

          {/* City Filter Dropdown */}
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs border-slate-300 bg-white">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Cities</SelectItem>
              <SelectItem value="Udaipur">Udaipur</SelectItem>
              <SelectItem value="Jaipur">Jaipur</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(channelFilter !== 'ALL' || cityFilter !== 'ALL' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setChannelFilter('ALL');
                setCityFilter('ALL');
                setSearchTerm('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <TableHead className="w-28">Ref Code</TableHead>
              <TableHead>Couple & Contact</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>City & Season</TableHead>
              <TableHead>Scale & Budget</TableHead>
              <TableHead>Agreement Status</TableHead>
              <TableHead>Pipeline Stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                  No enquiries found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((enq) => (
                <TableRow
                  key={enq.id}
                  onClick={() => navigate(`/enquiries/${enq.id}`)}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors text-xs"
                >
                  {/* Ref Code */}
                  <TableCell className="font-mono font-bold text-slate-700 py-3">
                    {enq.id}
                  </TableCell>

                  {/* Couple Name */}
                  <TableCell>
                    <div className="font-bold text-slate-900">{enq.couple}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{enq.phone}</span>
                      {enq.primaryContactName && (
                        <>
                          <span>•</span>
                          <span>{enq.primaryContactName}</span>
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* Channel */}
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {enq.channel}
                    </Badge>
                  </TableCell>

                  {/* City & Season */}
                  <TableCell>
                    <div className="font-medium text-slate-800">{enq.cityPreference}</div>
                    <div className="text-[10px] text-slate-500">{enq.datesRough}</div>
                  </TableCell>

                  {/* Scale & Budget */}
                  <TableCell>
                    <div className="font-bold text-slate-900">{enq.budgetMax}</div>
                    <div className="text-[10px] text-slate-500">{enq.guestCount} guests</div>
                  </TableCell>

                  {/* Agreement Status */}
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${enq.agreementStatus === 'Signed on Mobile'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : enq.agreementStatus === 'Sent - Pending Signature'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                      {enq.agreementStatus}
                    </span>
                  </TableCell>

                  {/* Pipeline Stage */}
                  <TableCell>
                    <Badge
                      variant={
                        enq.status === 'Consultation Booked'
                          ? 'success'
                          : enq.status === 'Agreement Awaited'
                            ? 'warning'
                            : enq.status === 'Converted to Wedding'
                              ? 'odoo'
                              : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {enq.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>



      {/* Modal: New Lead Intake */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              New Couple Lead Intake
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Log incoming inquiry and attach CRM lead specifications.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEnquiry} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="couple_name">Couple Identifier / Names</Label>
              <Input
                id="couple_name"
                placeholder="e.g. Radhika Merchant & Anant"
                value={newCouple}
                onChange={(e) => setNewCouple(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="+91 98290 00000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="channel">Channel</Label>
                <Select value={newChannel} onValueChange={(val: any) => setNewChannel(val)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website Consultation">Website Lead</SelectItem>
                    <SelectItem value="WhatsApp Inquiry">WhatsApp Inquiry</SelectItem>
                    <SelectItem value="Instagram DM">Instagram DM</SelectItem>
                    <SelectItem value="Phone Call Referral">Phone Call Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="city">City Preference</Label>
                <Select value={newCity} onValueChange={(val: any) => setNewCity(val)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Udaipur">Udaipur</SelectItem>
                    <SelectItem value="Jaipur">Jaipur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="guests">Guest Count</Label>
                <Select value={newGuests} onValueChange={(val: any) => setNewGuests(val)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Guests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="350">350 Guests</SelectItem>
                    <SelectItem value="400">400 Guests</SelectItem>
                    <SelectItem value="450">450 Guests</SelectItem>
                    <SelectItem value="500">500 Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="budget">Max Budget</Label>
                <Select value={newBudget} onValueChange={(val: any) => setNewBudget(val)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="₹1.80 Cr">₹1.80 Cr</SelectItem>
                    <SelectItem value="₹2.50 Cr">₹2.50 Cr</SelectItem>
                    <SelectItem value="₹3.00 Cr">₹3.00 Cr</SelectItem>
                    <SelectItem value="₹4.50 Cr">₹4.50 Cr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="default">
                Register Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
