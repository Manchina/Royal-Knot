import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  Receipt,
  FileCheck,
  Star,
  Users,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Progress,
  Button,
} from '../ui';

interface ClientPortalViewProps {
  selectedCouple?: string;
  couplesList?: {
    code: string;
    couple: string;
    city?: string;
    venue?: string;
  }[];
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  selectedCouple = 'ALL',
  couplesList = [],
}) => {
  const navigate = useNavigate();

  // Resolve active couple information
  const activeCouple = useMemo(() => {
    if (selectedCouple !== 'ALL') {
      const found = couplesList.find((c) => c.code === selectedCouple);
      if (found) return found;
    }
    return {
      code: 'RW-2026-001',
      couple: 'Aanya Singhania & Raghav Mehra',
      city: 'Udaipur',
      venue: 'Taj Lake Palace, Udaipur',
    };
  }, [selectedCouple, couplesList]);

  // Countdown timer calculations for Nov 20, 2026
  const weddingDate = new Date('2026-11-20T17:30:00');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number }>({
    days: 20,
    hours: 14,
    mins: 32,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = weddingDate.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        setTimeLeft({ days, hours, mins });
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Couple Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#714B67] to-[#4e2f47] text-white rounded-lg p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Bride & Groom Portal
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/20">
                {activeCouple.code}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeCouple.couple}
            </h1>
            <p className="text-xs text-white/80 flex items-center gap-2 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                {activeCouple.venue || 'Taj Lake Palace, Udaipur'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                Nov 20 - Nov 23, 2026
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-300" />
                400 Royal Guests
              </span>
            </p>
          </div>

          {/* Quick Module Go-To Links and Countdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/sign/${activeCouple.code}`)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-8 gap-1.5"
                title="View Digital Agreement & Signatures"
              >
                <span>Digital Agreement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/procurement')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-8 gap-1.5"
                title="Open Sourcing Matrix"
              >
                <span>Sourcing Matrix</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Countdown Clock Box */}
            {/* <div className="bg-black/25 backdrop-blur-xs border border-white/20 p-3 rounded-lg text-center shrink-0">
              <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                Countdown to Pheras
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-white leading-none">
                    {timeLeft.days}
                  </div>
                  <div className="text-[9px] text-white/60">DAYS</div>
                </div>
                <span className="text-white/40 font-mono">:</span>
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-white leading-none">
                    {timeLeft.hours}
                  </div>
                  <div className="text-[9px] text-white/60">HRS</div>
                </div>
                <span className="text-white/40 font-mono">:</span>
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-white leading-none">
                    {timeLeft.mins}
                  </div>
                  <div className="text-[9px] text-white/60">MINS</div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Couple Action Items Ribbon (Read-Only Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Planning Progress
              </span>
              <div className="p-1 rounded bg-purple-50 text-[#714B67] border border-purple-200">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              84% <span className="text-xs text-slate-400 font-normal">Complete</span>
            </div>
            <Progress value={84} className="h-1.5" />
            <div className="text-[11px] text-slate-500 pt-1">
              Venue locked &bull; Decor blueprints finalized
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Digital Service Agreement
              </span>
              <div className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FileCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Signed on Mobile Screen</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>Contract Reference</span>
              <span className="font-mono font-semibold text-slate-700">TRK-AGR-2026-001</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Payment Schedule
              </span>
              <div className="p-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              Stage 1 Paid <span className="text-xs text-emerald-700 font-semibold">(20% Locked)</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>Next: Stage 2 (50% Advance)</span>
              <span className="font-mono font-bold text-slate-700">Due Nov 01</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Room: Side-by-Side Caterer Comparison Overview */}
      <Card className="border border-purple-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-4 border-b border-purple-100 bg-purple-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                Couple Decision Room: Rajasthani Banquet Catering Quotes
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-white border-purple-300 text-[#714B67]">
                Normalized Bids
              </Badge>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Side-by-side comparison of curated caterers for your 400-guest royal banquet
            </div>
          </div>
          <Badge variant="success" className="text-xs font-bold py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Marwar Heritage Kitchens Recommended
          </Badge>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Caterer Option A */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Royal Rasoi</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>4.8</span>
                </div>
              </div>

              <div className="text-xl font-bold font-mono text-[#714B67]">
                ₹1,850 <span className="text-xs text-slate-500 font-normal">/ plate</span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                <div>• Overtime: ₹15,000 / hr</div>
                <div>• Silver-plated chinaware included</div>
                <div>• 8 Live Chaat & Sweet Counters</div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Badge variant="secondary" className="text-[10px]">
                  Under Evaluation
                </Badge>
              </div>
            </div>

            {/* Caterer Option B (Planner Recommended) */}
            <div className="p-3.5 rounded-lg border border-[#714B67] bg-purple-50/40 ring-1 ring-[#714B67] space-y-2.5 relative">
              <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-[#714B67] text-white uppercase tracking-wider shadow-2xs">
                Planner Recommended
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-xs text-slate-900">Marwar Heritage</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>5.0</span>
                </div>
              </div>

              <div className="text-xl font-bold font-mono text-emerald-800">
                ₹2,100 <span className="text-xs text-slate-500 font-normal">/ plate</span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                <div>• Overtime: ₹12,000 / hr (Lowest rate)</div>
                <div>• Handcrafted Marwari brassware & stewards</div>
                <div>• 14 Live Dal Baati & Shahi Mithai Stalls</div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Badge variant="success" className="text-[10px]">
                  Awarded Contract
                </Badge>
              </div>
            </div>

            {/* Caterer Option C */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Rajputana Feasts</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>4.9</span>
                </div>
              </div>

              <div className="text-xl font-bold font-mono text-[#714B67]">
                ₹1,950 <span className="text-xs text-slate-500 font-normal">/ plate</span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                <div>• Overtime: ₹20,000 / hr</div>
                <div>• Traditional bone china presentation</div>
                <div>• 10 Multi-cuisine & Mewari Counters</div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Badge variant="secondary" className="text-[10px]">
                  Under Evaluation
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest Itinerary Schedule */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <CardTitle className="text-sm font-bold text-slate-900">
            Royal Ceremony Itinerary Schedule
          </CardTitle>
          <div className="text-xs text-slate-500">
            Curated timeline for family, guests, and wedding ceremonies
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-700 text-xs">Date & Time</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Ceremony Event</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Palace Venue</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Dress Theme</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5">Nov 20 &bull; 11:00 AM</TableCell>
                <TableCell className="font-bold text-slate-900">Royal Mehendi & Welcome Sangeet</TableCell>
                <TableCell>Palace Courtyard Lawns</TableCell>
                <TableCell>Pastel Royal Florals</TableCell>
                <TableCell className="text-center">
                  <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5">Nov 20 &bull; 19:00 PM</TableCell>
                <TableCell className="font-bold text-slate-900">Sangeet & Musical Night with Dhol Tasha</TableCell>
                <TableCell>Lake Pichola Open Terrace</TableCell>
                <TableCell>Glitz, Glamour & Heritage Silk</TableCell>
                <TableCell className="text-center">
                  <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5">Nov 21 &bull; 10:30 AM</TableCell>
                <TableCell className="font-bold text-slate-900">Sunshine Haldi & Phoolon Ki Holi</TableCell>
                <TableCell>Poolside Marble Pavilion</TableCell>
                <TableCell>Shades of Marigold Yellow</TableCell>
                <TableCell className="text-center">
                  <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5 text-rose-700">Nov 21 &bull; 16:45 PM</TableCell>
                <TableCell className="font-bold text-slate-900">Royal Vintage Baraat & Vedic Pheras</TableCell>
                <TableCell>Sunset Mandap @ Lake Water Pavilion</TableCell>
                <TableCell>Regal Crimson & Raw Silk</TableCell>
                <TableCell className="text-center">
                  <Badge variant="destructive" className="text-[10px]">Main Event</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5">Nov 22 &bull; 20:00 PM</TableCell>
                <TableCell className="font-bold text-slate-900">Grand Royal Reception & Gala Dinner</TableCell>
                <TableCell>Mewar Grand Ballroom</TableCell>
                <TableCell>Black Tie & Royal Formal</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-[10px]">Final Evening</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
