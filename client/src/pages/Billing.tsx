import { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';

export const Billing: React.FC = () => {
  const [extraCharges] = useState([
    {
      id: 'EXT-01',
      category: 'EXTRA_PLATES',
      description: '60 Unexpected Guests turned up at the Grand Durbar Banquet',
      qty: 60,
      unitPrice: '₹2,100 / plate',
      total: '₹1,26,000',
      vendor: 'Marwar Gourmet Kitchens',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Finance Manager',
    },
    {
      id: 'EXT-02',
      category: 'DJ_OVERTIME',
      description: 'Sangeet party extended by 2.5 hours past 01:00 AM curfew',
      qty: 2.5,
      unitPrice: '₹12,000 / hr',
      total: '₹30,000',
      vendor: 'Desert Beat Sounds',
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Lead Planner',
    },
  ]);

  const vendorBills = [
    {
      vendor: 'Marwar Gourmet Kitchens (Caterer)',
      agreedBase: '₹8,40,000',
      extras: '+₹1,26,000 (60 Plates)',
      totalPayable: '₹9,66,000',
      advancePaid: '₹4,20,000',
      balanceDue: '₹5,46,000',
      status: 'RECONCILED_MATCHED',
    },
    {
      vendor: 'Jaipur Floral Wonders (Decor)',
      agreedBase: '₹14,00,000',
      extras: '₹0',
      totalPayable: '₹14,00,000',
      advancePaid: '₹7,00,000',
      balanceDue: '₹7,00,000',
      status: 'RECONCILED_MATCHED',
    },
    {
      vendor: 'Desert Beat Sounds (DJ & Lights)',
      agreedBase: '₹3,50,000',
      extras: '+₹30,000 (Overtime)',
      totalPayable: '₹3,80,000',
      advancePaid: '₹1,75,000',
      balanceDue: '₹2,05,000',
      status: 'RECONCILED_MATCHED',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">Billing & Extra Charges</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Client additions, extra guest plates, and vendor payment reconciliation.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF385C] text-white rounded-xl text-xs font-semibold hover:bg-[#E00B41] transition shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Extra Charge</span>
        </button>
      </div>

      {/* Extra Charges Section */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-[#222222]">Extra Additions Billed to Client</h2>
            <p className="text-xs text-neutral-500">Day-of additions added to the final client settlement</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Total Extras: ₹1,56,000
          </span>
        </div>

        <div className="space-y-3">
          {extraCharges.map((ext) => (
            <div key={ext.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-400">{ext.id}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-800">
                    {ext.category}
                  </span>
                </div>
                <div className="font-bold text-sm text-neutral-900">{ext.description}</div>
                <div className="text-neutral-500">
                  Vendor: <strong>{ext.vendor}</strong> &bull; Rate: {ext.unitPrice} &bull; Approved by: {ext.approvedBy}
                </div>
              </div>

              <div className="text-right sm:shrink-0">
                <div className="text-base font-bold text-[#222222]">{ext.total}</div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Billed to Client
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Bills Matching Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-[#222222]">Vendor Accounts Payable</h2>
            <p className="text-xs text-neutral-500">Advances matched against agreed quotes</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Reconciled
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 text-neutral-500 font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-3 px-4">Vendor Partner</th>
                <th className="py-3 px-4">Agreed Base Quote</th>
                <th className="py-3 px-4">Approved Extras</th>
                <th className="py-3 px-4">Total Payable</th>
                <th className="py-3 px-4">Advance Paid</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {vendorBills.map((b, i) => (
                <tr key={i} className="hover:bg-neutral-50/60 transition">
                  <td className="py-3.5 px-4 font-semibold text-neutral-900">{b.vendor}</td>
                  <td className="py-3.5 px-4 text-neutral-600">{b.agreedBase}</td>
                  <td className="py-3.5 px-4 font-medium text-emerald-600">{b.extras}</td>
                  <td className="py-3.5 px-4 font-bold text-neutral-900">{b.totalPayable}</td>
                  <td className="py-3.5 px-4 text-neutral-600">{b.advancePaid}</td>
                  <td className="py-3.5 px-4 font-bold text-rose-600">{b.balanceDue}</td>
                  <td className="py-3.5 px-4">
                    <button className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-[11px] font-semibold hover:bg-black transition">
                      Disburse Balance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
