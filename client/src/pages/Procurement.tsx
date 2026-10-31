import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Send, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  ComboboxMultiSelect,
  type ComboboxOption,
} from '../components/ui';
import { WeddingSourcingView } from '../components/procurement/WeddingSourcingView';
import { VendorDirectoryView, type VendorItem } from '../components/procurement/VendorDirectoryView';
import { useWeddingStore } from '../store/useWeddingStore';
import { useAuthStore } from '../store/useAuthStore';
import { useProcurementStore } from '../store/useProcurementStore';
import { vendorIntakeSchema, formatZodErrors } from '../lib/validations';

export const Procurement: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    selectedWeddingId, 
    setSelectedWeddingId, 
    weddingOptions, 
    fetchWeddingOptions 
  } = useWeddingStore();

  // Active Main Tab: 'weddings' or 'rfcs'
  const [activeMainTab, setActiveMainTab] = useState<'weddings' | 'rfcs'>('weddings');

  // Check permissions to create vendors
  const canCreateVendor = ['SUPER_ADMIN', 'LEAD_PLANNER', 'FOUNDER'].includes(user?.role || '');

  // Live procurement store data & actions
  const {
    vendorsList,
    vendorCounts,
    weddingsOverview,
    loading,
    fetchProcurementData,
    createVendor,
    assignVendorOptions,
  } = useProcurementStore();

  // Modals for Create Vendor & Assign Options
  const [createVendorOpen, setCreateVendorOpen] = useState<boolean>(false);
  const [assignOptionsOpen, setAssignOptionsOpen] = useState<boolean>(false);

  // Create Vendor Form State
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState<'CATERER' | 'DJ' | 'DECORATOR'>('CATERER');
  const [newVendorContact, setNewVendorContact] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorCity, setNewVendorCity] = useState('Jaipur');
  const [newVendorPrice, setNewVendorPrice] = useState('');
  const [newVendorSpecialties, setNewVendorSpecialties] = useState('');
  const [submittingVendor, setSubmittingVendor] = useState(false);
  const [vendorErrors, setVendorErrors] = useState<Record<string, string>>({});

  const clearVendorError = (field: string) => {
    setVendorErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Assign Options Form State
  const [assignWeddingId, setAssignWeddingId] = useState<string>('');
  const [assignCategory, setAssignCategory] = useState<'CATERER' | 'DJ' | 'DECORATOR'>('CATERER');
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Bottom-Middle Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetchProcurementData().then((res) => {
      if (res.weddingsOverview.length > 0) {
        const match = res.weddingsOverview.find(
          (w) => w.id === selectedWeddingId || w.code === selectedWeddingId
        );
        if (match) {
          setSelectedWeddingId(match.id);
        } else {
          setSelectedWeddingId(res.weddingsOverview[0].id);
        }
      }
    });
    fetchWeddingOptions();
  }, [fetchProcurementData, fetchWeddingOptions, selectedWeddingId, setSelectedWeddingId]);

  // Currently selected wedding in Weddings tab
  const currentWedding = useMemo(() => {
    if (!weddingsOverview.length) return null;
    return weddingsOverview.find((w) => w.id === selectedWeddingId || w.code === selectedWeddingId) || weddingsOverview[0];
  }, [weddingsOverview, selectedWeddingId]);

  const validateVendorForm = (): boolean => {
    const result = vendorIntakeSchema.safeParse({
      businessName: newVendorName,
      category: newVendorCategory,
      city: newVendorCity,
      phone: newVendorPhone,
      email: newVendorEmail,
    });

    if (!result.success) {
      setVendorErrors(formatZodErrors(result.error));
      return false;
    }

    setVendorErrors({});
    return true;
  };

  // Handle Create Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVendorForm()) return;

    setSubmittingVendor(true);
    try {
      const created = await createVendor({
        businessName: newVendorName.trim(),
        category: newVendorCategory,
        contactPerson: newVendorContact.trim(),
        phone: newVendorPhone.trim(),
        email: newVendorEmail.trim() || undefined,
        city: newVendorCity,
        pricingEstimate: newVendorPrice.trim(),
        specialties: newVendorSpecialties.trim(),
      });

      if (created) {
        showToast(`Vendor "${newVendorName}" registered successfully.`);
        setCreateVendorOpen(false);
        setNewVendorName('');
        setNewVendorContact('');
        setNewVendorPhone('');
        setNewVendorEmail('');
        setNewVendorPrice('');
        setNewVendorSpecialties('');
        setVendorErrors({});
      }
    } catch (err) {
      console.error('Failed to create vendor:', err);
      showToast('Error registering vendor.');
    } finally {
      setSubmittingVendor(false);
    }
  };

  // Handle Assign Options
  const handleAssignOptions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignWeddingId || !selectedVendorIds.length) return;

    setSubmittingAssign(true);
    try {
      const success = await assignVendorOptions({
        weddingId: assignWeddingId,
        category: assignCategory,
        vendorIds: selectedVendorIds,
      });

      if (success) {
        showToast(`Assigned ${selectedVendorIds.length} vendor options to wedding.`);
        setAssignOptionsOpen(false);
        setSelectedVendorIds([]);
      }
    } catch (err) {
      console.error('Failed to assign vendor options:', err);
      showToast('Error assigning vendor options.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Available options for Combobox Multi-Select (filtered by assignCategory)
  const availableComboboxOptions: ComboboxOption[] = useMemo(() => {
    return vendorsList
      .filter((v) => v.category === assignCategory)
      .map((v) => ({
        value: v.id,
        label: v.businessName,
        sublabel: `${v.city || 'Jaipur'} • Rating: ${v.ratingScore} ★ • ${v.phone}`,
        badge: v.category,
      }));
  }, [vendorsList, assignCategory]);

  const openAssignModalForCategory = (cat: 'CATERER' | 'DJ' | 'DECORATOR') => {
    setAssignWeddingId(currentWedding?.id || '');
    setAssignCategory(cat);
    const existingQuotes = currentWedding?.categories[cat]?.quotes || [];
    setSelectedVendorIds(existingQuotes.map((q) => q.vendorId));
    setAssignOptionsOpen(true);
  };

  const handleAssignVendorFromDirectory = (vendor: VendorItem) => {
    setAssignWeddingId(currentWedding?.id || '');
    if (vendor.category === 'CATERER' || vendor.category === 'DJ' || vendor.category === 'DECORATOR') {
      setAssignCategory(vendor.category as 'CATERER' | 'DJ' | 'DECORATOR');
    }
    setSelectedVendorIds([vendor.id]);
    setAssignOptionsOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification (Bottom Middle) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#714B67] text-white text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 font-medium border border-[#5b3c53] transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Odoo Control Panel Header (Matching Enquiries.tsx) */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Procurement & Vendor RFQs
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono font-bold text-[#714B67]">
              {activeMainTab === 'weddings' ? 'Wedding Sourcing' : 'Vendor Directory'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {activeMainTab === 'weddings' ? 'Wedding Sourcing & Decisions' : 'Vendor RFQs & Master Directory'}
            </h1>
            {loading && <Loader2 className="w-4 h-4 text-[#714B67] animate-spin" />}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssignWeddingId(currentWedding?.id || '');
              setAssignCategory('CATERER');
              setSelectedVendorIds([]);
              setAssignOptionsOpen(true);
            }}
            className="h-8 text-xs font-semibold text-slate-700"
          >
            <Send className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
            Assign Options
          </Button>

          {canCreateVendor && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setCreateVendorOpen(true)}
              className="h-8 text-xs bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create Vendor
            </Button>
          )}
        </div>
      </div>

      {/* 2. Main Tab Switcher (Weddings Sourcing vs Vendor Directory) */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveMainTab('weddings')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeMainTab === 'weddings'
              ? 'border-[#714B67] text-[#714B67]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Weddings Sourcing ({weddingsOverview.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('rfcs')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeMainTab === 'rfcs'
              ? 'border-[#714B67] text-[#714B67]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vendor RFQs Directory ({vendorsList.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* COMPONENT 1: WEDDING SOURCING VIEW                                        */}
      {/* ========================================================================= */}
      {activeMainTab === 'weddings' && (
        <WeddingSourcingView
          weddingsOverview={weddingsOverview}
          weddingOptions={weddingOptions}
          currentWedding={currentWedding}
          selectedWeddingId={selectedWeddingId}
          setSelectedWeddingId={setSelectedWeddingId}
          onOpenAssignModal={openAssignModalForCategory}
          onRefresh={fetchProcurementData}
          showToast={showToast}
          loading={loading}
        />
      )}

      {/* ========================================================================= */}
      {/* COMPONENT 2: VENDOR DIRECTORY VIEW                                        */}
      {/* ========================================================================= */}
      {activeMainTab === 'rfcs' && (
        <VendorDirectoryView
          vendorsList={vendorsList}
          vendorCounts={vendorCounts}
          onAssignToWedding={handleAssignVendorFromDirectory}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN OPTIONS TO WEDDING (Styled Like New Lead Intake Modal)    */}
      {/* ========================================================================= */}
      <Dialog open={assignOptionsOpen} onOpenChange={setAssignOptionsOpen}>
        <DialogContent className="max-w-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {selectedVendorIds.length > 0 ? 'Edit Assigned Vendor Options' : 'Assign Vendor Options to Wedding'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedVendorIds.length > 0
                ? 'Update or adjust shortlisted options for this category. Deselected vendors will be removed from review.'
                : 'Select target wedding, category, and multi-select vendor options using the searchable combobox.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignOptions} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Target Wedding Project *</Label>
              <select
                value={assignWeddingId}
                onChange={(e) => {
                  const newWedId = e.target.value;
                  setAssignWeddingId(newWedId);
                  const targetWed = weddingsOverview.find((w) => w.id === newWedId);
                  const existing = targetWed?.categories[assignCategory]?.quotes || [];
                  setSelectedVendorIds(existing.map((q) => q.vendorId));
                }}
                className="mt-1 w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
              >
                {weddingOptions.length > 0 ? (
                  weddingOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code}: {w.couple} ({w.city})
                    </option>
                  ))
                ) : (
                  weddingsOverview.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code}: {w.couple_name} ({w.destination_city})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Vendor Category *</Label>
              <select
                value={assignCategory}
                onChange={(e) => {
                  const newCat = e.target.value as 'CATERER' | 'DJ' | 'DECORATOR';
                  setAssignCategory(newCat);
                  const targetWed = weddingsOverview.find((w) => w.id === assignWeddingId);
                  const existing = targetWed?.categories[newCat]?.quotes || [];
                  setSelectedVendorIds(existing.map((q) => q.vendorId));
                }}
                className="mt-1 w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
              >
                <option value="CATERER">Catering & Banquets</option>
                <option value="DJ">DJ & Sound Production</option>
                <option value="DECORATOR">Palace Decor</option>
              </select>
            </div>

            {/* Combobox Multi-Select Component */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Vendor Options (Multi-Select) *
              </Label>
              <ComboboxMultiSelect
                options={availableComboboxOptions}
                selectedValues={selectedVendorIds}
                onChange={setSelectedVendorIds}
                placeholder={`Choose ${assignCategory} options...`}
                searchPlaceholder="Search vendor name, city, or phone..."
                emptyText={`No ${assignCategory} vendors registered yet.`}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Selected vendors will appear as options in the wedding project view for final award.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssignOptionsOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingAssign || selectedVendorIds.length === 0}
                size="sm"
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white"
              >
                {submittingAssign ? 'Saving Changes...' : selectedVendorIds.length > 0 ? 'Save & Update Options' : 'Assign Options'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE VENDOR (For Super Admin, Lead Planner, Founder)           */}
      {/* ========================================================================= */}
      <Dialog open={createVendorOpen} onOpenChange={setCreateVendorOpen}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create New Master Vendor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add a verified vendor to the master directory for sourcing across all luxury weddings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVendor} noValidate className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Business Name <span className="text-rose-500 font-bold ml-0.5">*</span>
              </Label>
              <Input
                type="text"
                required
                value={newVendorName}
                onChange={(e) => {
                  setNewVendorName(e.target.value);
                  clearVendorError('businessName');
                }}
                placeholder="e.g. Mewar Royal Banquets"
                className={`mt-1 h-8 text-xs ${vendorErrors.businessName ? 'border-rose-400 bg-rose-50/20' : ''}`}
              />
              {vendorErrors.businessName && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {vendorErrors.businessName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Category <span className="text-rose-500 font-bold ml-0.5">*</span>
                </Label>
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value as 'CATERER' | 'DJ' | 'DECORATOR')}
                  className="mt-1 w-full h-8 text-xs bg-white border border-slate-200 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                >
                  <option value="CATERER">Catering & Banquets</option>
                  <option value="DJ">DJ & Sound Production</option>
                  <option value="DECORATOR">Palace Decor</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  City <span className="text-rose-500 font-bold ml-0.5">*</span>
                </Label>
                <select
                  value={newVendorCity}
                  onChange={(e) => setNewVendorCity(e.target.value)}
                  className="mt-1 w-full h-8 text-xs bg-white border border-slate-200 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                >
                  <option value="Jaipur">Jaipur</option>
                  <option value="Udaipur">Udaipur</option>
                  <option value="Jodhpur">Jodhpur</option>
                  <option value="Jaisalmer">Jaisalmer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Contact Person</Label>
                <Input
                  type="text"
                  value={newVendorContact}
                  onChange={(e) => setNewVendorContact(e.target.value)}
                  placeholder="Chef Mahendra Singh"
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Phone Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  value={newVendorPhone}
                  onChange={(e) => {
                    setNewVendorPhone(e.target.value);
                    clearVendorError('phone');
                  }}
                  placeholder="+91 98290 00000"
                  className={`mt-1 h-8 text-xs ${vendorErrors.phone ? 'border-rose-400 bg-rose-50/20' : ''}`}
                />
                {vendorErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {vendorErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
              <Input
                type="email"
                value={newVendorEmail}
                onChange={(e) => {
                  setNewVendorEmail(e.target.value);
                  clearVendorError('email');
                }}
                placeholder="contact@vendor.com"
                className={`mt-1 h-8 text-xs ${vendorErrors.email ? 'border-rose-400 bg-rose-50/20' : ''}`}
              />
              {vendorErrors.email && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {vendorErrors.email}
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Estimated Base Price / Rate</Label>
              <Input
                type="text"
                value={newVendorPrice}
                onChange={(e) => setNewVendorPrice(e.target.value)}
                placeholder="₹2,100 / plate or ₹8,50,000 base"
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Specialties & Inclusions</Label>
              <textarea
                value={newVendorSpecialties}
                onChange={(e) => setNewVendorSpecialties(e.target.value)}
                placeholder="Silver chinaware, live counters, certified team..."
                rows={2}
                className="mt-1 w-full text-xs bg-white border border-slate-200 rounded p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateVendorOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingVendor}
                size="sm"
                className="text-xs h-8 bg-[#714B67] hover:bg-[#5b3c53] text-white"
              >
                {submittingVendor ? 'Saving...' : 'Register Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
