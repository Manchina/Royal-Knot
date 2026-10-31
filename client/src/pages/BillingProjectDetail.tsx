import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  FileText,
  Calendar,
  Users,
  MapPin,
  Clock,
  Receipt,
  CreditCard,
  History,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui';
import { api } from '../api/client';
import { useWeddingStore } from '../store/useWeddingStore';

interface LiveInvoice {
  id: string;
  invoiceNumber: string;
  stageKey: string;
  stageLabel: string;
  percentage: number;
  amountDue: string;
  rawAmountDue: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID';
  paidAmount: string;
  rawPaidAmount: number;
  paidAt?: string;
  paymentReference?: string;
}

interface LiveVendorBill {
  id: string;
  vendorId: string;
  vendor: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  agreedBase: string;
  rawAgreedBase: number;
  extras: string;
  rawExtras: number;
  totalPayable: string;
  rawTotalPayable: number;
  advancePaid: string;
  rawAdvancePaid: number;
  balanceDue: string;
  rawBalanceDue: number;
  status: 'PENDING' | 'RECONCILED_MATCHED' | 'SETTLEMENT_CLEARED' | 'DISPUTED';
  awardedQuoteId?: string;
  settledAt?: string;
}

interface LiveExtraCharge {
  id: string;
  dbId?: string;
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  rawTotal: number;
  vendor: string;
  vendorId?: string;
  isBilledToClient: boolean;
  status: 'ADDED_TO_CLIENT_INVOICE' | 'PENDING_APPROVAL';
  approvedBy: string;
  createdAt?: string;
}

interface LiveChangelog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  fromStatus?: string;
  toStatus?: string;
  amount?: string;
  performedBy: string;
  notes?: string;
  createdAt: string;
}

interface AvailableQuote {
  quoteId: string;
  rfqId: string;
  serviceCategory: string;
  description: string;
  vendorId: string;
  vendorName: string;
  baseCost: string;
  formattedCost: string;
  isBilled: boolean;
}

