
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/useAuthStore';
import { api } from '../api/client';
import { type WeddingSummary } from '../store/useWeddingStore';
import {
  PerspectiveSwitcher,
  ExecutiveDashboard,
  PlannerDashboard,
  CoordinatorDashboard,
  FinanceDashboard,
  ClientPortalView,
  type DashboardViewType,
  type CoupleOption,
} from '../components/dashboards';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const userRole: UserRole = user?.role || 'FOUNDER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isExecutive = userRole === 'FOUNDER' || isSuperAdmin;

  // State to hold couples from database for Super Admin filter
  const [couplesList, setCouplesList] = useState<CoupleOption[]>([]);

  // Fetch real list of destination weddings
  useEffect(() => {
    const fetchCouples = async () => {
      try {
        const res = await api.get<{ success: boolean; data: WeddingSummary[] }>('/api/weddings');
        if (res?.success && Array.isArray(res.data)) {
          const formatted: CoupleOption[] = res.data.map((w: WeddingSummary) => ({
            code: w.code,
            couple: w.couple || `${w.brideName || 'Bride'} & ${w.groomName || 'Groom'}`,
            city: w.city,
            venue: w.venue,
          }));
          setCouplesList(formatted);
        }
      } catch (err) {
        console.warn('Could not load couples list for dashboard perspective filter:', err);
      }
    };

    fetchCouples();
  }, []);

  // Resolve default view for each role
  const roleDefaultView = useMemo<DashboardViewType>(() => {
    switch (userRole) {
      case 'FOUNDER':
      case 'SUPER_ADMIN':
        return 'executive';
      case 'LEAD_PLANNER':
        return 'planner';
      case 'COORDINATOR':
        return 'coordinator';
      case 'FINANCE_MANAGER':
        return 'finance';
      case 'CLIENT':
        return 'client';
      default:
        return 'executive';
    }
  }, [userRole]);

  // Read view and couple from URL search params
  const rawViewParam = searchParams.get('view') as DashboardViewType | null;
  const validViews: DashboardViewType[] = ['executive', 'planner', 'coordinator', 'finance', 'client'];

  const activeView: DashboardViewType = useMemo(() => {
    if (rawViewParam && validViews.includes(rawViewParam)) {
      return rawViewParam;
    }
    return roleDefaultView;
  }, [rawViewParam, roleDefaultView]);

  const selectedCouple = searchParams.get('couple') || 'ALL';

  // Switch perspective and update URL query param
  const handleSelectPerspective = (view: DashboardViewType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', view);
    setSearchParams(newParams);
  };

  // Switch selected couple for Super Admin filter
  const handleSelectCouple = (code: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (code === 'ALL') {
      newParams.delete('couple');
    } else {
      newParams.set('couple', code);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-4">
      {/* Perspective Switcher Toolbar (Visible to Founder, Super Admin, or if a view param is in URL) */}
      {(isExecutive || searchParams.has('view')) && (
        <PerspectiveSwitcher
          activeView={activeView}
          onSelect={handleSelectPerspective}
          isSuperAdmin={isSuperAdmin}
          selectedCouple={selectedCouple}
          onSelectCouple={handleSelectCouple}
          couplesList={couplesList}
        />
      )}

      {/* Render the Active Persona Dashboard */}
      {activeView === 'executive' && (
        <ExecutiveDashboard selectedCouple={selectedCouple} />
      )}
      {activeView === 'planner' && (
        <PlannerDashboard selectedCouple={selectedCouple} />
      )}
      {activeView === 'coordinator' && (
        <CoordinatorDashboard selectedCouple={selectedCouple} />
      )}
      {activeView === 'finance' && (
        <FinanceDashboard selectedCouple={selectedCouple} />
      )}
      {activeView === 'client' && (
        <ClientPortalView selectedCouple={selectedCouple} couplesList={couplesList} />
      )}
    </div>
  );
};
