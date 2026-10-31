import { useState } from 'react';
import { 
  Check, 
  X, 
  CheckCircle2
} from 'lucide-react';

export const Procurement: React.FC = () => {
  const [selectedWinner, setSelectedWinner] = useState<string | null>('CAT-02');

  const quotes = [
    {
      id: 'CAT-01',
      vendor: 'Royal Mewar Banquets & Catering',
      rating: 4.95,
      city: 'Udaipur',
      pricePerPlate: '₹2,250',
      totalCost400: '₹9,00,000',
      overtimeRate: '₹15,000 / hr',
      menuHighlights: 'Dal Baati Churma, Ker Sangri, Laal Maas, Live Jalebi & Rabri counters, 12 Welcome Drinks',
      inclusions: '140 uniformed banquet staff, copper royal chafing dishes, mineral water jars, waste management',
      status: selectedWinner === 'CAT-01' ? 'AWARDED_WINNER' : selectedWinner ? 'AUTO_REJECTED' : 'PENDING',
    },
    {
      id: 'CAT-02',
      vendor: 'Marwar Gourmet Kitchens',
      rating: 4.88,
      city: 'Jaipur',
      pricePerPlate: '₹2,100',
      totalCost400: '₹8,40,000',
      overtimeRate: '₹12,000 / hr',
      menuHighlights: 'Royal Rajputana Thali, Smoked Chaat Island, Wood-fired Italian pizza bar, 18 Artisanal desserts',
      inclusions: 'Complete glassware, bone china crockery, dedicated bride/groom food butler, welcome detox mocktails',
      status: selectedWinner === 'CAT-02' ? 'AWARDED_WINNER' : selectedWinner ? 'AUTO_REJECTED' : 'PENDING',
    },
    {
      id: 'CAT-03',
      vendor: 'Jaipur Heritage Feast Co.',
      rating: 4.70,
      city: 'Jaipur',
      pricePerPlate: '₹1,950',
      totalCost400: '₹7,80,000',
      overtimeRate: '₹18,000 / hr',
      menuHighlights: 'Traditional Marwari buffet, live tandoor corner, sweet counter with 6 varieties',
      inclusions: 'Standard buffet setup, 90 staff, basic paper napkins and standard cutlery',
      status: selectedWinner === 'CAT-03' ? 'AWARDED_WINNER' : selectedWinner ? 'AUTO_REJECTED' : 'PENDING',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">Vendor Quote Comparison</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Side-by-side caterer comparison by price per plate, menu, and overtime terms.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-neutral-100 rounded-xl text-xs font-medium text-neutral-700">
          RFQ: <strong>Singhania-Mehra Wedding (400 Guests)</strong>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {quotes.map((q) => {
          const isWinner = q.status === 'AWARDED_WINNER';
          const isRejected = q.status === 'AUTO_REJECTED';

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between relative ${
                isWinner 
                  ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                  : isRejected
                  ? 'border-neutral-200 opacity-60 bg-neutral-50/50'
                  : 'border-neutral-200 shadow-sm hover:shadow-md'
              }`}
            >
              {isWinner && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Awarded Vendor
                </div>
              )}

              {isRejected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-400 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                  <X className="w-3 h-3" /> Auto-Closed
                </div>
              )}

              <div className="space-y-4">
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                    <span>{q.id}</span>
                    <span>{q.city} &bull; ★ {q.rating}</span>
                  </div>
                  <h3 className="font-bold text-base text-[#222222] mt-1">{q.vendor}</h3>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="text-xs text-neutral-500 font-medium">Price Per Plate</div>
                  <div className="text-2xl font-bold text-[#FF385C] mt-0.5">{q.pricePerPlate}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Total for 400 guests: <strong className="text-neutral-800">{q.totalCost400}</strong>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-700">Overtime Fee:</span>
                    <span className="text-neutral-600 ml-1.5">{q.overtimeRate}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-neutral-700">Menu Highlights:</span>
                    <p className="text-neutral-600 mt-0.5 leading-relaxed bg-neutral-50/50 p-2 rounded-lg border border-neutral-100">
                      {q.menuHighlights}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-neutral-700">Inclusions:</span>
                    <p className="text-neutral-600 mt-0.5 leading-relaxed">
                      {q.inclusions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                {isWinner ? (
                  <button
                    onClick={() => setSelectedWinner(null)}
                    className="w-full py-2.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Selected Caterer
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedWinner(q.id)}
                    className="w-full py-2.5 bg-neutral-900 text-white font-semibold text-xs rounded-xl hover:bg-black transition"
                  >
                    Select as Winner
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
