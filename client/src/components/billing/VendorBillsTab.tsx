import React from 'react';
import { Sparkles, Plus, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui';
import type { LiveVendorBill, AvailableQuote } from './types';

interface VendorBillsTabProps {
  vendorBills: LiveVendorBill[];
  availableQuotes: AvailableQuote[];
  onSyncQuotes: () => void;
  onOpenAddBill: () => void;
  onSelectReconcile: (bill: LiveVendorBill) => void;
}

export const VendorBillsTab: React.FC<VendorBillsTabProps> = ({
  vendorBills,
  availableQuotes,
  onSyncQuotes,
  onOpenAddBill,
  onSelectReconcile,
}) => {
  return (
    <div className="space-y-4">
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
            onClick={onSyncQuotes}
            className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer shrink-0"
          >
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
              onClick={onOpenAddBill}
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
                        onClick={() => onSelectReconcile(b)}
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
    </div>
  );
};
