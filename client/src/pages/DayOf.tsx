import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  User, 
  PhoneCall, 
  Flame
} from 'lucide-react';

export const DayOf: React.FC = () => {
  const [incidents] = useState([
    {
      id: 'INC-01',
      title: 'Florist needs extra backup generator for mandap spotlights',
      severity: 'HIGH',
      assignedTo: 'Karan Verma',
      status: 'INVESTIGATING',
      time: '14:20',
    },
    {
      id: 'INC-02',
      title: 'Bride convoy car slowed down by old city bazaar traffic (15 min delay)',
      severity: 'MEDIUM',
      assignedTo: 'Priya Joshi',
      status: 'RESOLVED',
      time: '14:05',
    },
  ]);

  const schedule = [
    { time: '14:00', event: 'Groom Baraat Assembly & Royal Vintage Car Lineup', venue: 'Palace South Gate', owner: 'Karan Verma', status: 'COMPLETED' },
    { time: '15:15', event: 'Grand Varmala (Garland Exchange) over Lake Courtyard', venue: 'Lake Front Terrace', owner: 'Devika Sharma', status: 'IN_PROGRESS' },
    { time: '16:30', event: 'Royal Vedic Pheras & Mangalsutra Ritual', venue: 'Heritage Mandap Hall', owner: 'Priya Joshi', status: 'UPCOMING' },
    { time: '19:30', event: 'Banquet Reception Gala & Family Speeches', venue: 'Grand Durbar Hall', owner: 'Devika Sharma', status: 'UPCOMING' },
  ];

  const vendorCheckins = [
    { vendor: 'Royal Mewar Banquets (Catering)', scheduled: '12:00 PM', actual: '11:45 AM', status: 'ARRIVED_ON_TIME', delay: 0 },
    { vendor: 'Desert Beat Sounds (DJ & Lights)', scheduled: '13:00 PM', actual: '13:40 PM', status: 'RUNNING_LATE', delay: 40, phone: '+91 98290 88776' },
    { vendor: 'Jaipur Floral Wonders (Mandap)', scheduled: '10:00 AM', actual: '09:50 AM', status: 'ARRIVED_ON_TIME', delay: 0 },
    { vendor: 'Heritage Dhol Troupe (Baraat)', scheduled: '13:30 PM', actual: '13:25 PM', status: 'ARRIVED_ON_TIME', delay: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">Day-of Live Schedule & Operations</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Minute-by-minute timeline, vendor arrivals, and real-time field coordination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-neutral-800">Live: Singhania & Mehra Wedding</span>
        </div>
      </div>

      {/* Incidents Bar */}
      <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
            <Flame className="w-4 h-4 text-[#FF385C]" /> Active Incidents
          </div>
          <span className="text-[11px] font-semibold text-rose-600">2 Reported</span>
        </div>

        <div className="space-y-2">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-white p-3 rounded-xl border border-rose-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  inc.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inc.severity}
                </span>
                <span className="font-semibold text-neutral-800">{inc.title}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-neutral-500">Assigned: <strong>{inc.assignedTo}</strong></span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                  inc.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {inc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Minute-by-Minute Schedule */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[#222222]">Minute-by-Minute Run Sheet</h2>
            <span className="text-xs text-neutral-400">Current Time: 15:20 IST</span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-neutral-200">
            {schedule.map((item, idx) => (
              <div key={idx} className="relative flex items-start gap-4 pl-8 text-xs">
                <div className={`absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                  item.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-500' : item.status === 'IN_PROGRESS' ? 'border-[#FF385C] bg-[#FF385C]' : 'border-neutral-300'
                }`}></div>

                <div className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <div className="flex items-center justify-between font-mono font-bold text-neutral-700 mb-1">
                    <span>{item.time}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : item.status === 'IN_PROGRESS' ? 'bg-rose-100 text-[#FF385C] font-bold animate-pulse' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-neutral-900">{item.event}</div>
                  <div className="flex items-center justify-between text-neutral-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral-400" /> {item.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" /> {item.owner}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Vendor Arrival Board */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[#222222]">Vendor Arrival Board</h2>
            <span className="text-xs text-neutral-500">18 Partners</span>
          </div>

          <div className="space-y-3">
            {vendorCheckins.map((v, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-neutral-900">{v.vendor}</div>
                  <div className="text-neutral-500 mt-0.5">
                    Sched: {v.scheduled} &bull; Actual: {v.actual}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {v.status === 'RUNNING_LATE' ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-[#FF385C]">
                        <AlertTriangle className="w-3 h-3" /> {v.delay}m Late
                      </span>
                      {v.phone && (
                        <div className="mt-1">
                          <a href={`tel:${v.phone}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black">
                            <PhoneCall className="w-3 h-3" /> Call Partner
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Arrived & Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
