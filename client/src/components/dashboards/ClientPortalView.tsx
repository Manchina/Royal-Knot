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
import { api } from '../../api/client';

interface ClientPortalViewProps {
  selectedCouple?: string;
  couplesList?: {
    code: string;
    couple: string;
    city?: string;
    venue?: string;
    startDate?: string;
  }[];
}

interface CatererBid {
  id: string;
  name: string;
  rating: number;
  pricePerPlate: number;
  formattedPrice: string;
  overtimeRate: string;
  inclusions: string[];
  status: 'AWARDED' | 'EVALUATION';
  isRecommended?: boolean;
}

interface ClientPortalInvoice {
  id?: string;
  stage?: string;
  stageLabel?: string;
  amount?: string;
  percentage?: number;
  status?: string;
  dueDate?: string;
}

interface ProjectDetailData {
  couple?: string;
  brideName?: string;
  groomName?: string;
  venue?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  guestCount?: number;
  actualHeadcount?: number;
  status?: string;
  budget?: string;
  invoices?: ClientPortalInvoice[];
  availableQuotes?: unknown[];
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  selectedCouple = 'ALL',
  couplesList = [],
}) => {
  const navigate = useNavigate();

  // Active couple resolver
  const activeCouple = useMemo(() => {
    if (selectedCouple !== 'ALL') {
      const found = couplesList.find((c) => c.code === selectedCouple);
      if (found) return found;
    }
    return {
      code: 'RW-2026-001',
      couple: 'Aanya Singhania & Raghav Mehra',
      city: 'Udaipur',
      venue: 'The Oberoi Udaivilas, Udaipur',
      startDate: '2026-11-14',
    };
  }, [selectedCouple, couplesList]);

  // Live PostgreSQL project & billing details
  const [projectData, setProjectData] = useState<ProjectDetailData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProjectDetails = async () => {
      try {
        const res = await api.get<{ success: boolean; data?: ProjectDetailData }>(`/api/billing/projects/${activeCouple.code}`);
        if (isMounted && res?.success && res.data) {
          setProjectData(res.data);
        }
      } catch (err) {
        console.warn(`Failed to fetch project details for ${activeCouple.code}:`, err);
      }
    };

    fetchProjectDetails();
    return () => {
      isMounted = false;
    };
  }, [activeCouple.code]);

  // Dynamic merged wedding information
  const weddingInfo = useMemo(() => {
    const p = projectData || {};
    return {
      code: activeCouple.code,
      couple: p.couple || activeCouple.couple || 'Royal Wedding',
      brideName: p.brideName || activeCouple.couple?.split('&')[0]?.trim() || 'Bride',
      groomName: p.groomName || activeCouple.couple?.split('&')[1]?.trim() || 'Groom',
      venue: p.venue || activeCouple.venue || 'The Oberoi Udaivilas, Udaipur',
      city: p.city || activeCouple.city || 'Udaipur',
      startDate: p.startDate || activeCouple.startDate || 'Nov 14, 2026',
      endDate: p.endDate || 'Nov 16, 2026',
      guestCount: p.actualHeadcount || p.guestCount || 400,
      status: p.status || 'LIVE_BIG_DAY',
      budget: p.budget || '₹3.50 Cr',
      invoices: p.invoices || [],
      availableQuotes: p.availableQuotes || [],
    };
  }, [projectData, activeCouple]);

  // Dynamic Countdown Timer to the couple's ceremony date
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number }>({
    days: 14,
    hours: 18,
    mins: 22,
  });

  useEffect(() => {
    const calculateTime = () => {
      const parsedDate = new Date(weddingInfo.startDate);
      const target = isNaN(parsedDate.getTime()) ? new Date('2026-11-20T17:30:00') : parsedDate;
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        setTimeLeft({ days, hours, mins });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0 });
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [weddingInfo.startDate]);

  // 1. Dynamic Planning Progress
  const planningProgress = useMemo(() => {
    const st = (weddingInfo.status || '').toUpperCase();
    if (st.includes('FINAL') || st.includes('COMPLET')) {
      return {
        pct: 100,
        subtitle: 'Celebration concluded • Vendor accounts & digital albums archived',
      };
    }
    if (st.includes('LIVE')) {
      return {
        pct: 88,
        subtitle: 'Venue locked • Mandap setup & banquet preparation underway',
      };
    }
    if (st.includes('PLAN')) {
      return {
        pct: 68,
        subtitle: 'Venue locked • Decor blueprints & catering tasting in progress',
      };
    }
    if (st.includes('BOOK')) {
      return {
        pct: 35,
        subtitle: 'Booking token confirmed • Vendor RFQs & initial moodboards drafted',
      };
    }
    return {
      pct: 84,
      subtitle: 'Venue locked • Decor blueprints finalized',
    };
  }, [weddingInfo.status]);

  // 2. Dynamic Digital Service Agreement
  const agreementInfo = useMemo(() => {
    const refCode = `TRK-AGR-${weddingInfo.code}`;
    const signedText = `Signed by ${weddingInfo.brideName} & ${weddingInfo.groomName}`;
    return { refCode, signedText };
  }, [weddingInfo]);

  // 3. Dynamic Payment Schedule from live PostgreSQL invoices
  const paymentSchedule = useMemo(() => {
    const invoices = Array.isArray(weddingInfo.invoices) ? (weddingInfo.invoices as ClientPortalInvoice[]) : [];
    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID');

    let totalPct = 0;
    paidInvoices.forEach((i) => {
      totalPct += Number(i.percentage) || 0;
    });

    let headline = 'Stage 1 Paid';
    let pctLabel = `(${totalPct || 20}% Locked)`;

    if (totalPct >= 100 || (invoices.length > 0 && unpaidInvoices.length === 0)) {
      headline = 'All Milestones Settled';
      pctLabel = '(100% Cleared)';
    } else if (totalPct >= 70) {
      headline = 'Stage 2 Paid';
      pctLabel = `(${totalPct}% Locked)`;
    } else if (totalPct >= 20) {
      headline = 'Stage 1 Paid';
      pctLabel = `(${totalPct}% Locked)`;
    } else {
      headline = 'Booking Advance';
      pctLabel = '(Pending)';
    }

    let nextLabel = 'All Invoices Cleared';
    let nextDue = 'Settled in Full';

    if (unpaidInvoices.length > 0) {
      const next = unpaidInvoices[0];
      const cleanLabel = next.stageLabel ? next.stageLabel.replace(/\s*\(\d+%\)/, '') : 'Next Stage';
      nextLabel = `Next: ${cleanLabel}`;
      nextDue = next.dueDate ? `Due ${next.dueDate}` : 'Due Soon';
    } else if (weddingInfo.status === 'LIVE_BIG_DAY') {
      nextLabel = 'Next: Stage 3 (Final Settlement)';
      nextDue = 'Due Nov 25';
    }

    return { headline, pctLabel, nextLabel, nextDue };
  }, [weddingInfo]);

  // 4. Dynamic Couple Decision Room (Banquet Catering Quotes)
  const catererQuotes = useMemo<CatererBid[]>(() => {
    const city = (weddingInfo.city || '').toLowerCase();
    const guests = weddingInfo.guestCount || 400;

    if (city.includes('udaipur')) {
      return [
        {
          id: 'cat-1',
          name: 'Royal Mewar Banquets',
          rating: 5.0,
          pricePerPlate: 2250,
          formattedPrice: '₹2,250',
          overtimeRate: '₹15,000 / hr',
          inclusions: [
            'Handcrafted Mewari silver & royal thali service',
            `${Math.round(guests / 30)} Live Lakefront Chaat & Sweet Counters`,
            'Overtime: ₹15,000 / hr',
          ],
          status: 'AWARDED',
          isRecommended: true,
        },
        {
          id: 'cat-2',
          name: 'Marwar Heritage Kitchens',
          rating: 4.9,
          pricePerPlate: 2100,
          formattedPrice: '₹2,100',
          overtimeRate: '₹12,000 / hr (Lowest rate)',
          inclusions: [
            'Handcrafted brassware & trained stewards',
            '10 Live Dal Baati & Tandoor Stations',
            'Overtime: ₹12,000 / hr (Lowest rate)',
          ],
          status: 'EVALUATION',
        },
        {
          id: 'cat-3',
          name: 'Jagmandir Culinary Guild',
          rating: 4.8,
          pricePerPlate: 1950,
          formattedPrice: '₹1,950',
          overtimeRate: '₹18,000 / hr',
          inclusions: [
            'Traditional bone china presentation',
            '8 Multi-cuisine & Mewari Counters',
            'Overtime: ₹18,000 / hr',
          ],
          status: 'EVALUATION',
        },
      ];
    }

    if (city.includes('jodhpur')) {
      return [
        {
          id: 'cat-1',
          name: 'Rajputana Feasts & Banquets',
          rating: 5.0,
          pricePerPlate: 2200,
          formattedPrice: '₹2,200',
          overtimeRate: '₹14,000 / hr',
          inclusions: [
            'Authentic Jodhpuri Mawa Kachori & Shahi Thali',
            'Traditional royal copper tableware',
            'Overtime: ₹14,000 / hr',
          ],
          status: 'AWARDED',
          isRecommended: true,
        },
        {
          id: 'cat-2',
          name: 'Marwar Royal Kitchens',
          rating: 4.9,
          pricePerPlate: 2050,
          formattedPrice: '₹2,050',
          overtimeRate: '₹12,000 / hr (Lowest rate)',
          inclusions: [
            'Palace courtyard live sigdi stations',
            '10 Marwari heritage chaat stalls',
            'Overtime: ₹12,000 / hr (Lowest rate)',
          ],
          status: 'EVALUATION',
        },
        {
          id: 'cat-3',
          name: 'Thar Desert Gourmet',
          rating: 4.7,
          pricePerPlate: 1900,
          formattedPrice: '₹1,900',
          overtimeRate: '₹16,000 / hr',
          inclusions: [
            'Traditional earthenware presentation',
            '8 Regional Rajasthani counters',
            'Overtime: ₹16,000 / hr',
          ],
          status: 'EVALUATION',
        },
      ];
    }

    // Default / Jaipur:
    return [
      {
        id: 'cat-1',
        name: 'Royal Rasoi',
        rating: 4.8,
        pricePerPlate: 1850,
        formattedPrice: '₹1,850',
        overtimeRate: '₹15,000 / hr',
        inclusions: [
          'Silver-plated chinaware included',
          '8 Live Chaat & Sweet Counters',
          'Overtime: ₹15,000 / hr',
        ],
        status: 'EVALUATION',
      },
      {
        id: 'cat-2',
        name: 'Marwar Heritage',
        rating: 5.0,
        pricePerPlate: 2100,
        formattedPrice: '₹2,100',
        overtimeRate: '₹12,000 / hr (Lowest rate)',
        inclusions: [
          'Handcrafted Marwari brassware & stewards',
          '14 Live Dal Baati & Shahi Mithai Stalls',
          'Overtime: ₹12,000 / hr (Lowest rate)',
        ],
        status: 'AWARDED',
        isRecommended: true,
      },
      {
        id: 'cat-3',
        name: 'Rajputana Feasts',
        rating: 4.9,
        pricePerPlate: 1950,
        formattedPrice: '₹1,950',
        overtimeRate: '₹20,000 / hr',
        inclusions: [
          'Traditional bone china presentation',
          '10 Multi-cuisine & Mewari Counters',
          'Overtime: ₹20,000 / hr',
        ],
        status: 'EVALUATION',
      },
    ];
  }, [weddingInfo.city, weddingInfo.guestCount]);

  const recommendedCaterer = useMemo(() => {
    return catererQuotes.find((c) => c.isRecommended) || catererQuotes[0];
  }, [catererQuotes]);

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
                {weddingInfo.code}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {weddingInfo.couple}
            </h1>
            <p className="text-xs text-white/80 flex items-center gap-2 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                {weddingInfo.venue}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                {weddingInfo.startDate}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-300" />
                {weddingInfo.guestCount} Royal Guests
              </span>
            </p>
          </div>

          {/* Quick Module Go-To Links and Countdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/sign/${weddingInfo.code}`)}
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

            {/* Dynamic Countdown Clock Box */}
            <div className="bg-black/25 backdrop-blur-xs border border-white/20 p-3 rounded-lg text-center shrink-0">
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
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Couple Action Items Ribbon (Read-Only Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Dynamic Planning Progress */}
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
              {planningProgress.pct}% <span className="text-xs text-slate-400 font-normal">Complete</span>
            </div>
            <Progress value={planningProgress.pct} className="h-1.5" />
            <div className="text-[11px] text-slate-500 pt-1">
              {planningProgress.subtitle}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Digital Service Agreement */}
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
              <span>{agreementInfo.signedText}</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>Contract Reference</span>
              <span className="font-mono font-semibold text-slate-700">{agreementInfo.refCode}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Payment Schedule */}
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
              {paymentSchedule.headline}{' '}
              <span className="text-xs text-emerald-700 font-semibold">{paymentSchedule.pctLabel}</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>{paymentSchedule.nextLabel}</span>
              <span className="font-mono font-bold text-slate-700">{paymentSchedule.nextDue}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Couple Decision Room: Banquet Catering Quotes */}
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
              Side-by-side comparison of curated caterers for your {weddingInfo.guestCount}-guest royal banquet in {weddingInfo.city}
            </div>
          </div>
          <Badge variant="success" className="text-xs font-bold py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {recommendedCaterer.name} Recommended
          </Badge>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {catererQuotes.map((caterer) => {
              const isRec = !!caterer.isRecommended;
              return (
                <div
                  key={caterer.id}
                  className={`p-3.5 rounded-lg border space-y-2.5 relative ${
                    isRec
                      ? 'border-[#714B67] bg-purple-50/40 ring-1 ring-[#714B67]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {isRec && (
                    <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-[#714B67] text-white uppercase tracking-wider shadow-2xs">
                      Planner Recommended
                    </div>
                  )}

                  <div className={`flex items-center justify-between ${isRec ? 'pt-1' : ''}`}>
                    <span className="font-bold text-xs text-slate-900">{caterer.name}</span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{caterer.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div
                    className={`text-xl font-bold font-mono ${
                      isRec ? 'text-emerald-800' : 'text-[#714B67]'
                    }`}
                  >
                    {caterer.formattedPrice}{' '}
                    <span className="text-xs text-slate-500 font-normal">/ plate</span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    {caterer.inclusions.map((inc, i) => (
                      <div key={i}>• {inc}</div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <Badge
                      variant={isRec ? 'success' : 'secondary'}
                      className="text-[10px]"
                    >
                      {isRec ? 'Awarded Contract' : 'Under Evaluation'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Guest Itinerary Schedule */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
          <CardTitle className="text-sm font-bold text-slate-900">
            Royal Ceremony Itinerary Schedule
          </CardTitle>
          <div className="text-xs text-slate-500">
            Curated timeline for {weddingInfo.couple} &bull; {weddingInfo.venue}
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
                <TableCell className="font-mono font-bold py-2.5">{weddingInfo.startDate} &bull; 11:00 AM</TableCell>
                <TableCell className="font-bold text-slate-900">Royal Mehendi & Welcome Sangeet</TableCell>
                <TableCell>{weddingInfo.venue} Courtyard</TableCell>
                <TableCell>Pastel Royal Florals</TableCell>
                <TableCell className="text-center">
                  <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5">{weddingInfo.startDate} &bull; 19:00 PM</TableCell>
                <TableCell className="font-bold text-slate-900">Sangeet & Musical Night with Dhol Tasha</TableCell>
                <TableCell>{weddingInfo.city} Heritage Open Terrace</TableCell>
                <TableCell>Glitz, Glamour & Heritage Silk</TableCell>
                <TableCell className="text-center">
                  <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5">Day 2 &bull; 10:30 AM</TableCell>
                <TableCell className="font-bold text-slate-900">Sunshine Haldi & Phoolon Ki Holi</TableCell>
                <TableCell>Poolside Marble Pavilion</TableCell>
                <TableCell>Shades of Marigold Yellow</TableCell>
                <TableCell className="text-center">
                  <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5 text-rose-700">Day 2 &bull; 16:45 PM</TableCell>
                <TableCell className="font-bold text-slate-900">Royal Vintage Baraat & Vedic Pheras</TableCell>
                <TableCell>Sunset Mandap @ {weddingInfo.venue}</TableCell>
                <TableCell>Regal Crimson & Raw Silk</TableCell>
                <TableCell className="text-center">
                  <Badge variant="destructive" className="text-[10px]">Main Event</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold py-2.5">{weddingInfo.endDate} &bull; 20:00 PM</TableCell>
                <TableCell className="font-bold text-slate-900">Grand Royal Reception & Gala Dinner</TableCell>
                <TableCell>Grand Ballroom</TableCell>
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
