import { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';

interface ExtraCharge {
  id: string;
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  vendor: string;
  status: 'ADDED_TO_CLIENT_INVOICE' | 'PENDING_APPROVAL';
  approvedBy: string;
}

interface VendorBill {
  vendor: string;
  category: string;
  agreedBase: string;
  extras: string;
  totalPayable: string;
  advancePaid: string;
  balanceDue: string;
  status: 'RECONCILED_MATCHED' | 'DISPUTED';
}

export const Billing: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('50');
  const [unitPrice, setUnitPrice] = useState('2100');
  const [vendor, setVendor] = useState('Marwar Gourmet Kitchens');

  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([
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

  const vendorBills: VendorBill[] = [
    {
      vendor: 'Marwar Gourmet Kitchens',
      category: 'Catering & Banquets',
      agreedBase: '₹8,40,000',
      extras: '+₹1,26,000 (60 Plates)',
      totalPayable: '₹9,66,000',
      advancePaid: '₹4,20,000',
      balanceDue: '₹5,46,000',
      status: 'RECONCILED_MATCHED',
    },
    {
      vendor: 'Jaipur Floral Wonders',
      category: 'Mandap & Courtyard Decor',
      agreedBase: '₹14,00,000',
      extras: '₹0',
      totalPayable: '₹14,00,000',
      advancePaid: '₹7,00,000',
      balanceDue: '₹7,00,000',
      status: 'RECONCILED_MATCHED',
    },
    {
      vendor: 'Desert Beat Sounds',
      category: 'Sound & DJ Tech Rider',
      agreedBase: '₹3,50,000',
      extras: '+₹30,000 (Overtime)',
      totalPayable: '₹3,80,000',
      advancePaid: '₹1,75,000',
      balanceDue: '₹2,05,000',
      status: 'RECONCILED_MATCHED',
    },
  ];

  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;

    const numQty = parseFloat(qty) || 1;
    const numPrice = parseFloat(unitPrice) || 1000;
    const calcTotal = numQty * numPrice;

    const newExtra: ExtraCharge = {
      id: `EXT-0${extraCharges.length + 1}`,
      category: 'OVERRUN_ADDITION',
      description: desc,
      qty: numQty,
      unitPrice: `₹${numPrice.toLocaleString('en-IN')}`,
      total: `₹${calcTotal.toLocaleString('en-IN')}`,
      vendor,
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Finance Manager',
    };

    setExtraCharges([...extraCharges, newExtra]);
    setModalOpen(false);
    setDesc('');
  };

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Invoicing & Vendor Settlements
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Billing & Extra Charges Reconciliation
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono font-bold py-1 px-2.5">
            Total Extras: ₹1,56,000
          </Badge>

          <Button
            variant="default"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Extra Charge</span>
          </Button>
        </div>
      </div>

      {/* Extra Charges Section */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <CardTitle className="text-sm font-bold text-slate-900">
            Day-of Additions Invoiced to Client
          </CardTitle>
          <div className="text-xs text-slate-500">
            Headcount additions and overtime adjustments added to final settlement
          </div>
        </CardHeader>

        <CardContent className="p-3.5 space-y-2.5">
          {extraCharges.map((ext) => (
            <div
              key={ext.id}
              className="p-3 rounded border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-500 text-xs">{ext.id}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {ext.category}
                  </Badge>
                  <span className="text-slate-500 text-xs">&bull; {ext.vendor}</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{ext.description}</div>
                <div className="text-slate-500 text-xs">
                  Rate: {ext.qty} units &times; {ext.unitPrice} = <strong className="font-mono text-slate-900">{ext.total}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <Badge variant="success" className="text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Invoiced to Couple
                  </Badge>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Authorized: {ext.approvedBy}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Vendor Payment Reconciliation Matrix */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Vendor Disbursement Ledger
              </CardTitle>
              <div className="text-xs text-slate-500">
                Agreed contract vs extras, advances paid, and balance payable
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Duplicate Payment Protected</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-700 text-xs">Vendor & Service Account</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Contract Base</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Extras</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Total Payable</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Advance Paid</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Balance Due</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {vendorBills.map((vb, i) => (
                <TableRow key={i} className="hover:bg-slate-50 transition">
                  <TableCell className="py-2.5">
                    <div className="font-bold text-xs text-slate-900">{vb.vendor}</div>
                    <div className="text-[11px] text-slate-500">{vb.category}</div>
                  </TableCell>

                  <TableCell className="py-2.5 text-right font-mono text-xs text-slate-600">
                    {vb.agreedBase}
                  </TableCell>

                  <TableCell className="py-2.5 text-right font-mono text-xs font-semibold text-amber-800">
                    {vb.extras}
                  </TableCell>

                  <TableCell className="py-2.5 text-right font-mono text-xs font-bold text-slate-900">
                    {vb.totalPayable}
                  </TableCell>

                  <TableCell className="py-2.5 text-right font-mono text-xs text-slate-600">
                    {vb.advancePaid}
                  </TableCell>

                  <TableCell className="py-2.5 text-right font-mono text-xs font-bold text-emerald-800">
                    {vb.balanceDue}
                  </TableCell>

                  <TableCell className="py-2.5 text-right">
                    <Badge variant="odoo" className="text-[10px]">
                      Reconciled Matched
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Add Extra Charge */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add Operational Extra Charge
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record verified event overrun to invoice couple and reconcile vendor payable.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExtra} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="vendor_name">Vendor Account</Label>
              <Select
                value={vendor}
                onValueChange={(val) => setVendor(val)}
              >
                <SelectTrigger id="vendor_name" className="h-8 text-xs border-slate-300">
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marwar Gourmet Kitchens">Marwar Gourmet Kitchens (Catering)</SelectItem>
                  <SelectItem value="Desert Beat Sounds">Desert Beat Sounds (DJ & Audio)</SelectItem>
                  <SelectItem value="Jaipur Floral Wonders">Jaipur Floral Wonders (Mandap)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="charge_desc">Reason / Item Description</Label>
              <Input
                id="charge_desc"
                placeholder="e.g. 50 Extra Banquet Plates for unannounced guests"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="charge_qty">Quantity / Units</Label>
                <Input
                  id="charge_qty"
                  type="number"
                  placeholder="50"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="charge_unit">Rate per Unit (₹)</Label>
                <Input
                  id="charge_unit"
                  type="number"
                  placeholder="2100"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Append to Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
