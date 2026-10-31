import { create } from 'zustand';
import { api } from '../api/client';
import { TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';
import type React from 'react';

export interface WeddingProfit {
  id?: string;
  code: string;
  couple: string;
  venue: string;
  city: string;
  guests: number;
  clientBilled: string;
  clientBilledNum?: number;
  vendorCosts: string;
  vendorCostsNum?: number;
  netProfit: string;
  netProfitNum?: number;
  marginPct: string;
  marginPctNum?: number;
  status: 'High Margin' | 'On Target' | 'Audit Extras';
  packageType?: string;
  leadPlanner: string;
  date: string;
}

export interface CashFlowPeriod {
  period: string;
  milestoneInflows: string;
  vendorPayables: string;
  netCashDelta: string;
  status: 'SURPLUS' | 'DEFICIT';
}

export interface VendorScoreItem {
  id: string;
  vendor: string;
  category: string;
  city: string;
  rating: string;
  onTimeArrivalPct: string;
  eventsDelivered: number;
  avgDelayMins: number;
  reliability: 'High Reliability' | 'Satisfactory' | 'Watchlist';
}

export interface MetricCardItem {
  label?: string;
  title?: string;
  value: string;
  change?: string;
  positive?: boolean;
  isPositive?: boolean;
  sub?: string;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SeasonSummaryResponse {
  success: boolean;
  metrics?: MetricCardItem[];
  weddingProfits?: WeddingProfit[];
  cashFlowForecast?: CashFlowPeriod[];
  vendorScorecard?: VendorScoreItem[];
}

interface AnalyticsState {
  metrics: MetricCardItem[];
  weddingProfits: WeddingProfit[];
  cashFlowForecast: CashFlowPeriod[];
  vendorScorecard: VendorScoreItem[];
  loading: boolean;
  error: string | null;
  lastRefreshed: string;
  page: number;
  pageSize: number;

  setPage: (page: number) => void;
  fetchSeasonSummary: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  metrics: [],
  weddingProfits: [],
  cashFlowForecast: [],
  vendorScorecard: [],
  loading: true,
  error: null,
  lastRefreshed: '',
  page: 1,
  pageSize: 6,

  setPage: (page: number) => set({ page }),

  fetchSeasonSummary: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get<SeasonSummaryResponse>('/api/analytics/season-summary');
      if (res && res.success) {
        const iconMap = [TrendingUp, DollarSign, Calendar, Users];
        const mappedMetrics = (res.metrics || []).map((m, i: number) => ({
          ...m,
          icon: iconMap[i % iconMap.length],
        }));
        set({
          metrics: mappedMetrics,
          weddingProfits: res.weddingProfits || [],
          cashFlowForecast: res.cashFlowForecast || [],
          vendorScorecard: res.vendorScorecard || [],
          lastRefreshed: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics summary';
      console.error('Failed to load season summary from backend:', err);
      set({ loading: false, error: message });
    }
  },
}));
