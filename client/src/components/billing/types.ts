export interface LiveInvoice {
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

export interface LiveVendorBill {
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
  createdAt?: string;
}

export interface LiveExtraCharge {
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

export interface LiveChangelog {
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

export interface AvailableQuote {
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

export interface ProjectFinancials {
  id: string;
  code: string;
  couple: string;
  brideName?: string;
  groomName?: string;
  clientEmail?: string;
  clientPhone?: string;
  city: string;
  venue: string;
  startDate: string;
  endDate?: string;
  guestCount: number;
  actualHeadcount?: number;
  packageType: string;
  status: string;
  isFinalised: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  rawBudget: number;
  coordinator: string;
  baseContract: string;
  rawBaseContract: number;
  totalExtras: string;
  rawTotalExtras: number;
  extrasCount: number;
  totalInvoiced: string;
  rawTotalInvoiced: number;
  vendorCommitments: string;
  rawVendorCommitments: number;
  vendorAdvancePaid: string;
  rawVendorAdvancePaid: number;
  vendorBalanceDue: string;
  rawVendorBalanceDue: number;
  grossMargin: string;
  billsCount: number;
  vendorBills: LiveVendorBill[];
  extraCharges: LiveExtraCharge[];
  invoices: LiveInvoice[];
  availableQuotes?: AvailableQuote[];
  changelog?: LiveChangelog[];
}
