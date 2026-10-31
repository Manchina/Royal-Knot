import React from 'react';
import {
  TrendingUp,
  Briefcase,
  CreditCard,
  HeartHandshake,
  Sparkles,
  Layers,
  Radio,
  Users
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';

export type DashboardViewType = 'executive' | 'planner' | 'coordinator' | 'finance' | 'client';

export interface CoupleOption {
  code: string;
  couple: string;
  city?: string;
  venue?: string;
}

interface PerspectiveSwitcherProps {
  activeView: DashboardViewType;
  onSelect: (view: DashboardViewType) => void;
  isSuperAdmin?: boolean;
  selectedCouple?: string;
  onSelectCouple?: (code: string) => void;
  couplesList?: CoupleOption[];
}

export const PerspectiveSwitcher: React.FC<PerspectiveSwitcherProps> = ({
  activeView,
  onSelect,
  isSuperAdmin = false,
  selectedCouple = 'ALL',
  onSelectCouple,
  couplesList = [],
}) => {
  const views: {
    id: DashboardViewType;
    label: string;
    roleTag: string;
    icon: typeof TrendingUp;
    badge?: string;
    desc: string;
  }[] = [
    {
      id: 'executive',
      label: 'Executive P&L',
      roleTag: 'Founder / CEO',
      icon: TrendingUp,
      desc: 'Season 2026 Margins & Cash Flow',
    },
    {
      id: 'planner',
      label: 'Planner Hub',
      roleTag: 'Lead Planner',
      icon: Briefcase,
      badge: 'Active',
      desc: 'Enquiries, Tasks & 25 Weddings',
    },
    {
      id: 'coordinator',
      label: 'Day-Of Live Ops',
      roleTag: 'Field Coordinator',
      icon: Radio,
      badge: 'Live',
      desc: 'Minute Run-Sheet & Arrivals',
    },
    {
      id: 'finance',
      label: 'Finance & Billing',
      roleTag: 'Finance Head',
      icon: CreditCard,
      desc: 'Milestones & Extra Plates Audit',
    },
    {
      id: 'client',
      label: 'Couple Portal',
      roleTag: 'Bride & Groom',
      icon: HeartHandshake,
      desc: 'Caterer Decision Room & Itinerary',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs space-y-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#714B67]/10 text-[#714B67]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                Executive Perspective Switcher
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-[#714B67] border border-purple-200">
                <Sparkles className="w-3 h-3 text-[#714B67]" />
                {isSuperAdmin ? 'Super Admin Mode' : 'Founder Preview'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              1-click preview across all 5 operational role dashboards without signing out
            </p>
          </div>
        </div>

        {/* Segmented Perspective Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          {views.map((v) => {
            const Icon = v.icon;
            const isSelected = activeView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={v.desc}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-[#714B67]' : 'text-slate-500'
                  }`}
                />
                <span className="tracking-tight">{v.label}</span>
                {v.badge && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0 rounded font-bold ${
                      v.badge === 'Live'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {v.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Super Admin Couple Filter Ribbon */}
      {(isSuperAdmin || couplesList.length > 0) && onSelectCouple && (
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60 p-2 rounded-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#714B67] text-white">
              <Users className="w-3 h-3" />
              Super Admin Couple Filter
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Filter dashboard view by specific wedding couple across all metrics & tables:
            </span>
          </div>

          <div className="w-full sm:w-72">
            <Select value={selectedCouple} onValueChange={onSelectCouple}>
              <SelectTrigger className="h-8 text-xs bg-white border-slate-300 font-medium">
                <SelectValue placeholder="All 25 Royal Destination Weddings" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="ALL">
                  All Royal Destination Weddings (25 Active)
                </SelectItem>
                {couplesList.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}: {c.couple} {c.city ? `(${c.city})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
