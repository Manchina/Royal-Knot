import { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  User, 
  CreditCard
} from 'lucide-react';

export const Tasks: React.FC = () => {
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');

  const tasks = [
    { id: 'TSK-01', title: 'Collect Booking Deposit (20%)', category: 'FINANCE', owner: 'Finance Team', stage: 'DONE', stagePayment: 'Stage 1: Booking Deposit', daysBefore: '90 Days' },
    { id: 'TSK-02', title: 'Lock Palace Venue Contract & Heritage Permits', category: 'VENUE', owner: 'Devika Sharma', stage: 'DONE', daysBefore: '75 Days' },
    { id: 'TSK-03', title: 'Issue Catering RFQ for 400 Guests', category: 'VENDORS', owner: 'Devika Sharma', stage: 'DONE', daysBefore: '60 Days' },
    { id: 'TSK-04', title: 'Award Catering Contract & Sign SLA', category: 'VENDORS', owner: 'Devika Sharma', stage: 'DONE', daysBefore: '50 Days' },
    { id: 'TSK-05', title: 'Collect Pre-Wedding Advance Payment (50%)', category: 'FINANCE', owner: 'Finance Team', stage: 'IN_PROGRESS', stagePayment: 'Stage 2: Advance (1 Mo Before)', daysBefore: '30 Days' },
    { id: 'TSK-06', title: 'Finalize Mehendi Floral Concept & Folk Dancers', category: 'DESIGN', owner: 'Aarav Mehta', stage: 'IN_PROGRESS', daysBefore: '25 Days' },
    { id: 'TSK-07', title: 'Sangeet Stage Lighting Truss & DJ Tech Rider', category: 'DESIGN', owner: 'Karan Verma', stage: 'IN_PROGRESS', daysBefore: '20 Days' },
    { id: 'TSK-08', title: 'Royal Elephant & Drummers Baraat Route Clearance', category: 'PERMITS', owner: 'Karan Verma', stage: 'TO_PLAN', daysBefore: '15 Days' },
    { id: 'TSK-09', title: 'Mandap Structural & Fire Safety Certification', category: 'VENUE', owner: 'Aarav Mehta', stage: 'TO_PLAN', daysBefore: '10 Days' },
    { id: 'TSK-10', title: 'Minute-by-Minute Run Sheet Distribution to Family', category: 'DAY_OF', owner: 'Priya Joshi', stage: 'TO_PLAN', daysBefore: '5 Days' },
    { id: 'TSK-11', title: 'Post-Event Banquet Headcount Audit (+ Extras)', category: 'FINANCE', owner: 'Finance Team', stage: 'TO_PLAN', stagePayment: 'Stage 3: Final Settlement', daysBefore: '+1 Day' },
    { id: 'TSK-12', title: 'Disburse Final Vendor Balance Payments', category: 'FINANCE', owner: 'Finance Team', stage: 'TO_PLAN', daysBefore: '+3 Days' },
  ];

  const filtered = activeStageFilter === 'ALL' ? tasks : tasks.filter((t) => t.stage === activeStageFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">Wedding Checklists & Milestones</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
            Structured task workflows across venue, design, permits, and payment milestones.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF385C] text-white rounded-xl text-xs font-semibold hover:bg-[#E00B41] transition shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Tasks (12 shown / 25 template)' },
          { key: 'TO_PLAN', label: 'To Plan' },
          { key: 'IN_PROGRESS', label: 'In Progress' },
          { key: 'DONE', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStageFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
              activeStageFilter === tab.key
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 text-neutral-500 font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4">Payment Link</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-neutral-900">{t.title}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">{t.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-medium">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      {t.owner}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 font-medium">{t.daysBefore}</td>
                  <td className="py-3.5 px-4">
                    {t.stagePayment ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CreditCard className="w-3 h-3" /> {t.stagePayment}
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">&mdash;</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      t.stage === 'DONE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : t.stage === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {t.stage === 'DONE' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {t.stage.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
