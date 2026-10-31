import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui';
import type { LiveInvoice } from './types';

interface MilestoneInvoicesTabProps {
  invoices: LiveInvoice[];
  onSelectPayInvoice: (invoice: LiveInvoice) => void;
}

export const MilestoneInvoicesTab: React.FC<MilestoneInvoicesTabProps> = ({ invoices, onSelectPayInvoice }) => {
  return (
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
                        onClick={() => onSelectPayInvoice(inv)}
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
  );
};
