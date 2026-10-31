import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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

interface FinaliseProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorBillsCount: number;
  extraChargesCount: number;
  onConfirm: (notes: string) => Promise<void>;
}

export const FinaliseProjectModal: React.FC<FinaliseProjectModalProps> = ({
  open,
  onOpenChange,
  vendorBillsCount,
  extraChargesCount,
  onConfirm,
}) => {
  const [notes, setNotes] = useState(
    'All vendor accounts and client milestone invoices fully reconciled and audited.'
  );
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm(notes);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Finalise & Settle Wedding Project
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Sign off on commercial audit, lock accounts ledger, and transition project to FINALISED & SETTLED.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded p-3 text-xs text-emerald-900 space-y-1">
            <p className="font-bold">Audit Verification Checks Passed:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-800">
              <li>All {vendorBillsCount} vendor supplier balances reconciled.</li>
              <li>Audited extra charges ({extraChargesCount} items) attached to client statement.</li>
              <li>Client milestone payments reconciled with bank statements.</li>
            </ul>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Audit Sign-off Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1"
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
              type="button"
              size="sm"
              disabled={submitting}
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              {submitting ? 'Locking...' : 'Confirm Final Sign-off'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
