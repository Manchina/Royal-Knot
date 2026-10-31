import { useState } from 'react';
import { 
  Plus, 
  Phone, 
  FileCheck, 
  Clock, 
  Search,
  CheckCircle2
} from 'lucide-react';
import {
  Card,
  CardContent,
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
} from '../components/ui';

interface Enquiry {
  id: string;
  couple: string;
  channel: 'WhatsApp Inquiry' | 'Instagram DM' | 'Phone Call Referral';
  phone: string;
  cityPreference: 'Udaipur' | 'Jaipur';
  datesRough: string;
  guestCount: number;
  theme: string;
  budgetMax: string;
  agreementStatus: 'Signed on Mobile' | 'Sent - Pending Signature' | 'Drafting Agreement';
  agreementSignedAt?: string;
  status: 'Consultation Booked' | 'Agreement Awaited' | 'Initial Discovery';
}

export const Enquiries: React.FC = () => {
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Form states
  const [newCouple, setNewCouple] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newChannel, setNewChannel] = useState<'WhatsApp Inquiry' | 'Instagram DM' | 'Phone Call Referral'>('WhatsApp Inquiry');
  const [newCity, setNewCity] = useState<'Udaipur' | 'Jaipur'>('Udaipur');
  const [newBudget, setNewBudget] = useState('₹2.00 Cr');
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

  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouple) return;

    const newEnq: Enquiry = {
      id: `ENQ-2026-${100 + enquiries.length + 2}`,
      couple: newCouple,
      channel: newChannel,
      phone: newPhone || '+91 98000 00000',
      cityPreference: newCity,
      datesRough: 'Spring 2027',
      guestCount: parseInt(newGuests, 10) || 400,
      theme: 'Palace Regal',
      budgetMax: newBudget,
      agreementStatus: 'Drafting Agreement',
      status: 'Initial Discovery',
    };

    setEnquiries([newEnq, ...enquiries]);
    setModalOpen(false);
    setNewCouple('');
    setNewPhone('');
  };

  const handleSignAgreement = (id: string) => {
    setEnquiries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              agreementStatus: 'Signed on Mobile',
              agreementSignedAt: 'Just Now',
              status: 'Consultation Booked',
            }
          : e
      )
    );
  };

  const filtered = enquiries.filter((e) => {
    const matchesChannel = channelFilter === 'ALL' || e.channel.includes(channelFilter);
    const matchesSearch =
      e.couple.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone.includes(searchTerm) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChannel && matchesSearch;
  });

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

      {/* Odoo Filter & Search Toolbar */}
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

        <Tabs value={channelFilter} onValueChange={setChannelFilter} className="w-full md:w-auto">
          <TabsList className="h-8 bg-slate-100 border border-slate-200">
            <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
              All Channels ({enquiries.length})
            </TabsTrigger>
            <TabsTrigger value="WhatsApp" className="text-xs px-3 font-semibold">
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="Instagram" className="text-xs px-3 font-semibold">
              Instagram
            </TabsTrigger>
            <TabsTrigger value="Phone" className="text-xs px-3 font-semibold">
              Phone Calls
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Enquiry Cards */}
      <div className="space-y-3">
        {filtered.map((enq) => (
          <Card key={enq.id} className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{enq.id}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {enq.channel}
                    </Badge>
                    <Badge variant="odoo" className="text-[10px]">
                      {enq.cityPreference}
                    </Badge>
                    <Badge
                      variant={
                        enq.status === 'Consultation Booked'
                          ? 'success'
                          : enq.status === 'Agreement Awaited'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {enq.status}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">{enq.couple}</h3>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-800">{enq.phone}</span>
                    </div>
                    <div>
                      Guests: <strong className="text-slate-900">{enq.guestCount}</strong>
                    </div>
                    <div>
                      Target: <strong className="text-slate-900">{enq.datesRough}</strong>
                    </div>
                    <div>
                      Budget Cap: <strong className="text-slate-900 font-mono">{enq.budgetMax}</strong>
                    </div>
                  </div>
                </div>

                {/* Right Agreement Box */}
                <div className="lg:w-72 shrink-0 p-3 rounded bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Agreement:</span>
                    <span
                      className={`font-bold text-xs flex items-center gap-1 ${
                        enq.agreementStatus === 'Signed on Mobile'
                          ? 'text-emerald-800'
                          : 'text-amber-800'
                      }`}
                    >
                      {enq.agreementStatus === 'Signed on Mobile' ? (
                        <FileCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {enq.agreementStatus}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200">
                    {enq.agreementStatus !== 'Signed on Mobile' ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSignAgreement(enq.id)}
                        className="w-full text-xs h-7"
                      >
                        Confirm Signed Agreement
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 text-emerald-800 border-emerald-300 bg-emerald-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Converted to Project
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                  placeholder="+91 98..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="channel">Source Channel</Label>
                <Select
                  value={newChannel}
                  onValueChange={(val) => setNewChannel(val as any)}
                >
                  <SelectTrigger id="channel" className="h-8 text-xs border-slate-300">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp Inquiry">WhatsApp Inquiry</SelectItem>
                    <SelectItem value="Instagram DM">Instagram DM</SelectItem>
                    <SelectItem value="Phone Call Referral">Phone Call Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="city_pref">City Preference</Label>
                <Select
                  value={newCity}
                  onValueChange={(val) => setNewCity(val as any)}
                >
                  <SelectTrigger id="city_pref" className="h-8 text-xs border-slate-300">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Udaipur">Udaipur (Palaces & Lakes)</SelectItem>
                    <SelectItem value="Jaipur">Jaipur (Forts & Heritage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="guests_count">Expected Guests</Label>
                <Input
                  id="guests_count"
                  type="number"
                  placeholder="400"
                  value={newGuests}
                  onChange={(e) => setNewGuests(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="budget_max">Budget Cap</Label>
              <Input
                id="budget_max"
                placeholder="₹2.50 Cr"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Save & Open Proposal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
