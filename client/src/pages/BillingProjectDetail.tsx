import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  FileText,
  Calendar,
  Users,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
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
import { useBillingStore } from '../store/useBillingStore';

interface LiveInvoice {
  id: string;
  invoiceNumber: string;
  stageKey: string;
  stageLabel: string;
  percentage: number;
  amountDue: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID';
  paidAmount: string;
  paidAt?: string;
  paymentReference?: string;
}

interface LiveVendorBill {
  id: string;
  vendor: string;
  category: string;
  agreedBase: string;
  extras: string;
  totalPayable: string;
  advancePaid: string;
  balanceDue: string;
  status: 'RECONCILED_MATCHED' | 'SETTLEMENT_CLEARED' | 'DISPUTED';
}

interface LiveExtraCharge {
  id: string;
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  vendor: string;
  status: 'ADDED_TO_CLIENT_INVOICE' | 'PENDING_APPROVAL';
  approvedBy: string;
  lastEditedAt?: string;
}

export const BillingProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { weddings } = useWeddingStore();
  const { finalisedProjects } = useBillingStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [finaliseModalOpen, setFinaliseModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('milestones');

  // Live PostgreSQL Data States
  const [liveProject, setLiveProject] = useState<any>(null);
  const [liveInvoices, setLiveInvoices] = useState<LiveInvoice[]>([]);
  const [liveExtras, setLiveExtras] = useState<LiveExtraCharge[]>([]);
  const [liveVendorBills, setLiveVendorBills] = useState<LiveVendorBill[]>([]);

  // Extra Charge Form State
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('60');
  const [unitPrice, setUnitPrice] = useState('2100');
  const [vendor, setVendor] = useState('Marwar Heritage Kitchens');
  const [category, setCategory] = useState('EXTRA_PLATES');

  // Fallback target wedding from store
  const storeWedding = useMemo(() => {
    return weddings.find((w) => w.id === projectId || w.code === projectId) || weddings[0];
  }, [weddings, projectId]);

  // Fetch live PostgreSQL project details
  const fetchProjectData = async () => {
    const idToFetch = projectId || storeWedding.id;
    try {
      setLoading(true);
      const res = await api.get(`/billing/projects/${idToFetch}`);
      if (res?.success && res.data) {
        setLiveProject(res.data);
        if (res.data.invoices) setLiveInvoices(res.data.invoices);
        if (res.data.extraCharges) setLiveExtras(res.data.extraCharges);
        if (res.data.vendorBills) setLiveVendorBills(res.data.vendorBills);
      }
    } catch (err) {
      console.warn('Fallback to local store:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Combined Active Project View
  const wedding = liveProject || {
    id: storeWedding.id,
    code: storeWedding.code,
    couple: storeWedding.couple,
    city: storeWedding.city,
    venue: storeWedding.venue,
    startDate: storeWedding.startDate,
    guestCount: storeWedding.guestCount,
    packageType: storeWedding.packageType,
    status: storeWedding.status,
    budget: storeWedding.budget,
    coordinator: storeWedding.coordinator,
    baseContract: storeWedding.budget,
    totalExtras: (storeWedding as any).totalExtras || '₹0',
    totalInvoiced: (storeWedding as any).totalInvoiced || storeWedding.budget,
    vendorAdvancePaid: (storeWedding as any).vendorAdvancePaid || '₹0',
    vendorBalanceDue: (storeWedding as any).vendorBalanceDue || '₹0',
    grossMargin: (storeWedding as any).grossMargin || '0.0%',
  };

  const isFinalised = Boolean(
    wedding.isFinalised ||
    wedding.status === 'FINALISED' ||
    wedding.status === 'FINALISED_SETTLED' ||
    finalisedProjects[wedding.id]
  );

  const finalisedInfo = {
    finalisedDate: wedding.finalisedDate || 'Settled',
    finalisedBy: wedding.finalisedBy || wedding.coordinator || 'Finance Operations',
  };

  // Live Database Lists (Zero Mock Data)
  const projectExtras = liveExtras;
  const projectVendorBills = liveVendorBills;
  const invoices = liveInvoices;

  // Submit extra charge to real PostgreSQL backend
  const handleAddExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;

    const numQty = parseFloat(qty) || 1;
    const numPrice = parseFloat(unitPrice) || 1000;

    try {
      await api.post(`/billing/projects/${wedding.id}/extras`, {
        category,
        description: desc,
        qty: numQty,
        unitPrice: `₹${numPrice.toLocaleString('en-IN')}`,
        vendor,
      });
      setModalOpen(false);
      setDesc('');
      await fetchProjectData();
    } catch (err: any) {
      alert(`Error saving extra charge: ${err.message}`);
    }
  };

  // Reconcile vendor bill in real PostgreSQL backend
  const handleReconcileBill = async (billId: string) => {
    try {
      await api.put(`/billing/vendor-bills/${billId}/reconcile`);
      await fetchProjectData();
    } catch (err: any) {
      alert(`Error reconciling vendor bill: ${err.message}`);
    }
  };

  // Mark invoice paid in real PostgreSQL backend
  const handlePayInvoice = async (invoiceId: string) => {
    try {
      await api.put(`/billing/invoices/${invoiceId}/pay`);
      await fetchProjectData();
    } catch (err: any) {
      alert(`Error updating invoice: ${err.message}`);
    }
  };

  // Finalise project in real PostgreSQL backend
  const handleFinalise = async () => {
    try {
      await api.put(`/billing/projects/${wedding.id}/finalise`);
      setFinaliseModalOpen(false);
      await fetchProjectData();
    } catch (err: any) {
      alert(`Error finalising project: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/billing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#714B67] hover:text-[#5C3D54] hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Billing Projects</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Billing & Extras</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">{wedding.code}</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            {loading ? 'Syncing...' : 'PostgreSQL Live'}
          </span>
        </div>
      </div>

      {/* Project Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-[#714B67] border border-purple-200">
                {wedding.code}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {wedding.city}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">{wedding.venue}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {wedding.couple}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {wedding.startDate}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> {wedding.guestCount} Guests
              </span>
              <span>👤 Lead Coordinator: <strong className="text-slate-700">{wedding.coordinator}</strong></span>
              <span>📦 Package: <strong className="text-slate-700">{wedding.packageType}</strong></span>
            </div>
          </div>

          {/* Action Buttons & Status Badge */}
          {/* Status Badge when Finalised */}
          {isFinalised ? (
            <div className="flex items-center gap-2">
              <div className="text-right bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1 justify-end">
                  <Lock className="w-3 h-3" /> Finalised & Audited
                </div>
                <div className="text-[10px] text-slate-500">
                  {finalisedInfo.finalisedDate} by {finalisedInfo.finalisedBy}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => alert(`Exporting formal settlement statement for ${wedding.code}`)}
                className="gap-1.5 h-9 text-xs border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Invoice Statement</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFinaliseModalOpen(true)}
                className="gap-1.5 h-9 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Finalise Settlement</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-1.5 h-9 text-xs cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra Charge</span>
              </Button>
            </div>
          )}
        </div>

        {/* Executive Financial Ledger KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Base Contract</div>
            <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">{wedding.baseContract || wedding.budget}</div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200/60">
            <div className="text-[10px] uppercase font-bold text-purple-700">Day-of Extras</div>
            <div className="font-mono font-bold text-sm text-[#714B67] mt-0.5">
              {wedding.totalExtras}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Invoiced</div>
            <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
              {wedding.totalInvoiced}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Advances Paid</div>
            <div className="font-mono font-bold text-sm text-slate-700 mt-0.5">{wedding.vendorAdvancePaid}</div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/60">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Vendor Balance Due</div>
            <div className="font-mono font-bold text-sm text-emerald-900 mt-0.5">
              {wedding.vendorBalanceDue}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gross Margin</div>
            <div className="font-mono font-bold text-sm text-slate-800 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{wedding.grossMargin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for Commercial & Billing Detail */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs">
          <TabsList className="bg-slate-100/90 p-1 border border-slate-200/80 rounded-lg h-auto flex flex-wrap gap-1.5 w-full justify-start">
            <TabsTrigger
              value="milestones"
              className="px-3.5 py-2 text-xs font-semibold gap-2 data-[state=active]:bg-white data-[state=active]:text-[#714B67] data-[state=active]:shadow-2xs rounded-md transition-all cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Staged Client Billing (Milestone Invoices)</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {invoices.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="extras"
              className="px-3.5 py-2 text-xs font-semibold gap-2 data-[state=active]:bg-white data-[state=active]:text-[#714B67] data-[state=active]:shadow-2xs rounded-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>Day-of Additions & Extra Charges Invoiced to Couple (Banquet Overruns)</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-[#714B67]">
                {projectExtras.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="vendor-bills"
              className="px-3.5 py-2 text-xs font-semibold gap-2 data-[state=active]:bg-white data-[state=active]:text-[#714B67] data-[state=active]:shadow-2xs rounded-md transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Vendor Bill Two-Way Matching Ledger</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {projectVendorBills.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Staged Client Billing (Scene 5 Milestone Billing) */}
        <TabsContent value="milestones" className="mt-0">
          <Card className="border border-slate-200 shadow-2xs rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span>Staged Client Billing (Milestone Invoices)</span>
            </CardTitle>
            <div className="text-xs text-slate-500">
              Contract milestones: 20% Booking Deposit, 50% Pre-Wedding Advance, and 30% Final Settlement + Extras
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5">
              {invoices.length} Milestone Invoices
            </Badge>

            {!isFinalised && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-1.5 h-8 text-xs cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra Charge</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-700 text-xs">Invoice #</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Milestone Payment Stage</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Due Date</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Amount Due</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Paid Amount</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-center">Payment Status</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-slate-50 transition">
                  <TableCell className="py-3 font-mono font-bold text-xs text-slate-800">
                    {inv.invoiceNumber}
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="font-bold text-xs text-slate-900">{inv.stageLabel}</div>
                    {inv.paymentReference && (
                      <div className="text-[11px] text-slate-500 font-mono">Ref: {inv.paymentReference}</div>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{inv.dueDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                    {inv.amountDue}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs text-slate-700">
                    {inv.paidAmount}
                  </TableCell>

                  <TableCell className="py-3 text-center">
                    {inv.status === 'PAID' ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> PAID
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-bold border-amber-300 text-amber-800 bg-amber-50">
                        UNPAID
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    {inv.status === 'UNPAID' ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePayInvoice(inv.id)}
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Receive Payment</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Cleared</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>

        {/* Tab 2: Day-of Additions & Extra Charges Invoiced to Client */}
        <TabsContent value="extras" className="mt-0">
          <Card className="border border-slate-200 shadow-2xs rounded-xl bg-white">
        <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Day-of Additions & Extra Charges Invoiced to Couple (Banquet Overruns)
            </CardTitle>
            <div className="text-xs text-slate-500">
              Handling the 60 unexpected banquet guests (Contracted 400 vs 460 actuals @ ₹2,100/plate) and DJ overtime charges
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5">
              {projectExtras.length} Items • {wedding.totalExtras}
            </Badge>

            {!isFinalised && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {projectExtras.map((ext) => (
            <div
              key={ext.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs hover:border-slate-300 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-500 text-xs">{ext.id}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {ext.category}
                  </Badge>
                  <span className="text-slate-500 text-xs">&bull; {ext.vendor}</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{ext.description}</div>
                <div className="text-slate-500 text-xs">
                  Rate: {ext.qty} units &times; {ext.unitPrice} ={' '}
                  <strong className="font-mono text-slate-900">{ext.total}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <Badge variant="success" className="text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Invoiced to Couple
                  </Badge>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Authorized: {ext.approvedBy}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </TabsContent>

        {/* Tab 3: Vendor Disbursement Ledger & Two-Way Matching */}
        <TabsContent value="vendor-bills" className="mt-0">
          <Card className="border border-slate-200 shadow-2xs rounded-xl bg-white">
        <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Vendor Bill Two-Way Matching Ledger
              </CardTitle>
              <div className="text-xs text-slate-500">
                Matching submitted vendor bills against agreed RFQ purchase orders (Agreed Base + Extras = Total Payable)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Duplicate Payment Protected</span>
              </div>

              {!isFinalised && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  className="gap-1.5 h-8 text-xs cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Extra Charge</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-700 text-xs">Vendor & Service Account</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Agreed RFQ Base</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Day-of Extras</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Total Payable</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Advance Paid</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Balance Due</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Two-Way Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {projectVendorBills.map((vb) => (
                <TableRow key={vb.id} className="hover:bg-slate-50 transition">
                  <TableCell className="py-3">
                    <div className="font-bold text-xs text-slate-900">{vb.vendor}</div>
                    <div className="text-[11px] text-slate-500">{vb.category}</div>
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs text-slate-600">
                    {vb.agreedBase}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs font-semibold text-amber-800">
                    {vb.extras}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                    {vb.totalPayable}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs text-slate-600">
                    {vb.advancePaid}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-emerald-900">
                    {vb.balanceDue}
                  </TableCell>

                  <TableCell className="py-3 text-center">
                    {vb.status === 'SETTLEMENT_CLEARED' ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Cleared
                      </Badge>
                    ) : vb.status === 'RECONCILED_MATCHED' ? (
                      <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 text-emerald-800 bg-emerald-50">
                        MATCHED
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-bold border-amber-300 text-amber-800 bg-amber-50">
                        {vb.status}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isFinalised && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVendor(vb.vendor);
                            setCategory(
                              vb.category === 'CATERER' ? 'EXTRA_PLATES' :
                              vb.category === 'DJ' ? 'DJ_OVERTIME' :
                              'SPECIAL_FIREWORKS'
                            );
                            setModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] border-purple-200 text-[#714B67] hover:bg-purple-50 gap-1 cursor-pointer"
                          title={`Add extra overrun charge for ${vb.vendor}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Extra</span>
                        </Button>
                      )}
                      {vb.status !== 'SETTLEMENT_CLEARED' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReconcileBill(vb.id)}
                          className="h-7 px-2 text-xs text-[#714B67] hover:bg-purple-100 font-semibold cursor-pointer"
                        >
                          Reconcile
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Audited</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

      {/* Modal: Add Extra Charge */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add Day-of Extra Charge to Invoice
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record unexpected banquet headcount overrun or curfew overtime to {wedding.code}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExtra} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs bg-slate-50">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXTRA_PLATES">Extra Banquet Plates (Overrun Covers)</SelectItem>
                  <SelectItem value="DJ_OVERTIME">DJ & Sound Curfew Overtime</SelectItem>
                  <SelectItem value="VINTAGE_CAR">Baraat Vintage Car Addition</SelectItem>
                  <SelectItem value="ADDITIONAL_POWER">Diesel Generator Backup</SelectItem>
                  <SelectItem value="SPECIAL_FIREWORKS">Fireworks & Special Effects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Description</Label>
              <Input
                placeholder="e.g. 60 unexpected banquet guests verified with kitchen captain"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="h-8 text-xs bg-slate-50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Quantity / Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-8 text-xs bg-slate-50 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Unit Price (₹)</Label>
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="h-8 text-xs bg-slate-50 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Responsible Vendor</Label>
              <Input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="h-8 text-xs bg-slate-50"
                required
              />
            </div>

            <div className="p-2.5 rounded bg-purple-50 border border-purple-200 text-xs flex items-center justify-between font-mono">
              <span className="font-semibold text-slate-600">Calculated Addition:</span>
              <span className="font-bold text-sm text-[#714B67]">
                ₹{((parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0)).toLocaleString('en-IN')}
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Save to Database
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Finalise & Lock Settlement */}
      <Dialog open={finaliseModalOpen} onOpenChange={setFinaliseModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Finalise Settlement for {wedding.code}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm that all day-of extras are reconciled with couple and vendor disbursements are matched.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="font-bold text-emerald-900">Audit Signoff Summary:</div>
              <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
                <li>Total Invoiced: <strong>{wedding.totalInvoiced}</strong></li>
                <li>Extra Charges: <strong>{wedding.totalExtras}</strong></li>
                <li>All Vendor Accounts Matched against Awarded RFQ</li>
                <li>PostgreSQL records will be locked and audited</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" size="sm" onClick={() => setFinaliseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleFinalise} className="bg-emerald-700 hover:bg-emerald-800">
              Lock & Finalise in PostgreSQL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
