import { create } from 'zustand';

export interface RunSheetItem {
  id: string;
  weddingId: string;
  timeSlot: string;
  event: string;
  venue: string;
  owner: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface VendorCheckinItem {
  id: string;
  weddingId: string;
  vendorId?: string;
  vendor: string;
  category: string;
  scheduled: string;
  actual: string;
  status: 'SCHEDULED' | 'ARRIVED_ON_TIME' | 'RUNNING_LATE';
  delay: number;
  remarks?: string;
}

export interface IncidentItem {
  id: string;
  weddingId: string;
  weddingCode?: string;
  weddingCouple?: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'INVESTIGATING' | 'RESOLVED';
  reportedAt: string;
  resolvedAt?: string;
  assignee: string;
}

interface DayOfState {
  selectedWeddingId: string;
  activeTab: 'run-sheet' | 'vendor-arrivals';
  schedulePage: number;
  vendorPage: number;
  pageSize: number;

  // Modals
  incidentModalOpen: boolean;
  scheduleModalOpen: boolean;

  // Setters
  setSelectedWeddingId: (id: string) => void;
  setActiveTab: (tab: 'run-sheet' | 'vendor-arrivals') => void;
  setSchedulePage: (page: number) => void;
  setVendorPage: (page: number) => void;
  setIncidentModalOpen: (open: boolean) => void;
  setScheduleModalOpen: (open: boolean) => void;
}

export const useDayOfStore = create<DayOfState>((set) => ({
  selectedWeddingId: '',
  activeTab: 'run-sheet',
  schedulePage: 1,
  vendorPage: 1,
  pageSize: 6,

  incidentModalOpen: false,
  scheduleModalOpen: false,

  setSelectedWeddingId: (id: string) => set({ selectedWeddingId: id, schedulePage: 1, vendorPage: 1 }),
  setActiveTab: (tab: 'run-sheet' | 'vendor-arrivals') => set({ activeTab: tab }),
  setSchedulePage: (page: number) => set({ schedulePage: page }),
  setVendorPage: (page: number) => set({ vendorPage: page }),
  setIncidentModalOpen: (open: boolean) => set({ incidentModalOpen: open }),
  setScheduleModalOpen: (open: boolean) => set({ scheduleModalOpen: open }),
}));
