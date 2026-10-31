import React, { useState } from 'react';
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../ui';

interface AddVendorBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    vendorId: string;
    agreedBaseAmount: number;
    advancePaid: number;
    notes: string;
  }) => Promise<void>;
}

export const AddVendorBillModal: React.FC<AddVendorBillModalProps> = ({ open, onOpenChange, onSubmit }) => {
  const [vendorId, setVendorId] = useState('');
  const [agreedBaseAmount, setAgreedBaseAmount] = useState('1850000');
  const [advancePaid, setAdvancePaid] = useState('925000');
  const [notes, setNotes] = useState('Sourced via Procurement Engine');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSubmit({
        vendorId,
        agreedBaseAmount: parseFloat(agreedBaseAmount) || 0,
        advancePaid: parseFloat(advancePaid) || 0,
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
            Create Vendor Bill & Record PO
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Record a supplier contract commitment into this wedding&apos;s accounts payable ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div>
            <Label className="text-xs font-bold text-slate-700">Vendor Partner</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger className="h-9 text-xs border-slate-200 mt-1">
                <SelectValue placeholder="Select Vendor Partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="e0000001-0000-0000-0000-000000000001">Royal Rasoi Caterers (Catering)</SelectItem>
                <SelectItem value="e0000001-0000-0000-0000-000000000002">Marwar Heritage Kitchens (Catering)</SelectItem>
                <SelectItem value="e0000001-0000-0000-0000-000000000003">Rajputana Feasts & Banquets (Catering)</SelectItem>
                <SelectItem value="e0000001-0000-0000-0000-000000000004">Mewar Royal Florals & Decor (Decor)</SelectItem>
                <SelectItem value="e0000001-0000-0000-0000-000000000005">Jodhpur Beats & Sound Production (DJ / AV)</SelectItem>
                <SelectItem value="e0000001-0000-0000-0000-000000000007">Udaipur Royal Cinematography (Photography)</SelectItem>
                <SelectItem value="e0000001-0000-0000-0000-000000000008">Royal Rajputana Fleet (Transport)</SelectItem>
                <SelectItem value="e0000001-0000-0000-0000-000000000009">Jaipur Power Grid Rentals (Infrastructure)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700">Agreed PO Base Cost (₹)</Label>
              <Input
                type="number"
                value={agreedBaseAmount}
                onChange={(e) => setAgreedBaseAmount(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Initial Advance Paid (₹)</Label>
              <Input
                type="number"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">PO / Reference Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1"
              placeholder="e.g. Sourced via Procurement Decision Matrix"
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
              disabled={submitting || !vendorId}
              className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              {submitting ? 'Adding...' : 'Add Vendor Bill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
