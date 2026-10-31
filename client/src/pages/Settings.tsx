import { useState } from 'react';
import { 
  Plus, 
  ShieldAlert, 
  Layers
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [categories] = useState([
    {
      category: 'PACKAGE_TYPE',
      label: 'Wedding Package Tiers',
      items: [
        { key: 'FULL_SERVICE', name: 'Full-Service Wedding (Complete planning)', stages: 'Deposit: 20%, Advance: 50%, Final: 30%' },
        { key: 'DAY_OF', name: 'Partial / Day-of Service', stages: 'Deposit: 30%, Advance: 40%, Final: 30%' },
      ],
    },
    {
      category: 'CEREMONY_TYPE',
      label: 'Royal Ceremonies & Sub-Events',
      items: [
        { key: 'MEHENDI', name: 'Mehendi Ceremony', stages: 'Floral & Henna' },
        { key: 'SANGEET', name: 'Sangeet Musical Night', stages: 'DJ, Lights & Stage' },
        { key: 'HALDI', name: 'Auspicious Haldi Ritual', stages: 'Morning setup' },
        { key: 'PHERAS', name: 'Varmala & Royal Pheras', stages: 'Mandap & Vedic' },
        { key: 'RECEPTION', name: 'Grand Royal Reception', stages: 'Banquet & Speeches' },
      ],
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#FF385C] mb-1.5 border border-rose-200">
            <ShieldAlert className="w-3 h-3" />
            Super Admin Controls
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222]">Master System Configurations</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Universal lookup master options avoiding hardcoded enums. Modify package templates, stage payment percentages, and role policies.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF385C] text-white rounded-xl text-xs font-semibold hover:bg-[#E00B41] transition shadow-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Master Option</span>
        </button>
      </div>

      {/* Master Configuration Tables */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.category} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF385C]" />
                <h2 className="font-bold text-base text-[#222222]">{cat.label}</h2>
              </div>
              <span className="text-xs font-mono font-semibold text-neutral-400">{cat.category}</span>
            </div>

            <div className="divide-y divide-neutral-100">
              {cat.items.map((item) => (
                <div key={item.key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-neutral-900">{item.name}</div>
                    <div className="text-neutral-500 font-mono text-[11px]">{item.key}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-neutral-600 font-medium bg-neutral-100 px-2.5 py-1 rounded-lg">
                      {item.stages}
                    </span>
                    <button className="text-[#FF385C] hover:underline font-semibold">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
