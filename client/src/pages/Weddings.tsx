import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ChevronRight,
  Filter
} from 'lucide-react';

export const Weddings: React.FC = () => {
  const [filterCity, setFilterCity] = useState<string>('ALL');

  const weddings = [
    {
      id: 'RW-2026-001',
      couple: 'Aanya Singhania & Raghav Mehra',
      dates: 'Nov 14 - 16, 2026',
      city: 'Udaipur',
      venue: 'City Palace Complex & Jagmandir Island',
      guests: 450,
      package: 'Full-Service Planning',
      theme: 'Royal Heritage & Mewar Regal',
      budget: '₹1.85 Cr',
      stage: 'Tasting & Decor Lock',
      coordinator: 'Devika Sharma',
      progress: 68,
    },
    {
      id: 'RW-2026-002',
      couple: 'Pooja Oberoi & Devendra Rathore',
      dates: 'Dec 02 - 04, 2026',
      city: 'Jaipur',
      venue: 'Rambagh Palace & Jaigarh Fort',
      guests: 520,
      package: 'Full-Service Planning',
      theme: 'Rajputana Elegance & Marwar Gold',
      budget: '₹2.40 Cr',
      stage: 'Vendor Quote RFQ Finalization',
      coordinator: 'Karan Verma',
      progress: 45,
    },
    {
      id: 'RW-2026-003',
      couple: 'Ishita Kapoor & Vikram Chauhan',
      dates: 'Dec 18 - 20, 2026',
      city: 'Jaipur',
      venue: 'Fairmont & Nahargarh Haveli',
      guests: 380,
      package: 'Partial / Day-of Service',
      theme: 'Desert Fort Chic',
      budget: '₹95 Lakh',
      stage: 'Minute-by-Minute Run Sheet Cueing',
      coordinator: 'Priya Joshi',
      progress: 82,
    },
    {
      id: 'RW-2026-004',
      couple: 'Ananya Bansal & Rohan Agarwal',
      dates: 'Jan 08 - 10, 2027',
      city: 'Udaipur',
      venue: 'The Oberoi Udaivilas & Lake Pichola',
      guests: 400,
      package: 'Full-Service Planning',
      theme: 'Lake Palace Chic & Candlelight',
      budget: '₹2.10 Cr',
      stage: 'Initial Consultation & Agreement Signed',
      coordinator: 'Devika Sharma',
      progress: 25,
    },
  ];

  const filtered = filterCity === 'ALL' ? weddings : weddings.filter((w) => w.city === filterCity);

  return (
    <div className="space-y-6">
      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">Weddings Portfolio</h1>
          <p className="text-xs md:text-sm text-neutral-500">25 Destination luxury weddings managed across Jaipur & Udaipur</p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF385C] text-white rounded-xl text-xs font-semibold hover:bg-[#E00B41] transition shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>New Wedding Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by couple, code, or venue..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'Jaipur', 'Udaipur'].map((city) => (
            <button
              key={city}
              onClick={() => setFilterCity(city)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filterCity === city
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {city === 'ALL' ? 'All Locations' : city}
            </button>
          ))}
        </div>
      </div>

      {/* Wedding Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[11px] font-mono font-semibold text-neutral-400">{w.id}</span>
                  <h3 className="font-bold text-base text-[#222222]">{w.couple}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {w.package}
                </span>
              </div>

              <div className="space-y-1.5 mt-3 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />
                  <span className="font-medium text-neutral-800">{w.venue}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{w.dates}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{w.guests} Guests</span>
                  </div>
                </div>
              </div>

              {/* Progress and Current Stage */}
              <div className="mt-4 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-500 font-medium">Stage: {w.stage}</span>
                  <span className="font-bold text-neutral-800">{w.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${w.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Lead Planner: <strong className="text-neutral-700">{w.coordinator}</strong>
              </span>
              <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF385C] hover:underline">
                View Workspace <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
