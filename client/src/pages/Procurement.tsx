import { useState } from 'react';
import { 
  Check, 
  CheckCircle2, 
  Star
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
} from '../components/ui';
import { useWeddingStore } from '../store/useWeddingStore';

export const Procurement: React.FC = () => {
  const { weddings, selectedWeddingId, setSelectedWeddingId } = useWeddingStore();
  const activeWedding = weddings.find((w) => w.id === selectedWeddingId) || weddings[0];
  const [selectedWinner, setSelectedWinner] = useState<string | null>('CAT-02');
  const [activeCategory, setActiveCategory] = useState<string>('catering');

  const quotes = [
    {
      id: 'CAT-01',
      vendor: 'Royal Mewar Banquets & Catering',
      rating: 4.95,
      city: 'Udaipur',
      pricePerPlate: '₹2,250',
      totalCost400: '₹9,00,000',
      overtimeRate: '₹15,000 / hr',
      staffCount: '140 Banquet Staff',
      menuHighlights: 'Dal Baati Churma, Ker Sangri, Laal Maas, Live Jalebi & Rabri counters, 12 Welcome Drinks',
      inclusions: '140 uniformed banquet staff, copper royal chafing dishes, mineral water jars, waste management',
    },
    {
      id: 'CAT-02',
      vendor: 'Marwar Gourmet Kitchens',
      rating: 4.88,
      city: 'Jaipur',
      pricePerPlate: '₹2,100',
      totalCost400: '₹8,40,000',
      overtimeRate: '₹12,000 / hr',
      staffCount: '120 Banquet Staff',
      menuHighlights: 'Royal Rajputana Thali, Smoked Chaat Island, Wood-fired Italian pizza bar, 18 Artisanal desserts',
      inclusions: 'Complete glassware, bone china crockery, dedicated bride/groom food butler, welcome detox mocktails',
    },
    {
      id: 'CAT-03',
      vendor: 'Jaipur Heritage Feast Co.',
      rating: 4.70,
      city: 'Jaipur',
      pricePerPlate: '₹1,950',
      totalCost400: '₹7,80,000',
      overtimeRate: '₹18,000 / hr',
      staffCount: '90 Banquet Staff',
      menuHighlights: 'Traditional Marwari buffet, live tandoor corner, sweet counter with 6 varieties',
      inclusions: 'Standard buffet setup, 90 staff, basic paper napkins and standard cutlery',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Vendor Sourcing & RFQ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono font-bold text-[#714B67]">
              {activeWedding.code}: {activeWedding.couple}
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Vendor Quote Comparison & Award
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Project:</span>
          <select
            value={activeWedding.id}
            onChange={(e) => setSelectedWeddingId(e.target.value)}
            className="h-8 text-xs font-semibold bg-white border border-slate-200 rounded px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] cursor-pointer"
          >
            {weddings.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code}: {w.couple} ({w.guestCount} Guests, {w.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Odoo Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="h-8 bg-slate-100 border border-slate-200">
          <TabsTrigger value="catering" className="text-xs px-3 font-semibold">
            Catering & Banquets (3 Quotes)
          </TabsTrigger>
          <TabsTrigger value="decor" className="text-xs px-3 font-semibold">
            Decor & Mandap (Locked)
          </TabsTrigger>
          <TabsTrigger value="sound" className="text-xs px-3 font-semibold">
            DJ & Truss Lights (Locked)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Side-by-Side Quote Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {quotes.map((q) => {
          const isWinner = selectedWinner === q.id;
          const isRejected = selectedWinner !== null && !isWinner;

          return (
            <Card
              key={q.id}
              className={`relative flex flex-col justify-between border rounded bg-white shadow-2xs transition-all ${
                isWinner
                  ? 'border-emerald-600 ring-1 ring-emerald-600'
                  : isRejected
                  ? 'border-slate-200 opacity-60 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="font-bold">{q.id}</span>
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span>{q.rating}</span>
                    <span className="text-slate-500 font-normal">({q.city})</span>
                  </div>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 pt-1">
                  {q.vendor}
                </CardTitle>
                {isWinner && (
                  <Badge variant="success" className="text-[10px] w-fit mt-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Awarded Contract
                  </Badge>
                )}
                {isRejected && (
                  <Badge variant="secondary" className="text-[10px] w-fit mt-1">
                    Auto-Closed
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {/* Financial Rates */}
                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Price per Plate:</span>
                    <span className="text-sm font-bold font-mono text-slate-900">{q.pricePerPlate}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Total (400 Pax):</span>
                    <span className="font-semibold font-mono text-slate-800">{q.totalCost400}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 text-[11px]">
                    <span className="text-slate-500">Overtime Rate:</span>
                    <span className="font-mono text-slate-700 font-medium">{q.overtimeRate}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                      Banquet Staffing:
                    </span>
                    <p className="text-slate-600">{q.staffCount}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                      Menu Coverage:
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{q.menuHighlights}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-3 bg-slate-50/80 border-t border-slate-200">
                {isWinner ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold text-emerald-800 border-emerald-300 bg-emerald-50"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Contract Executed
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedWinner(q.id)}
                    className="w-full text-xs"
                  >
                    Award Contract
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <CardTitle className="text-sm font-bold text-slate-900">
            RFQ Specifications Comparison
          </CardTitle>
          <div className="text-xs text-slate-500">
            Head-to-head parameter analysis
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-1/4 font-bold text-slate-700 text-xs">Specification</TableHead>
                {quotes.map((q) => (
                  <TableHead key={q.id} className="w-1/4 font-bold text-slate-700 text-xs">
                    <div>{q.vendor}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal">{q.id}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              <TableRow>
                <TableCell className="font-medium text-xs text-slate-700">Base Plate Rate</TableCell>
                {quotes.map((q) => (
                  <TableCell key={q.id} className="font-mono font-bold text-xs text-slate-900">
                    {q.pricePerPlate}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs text-slate-700">Contract Total (400 Pax)</TableCell>
                {quotes.map((q) => (
                  <TableCell key={q.id} className="font-mono font-semibold text-xs text-slate-900">
                    {q.totalCost400}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs text-slate-700">Overtime Penalty Rate</TableCell>
                {quotes.map((q) => (
                  <TableCell key={q.id} className="font-mono text-xs text-slate-600">
                    {q.overtimeRate}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs text-slate-700">Dedicated Butler</TableCell>
                <TableCell className="text-xs text-slate-500">On request (+₹5,000)</TableCell>
                <TableCell className="text-xs text-emerald-800 font-bold">Included in Base</TableCell>
                <TableCell className="text-xs text-slate-400">Not provided</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
