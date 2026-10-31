import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Star,
  Users,
  FileSpreadsheet,
  Search
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
  Progress,
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

interface WeddingProfit {
  code: string;
  couple: string;
  venue: string;
  city: string;
  guests: number;
  clientBilled: string;
  vendorCosts: string;
  netProfit: string;
  marginPct: string;
  status: 'High Margin' | 'On Target' | 'Audit Extras';
  leadPlanner: string;
  date: string;
}

export const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'High Margin' | 'On Target' | 'Audit Extras'>('ALL');
  const [selectedWedding, setSelectedWedding] = useState<WeddingProfit | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const metrics = [
    {
      label: 'Net Profit Margin (Season)',
      value: '₹3.85 Cr',
      change: '+18.4% vs 2025',
      positive: true,
      sub: '25 Destination Weddings',
      icon: TrendingUp,
    },
    {
      label: 'Contracted Client Revenue',
      value: '₹14.20 Cr',
      change: '+22.1% YoY',
      positive: true,
      sub: 'Packages & Management Fee',
      icon: DollarSign,
    },
    {
      label: 'Pending Inflows (Next 30 Days)',
      value: '₹2.45 Cr',
      change: '5 Stage Payments Due',
      positive: true,
      sub: 'Client Milestones',
      icon: Calendar,
    },
    {
      label: 'Vendor Disbursements Due',
      value: '₹1.15 Cr',
      change: '18 Reconciled Invoices',
      positive: false,
      sub: 'Awaiting Coordinator Approval',
      icon: Users,
    },
  ];

  const weddingProfits: WeddingProfit[] = [
    {
      code: 'RW-2026-001',
      couple: 'Singhania & Mehra',
      venue: 'City Palace Complex & Jagmandir Island',
      city: 'Udaipur',
      guests: 450,
      clientBilled: '₹75,00,000',
      vendorCosts: '₹48,20,000',
      netProfit: '₹26,80,000',
      marginPct: '35.7%',
      status: 'High Margin',
      leadPlanner: 'Devika Sharma',
      date: 'Nov 14 - 16, 2026',
    },
    {
      code: 'RW-2026-002',
      couple: 'Oberoi & Rathore',
      venue: 'Rambagh Palace & Jaigarh Fort',
      city: 'Jaipur',
      guests: 520,
      clientBilled: '₹92,00,000',
      vendorCosts: '₹64,50,000',
      netProfit: '₹27,50,000',
      marginPct: '29.8%',
      status: 'On Target',
      leadPlanner: 'Karan Verma',
      date: 'Dec 02 - 04, 2026',
    },
    {
      code: 'RW-2026-003',
      couple: 'Kapoor & Chauhan',
      venue: 'Oberoi Rajvilas & Fort Nahargarh',
      city: 'Jaipur',
      guests: 380,
      clientBilled: '₹55,00,000',
      vendorCosts: '₹39,80,000',
      netProfit: '₹15,20,000',
      marginPct: '27.6%',
      status: 'On Target',
      leadPlanner: 'Priya Joshi',
      date: 'Dec 18 - 20, 2026',
    },
    {
      code: 'RW-2026-004',
      couple: 'Bansal & Agarwal',
      venue: 'Taj Lake Palace, Udaipur',
      city: 'Udaipur',
      guests: 410,
      clientBilled: '₹68,00,000',
      vendorCosts: '₹52,10,000',
      netProfit: '₹15,90,000',
      marginPct: '23.3%',
      status: 'Audit Extras',
      leadPlanner: 'Devika Sharma',
      date: 'Jan 08 - 10, 2027',
    },
  ];

  const vendorScorecard = [
    { name: 'Royal Mewar Banquets', category: 'Catering', weddings: 8, onTimeScore: 98, rating: 4.95, city: 'Udaipur' },
    { name: 'Jaipur Floral Wonders', category: 'Decor & Mandap', weddings: 12, onTimeScore: 92, rating: 4.88, city: 'Jaipur' },
    { name: 'Desert Beat Sounds', category: 'DJ & Production', weddings: 9, onTimeScore: 85, rating: 4.70, city: 'Jaipur' },
    { name: 'Heritage Dhol Troupe', category: 'Baraat Drummers', weddings: 14, onTimeScore: 99, rating: 4.98, city: 'Udaipur' },
  ];

  const filteredWeddings = weddingProfits.filter((w) => {
    const matchesSearch =
      w.couple.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel: Title & Primary Actions */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Executive Financial Management
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Profitability & Operational Performance
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Financial Ledger</span>
          </Button>
        </div>
      </div>

      {/* Operational KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <Card key={i} className="border border-slate-200 shadow-2xs rounded bg-white">
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {m.label}
                  </span>
                  <div className="p-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {m.value}
                </div>

                <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-slate-100">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                      m.positive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {m.positive ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    )}
                    {m.change}
                  </span>
                  <span className="text-slate-500 text-[11px] truncate">{m.sub}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Wedding-by-Wedding Profitability Matrix */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Wedding Profitability Matrix
              </CardTitle>
              <div className="text-xs text-slate-500 mt-0.5">
                Contracted billing vs direct vendor accounts with margin health
              </div>
            </div>

            {/* Odoo Style Filter & Search Controls */}
            <div className="flex items-center gap-2">
              <div className="w-36">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as any)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                    <SelectValue placeholder="All Margins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Margins</SelectItem>
                    <SelectItem value="High Margin">High Margin (&gt;30%)</SelectItem>
                    <SelectItem value="On Target">On Target</SelectItem>
                    <SelectItem value="Audit Extras">Audit Extras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search code, couple, venue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-slate-300"
                />
              </div>

              <Badge variant="outline" className="text-xs font-mono py-1">
                {filteredWeddings.length} of 25
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-700 text-xs">Event Code / Couple</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Venue & Destination</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Guests</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Invoiced (Client)</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Vendor Bills</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Net Profit</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Margin</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredWeddings.map((w) => (
                <TableRow key={w.code} className="hover:bg-slate-50 transition">
                  <TableCell className="py-2.5">
                    <div className="font-bold text-xs text-slate-900">{w.couple}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{w.code}</div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="text-slate-800 text-xs font-medium">{w.venue}</div>
                    <div className="text-[11px] text-slate-500">{w.city}</div>
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-mono text-xs">{w.guests}</TableCell>
                  <TableCell className="py-2.5 text-right font-mono font-semibold text-xs text-slate-900">
                    {w.clientBilled}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-mono text-xs text-slate-600">
                    {w.vendorCosts}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-emerald-800">
                    {w.netProfit}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-slate-800">
                    {w.marginPct}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <Badge
                      variant={
                        w.status === 'High Margin'
                          ? 'success'
                          : w.status === 'On Target'
                          ? 'info'
                          : 'warning'
                      }
                      className="text-[11px] font-semibold"
                    >
                      {w.status === 'Audit Extras' ? (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      ) : (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWedding(w)}
                      className="h-6 px-2 text-xs text-slate-700"
                    >
                      Audit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vendor SLA Scorecard (Formal High-Density Grid) */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Vendor SLA & Delivery Benchmarks
              </CardTitle>
              <div className="text-xs text-slate-500">
                Punctuality ratings and verified performance records
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              18 Partners Audited
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {vendorScorecard.map((v, i) => (
              <div
                key={i}
                className="p-3 rounded border border-slate-200 bg-slate-50/40 flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      {v.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                      <span>{v.rating}</span>
                    </div>
                  </div>
                  <div className="font-bold text-xs text-slate-900">{v.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {v.weddings} Weddings Delivered &bull; {v.city}
                  </div>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">On-Time Arrival:</span>
                    <span className="font-bold text-emerald-800 text-xs font-mono">
                      {v.onTimeScore}%
                    </span>
                  </div>
                  <Progress value={v.onTimeScore} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Wedding P&L Audit Detail */}
      {selectedWedding && (
        <Dialog open={!!selectedWedding} onOpenChange={() => setSelectedWedding(null)}>
          <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {selectedWedding.code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedWedding.city}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {selectedWedding.couple}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {selectedWedding.venue} &bull; {selectedWedding.date}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Contracted Client Invoice</div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {selectedWedding.clientBilled}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Approved Vendor Accounts</div>
                  <div className="text-sm font-bold font-mono text-slate-700 mt-0.5">
                    {selectedWedding.vendorCosts}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Net Project Margin
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Direct margin after coordinator & operational allocations
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-emerald-900">
                    {selectedWedding.netProfit}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    {selectedWedding.marginPct}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-slate-600 text-xs border-t border-slate-100 pt-2">
                <div className="flex justify-between">
                  <span>Assigned Planner:</span>
                  <span className="font-semibold text-slate-900">{selectedWedding.leadPlanner}</span>
                </div>
                <div className="flex justify-between">
                  <span>Audited Guest Headcount:</span>
                  <span className="font-semibold text-slate-900">{selectedWedding.guests} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span>Reconciliation Status:</span>
                  <span className="font-bold text-slate-900">{selectedWedding.status}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedWedding(null)}>
                Close
              </Button>
              <Button variant="default" size="sm" onClick={() => setSelectedWedding(null)}>
                Download Itemized Ledger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Export Report */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Export Season 2026 Financial Ledger
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Export consolidated audit records across all 25 destination weddings into formatted XLSX / CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-slate-600">
            <p className="p-2.5 rounded bg-slate-50 border border-slate-200">
              Includes gross revenue, verified vendor payables, extra plates adjustments, and net agency margin calculations.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={() => setExportModalOpen(false)}>
              Export Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