export const BillingProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { weddings } = useWeddingStore();

  const [_loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('vendorBills');
  const [project, setProject] = useState<any>(null);

  // Modals state
  const [extraModalOpen, setExtraModalOpen] = useState<boolean>(false);
  const [billModalOpen, setBillModalOpen] = useState<boolean>(false);
  const [reconcileModalOpen, setReconcileModalOpen] = useState<boolean>(false);
  const [payInvoiceModalOpen, setPayInvoiceModalOpen] = useState<boolean>(false);
  const [finaliseModalOpen, setFinaliseModalOpen] = useState<boolean>(false);

  // Selected entities for modals
  const [selectedBill, setSelectedBill] = useState<LiveVendorBill | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<LiveInvoice | null>(null);

  // Form states: Extra Charge
  const [extraCategory, setExtraCategory] = useState('EXTRA_PLATES');
  const [extraDesc, setExtraDesc] = useState('60 Unexpected Guests turned up at the Grand Durbar Banquet');
  const [extraQty, setExtraQty] = useState('60');
  const [extraUnitPrice, setExtraUnitPrice] = useState('2100');
  const [extraVendor, setExtraVendor] = useState('Marwar Heritage Kitchens');
  const [submittingExtra, setSubmittingExtra] = useState(false);

  // Form states: New Vendor Bill
  const [newBillVendorId, setNewBillVendorId] = useState('');
  const [newBillAgreedBase, setNewBillAgreedBase] = useState('1850000');
  const [newBillAdvance, setNewBillAdvance] = useState('925000');
  const [newBillNotes, setNewBillNotes] = useState('Sourced via Procurement Engine');
  const [submittingBill, setSubmittingBill] = useState(false);

  // Form states: Reconcile / Record Bill Payment
  const [reconcileAmount, setReconcileAmount] = useState('');
  const [reconcileRef, setReconcileRef] = useState('HDFC-NEFT-889922');
  const [reconcileNotes, setReconcileNotes] = useState('Settlement tranche cleared via NEFT');
  const [submittingReconcile, setSubmittingReconcile] = useState(false);

  // Form states: Pay Invoice
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('ICICI-RTGS-774411');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Form states: Finalise Project
  const [finaliseNotes, setFinaliseNotes] = useState('All 6 vendor accounts and 3 client milestone invoices fully reconciled and audited.');
  const [submittingFinalise, setSubmittingFinalise] = useState(false);

  // Fallback wedding from store
  const storeWedding = useMemo(() => {
    return weddings.find((w) => w.id === projectId || w.code === projectId) || weddings[0];
  }, [weddings, projectId]);

  // Fetch full live project dossier
  const fetchProjectDossier = async () => {
    const idToFetch = projectId || storeWedding?.id || 'RW-2026-001';
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: any }>(`/billing/projects/${idToFetch}`);
      if (res?.success && res.data) {
        setProject(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch live project billing dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDossier();
  }, [projectId]);

  // Data helpers
  const vendorBills: LiveVendorBill[] = project?.vendorBills || [];
  const extraCharges: LiveExtraCharge[] = project?.extraCharges || [];
  const invoices: LiveInvoice[] = project?.invoices || [];
  const availableQuotes: AvailableQuote[] = project?.availableQuotes || [];
  const changelog: LiveChangelog[] = project?.changelog || [];

  // Sync Winning Quotes Action
  const handleSyncAwardedQuotes = async () => {
    const idToFetch = projectId || project?.id;
    try {
      setLoading(true);
      const res = await api.post<{ success: boolean; message: string; syncedCount: number }>(
        `/billing/projects/${idToFetch}/sync-awarded-quotes`,
        {}
      );
      if (res?.success) {
        await fetchProjectDossier();
      }
    } catch (err) {
      console.error('Error syncing quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit Extra Charge
  const handleCreateExtraCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const idToFetch = projectId || project?.id;
    try {
      setSubmittingExtra(true);
      await api.post(`/billing/projects/${idToFetch}/extras`, {
        category: extraCategory,
        description: extraDesc,
        qty: parseFloat(extraQty) || 1,
        unitPrice: parseFloat(extraUnitPrice) || 0,
        vendor: extraVendor,
        performedBy: 'Devika Sharma (Finance Manager)',
      });
      setExtraModalOpen(false);
      await fetchProjectDossier();
    } catch (err) {
      console.error('Failed to create extra charge:', err);
    } finally {
      setSubmittingExtra(false);
    }
  };

  // Submit New Vendor Bill
  const handleCreateVendorBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const idToFetch = projectId || project?.id;
    try {
      setSubmittingBill(true);
      await api.post(`/billing/projects/${idToFetch}/vendor-bills`, {
        vendorId: newBillVendorId,
        agreedBaseAmount: parseFloat(newBillAgreedBase) || 0,
        advancePaid: parseFloat(newBillAdvance) || 0,
        notes: newBillNotes,
        performedBy: 'Devika Sharma (Finance Manager)',
      });
      setBillModalOpen(false);
      await fetchProjectDossier();
    } catch (err) {
      console.error('Failed to add vendor bill:', err);
    } finally {
      setSubmittingBill(false);
    }
  };

  // Submit Reconcile / Record Vendor Bill Payment
  const handleReconcileBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    const idToFetch = projectId || project?.id;
    try {
      setSubmittingReconcile(true);
      await api.put(`/billing/projects/${idToFetch}/vendor-bills/${selectedBill.id}/reconcile`, {
        paymentAmount: parseFloat(reconcileAmount) || selectedBill.rawBalanceDue,
        paymentReference: reconcileRef,
        notes: reconcileNotes,
        performedBy: 'Devika Sharma (Finance Manager)',
      });
      setReconcileModalOpen(false);
      setSelectedBill(null);
      await fetchProjectDossier();
    } catch (err) {
      console.error('Failed to reconcile bill:', err);
    } finally {
      setSubmittingReconcile(false);
    }
  };

  // Submit Pay Invoice
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const idToFetch = projectId || project?.id;
    try {
      setSubmittingPay(true);
      await api.put(`/billing/projects/${idToFetch}/pay-invoice`, {
        invoiceId: selectedInvoice.id,
        paidAmount: parseFloat(payAmount) || selectedInvoice.rawAmountDue,
        paymentReference: payRef,
        performedBy: 'Aditya Singhal (Finance Director)',
      });
      setPayInvoiceModalOpen(false);
      setSelectedInvoice(null);
      await fetchProjectDossier();
    } catch (err) {
      console.error('Failed to pay invoice:', err);
    } finally {
      setSubmittingPay(false);
    }
  };

  // Submit Finalise Project
  const handleFinaliseProject = async () => {
    const idToFetch = projectId || project?.id;
    try {
      setSubmittingFinalise(true);
      await api.put(`/billing/projects/${idToFetch}/finalise`, {
        notes: finaliseNotes,
        performedBy: 'Aditya Singhal (Super Admin)',
      });
      setFinaliseModalOpen(false);
      await fetchProjectDossier();
    } catch (err) {
      console.error('Failed to finalise project:', err);
    } finally {
      setSubmittingFinalise(false);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE_BIG_DAY':
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Live Big Day
          </Badge>
        );
      case 'IN_PLANNING':
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Planning
          </Badge>
        );
      case 'BOOKED':
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Booked
          </Badge>
        );
      case 'FINALISED_SETTLED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Finalised & Settled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600">
            {status}
          </Badge>
        );
    }
  };

  const isFinalised = project?.isFinalised || project?.status === 'FINALISED_SETTLED';

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Top Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Billing Registry
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20">
              {project?.code || 'RW-2026-001'}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {project?.couple || storeWedding?.couple}
            </h1>
            {renderStatusBadge(project?.status || 'IN_PLANNING')}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {project?.city} • {project?.venue}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {project?.startDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {project?.guestCount} Guests
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjectDossier}
            className="text-xs font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExtraModalOpen(true)}
            className="text-xs font-semibold border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100/50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-amber-700" />
            + Add Extra Charge
          </Button>

          <Button
            size="sm"
            onClick={() => setBillModalOpen(true)}
            className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Add Vendor Bill
          </Button>

          {!isFinalised ? (
            <Button
              size="sm"
              onClick={() => setFinaliseModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Finalise & Settle
            </Button>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 py-1.5 px-3 gap-1.5 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              Ledger Locked & Settled
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Executive Financial Metric Ribbon (6 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Base Contract</span>
          <span className="font-mono font-bold text-lg text-slate-900 mt-1 block">
            {project?.baseContract || '₹3.50 Cr'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Fixed Agency Agreement</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Invoiced Total</span>
          <span className="font-mono font-bold text-lg text-emerald-700 mt-1 block">
            {project?.totalInvoiced || '₹3.51 Cr'}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">
            Base + {project?.totalExtras || '₹0'} Extras
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vendor Bills Total</span>
          <span className="font-mono font-bold text-lg text-slate-900 mt-1 block">
            {project?.vendorCommitments || '₹0'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Across {vendorBills.length} Suppliers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Advances Paid</span>
          <span className="font-mono font-bold text-lg text-blue-700 mt-1 block">
            {project?.vendorAdvancePaid || '₹0'}
          </span>
          <span className="text-[10px] text-blue-600 block mt-0.5">Cleared Tranches</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Net Balance Due</span>
          <span className={`font-mono font-bold text-lg mt-1 block ${
            project?.rawVendorBalanceDue === 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {project?.vendorBalanceDue || '₹0'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Outstanding Payables</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gross Margin</span>
          <span className="font-mono font-bold text-lg text-purple-700 mt-1 block">
            {project?.grossMargin || '22.4%'}
          </span>
          <span className="text-[10px] text-purple-600 block mt-0.5">Agency Retained Profit</span>
        </div>
      </div>

      {/* 3. Main Operational Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 w-full justify-start overflow-x-auto">
          <TabsTrigger value="vendorBills" className="gap-2 text-xs font-semibold cursor-pointer py-2">
            <CreditCard className="w-4 h-4 text-[#714B67]" />
            Vendor Bills & PO Ledger ({vendorBills.length})
          </TabsTrigger>

          <TabsTrigger value="extraCharges" className="gap-2 text-xs font-semibold cursor-pointer py-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            Audited Extra Charges ({extraCharges.length})
          </TabsTrigger>

          <TabsTrigger value="invoices" className="gap-2 text-xs font-semibold cursor-pointer py-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Client Milestone Invoices ({invoices.length})
          </TabsTrigger>

          <TabsTrigger value="changelog" className="gap-2 text-xs font-semibold cursor-pointer py-2">
            <History className="w-4 h-4 text-slate-600" />
            Audit Changelog ({changelog.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VENDOR BILLS & PURCHASES (MAIN MISSING FEATURE) */}
        <TabsContent value="vendorBills" className="mt-4 space-y-4">
          {/* Awarded Quotes Banner: Sync Winning Quotes into Bills */}
          {availableQuotes.length > 0 && (
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-[#714B67] text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Awarded Quotes Detected from Procurement Matrix
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Found {availableQuotes.length} selected vendor quote(s) in RFQs for this wedding project.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleSyncAwardedQuotes}
                className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Auto-Generate Bills from Winning Quotes
              </Button>
            </div>
          )}

          {/* Vendor Bills Table */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Vendor Accounts Payable & Two-Way Matching
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tracks agreed PO base costs against audited extra charges, advance disbursements, and outstanding settlements.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBillModalOpen(true)}
                  className="text-xs font-semibold border-slate-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  + Add Bill Manually
                </Button>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Vendor & Category</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Agreed Base</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Audited Extras</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Total Payable</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Advance Paid</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Balance Due</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right py-3">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                        <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-600">No vendor bills added yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Click &quot;Auto-Generate Bills from Winning Quotes&quot; or &quot;+ Add Bill Manually&quot;.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendorBills.map((b) => (
                      <TableRow key={b.id} className="border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <TableCell className="py-3">
                          <div className="font-bold text-xs text-slate-900">{b.vendor}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{b.category}</div>
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs text-slate-700">
                          {b.agreedBase}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs">
                          {b.rawExtras > 0 ? (
                            <span className="text-amber-700 font-semibold">{b.extras}</span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs font-bold text-slate-900">
                          {b.totalPayable}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs text-blue-700 font-semibold">
                          {b.advancePaid}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs font-bold">
                          {b.rawBalanceDue === 0 ? (
                            <span className="text-emerald-600">₹0 (Settled)</span>
                          ) : (
                            <span className="text-rose-600">{b.balanceDue}</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3">
                          {b.status === 'SETTLEMENT_CLEARED' ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                              Settlement Cleared
                            </Badge>
                          ) : b.status === 'RECONCILED_MATCHED' ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                              Reconciled (Matched)
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                              Pending Advance
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBill(b);
                              setReconcileAmount(String(b.rawBalanceDue));
                              setReconcileModalOpen(true);
                            }}
                            className="text-xs font-semibold h-7 border-slate-300 hover:bg-[#714B67]/10 hover:text-[#714B67] cursor-pointer"
                          >
                            Reconcile / Pay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: AUDITED EXTRA CHARGES (ADDITIONS) */}
        <TabsContent value="extraCharges" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Audited Extra Charges & Change Requests
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overruns (e.g. 60 Banquet covers @ ₹2,100, DJ 2.5 hr overtime) audited and attached to final client billing.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setExtraModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + Add Extra Charge
              </Button>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Charge ID</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Category & Scope</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Qty</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Unit Rate</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Total Cost</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Vendor Attribution</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Client Invoiced</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extraCharges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                        <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-600">No extra charges recorded</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Use &quot;+ Add Extra Charge&quot; to audit event overruns.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    extraCharges.map((e) => (
                      <TableRow key={e.id} className="border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <TableCell className="py-3 font-mono text-xs font-bold text-slate-800">
                          {e.id}
                        </TableCell>

                        <TableCell className="py-3">
                          <span className="font-mono text-[10px] font-bold text-[#714B67] bg-purple-50 px-1.5 py-0.5 rounded mr-1.5">
                            {e.category}
                          </span>
                          <span className="text-xs text-slate-900 font-medium">{e.description}</span>
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs text-slate-700">
                          {e.qty}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs text-slate-700">
                          {e.unitPrice}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs font-bold text-amber-700">
                          {e.total}
                        </TableCell>

                        <TableCell className="py-3 text-xs text-slate-700 font-medium">
                          {e.vendor}
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                            <Check className="w-3 h-3 mr-1" />
                            Added to Client Bill
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 text-xs text-slate-600">
                          {e.approvedBy}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: CLIENT MILESTONE INVOICES */}
        <TabsContent value="invoices" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Client Milestone Invoicing Schedule (20% - 50% - 30% + Extras)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deposit on signing, pre-wedding production advance, and post-event final settlement with verified extra charges.
                </p>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Invoice Number</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Stage Milestone</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Percentage</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Due Date</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Amount Due</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Payment Reference</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right py-3">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                        <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-600">No client invoices available</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id} className="border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <TableCell className="py-3 font-mono text-xs font-bold text-slate-800">
                          {inv.invoiceNumber}
                        </TableCell>

                        <TableCell className="py-3 text-xs font-bold text-slate-900">
                          {inv.stageLabel}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs text-slate-700">
                          {inv.percentage}%
                        </TableCell>

                        <TableCell className="py-3 text-xs text-slate-600">
                          {inv.dueDate}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs font-bold text-emerald-700">
                          {inv.amountDue}
                        </TableCell>

                        <TableCell className="py-3 font-mono text-xs text-slate-500">
                          {inv.paymentReference || 'Pending UTR'}
                        </TableCell>

                        <TableCell className="py-3">
                          {inv.status === 'PAID' ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                              <Check className="w-3 h-3 mr-1" />
                              PAID
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                              UNPAID
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          {inv.status !== 'PAID' ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPayAmount(String(inv.rawAmountDue));
                                setPayInvoiceModalOpen(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-7 cursor-pointer"
                            >
                              Record Payment
                            </Button>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400 font-semibold">
                              Receipt Cleared
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: AUDIT CHANGELOG ("settled and shit") */}
        <TabsContent value="changelog" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#714B67]" />
                Commercial Audit Trail & Activity Changelog
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable ledger history documenting all vendor bill approvals, milestone collections, charge overruns, and settlement sign-offs.
              </p>
            </CardHeader>

            <div className="p-5">
              {changelog.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">No activity logged yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Transactions, payments, and extra charge additions will automatically appear in this audit trail.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {changelog.map((log) => (
                    <div key={log.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#714B67] ring-4 ring-white" />
                      
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono text-[11px]">
                              {log.action}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-[#714B67]">
                              {log.entityType}
                            </span>
                            {log.amount && (
                              <span className="font-mono text-emerald-700 font-bold">
                                {log.amount}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.createdAt}
                          </span>
                        </div>

                        <p className="text-slate-700 font-medium mt-1">
                          {log.notes || 'Transaction logged'}
                        </p>

                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 flex items-center justify-between">
                          <span>Authorized By: <strong className="text-slate-600">{log.performedBy}</strong></span>
                          {log.toStatus && (
                            <span>Status Transition: <strong className="text-[#714B67]">{log.toStatus}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: ADD EXTRA CHARGE */}
      <Dialog open={extraModalOpen} onOpenChange={setExtraModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Audit & Record Extra Charge Overrun
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Attach unbudgeted banquet overruns, overtime, or client requests to both client settlement and supplier disbursement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExtraCharge} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Category</Label>
              <Select value={extraCategory} onValueChange={setExtraCategory}>
                <SelectTrigger className="h-9 text-xs border-slate-200 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXTRA_PLATES">Extra Dinner / Banquet Plates</SelectItem>
                  <SelectItem value="DJ_OVERTIME">DJ & Sound Extension Overtime</SelectItem>
                  <SelectItem value="VINTAGE_CAR">Vintage Baraat Vehicle Overrun</SelectItem>
                  <SelectItem value="ADDITIONAL_POWER">Backup Diesel Genset</SelectItem>
                  <SelectItem value="BOAT_SHUTTLE_OVERRUN">Water Taxi / Boat Shuttle Overrun</SelectItem>
                  <SelectItem value="SPECIAL_FIREWORKS">Pyro / Fireworks Permit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Description / Scope Details</Label>
              <Input
                value={extraDesc}
                onChange={(e) => setExtraDesc(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
                placeholder="e.g. 60 unexpected banquet guests verified by banquet captain"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Quantity / Units</Label>
                <Input
                  type="number"
                  value={extraQty}
                  onChange={(e) => setExtraQty(e.target.value)}
                  className="h-9 text-xs border-slate-200 mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Unit Rate (₹)</Label>
                <Input
                  type="number"
                  value={extraUnitPrice}
                  onChange={(e) => setExtraUnitPrice(e.target.value)}
                  className="h-9 text-xs border-slate-200 mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Vendor Attribution</Label>
              <Input
                value={extraVendor}
                onChange={(e) => setExtraVendor(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
                placeholder="e.g. Marwar Heritage Kitchens"
                required
              />
            </div>

            <div className="bg-amber-50 p-2.5 rounded border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between font-mono">
              <span>Calculated Total Addition:</span>
              <strong className="text-xs font-bold text-amber-800">
                ₹{((parseFloat(extraQty) || 0) * (parseFloat(extraUnitPrice) || 0)).toLocaleString('en-IN')}
              </strong>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExtraModalOpen(false)}
                className="text-xs border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingExtra}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                {submittingExtra ? 'Auditing...' : 'Confirm & Audit Extra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ADD VENDOR BILL */}
      <Dialog open={billModalOpen} onOpenChange={setBillModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create Vendor Bill & Record PO
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record a supplier contract commitment into this wedding&apos;s accounts payable ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVendorBill} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Vendor Partner</Label>
              <Select value={newBillVendorId} onValueChange={setNewBillVendorId}>
                <SelectTrigger className="h-9 text-xs border-slate-200 mt-1">
                  <SelectValue placeholder="Select Vendor Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e0000001-0000-0000-0000-000000000001">Royal Rasoi Caterers (Catering)</SelectItem>
                  <SelectItem value="e0000001-0000-0000-0000-000000000002">Marwar Heritage Kitchens (Catering)</SelectItem>
                  <SelectItem value="e0000001-0000-0000-0000-000000000003">Rajputana Feasts & Banquets (Catering)</SelectItem>
                  <SelectItem value="e0000001-0000-0000-0000-000000000004">Mewar Royal Florals & Decor (Decor)</SelectItem>
                  <SelectItem value="e0000001-0000-0000-0000-000000000005">Jodhpur Beats & Sound Production (DJ / AV)</SelectItem>
                  <SelectItem value="e0000001-0000-0000-0000-000000000007">Udaipur Royal Cinematography (Photography)</SelectItem>
                  <SelectItem value="e0000001-0000-0000-0000-000000000008">Royal Rajputana Fleet (Transport)</SelectItem>
                  <SelectItem value="e0000001-0000-0000-0000-000000000009">Jaipur Power Grid Rentals (Infrastructure)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Agreed PO Base Cost (₹)</Label>
                <Input
                  type="number"
                  value={newBillAgreedBase}
                  onChange={(e) => setNewBillAgreedBase(e.target.value)}
                  className="h-9 text-xs border-slate-200 mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Initial Advance Paid (₹)</Label>
                <Input
                  type="number"
                  value={newBillAdvance}
                  onChange={(e) => setNewBillAdvance(e.target.value)}
                  className="h-9 text-xs border-slate-200 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">PO / Reference Notes</Label>
              <Input
                value={newBillNotes}
                onChange={(e) => setNewBillNotes(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
                placeholder="e.g. Sourced via Procurement Decision Matrix"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBillModalOpen(false)}
                className="text-xs border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingBill || !newBillVendorId}
                className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                {submittingBill ? 'Adding...' : 'Add Vendor Bill'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: RECONCILE / RECORD BILL PAYMENT */}
      <Dialog open={reconcileModalOpen} onOpenChange={setReconcileModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Reconcile & Record Vendor Disbursement
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record a bank transfer payment tranche for {selectedBill?.vendor}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReconcileBill} className="space-y-3.5 py-2">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Payable:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBill?.totalPayable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Advance Paid:</span>
                <span className="font-mono text-blue-700">{selectedBill?.advancePaid}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                <span className="text-slate-700">Remaining Balance:</span>
                <span className="font-mono text-rose-600">{selectedBill?.balanceDue}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Payment Amount (₹)</Label>
              <Input
                type="number"
                value={reconcileAmount}
                onChange={(e) => setReconcileAmount(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1 font-mono"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Bank Transfer / NEFT Reference</Label>
              <Input
                value={reconcileRef}
                onChange={(e) => setReconcileRef(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1 font-mono"
                placeholder="e.g. HDFC-NEFT-998811"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Settlement Notes</Label>
              <Input
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
                placeholder="e.g. Final balance clearance upon event signoff"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReconcileModalOpen(false)}
                className="text-xs border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingReconcile}
                className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                {submittingReconcile ? 'Reconciling...' : 'Confirm Disbursement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: RECORD CLIENT INVOICE PAYMENT */}
      <Dialog open={payInvoiceModalOpen} onOpenChange={setPayInvoiceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Record Client Milestone Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Log bank receipt for {selectedInvoice?.invoiceNumber} ({selectedInvoice?.stageLabel}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayInvoice} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Collected Amount (₹)</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1 font-mono"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Payment Reference / UTR</Label>
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1 font-mono"
                placeholder="e.g. ICICI-RTGS-774411"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPayInvoiceModalOpen(false)}
                className="text-xs border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingPay}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                {submittingPay ? 'Recording...' : 'Mark Invoice Paid'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: FINALISE & SETTLE PROJECT */}
      <Dialog open={finaliseModalOpen} onOpenChange={setFinaliseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Finalise & Settle Wedding Project
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sign off on commercial audit, lock accounts ledger, and transition project to FINALISED & SETTLED.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded p-3 text-xs text-emerald-900 space-y-1">
              <p className="font-bold">Audit Verification Checks Passed:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-800">
                <li>All {vendorBills.length} vendor supplier balances reconciled.</li>
                <li>Audited extra charges ({extraCharges.length} items) attached to client statement.</li>
                <li>Client milestone payments reconciled with bank statements.</li>
              </ul>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Audit Sign-off Notes</Label>
              <Input
                value={finaliseNotes}
                onChange={(e) => setFinaliseNotes(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFinaliseModalOpen(false)}
                className="text-xs border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submittingFinalise}
                onClick={handleFinaliseProject}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                {submittingFinalise ? 'Locking...' : 'Confirm Final Sign-off'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
