import React from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Star,
  Users
} from 'lucide-react';
export const Dashboard: React.FC = () => {

  const metrics = [
    {
      label: 'Season Net Profit Margin',
      value: '₹3.85 Cr',
      change: '+18.4% vs 2025',
      positive: true,
      sub: 'Across 25 luxury weddings',
      icon: TrendingUp,
    },
    {
      label: 'Contracted Client Revenue',
      value: '₹14.20 Cr',
      change: '+22.1%',
      positive: true,
      sub: 'Packages + Commission',
      icon: DollarSign,
    },
    {
      label: 'Pending Inflows (Next 30 Days)',
      value: '₹2.45 Cr',
      change: '5 Stage Advances',
      positive: true,
      sub: 'Due from couples',
      icon: Calendar,
    },
    {
      label: 'Vendor Disbursements Due',
      value: '₹1.15 Cr',
      change: '18 Vendor Bills',
      positive: false,
      sub: 'Reconciled & approved',
      icon: Users,
    },
  ];

  const weddingProfits = [
    {
      code: 'RW-2026-001',
      couple: 'Singhania & Mehra',
      venue: 'City Palace, Udaipur',
      guests: 450,
      clientBilled: '₹75,00,000',
      vendorCosts: '₹48,20,000',
      netProfit: '₹26,80,000',
      marginPct: '35.7%',
      status: 'High Margin',
    },
    {
      code: 'RW-2026-002',
      couple: 'Oberoi & Rathore',
      venue: 'Rambagh Palace, Jaipur',
      guests: 520,
      clientBilled: '₹92,00,000',
      vendorCosts: '₹64,50,000',
      netProfit: '₹27,50,000',
      marginPct: '29.8%',
      status: 'On Target',
    },
    {
      code: 'RW-2026-003',
      couple: 'Kapoor & Chauhan',
      venue: 'Oberoi Rajvilas, Jaipur',
      guests: 380,
      clientBilled: '₹55,00,000',
      vendorCosts: '₹39,80,000',
      netProfit: '₹15,20,000',
      marginPct: '27.6%',
      status: 'On Target',
    },
    {
      code: 'RW-2026-004',
      couple: 'Bansal & Agarwal',
      venue: 'Taj Lake Palace, Udaipur',
      guests: 410,
      clientBilled: '₹68,00,000',
      vendorCosts: '₹52,10,000',
      netProfit: '₹15,90,000',
      marginPct: '23.3%',
      status: 'Audit Extras',
    },
  ];

  const vendorScorecard = [
    { name: 'Royal Mewar Banquets', category: 'Catering', weddings: 8, onTimeScore: '98%', rating: 4.95 },
    { name: 'Jaipur Floral Wonders', category: 'Decor & Mandap', weddings: 12, onTimeScore: '92%', rating: 4.88 },
    { name: 'Desert Beat Sounds', category: 'DJ & Production', weddings: 9, onTimeScore: '85%', rating: 4.70 },
    { name: 'Heritage Dhol Troupe', category: 'Drummers', weddings: 14, onTimeScore: '99%', rating: 4.98 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Founder View */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">
            Season 2026 Executive Performance
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Net margins, cash flow, and vendor delivery benchmarks across 25 weddings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition shadow-sm">
            Export Season Report
          </button>
        </div>
      </div>

      {/* Metric Cards (Airbnb Grid Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-neutral-500">{m.label}</span>
                <div className="p-2 rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#222222] tracking-tight">{m.value}</div>
              <div className="flex items-center gap-1.5 text-xs mt-2">
                <span className={`font-semibold flex items-center ${m.positive ? 'text-emerald-600' : 'text-neutral-600'}`}>
                  {m.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {m.change}
                </span>
                <span className="text-neutral-400">&bull;</span>
                <span className="text-neutral-500">{m.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wedding-by-Wedding Profitability Matrix */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#222222]">Wedding Profitability Matrix</h2>
            <p className="text-xs text-neutral-500">Net profit breakdown per destination wedding: Revenue minus Vendor Bills & Extras</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-neutral-100 rounded-full text-neutral-700">
            25 Weddings in Portfolio
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 text-neutral-500 font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-3 px-4">Code / Couple</th>
                <th className="py-3 px-4">Destination & Venue</th>
                <th className="py-3 px-4">Guests</th>
                <th className="py-3 px-4">Client Invoiced</th>
                <th className="py-3 px-4">Vendor Bills</th>
                <th className="py-3 px-4">Net Profit</th>
                <th className="py-3 px-4">Margin %</th>
                <th className="py-3 px-4">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {weddingProfits.map((w) => (
                <tr key={w.code} className="hover:bg-neutral-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-neutral-900">{w.couple}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">{w.code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 font-medium">{w.venue}</td>
                  <td className="py-3.5 px-4 text-neutral-800 font-medium">{w.guests}</td>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900">{w.clientBilled}</td>
                  <td className="py-3.5 px-4 text-neutral-600">{w.vendorCosts}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">{w.netProfit}</td>
                  <td className="py-3.5 px-4 font-semibold text-neutral-800">{w.marginPct}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${w.status === 'High Margin'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : w.status === 'On Target'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                      {w.status === 'Audit Extras' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Delivery Scorecard */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#222222]">Vendor Quality & Reliability Scorecard</h2>
          <p className="text-xs text-neutral-500">Tracking punctuality and service quality across preferred Jaipur & Udaipur partners</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendorScorecard.map((v, i) => (
            <div key={i} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase">{v.category}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {v.rating}
                  </div>
                </div>
                <div className="font-bold text-sm text-[#222222]">{v.name}</div>
                <div className="text-xs text-neutral-500 mt-1">{v.weddings} Weddings Served</div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-xs">
                <span className="text-neutral-500">On-Time Arrival:</span>
                <span className="font-bold text-emerald-600">{v.onTimeScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
