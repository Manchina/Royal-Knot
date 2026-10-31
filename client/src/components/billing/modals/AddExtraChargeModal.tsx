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

interface AddExtraChargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    category: string;
    description: string;
    qty: number;
    unitPrice: number;
    vendor: string;
  }) => Promise<void>;
}

export const AddExtraChargeModal: React.FC<AddExtraChargeModalProps> = ({ open, onOpenChange, onSubmit }) => {
  const [category, setCategory] = useState('EXTRA_PLATES');
  const [description, setDescription] = useState('60 Unexpected Guests turned up at the Grand Durbar Banquet');
  const [qty, setQty] = useState('60');
  const [unitPrice, setUnitPrice] = useState('2100');
  const [vendor, setVendor] = useState('Marwar Heritage Kitchens');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSubmit({
        category,
        description,
        qty: parseFloat(qty) || 1,
        unitPrice: parseFloat(unitPrice) || 0,
        vendor,
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
            Audit & Record Extra Charge Overrun
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Attach unbudgeted banquet overruns, overtime, or client requests to both client settlement and supplier disbursement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div>
            <Label className="text-xs font-bold text-slate-700">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs border-slate-200 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXTRA_PLATES">Extra Dinner / Banquet Plates</SelectItem>
                <SelectItem value="DJ_OVERTIME">DJ & Sound Extension Overtime</SelectItem>
                <SelectItem value="VINTAGE_CAR">Vintage Baraat Vehicle Overrun</SelectItem>
                <SelectItem value="ADDITIONAL_POWER">Backup Diesel Genset</SelectItem>
                <SelectItem value="BOAT_SHUTTLE_OVERRUN">Water Taxi / Boat Shuttle Overrun</SelectItem>
                <SelectItem value="SPECIAL_FIREWORKS">Pyro / Fireworks Permit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Description / Scope Details</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1"
              placeholder="e.g. 60 unexpected banquet guests verified by captain"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700">Quantity / Units</Label>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Unit Rate (₹)</Label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="h-9 text-xs border-slate-200 mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Vendor Attribution</Label>
            <Input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="h-9 text-xs border-slate-200 mt-1"
              placeholder="e.g. Marwar Heritage Kitchens"
              required
            />
          </div>

          <div className="bg-amber-50 p-2.5 rounded border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between font-mono">
            <span>Calculated Total Addition:</span>
            <strong className="text-xs font-bold text-amber-800">
              ₹{((parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0)).toLocaleString('en-IN')}
            </strong>
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
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              {submitting ? 'Auditing...' : 'Confirm & Audit Extra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
