import React from 'react';
import type { ProjectFinancials } from './types';

interface BillingMetricsRibbonProps {
  project: ProjectFinancials | null;
}

export const BillingMetricsRibbon: React.FC<BillingMetricsRibbonProps> = ({ project }) => {
  return (
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
        <span className="text-[10px] text-slate-400 block mt-0.5">Across {project?.vendorBills?.length || 0} Suppliers</span>
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
        <span
          className={`font-mono font-bold text-lg mt-1 block ${project?.rawVendorBalanceDue === 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
        >
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
  );
};
