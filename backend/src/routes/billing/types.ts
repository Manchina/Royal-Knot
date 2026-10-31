export interface ExtraChargeItem {
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
  editHistory?: Array<{
    date: string;
    action: string;
    by: string;
    details: string;
  }>;
}

export interface VendorDisbursementItem {
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

export interface ClientInvoiceItem {
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

export interface ProjectBillingData {
  id: string;
  code: string;
  couple: string;
  city: string;
  venue: string;
  startDate: string;
  guestCount: number;
  packageType: string;
  status: 'LIVE_BIG_DAY' | 'IN_PLANNING' | 'BOOKED' | 'FINALISED' | 'FINALISED_SETTLED';
  isFinalised: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  coordinator: string;
  baseContract: string;
  totalExtras: string;
  totalInvoiced: string;
  vendorAdvancePaid: string;
  vendorBalanceDue: string;
  grossMargin: string;
  extraCharges: ExtraChargeItem[];
  vendorBills: VendorDisbursementItem[];
  invoices: ClientInvoiceItem[];
}

export interface MasterOptionRow {
  id: string;
  category: string;
  optionKey: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}
