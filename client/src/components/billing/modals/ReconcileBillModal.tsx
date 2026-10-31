import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from '../../ui';
import type { LiveVendorBill } from '../types';

interface ReconcileBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: LiveVendorBill | null;
  onSubmit: (data: {
    paymentAmount: number;
    paymentReference: string;
    notes: string;
  }) => Promise<void>;
}

export const ReconcileBillModal: React.FC<ReconcileBillModalProps> = ({ open, onOpenChange, bill, onSubmit }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('HDFC-NEFT-889922');
  const [notes, setNotes] = useState('Settlement tranche cleared via NEFT');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bill) {
      setPaymentAmount(String(bill.rawBalanceDue));
    }
  }, [bill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSubmit({
        paymentAmount: parseFloat(paymentAmount) || 0,
        paymentReference,
        notes,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Reconcile & Record Vendor Disbursement
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Record a bank transfer payment tranche for {bill?.vendor}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Payable:</span>
              <span className="font-mono font-bold text-slate-900">{bill?.totalPayable}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Advance Paid:</span>
              <span className="font-mono text-blue-700">{bill?.advancePaid}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
              <span className="text-slate-700">Remaining Balance:</span>
              <span className="font-mono text-rose-600">{bill?.balanceDue}</span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Payment Amount (₹)</Label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1 font-mono"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Bank Transfer / NEFT Reference</Label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1 font-mono"
              placeholder="e.g. HDFC-NEFT-998811"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Settlement Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1"
              placeholder="e.g. Final balance clearance upon event signoff"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs border-slate-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              {submitting ? 'Reconciling...' : 'Confirm Disbursement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
