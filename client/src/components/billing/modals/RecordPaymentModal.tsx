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
import type { LiveInvoice } from '../types';

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: LiveInvoice | null;
  onSubmit: (data: {
    paidAmount: number;
    paymentReference: string;
  }) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ open, onOpenChange, invoice, onSubmit }) => {
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('ICICI-RTGS-774411');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      setPaidAmount(String(invoice.rawAmountDue));
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSubmit({
        paidAmount: parseFloat(paidAmount) || 0,
        paymentReference,
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
            Record Client Milestone Payment
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Log bank receipt for {invoice?.invoiceNumber} ({invoice?.stageLabel}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div>
            <Label className="text-xs font-bold text-slate-700">Collected Amount (₹)</Label>
            <Input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1 font-mono"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Payment Reference / UTR</Label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1 font-mono"
              placeholder="e.g. ICICI-RTGS-774411"
              required
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              {submitting ? 'Recording...' : 'Mark Invoice Paid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
