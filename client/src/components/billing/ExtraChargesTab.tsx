import React from 'react';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui';
import type { LiveExtraCharge } from './types';

interface ExtraChargesTabProps {
  extraCharges: LiveExtraCharge[];
  onOpenAddExtra: () => void;
}

export const ExtraChargesTab: React.FC<ExtraChargesTabProps> = ({ extraCharges, onOpenAddExtra }) => {
  return (
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
          onClick={onOpenAddExtra}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Extra Charge
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
  );
};
