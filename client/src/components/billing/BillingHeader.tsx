import React from 'react';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Lock,
  MapPin,
  Calendar,
  Users,
  ShieldCheck
} from 'lucide-react';
import { Button, Badge } from '../ui';
import type { ProjectFinancials } from './types';
import type { WeddingSummary } from '../../store/useWeddingStore';

interface BillingHeaderProps {
  project: ProjectFinancials | null;
  storeWedding?: WeddingSummary | null;
  onRefresh: () => void;
  onOpenExtraModal: () => void;
  onOpenBillModal: () => void;
  onOpenFinaliseModal: () => void;
  onBack: () => void;
}

export const BillingHeader: React.FC<BillingHeaderProps> = ({
  project,
  storeWedding,
  onOpenExtraModal,
  onOpenBillModal,
  onOpenFinaliseModal,
  onBack,
}) => {
  const isFinalised = project?.isFinalised || project?.status === 'FINALISED_SETTLED';

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'LIVE_BIG_DAY':
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Live Big Day
          </Badge>
        );
      case 'IN_PLANNING':
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Planning
          </Badge>
        );
      case 'BOOKED':
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Booked
          </Badge>
        );
      case 'FINALISED_SETTLED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Finalised & Settled
          </Badge>
        );
      case 'FINALISED':
        return (
          <Badge className="bg-teal-50 text-teal-700 border border-teal-200 gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Audit Complete
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600">
            {status || 'ACTIVE'}
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
      {/* Left: Back Arrow & Project Identity */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
          title="Back to Billing Ledger"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {project?.couple || storeWedding?.couple || 'Wedding Commercial Ledger'}
            </h1>
            <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {project?.code || 'RW-2026-001'}
            </span>
            {renderStatusBadge(project?.status)}
          </div>

          <p className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {project?.city} • {project?.venue}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {project?.startDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {project?.guestCount} Guests
            </span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenExtraModal}
          className="text-xs font-semibold border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100/50 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-amber-700" />
          Add Extra Charge
        </Button>

        <Button
          size="sm"
          onClick={onOpenBillModal}
          className="bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Vendor Bill
        </Button>

        {!isFinalised ? (
          <Button
            size="sm"
            onClick={onOpenFinaliseModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Finalise & Settle
          </Button>
        ) : (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 py-1.5 px-3 gap-1.5 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            Ledger Locked & Settled
          </Badge>
        )}
      </div>
    </div>
  );
};
