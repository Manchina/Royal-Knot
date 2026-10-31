import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  SlidersHorizontal,
  Loader2,
  Edit2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';
import { useWeddingStore } from '../store/useWeddingStore';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';

interface VendorQuoteHistory {
  quoteId: string;
  quoteReference?: string;
  baseCost: string;
  pricePerPlate?: string;
  overtimeHourlyRate?: string;
  status: string;
  decisionReason?: string;
  decidedAt?: string;
  inclusions?: string;
  exclusions?: string;
  rfqId: string;
  serviceCategory: string;
  weddingId?: string;
  weddingCode?: string;
  weddingCity?: string;
  weddingVenue?: string;
  weddingStartDate?: string;
  coupleName?: string;
}

interface VendorDetailData {
  id: string;
  businessName: string;
  category: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  city?: string;
  ratingScore: string | number;
  bankAccountInfo?: {
    pricingEstimate?: string;
    specialties?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  } | null;
  createdAt: string;
  quotes?: VendorQuoteHistory[];
  metrics?: {
    totalQuotes: number;
    awardedQuotes: number;
    winRate: number;
  };
}

export const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { weddingOptions, setSelectedWeddingId } = useWeddingStore();

  const [vendor, setVendor] = useState<VendorDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dossier');

  // Edit Vendor Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRating, setEditRating] = useState('4.90');
  const [editPricing, setEditPricing] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Assign to Wedding Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetWeddingId, setTargetWeddingId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Bottom Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchVendorDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: VendorDetailData }>(`/api/procurement/vendors/${id}`);
      if (res?.success && res.data) {
        setVendor(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendor details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDetails();
  }, [id]);

  const handleOpenEdit = () => {
    if (!vendor) return;
    setEditName(vendor.businessName);
    setEditContact(vendor.contactPerson || '');
    setEditPhone(vendor.phone);
    setEditEmail(vendor.email || '');
    setEditCity(vendor.city || 'Jaipur');
    setEditRating(String(vendor.ratingScore || '4.90'));
    setEditPricing(vendor.bankAccountInfo?.pricingEstimate || '');
    setEditSpecialties(vendor.bankAccountInfo?.specialties || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setSubmittingEdit(true);
    try {
      const res = await api.put<{ success: boolean; message: string; data: any }>(`/api/procurement/vendors/${vendor.id}`, {
        businessName: editName,
        contactPerson: editContact,
        phone: editPhone,
        email: editEmail,
        city: editCity,
        ratingScore: editRating,
        pricingEstimate: editPricing,
        specialties: editSpecialties,
      });

      if (res?.success) {
        showToast('Vendor profile updated successfully.');
        setEditModalOpen(false);
        fetchVendorDetails();
      }
    } catch (err) {
      console.error('Failed to update vendor:', err);
      showToast('Error updating vendor profile.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleAssignToWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !targetWeddingId) return;

    setSubmittingAssign(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/api/procurement/assign-options', {
        weddingId: targetWeddingId,
        category: vendor.category,
        vendorIds: [vendor.id],
      });

      if (res?.success) {
        showToast(`Assigned ${vendor.businessName} to wedding project.`);
        setAssignModalOpen(false);
        fetchVendorDetails();
      }
    } catch (err) {
      console.error('Failed to assign vendor:', err);
      showToast('Error assigning vendor.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-2xs space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#714B67] mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading vendor dossier...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Vendor Not Found</h2>
          <p className="text-xs text-slate-500">The requested vendor profile does not exist.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/procurement')}
          className="text-xs h-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Procurement & Vendor Directory
        </Button>
      </div>
    );
  }

  const quotes = vendor.quotes || [];
  const metrics = vendor.metrics || {
    totalQuotes: quotes.length,
    awardedQuotes: quotes.filter((q) => q.status === 'ACCEPTED' || q.status === 'AWARDED').length,
    winRate: 0,
  };

  const getQuoteBadge = (status: string) => {
    const st = status?.toUpperCase() || '';
    if (st === 'ACCEPTED' || st === 'AWARDED') {
      return <Badge variant="success" className="text-[10px] py-0 font-bold">Awarded ✓</Badge>;
    }
    if (st === 'PENDING') {
      return <Badge variant="secondary" className="text-[10px] py-0 text-amber-800 bg-amber-50 font-semibold">Under Review</Badge>;
    }
    if (st === 'AUTO_REJECTED' || st === 'REJECTED') {
      return <Badge variant="outline" className="text-[10px] py-0 border-slate-300 text-slate-400">Closed</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] py-0">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#714B67] text-white text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-medium border border-[#5b3c53]">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Odoo Breadcrumbs & Control Bar */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/procurement')}
            className="h-8 text-xs text-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Vendor Directory
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Procurement / Master Vendors
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-xs font-bold text-[#714B67]">
                {vendor.category}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {vendor.businessName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="h-8 text-xs text-slate-700 font-semibold"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
            Edit Profile
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setAssignModalOpen(true)}
            className="h-8 text-xs bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            Assign to Wedding
          </Button>
        </div>
      </div>

      {/* 2. Hero Overview Card */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] py-0 font-mono font-bold text-[#714B67] border-[#714B67]/30 bg-[#714B67]/5">
              {vendor.category}
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 border-slate-300 text-slate-700 font-semibold">
              {vendor.city || 'Jaipur'}
            </Badge>
            <div className="flex items-center gap-1 font-bold text-xs text-amber-700">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>{vendor.ratingScore} ★ Verified Partner</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {vendor.businessName}
          </h2>

          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
            {vendor.contactPerson && (
              <span className="font-semibold text-slate-800">
                Contact: {vendor.contactPerson}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {vendor.phone}
            </span>
            {vendor.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {vendor.email}
              </span>
            )}
          </div>
        </div>

        {/* Performance Metric Counters */}
        <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total RFQs</span>
            <div className="text-base font-bold text-slate-900 font-mono">{metrics.totalQuotes}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Won Contracts</span>
            <div className="text-base font-bold text-emerald-700 font-mono">{metrics.awardedQuotes}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Win Rate</span>
            <div className="text-base font-bold text-[#714B67] font-mono">{metrics.winRate}%</div>
          </div>
        </div>
      </div>

      {/* 3. Tabbed Content Dossier */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-slate-200 px-3 pt-1">
            <TabsList className="h-9 bg-transparent border-0 p-0 space-x-2">
              <TabsTrigger
                value="dossier"
                className="text-xs font-bold border-b-2 border-transparent data-[state=active]:border-[#714B67] data-[state=active]:text-[#714B67] rounded-none px-3"
              >
                Commercial Dossier & Capabilities
              </TabsTrigger>
              <TabsTrigger
                value="quotes"
                className="text-xs font-bold border-b-2 border-transparent data-[state=active]:border-[#714B67] data-[state=active]:text-[#714B67] rounded-none px-3"
              >
                Quote History & Contracts ({quotes.length})
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                className="text-xs font-bold border-b-2 border-transparent data-[state=active]:border-[#714B67] data-[state=active]:text-[#714B67] rounded-none px-3"
              >
                Bank & Payout Profile
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Commercial Dossier */}
          <TabsContent value="dossier" className="p-5 m-0 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="border border-slate-200 rounded shadow-2xs">
                <CardHeader className="p-3.5 border-b border-slate-100 bg-slate-50/70">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#714B67]" />
                    Business & Commercial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Primary Category</span>
                      <strong className="text-slate-800">{vendor.category}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Operational Hub</span>
                      <strong className="text-slate-800">{vendor.city || 'Jaipur, Rajasthan'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Baseline Pricing Estimate</span>
                      <span className="font-mono font-bold text-slate-800">
                        {vendor.bankAccountInfo?.pricingEstimate || '₹5,00,000 - ₹12,00,000 (Based on scale)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Specialties & Signature Services</span>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded text-[11px] leading-relaxed mt-1">
                        {vendor.bankAccountInfo?.specialties || 'Palace-grade catering, certified royal banquet staff, silver chinaware, regional live counters, verified equipment.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 rounded shadow-2xs">
                <CardHeader className="p-3.5 border-b border-slate-100 bg-slate-50/70">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Quality & Audit Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Audit Rating</span>
                      <strong className="text-amber-800">{vendor.ratingScore} / 5.00 Stars</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Verification</span>
                      <strong className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Enterprise Partner
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Registered On</span>
                      <span className="text-slate-700 font-mono">
                        {new Date(vendor.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Coverage Cities</span>
                      <span className="text-slate-700">Jaipur, Udaipur, Jodhpur, Ranthambore</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: Quote History & Contracts */}
          <TabsContent value="quotes" className="p-5 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">RFQs & Contract Decisions</h3>
                <p className="text-xs text-slate-500">Historical proposals and contract award outcomes for this vendor.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModalOpen(true)}
                className="text-xs h-8 border-slate-300 font-semibold"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
                Assign to Another Wedding
              </Button>
            </div>

            {quotes.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded p-8 text-center text-xs text-slate-400">
                No past quotes or proposals recorded for this vendor yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-slate-50 text-slate-700">
                    <TableRow>
                      <TableHead className="w-[120px] text-xs font-bold">Quote Ref</TableHead>
                      <TableHead className="text-xs font-bold">Wedding Project</TableHead>
                      <TableHead className="text-xs font-bold">Venue & City</TableHead>
                      <TableHead className="text-xs font-bold">Base Rate</TableHead>
                      <TableHead className="text-xs font-bold">Plate / Overtime</TableHead>
                      <TableHead className="text-xs font-bold">Outcome</TableHead>
                      <TableHead className="text-right text-xs font-bold pr-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((q) => (
                      <TableRow key={q.quoteId} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-bold text-[#714B67]">
                          {q.quoteReference || q.quoteId.slice(0, 8)}
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-xs text-slate-900">
                            {q.coupleName || 'Wedding Project'}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {q.weddingCode}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-slate-700">
                          <div>{q.weddingVenue || 'Luxury Palace'}</div>
                          <div className="text-[11px] text-slate-400">{q.weddingCity}</div>
                        </TableCell>

                        <TableCell className="font-mono font-bold text-xs text-slate-900">
                          ₹{Number(q.baseCost).toLocaleString('en-IN')}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-slate-600">
                          {q.pricePerPlate ? `₹${Number(q.pricePerPlate).toLocaleString('en-IN')} / plate` : '—'}
                        </TableCell>

                        <TableCell>
                          {getQuoteBadge(q.status)}
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          {q.weddingCode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (q.weddingId) setSelectedWeddingId(q.weddingId);
                                navigate(`/weddings/${q.weddingCode}`);
                              }}
                              className="h-7 text-xs text-[#714B67] hover:text-[#5b3c53] font-semibold"
                            >
                              View Wedding
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Compliance & Bank Details */}
          <TabsContent value="compliance" className="p-5 m-0 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Financial & Settlement Information</h3>
              <p className="text-xs text-slate-500">Bank accounts for milestone disbursements and compliance audit logs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Bank Account Details</span>
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <div>Account: {vendor.bankAccountInfo?.accountNumber || '•••• •••• •••• 4402'}</div>
                  <div>IFSC Code: {vendor.bankAccountInfo?.ifscCode || 'HDFC0001042'}</div>
                  <div>Bank: {vendor.bankAccountInfo?.bankName || 'HDFC Bank, MI Road Branch, Jaipur'}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-4 bg-slate-50/50 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Disbursement Schedule</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Standard PeopleFirst 3-tranche milestone payout: 25% Advance Booking, 50% Hall Rehearsal / Setup, 25% Post Event Final Settlement.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL 1: Edit Vendor Profile */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Vendor Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update commercial details, contact coordinates, and service inclusions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Business Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Contact Person</Label>
                <Input
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Operational City</Label>
                <Input
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Audit Rating (Stars)</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="1"
                  max="5"
                  value={editRating}
                  onChange={(e) => setEditRating(e.target.value)}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Pricing Estimate</Label>
                <Input
                  value={editPricing}
                  onChange={(e) => setEditPricing(e.target.value)}
                  placeholder="e.g. ₹8,00,000"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Specialties & Inclusions</Label>
              <textarea
                value={editSpecialties}
                onChange={(e) => setEditSpecialties(e.target.value)}
                rows={2}
                className="mt-1 w-full text-xs bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingEdit}
                size="sm"
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white"
              >
                {submittingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Assign to Wedding */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Assign {vendor.businessName} to Wedding
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select the wedding project to add this vendor as a candidate {vendor.category} option.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignToWedding} className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Target Wedding *</Label>
              <select
                value={targetWeddingId}
                onChange={(e) => setTargetWeddingId(e.target.value)}
                className="mt-1 w-full h-8 text-xs bg-white border border-slate-200 rounded px-2 text-slate-800"
                required
              >
                <option value="">Select Wedding Project...</option>
                {weddingOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code}: {w.couple} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssignModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAssign || !targetWeddingId}
                size="sm"
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white"
              >
                {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
