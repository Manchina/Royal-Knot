import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Receipt, FileText, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { useWeddingStore } from '../store/useWeddingStore';
import { useBillingStore } from '../store/useBillingStore';
import {
  type LiveVendorBill,
  type LiveInvoice,
  BillingHeader,
  BillingMetricsRibbon,
  VendorBillsTab,
  ExtraChargesTab,
  MilestoneInvoicesTab,
  AuditChangelogTab,
  AddExtraChargeModal,
  AddVendorBillModal,
  ReconcileBillModal,
  RecordPaymentModal,
  FinaliseProjectModal,
} from '../components/billing';

export const BillingProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { weddings } = useWeddingStore();
  const {
    currentProject: project,
    fetchProjectDossier,
    syncAwardedQuotes,
    createExtraCharge,
    createVendorBill,
    reconcileVendorBill,
    recordPayment,
    finaliseProject,
  } = useBillingStore();

  const [activeTab, setActiveTab] = useState<string>('vendorBills');

  // Modals state
  const [extraModalOpen, setExtraModalOpen] = useState<boolean>(false);
  const [billModalOpen, setBillModalOpen] = useState<boolean>(false);
  const [reconcileModalOpen, setReconcileModalOpen] = useState<boolean>(false);
  const [payInvoiceModalOpen, setPayInvoiceModalOpen] = useState<boolean>(false);
  const [finaliseModalOpen, setFinaliseModalOpen] = useState<boolean>(false);

  // Selected entities for modals
  const [selectedBill, setSelectedBill] = useState<LiveVendorBill | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<LiveInvoice | null>(null);

  // Target wedding from store
  const storeWedding = useMemo(() => {
    return weddings.find((w) => w.id === projectId || w.code === projectId);
  }, [weddings, projectId]);

  const idToFetch = projectId || storeWedding?.id || '';

  useEffect(() => {
    if (idToFetch) {
      fetchProjectDossier(idToFetch);
    }
  }, [idToFetch, fetchProjectDossier]);

  // Sync Winning Quotes Action
  const handleSyncAwardedQuotes = async () => {
    await syncAwardedQuotes(idToFetch);
  };

  // Submit Extra Charge
  const handleCreateExtraCharge = async (data: {
    category: string;
    description: string;
    qty: number;
    unitPrice: number;
    vendor: string;
  }) => {
    await createExtraCharge(idToFetch, data);
  };

  // Submit New Vendor Bill
  const handleCreateVendorBill = async (data: {
    vendorId: string;
    agreedBaseAmount: number;
    advancePaid: number;
    notes: string;
  }) => {
    await createVendorBill(idToFetch, {
      vendorId: data.vendorId,
      agreedBase: data.agreedBaseAmount,
      category: 'GENERAL',
      notes: data.notes,
    });
  };

  // Submit Reconcile / Record Vendor Bill Payment
  const handleReconcileBill = async (data: {
    paymentAmount: number;
    paymentReference: string;
    notes: string;
  }) => {
    if (!selectedBill) return;
    await reconcileVendorBill(idToFetch, selectedBill.id, {
      reconciledAmount: data.paymentAmount,
      status: 'RECONCILED_MATCHED',
      notes: data.notes || data.paymentReference,
    });
    setSelectedBill(null);
  };

  // Submit Pay Invoice
  const handlePayInvoice = async (data: {
    paidAmount: number;
    paymentReference: string;
  }) => {
    if (!selectedInvoice) return;
    await recordPayment(idToFetch, selectedInvoice.id, {
      amount: data.paidAmount,
      reference: data.paymentReference,
    });
    setSelectedInvoice(null);
  };

  // Submit Finalise Project
  const handleFinaliseProject = async (notes: string) => {
    await finaliseProject(idToFetch, {
      finalisedBy: 'Aditya Singhal (Super Admin)',
      settlementNotes: notes,
    });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Banner */}
      <BillingHeader
        project={project}
        storeWedding={storeWedding}
        onRefresh={() => fetchProjectDossier(idToFetch)}
        onOpenExtraModal={() => setExtraModalOpen(true)}
        onOpenBillModal={() => setBillModalOpen(true)}
        onOpenFinaliseModal={() => setFinaliseModalOpen(true)}
        onBack={() => navigate('/billing')}
      />

      {/* 2. Executive Financial Ribbon */}
      <BillingMetricsRibbon project={project} />

      {/* 3. Main Operational Tabs (Restored Old Aesthetic) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="vendorBills"
            className="gap-2 text-xs font-semibold cursor-pointer py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-[#714B67]" />
            Vendor Bills & PO Ledger ({project?.vendorBills?.length || 0})
          </TabsTrigger>

          <TabsTrigger
            value="extraCharges"
            className="gap-2 text-xs font-semibold cursor-pointer py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Receipt className="w-4 h-4 text-amber-600" />
            Audited Extra Charges ({project?.extraCharges?.length || 0})
          </TabsTrigger>

          <TabsTrigger
            value="invoices"
            className="gap-2 text-xs font-semibold cursor-pointer py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            Client Milestone Invoices ({project?.invoices?.length || 0})
          </TabsTrigger>

          <TabsTrigger
            value="changelog"
            className="gap-2 text-xs font-semibold cursor-pointer py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <History className="w-4 h-4 text-slate-600" />
            Audit Changelog ({project?.changelog?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Vendor Bills (Purchases & 3-Way Matching) */}
        <TabsContent value="vendorBills" className="mt-4">
          <VendorBillsTab
            vendorBills={project?.vendorBills || []}
            availableQuotes={project?.availableQuotes || []}
            onSyncQuotes={handleSyncAwardedQuotes}
            onOpenAddBill={() => setBillModalOpen(true)}
            onSelectReconcile={(b) => {
              setSelectedBill(b);
              setReconcileModalOpen(true);
            }}
          />
        </TabsContent>

        {/* Tab 2: Audited Extra Charges (Additions & Overruns) */}
        <TabsContent value="extraCharges" className="mt-4">
          <ExtraChargesTab
            extraCharges={project?.extraCharges || []}
            onOpenAddExtra={() => setExtraModalOpen(true)}
          />
        </TabsContent>

        {/* Tab 3: Client Milestone Invoices (Revenue Schedule) */}
        <TabsContent value="invoices" className="mt-4">
          <MilestoneInvoicesTab
            invoices={project?.invoices || []}
            onSelectPayInvoice={(inv) => {
              setSelectedInvoice(inv);
              setPayInvoiceModalOpen(true);
            }}
          />
        </TabsContent>

        {/* Tab 4: Audit Trail & Activity Changelog */}
        <TabsContent value="changelog" className="mt-4">
          <AuditChangelogTab changelog={project?.changelog || []} />
        </TabsContent>
      </Tabs>

      {/* Interactive Modals */}
      <AddExtraChargeModal
        open={extraModalOpen}
        onOpenChange={setExtraModalOpen}
        onSubmit={handleCreateExtraCharge}
      />

      <AddVendorBillModal
        open={billModalOpen}
        onOpenChange={setBillModalOpen}
        onSubmit={handleCreateVendorBill}
      />

      <ReconcileBillModal
        open={reconcileModalOpen}
        onOpenChange={setReconcileModalOpen}
        bill={selectedBill}
        onSubmit={handleReconcileBill}
      />

      <RecordPaymentModal
        open={payInvoiceModalOpen}
        onOpenChange={setPayInvoiceModalOpen}
        invoice={selectedInvoice}
        onSubmit={handlePayInvoice}
      />

      <FinaliseProjectModal
        open={finaliseModalOpen}
        onOpenChange={setFinaliseModalOpen}
        vendorBillsCount={project?.vendorBills?.length || 0}
        extraChargesCount={project?.extraCharges?.length || 0}
        onConfirm={handleFinaliseProject}
      />
    </div>
  );
};
