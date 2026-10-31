import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  Loader2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { useWeddingStore } from '../store/useWeddingStore';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui';

interface WeddingEvent {
  id: string;
  ceremonyType: string;
  eventName: string;
  venueHall?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
}

interface WeddingRfq {
  rfqId: string;
  category: string;
  status: string;
  description?: string;
  quoteId?: string;
  quoteStatus?: string;
  baseCost?: string;
  vendorId?: string;
  vendorName?: string;
  vendorCity?: string;
  vendorRating?: string;
}

interface WeddingDetailData {
  id: string;
  code: string;
  couple: string;
  brideName: string;
  groomName: string;
  clientPhone: string;
  clientEmail: string;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  guestCount: number;
  actualBanquetHeadcount?: number;
  budget: string;
  agencyFee: string;
  packageType: string;
  theme?: string;
  status: string;
  notes?: string;
  coordinator?: string;
  coordinatorPhone?: string;
  events?: WeddingEvent[];
  rfqs?: WeddingRfq[];
}


export const WeddingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedWeddingId } = useWeddingStore();

  const [wedding, setWedding] = useState<WeddingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dossier');

  const fetchWeddingDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: WeddingDetailData }>(`/api/weddings/${id}`);
      if (res?.success && res.data) {
        setWedding(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch wedding details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeddingDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-2xs space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#714B67] mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading wedding project dossier...</p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Calendar className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Wedding Project Not Found</h2>
          <p className="text-xs text-slate-500">The wedding reference code or ID does not exist in the database.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/weddings')}
          className="text-xs h-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Weddings Portfolio
        </Button>
      </div>
    );
  }

  const budgetNum = Number(wedding.budget) || 25000000;
  const budgetFormatted = `₹${(budgetNum / 10000000).toFixed(2)} Cr`;
  const agencyFeeNum = Number(wedding.agencyFee) || (budgetNum * 0.15);
  const agencyFeeFormatted = `₹${(agencyFeeNum / 100000).toFixed(2)} Lakh`;

  // Sourcing categorization
  const catererRfq = wedding.rfqs?.find((r) => r.category === 'CATERER');
  const djRfq = wedding.rfqs?.find((r) => r.category === 'DJ');
  const decorRfq = wedding.rfqs?.find((r) => r.category === 'DECORATOR');

  const awardedCount = [catererRfq, djRfq, decorRfq].filter(
    (r) => r?.status === 'AWARDED' || r?.quoteStatus === 'ACCEPTED'
  ).length;

  return (
    <div className="space-y-4">
      {/* 1. Odoo Breadcrumbs & Control Bar */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/weddings')}
            className="h-8 text-xs text-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Weddings / Projects
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-xs font-bold text-[#714B67]">
                {wedding.code}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {wedding.couple}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedWeddingId(wedding.id);
              navigate('/procurement');
            }}
            className="h-8 text-xs bg-[#714B67] hover:bg-[#5b3c53] text-white font-semibold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            Source Vendors
          </Button>
        </div>
      </div>

      {/* 3. Hero Summary Card */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20">
              {wedding.code}
            </span>
            <Badge variant="outline" className="text-[10px] py-0 border-slate-300 text-slate-700 font-semibold">
              {wedding.status}
            </Badge>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {wedding.city} • {wedding.venue}
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {wedding.couple}
          </h2>

          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(wedding.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {wedding.endDate && ` – ${new Date(wedding.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <strong>{wedding.guestCount}</strong> Guests Confirmed
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              {wedding.theme || 'Palace Royal Heritage'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Budget</span>
            <div className="text-sm font-bold text-slate-900 font-mono">{budgetFormatted}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agency Fee (15%)</span>
            <div className="text-sm font-bold text-[#714B67] font-mono">{agencyFeeFormatted}</div>
          </div>

          <div className="space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead Planner</span>
            <div className="text-xs font-semibold text-slate-800">{wedding.coordinator || 'Karan Verma'}</div>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Content Dossier */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-slate-200 px-3 pt-1">
            <TabsList className="h-9 bg-transparent border-0 p-0 space-x-2">
              <TabsTrigger
                value="dossier"
                className="text-xs font-bold border-b-2 border-transparent data-[state=active]:border-[#714B67] data-[state=active]:text-[#714B67] rounded-none px-3"
              >
                Project & Client Dossier
              </TabsTrigger>
              <TabsTrigger
                value="procurement"
                className="text-xs font-bold border-b-2 border-transparent data-[state=active]:border-[#714B67] data-[state=active]:text-[#714B67] rounded-none px-3"
              >
                Vendor Sourcing ({awardedCount}/3 Awarded)
              </TabsTrigger>
              <TabsTrigger
                value="ceremonies"
                className="text-xs font-bold border-b-2 border-transparent data-[state=active]:border-[#714B67] data-[state=active]:text-[#714B67] rounded-none px-3"
              >
                Ceremonies & Timeline ({wedding.events?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="text-xs font-bold border-b-2 border-transparent data-[state=active]:border-[#714B67] data-[state=active]:text-[#714B67] rounded-none px-3"
              >
                Financials & Settlement
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Project & Client Dossier */}
          <TabsContent value="dossier" className="p-5 m-0 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="border border-slate-200 rounded shadow-2xs">
                <CardHeader className="p-3.5 border-b border-slate-100 bg-slate-50/70">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#714B67]" />
                    Client & Couple Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Bride's Name</span>
                      <strong className="text-slate-800">{wedding.brideName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Groom's Name</span>
                      <strong className="text-slate-800">{wedding.groomName}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{wedding.clientPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{wedding.clientEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Residence / Destination: {wedding.city}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 rounded shadow-2xs">
                <CardHeader className="p-3.5 border-b border-slate-100 bg-slate-50/70">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#714B67]" />
                    Wedding Project Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Package Tier</span>
                      <strong className="text-slate-800">{wedding.packageType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Primary Venue</span>
                      <strong className="text-slate-800">{wedding.venue}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Estimated Headcount</span>
                      <strong className="text-slate-800">{wedding.guestCount} Guests</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Lead Coordinator</span>
                      <strong className="text-slate-800">{wedding.coordinator || 'Assigned Planner'}</strong>
                    </div>
                  </div>

                  {wedding.notes && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block text-[11px] mb-1">Dossier Notes</span>
                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded text-[11px] leading-relaxed">
                        {wedding.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: Vendor Sourcing (Scene 2) */}
          <TabsContent value="procurement" className="p-5 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Vendor Shortlists & RFC Status</h3>
                <p className="text-xs text-slate-500">Live breakdown of curated vendors for catering, DJ, and decor.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedWeddingId(wedding.id);
                  navigate('/procurement');
                }}
                className="text-xs h-8 border-slate-300 font-semibold"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
                Open Procurement Engine
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { title: 'Royal Catering & Banquets', category: 'CATERER', rfq: catererRfq },
                { title: 'DJ & Sound Production', category: 'DJ', rfq: djRfq },
                { title: 'Palace Mandap & Floral Decor', category: 'DECORATOR', rfq: decorRfq },
              ].map(({ title, category, rfq }) => {
                const isAwarded = rfq?.status === 'AWARDED' || rfq?.quoteStatus === 'ACCEPTED';

                return (
                  <Card key={category} className="border border-slate-200 rounded shadow-2xs bg-white">
                    <CardHeader className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <CardTitle className="text-xs font-bold text-slate-900">{title}</CardTitle>
                      {isAwarded ? (
                        <Badge variant="success" className="text-[10px] py-0">Awarded ✓</Badge>
                      ) : rfq ? (
                        <Badge variant="secondary" className="text-[10px] py-0 text-amber-800 bg-amber-50">In Review</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 text-slate-400">Not Assigned</Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 text-xs">
                      {isAwarded ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{rfq?.vendorName || 'Awarded Vendor'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {rfq?.vendorCity} • Rating: {rfq?.vendorRating || '4.90'} ★
                          </div>
                          {rfq?.baseCost && (
                            <div className="text-xs font-mono font-bold text-slate-800 pt-1">
                              Contract: ₹{Number(rfq.baseCost).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          {rfq ? 'Shortlisted candidate options assigned for team review.' : 'No vendors currently assigned.'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: Ceremonies & Timeline */}
          <TabsContent value="ceremonies" className="p-5 m-0 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Sub-Ceremonies & Event Timeline</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedWeddingId(wedding.id);
                  navigate('/day-of');
                }}
                className="text-xs h-8 border-slate-300 font-semibold text-slate-700"
              >
                <Clock className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
                View Full Run Sheet
              </Button>
            </div>

            {wedding.events && wedding.events.length > 0 ? (
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Ceremony</th>
                      <th className="py-2.5 px-3 text-left">Venue Hall</th>
                      <th className="py-2.5 px-3 text-left">Date</th>
                      <th className="py-2.5 px-3 text-left">Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wedding.events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-semibold text-slate-800">{evt.eventName}</td>
                        <td className="py-2 px-3 text-slate-600">{evt.venueHall || wedding.venue}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{evt.eventDate}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{evt.startTime} - {evt.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded p-8 text-center text-xs text-slate-400">
                Ceremonies timeline and sub-events will populate as event milestones are scheduled.
              </div>
            )}
          </TabsContent>

          {/* TAB 4: Financials & Settlement */}
          <TabsContent value="billing" className="p-5 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Project Financials & Settlement Dossier</h3>
                <p className="text-xs text-slate-500">Contracted budgets, agency margins, and audit settlements.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/billing/${wedding.code}`)}
                className="text-xs h-8 border-slate-300 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1 text-[#714B67]" />
                Open Full Billing Ledger
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-slate-200 rounded p-3.5 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Gross Budget</span>
                <span className="text-lg font-bold font-mono text-slate-900">{budgetFormatted}</span>
              </div>
              <div className="border border-slate-200 rounded p-3.5 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Agency Fee (15%)</span>
                <span className="text-lg font-bold font-mono text-[#714B67]">{agencyFeeFormatted}</span>
              </div>
              <div className="border border-slate-200 rounded p-3.5 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Settlement Stage</span>
                <span className="text-sm font-bold text-emerald-800 flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Contract Verified
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
