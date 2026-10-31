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
  Tag,
  Calendar,
  Sparkles
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
} from '../components/ui';

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
  } | null;
  createdAt: string;
}

export const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { weddingOptions } = useWeddingStore();

  const [vendor, setVendor] = useState<VendorDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      console.error('Failed to save vendor edit:', err);
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
        showToast(`Vendor assigned to wedding project successfully.`);
        setAssignModalOpen(false);
        setTargetWeddingId('');
      }
    } catch (err) {
      console.error('Failed to assign vendor to wedding:', err);
      showToast('Error assigning vendor.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px] text-xs text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#714B67]" />
        <span>Loading vendor dossier...</span>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center max-w-md mx-auto my-12 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Vendor Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested vendor profile does not exist or has been removed.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/procurement')}
          className="text-xs h-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        </Button>
      </div>
    );
  }

  const pricingEstimate = vendor.bankAccountInfo?.pricingEstimate || 'Standard rate on request';
  const specialties = vendor.bankAccountInfo?.specialties || 'Verified partner registered in Royal Knot agency directory.';

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#714B67] text-white text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-medium border border-[#5b3c53]">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Control Bar */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/procurement')}
            className="h-8 text-xs text-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Procurement / Vendor Directory
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

      {/* 2. Primary Vendor Dossier Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Vendor Profile & Contact (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border border-slate-200 rounded shadow-2xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#714B67]" />
                  <span>Vendor Profile</span>
                </CardTitle>
                <p className="text-[11px] text-slate-500">Registered commercial partner details</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] py-0 font-mono font-bold text-[#714B67] border-[#714B67]/30 bg-[#714B67]/5">
                  {vendor.category}
                </Badge>
                <div className="flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                  <span>{vendor.ratingScore}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5 text-xs">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Business Name</span>
                  <strong className="text-slate-900 text-sm">{vendor.businessName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Category</span>
                  <Badge variant="outline" className="font-mono text-xs mt-0.5 border-slate-300">
                    {vendor.category}
                  </Badge>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Primary Contact Person</span>
                  <span className="text-slate-800 font-semibold">{vendor.contactPerson || 'Not specified'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Operational City</span>
                  <span className="text-slate-800 font-semibold">{vendor.city || 'Jaipur'}</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Phone Number</span>
                  <a
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-1.5 font-mono font-bold text-slate-900 hover:text-[#714B67] mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vendor.phone}</span>
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Email Address</span>
                  {vendor.email ? (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-1.5 text-slate-800 hover:text-[#714B67] mt-0.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vendor.email}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 mt-0.5 block">Not provided</span>
                  )}
                </div>
              </div>

              {/* Specialties & Pricing Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#714B67]" />
                    Baseline Pricing Estimate
                  </span>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-xs">
                    {pricingEstimate}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#714B67]" />
                    Specialties & Description
                  </span>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed">
                    {specialties}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Info & Registration Meta */}
        <div className="space-y-4">
          <Card className="border border-slate-200 rounded shadow-2xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-xs font-bold text-slate-900">
                Partner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Vendor ID</span>
                <span className="font-mono text-[11px] text-slate-600 select-all">{vendor.id}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px]">Partner Status</span>
                <Badge variant="success" className="text-[10px] py-0 mt-0.5">
                  Active Directory
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Date Added
                </span>
                <span className="text-slate-700 font-medium mt-0.5 block">
                  {new Date(vendor.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignModalOpen(true)}
                  className="w-full h-8 text-xs font-semibold text-[#714B67] border-[#714B67]/30 hover:bg-[#714B67]/5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                  Assign to Wedding Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Modal: Edit Vendor Profile */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Vendor Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update commercial details, contact numbers, and service estimates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs font-semibold">Business Name *</Label>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Contact Person</Label>
                <Input
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Phone *</Label>
                <Input
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Email</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Rating Score</Label>
                <Input
                  value={editRating}
                  onChange={(e) => setEditRating(e.target.value)}
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Pricing Estimate</Label>
                <Input
                  value={editPricing}
                  onChange={(e) => setEditPricing(e.target.value)}
                  placeholder="e.g. ₹8,500"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Specialties / Notes</Label>
              <Input
                value={editSpecialties}
                onChange={(e) => setEditSpecialties(e.target.value)}
                placeholder="e.g. silver chair, royal mandap"
                className="h-8 text-xs mt-1"
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
                size="sm"
                disabled={submittingEdit}
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white"
              >
                {submittingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Modal: Assign Vendor to Wedding Project */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Assign Vendor to Wedding
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add {vendor.businessName} to the procurement options for a specific wedding.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignToWedding} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs font-semibold">Target Wedding Project</Label>
              <select
                required
                value={targetWeddingId}
                onChange={(e) => setTargetWeddingId(e.target.value)}
                className="w-full mt-1.5 h-8 text-xs bg-white border border-slate-300 rounded px-2 text-slate-800"
              >
                <option value="">Select a wedding...</option>
                {weddingOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} • {w.couple} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              This vendor will be assigned under category <strong className="text-slate-900">{vendor.category}</strong>.
            </div>

            <DialogFooter>
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
                size="sm"
                disabled={submittingAssign || !targetWeddingId}
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold"
              >
                {submittingAssign ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Confirm Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
