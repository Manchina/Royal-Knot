import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  History, 
  TrendingUp, 
  FileText,
  Calendar,
  Users,
  MapPin
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
import { useWeddingStore } from '../store/useWeddingStore';
import { useBillingStore } from '../store/useBillingStore';

export const BillingProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { weddings } = useWeddingStore();
  const { 
    extraCharges, 
    vendorBills, 
    finalisedProjects, 
    addExtraCharge, 
    finaliseProject 
  } = useBillingStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [finaliseModalOpen, setFinaliseModalOpen] = useState(false);

  // Extra Charge Form State
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('50');
  const [unitPrice, setUnitPrice] = useState('2100');
  const [vendor, setVendor] = useState('Marwar Gourmet Kitchens');
  const [category, setCategory] = useState('EXTRA_PLATES');

  // Find target wedding
  const wedding = useMemo(() => {
    return weddings.find((w) => w.id === projectId || w.code === projectId) || weddings[0];
  }, [weddings, projectId]);

  // Is project finalised
  const isFinalised = Boolean(
    wedding.isFinalised ||
    wedding.status === 'FINALISED' ||
    finalisedProjects[wedding.id]
  );

  const finalisedInfo = finalisedProjects[wedding.id] || {
    finalisedDate: wedding.finalisedDate || 'Audited',
    finalisedBy: wedding.finalisedBy || 'Super Admin',
  };

  // Extra charges for this project
  const projectExtras = useMemo(() => {
    return extraCharges.filter((ext) => ext.weddingId === wedding.id);
  }, [extraCharges, wedding.id]);

  // Vendor bills for this project
  const projectVendorBills = useMemo(() => {
    return vendorBills.filter((vb) => vb.weddingId === wedding.id);
  }, [vendorBills, wedding.id]);

  // Financial totals
  const totalExtrasAmount = useMemo(() => {
    return projectExtras.reduce((sum, item) => {
      const num = parseFloat(item.total.replace(/[^\d.]/g, '')) || 0;
      return sum + num;
    }, 0);
  }, [projectExtras]);

  const baseBudgetNumeric = useMemo(() => {
    return (parseFloat(wedding.budget.replace(/[^\d.]/g, '')) || 3.5) * 10000000;
  }, [wedding.budget]);

  // Project edits history
  const projectEdits = useMemo(() => {
    const records: Array<{ date: string; action: string; by: string; details: string; itemRef: string; itemDesc: string }> = [];
    projectExtras.forEach((item) => {
      if (item.editHistory && item.editHistory.length > 0) {
        item.editHistory.forEach((rec) => {
          records.push({
            ...rec,
            itemRef: item.id,
            itemDesc: item.description,
          });
        });
      }
    });
    return records;
  }, [projectExtras]);

  // Submit extra charge
  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;

    const numQty = parseFloat(qty) || 1;
    const numPrice = parseFloat(unitPrice) || 1000;
    const calcTotal = numQty * numPrice;

    addExtraCharge({
      weddingId: wedding.id,
      category,
      description: desc,
      qty: numQty,
      unitPrice: `₹${numPrice.toLocaleString('en-IN')}`,
      total: `₹${calcTotal.toLocaleString('en-IN')}`,
      vendor,
      status: 'ADDED_TO_CLIENT_INVOICE',
      approvedBy: 'Finance Manager',
    });

    setModalOpen(false);
    setDesc('');
  };

  // Finalise project
  const handleFinalise = () => {
    finaliseProject(wedding.id, 'Aditya Singhal (Super Admin)');
    setFinaliseModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/billing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#714B67] hover:text-[#5C3D54] hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Billing Projects</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Billing & Extras</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">{wedding.code}</span>
        </div>
      </div>

      {/* Project Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-[#714B67] border border-purple-200">
                {wedding.code}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {wedding.city}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">{wedding.venue}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {wedding.couple}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {wedding.startDate}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> {wedding.guestCount} Guests
              </span>
              <span>👤 Lead Coordinator: <strong className="text-slate-700">{wedding.coordinator}</strong></span>
              <span>📦 Package: <strong className="text-slate-700">{wedding.packageType}</strong></span>
            </div>
          </div>

          {/* Action Buttons & Status Badge */}
          <div className="flex flex-wrap items-center gap-2">
            {isFinalised ? (
              <div className="flex items-center gap-2">
                <div className="text-right bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1 justify-end">
                    <Lock className="w-3 h-3" /> Finalised & Audited
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {finalisedInfo.finalisedDate} by {finalisedInfo.finalisedBy}
                  </div>
                </div>

                {projectEdits.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuditModalOpen(true)}
                    className="gap-1.5 h-9 text-xs border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  >
                    <History className="w-3.5 h-3.5 text-amber-700" />
                    <span>View Edits Log ({projectEdits.length})</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Exporting formal settlement statement for ${wedding.code}`)}
                  className="gap-1.5 h-9 text-xs border-slate-200 hover:bg-slate-50"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Invoice Statement</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFinaliseModalOpen(true)}
                  className="gap-1.5 h-9 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Finalise Settlement</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  className="gap-1.5 h-9 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Extra Charge</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Executive Financial Ledger KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Base Contract</div>
            <div className="font-mono font-bold text-sm text-slate-800 mt-0.5">{wedding.budget}</div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200/60">
            <div className="text-[10px] uppercase font-bold text-purple-700">Day-of Extras</div>
            <div className="font-mono font-bold text-sm text-[#714B67] mt-0.5">
              ₹{totalExtrasAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Invoiced</div>
            <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
              ₹{(baseBudgetNumeric + totalExtrasAmount).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Advances Paid</div>
            <div className="font-mono font-bold text-sm text-slate-700 mt-0.5">50% Advance Paid</div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/60">
            <div className="text-[10px] uppercase font-bold text-emerald-800">
              {isFinalised ? 'Vendor Balance' : 'Balance Payable'}
            </div>
            <div className="font-mono font-bold text-sm text-emerald-900 mt-0.5">
              {isFinalised ? '₹0 (Settled)' : 'Reconciled in Ledger'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gross Margin</div>
            <div className="font-mono font-bold text-sm text-slate-800 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>24.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Day-of Additions & Extra Charges Invoiced to Client */}
      <Card className="border border-slate-200 shadow-2xs rounded-xl bg-white">
        <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Day-of Additions & Extra Charges Invoiced to Couple
            </CardTitle>
            <div className="text-xs text-slate-500">
              Unexpected banquet covers, DJ curfew extensions, and client-requested additions
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5">
              {projectExtras.length} Items • ₹{totalExtrasAmount.toLocaleString('en-IN')}
            </Badge>

            {!isFinalised && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {projectExtras.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No extra charges recorded for this wedding project.
            </div>
          ) : (
            projectExtras.map((ext) => (
              <div
                key={ext.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs hover:border-slate-300 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-500 text-xs">{ext.id}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {ext.category}
                    </Badge>
                    <span className="text-slate-500 text-xs">&bull; {ext.vendor}</span>

                    {ext.editHistory && ext.editHistory.length > 0 && (
                      <Badge
                        variant="secondary"
                        onClick={() => setAuditModalOpen(true)}
                        className="text-[9px] bg-amber-50 text-amber-800 border-amber-200 cursor-pointer hover:bg-amber-100 gap-1"
                        title="Click to view edit history"
                      >
                        <History className="w-2.5 h-2.5" /> Edited
                      </Badge>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{ext.description}</div>
                  <div className="text-slate-500 text-xs">
                    Rate: {ext.qty} units &times; {ext.unitPrice} ={' '}
                    <strong className="font-mono text-slate-900">{ext.total}</strong>
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
            ))
          )}
        </CardContent>
      </Card>

      {/* Section 2: Vendor Disbursement Ledger */}
      <Card className="border border-slate-200 shadow-2xs rounded-xl bg-white">
        <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Vendor Disbursement Ledger
              </CardTitle>
              <div className="text-xs text-slate-500">
                Agreed contract vs extras, advances paid, and balance payable for {wedding.code}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60">
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
              {projectVendorBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-500">
                    No vendor disbursement accounts recorded for this project yet.
                  </TableCell>
                </TableRow>
              ) : (
                projectVendorBills.map((vb, i) => (
                  <TableRow key={i} className="hover:bg-slate-50 transition">
                    <TableCell className="py-3">
                      <div className="font-bold text-xs text-slate-900">{vb.vendor}</div>
                      <div className="text-[11px] text-slate-500">{vb.category}</div>
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-xs text-slate-600">
                      {vb.agreedBase}
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-xs font-semibold text-amber-800">
                      {vb.extras}
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                      {vb.totalPayable}
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-xs text-slate-600">
                      {vb.advancePaid}
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-xs font-bold text-emerald-800">
                      {vb.balanceDue}
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      {vb.status === 'SETTLEMENT_CLEARED' ? (
                        <Badge variant="success" className="text-[10px] gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Settlement Cleared
                        </Badge>
                      ) : (
                        <Badge variant="odoo" className="text-[10px]">
                          Reconciled Matched
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Extra Charge Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add Day-of Extra Charge
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Append unexpected guest covers or vendor overtime to {wedding.couple}'s final settlement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExtra} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Project Wedding</Label>
              <div className="mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-[#714B67]">
                {wedding.code} • {wedding.couple}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Cost Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 z-50">
                  <SelectItem value="EXTRA_PLATES">Extra Food & Banquet Plates (₹2,100/plate)</SelectItem>
                  <SelectItem value="DJ_OVERTIME">DJ & Sound Extension Past 01:00 AM</SelectItem>
                  <SelectItem value="VINTAGE_CAR">Vintage Baraat Vehicle Overrun</SelectItem>
                  <SelectItem value="ADDITIONAL_POWER">Diesel Generator / Backup Power</SelectItem>
                  <SelectItem value="SPECIAL_FIREWORKS">Varmala Cold Pyro / Eco Fireworks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Vendor Account</Label>
              <Input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Marwar Gourmet Kitchens"
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Description of Overrun / Addition</Label>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g. 50 extra plates requested by Bride family"
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Quantity / Units</Label>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Unit Rate (₹)</Label>
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 rounded bg-purple-50/70 border border-purple-200/60 text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">Calculated Additional Charge:</span>
              <span className="font-mono font-bold text-sm text-[#714B67]">
                ₹{((parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0)).toLocaleString('en-IN')}
              </span>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Authorize & Add to Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Audit History & Edits Modal */}
      <Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
        <DialogContent className="max-w-lg bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>Project Audit & Edits History</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Audit log of changes, rate negotiations, and adjustments made to {wedding.code}'s extras and settlements.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 max-h-[60vh] overflow-y-auto">
            {projectEdits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No edit revisions recorded for this project yet.
              </div>
            ) : (
              projectEdits.map((edit, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{edit.action}</span>
                    <span className="font-mono text-slate-500">{edit.date}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Item:</span> {edit.itemRef} &bull; {edit.itemDesc}
                  </div>
                  <div className="text-slate-700 bg-white p-2 rounded border border-slate-200/80 text-[11px] mt-1">
                    {edit.details}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Authorized by: <strong className="text-slate-600">{edit.by}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAuditModalOpen(false)}>
              Close Audit Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalise Project Confirmation Dialog */}
      <Dialog open={finaliseModalOpen} onOpenChange={setFinaliseModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Finalise & Lock Wedding Settlement?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This will lock all extra charges for {wedding.couple} ({wedding.code}), clear remaining vendor balances as settled, and mark this wedding as Finalised.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 space-y-1 my-2">
            <div className="font-bold">Settlement Summary to be Locked:</div>
            <div>&bull; Base Contract: <strong>{wedding.budget}</strong></div>
            <div>&bull; Total Day-of Extras: <strong>₹{totalExtrasAmount.toLocaleString('en-IN')}</strong></div>
            <div>&bull; Reconciled Vendor Accounts: <strong>{projectVendorBills.length} Vendors</strong></div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setFinaliseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleFinalise}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Confirm & Finalise Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
