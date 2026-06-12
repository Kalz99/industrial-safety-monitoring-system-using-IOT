import { create } from 'zustand';
import type { AreaTelemetry } from '../pages/dashboard/components/AreaCard';

export interface ActiveAlertInfo {
  areaId: string;
  areaName: string;
  sourceType: 'machine' | 'environment';
  sensorType: string;
  sensorLabel: string;
  value: number | string;
  unit: string;
  timestamp: string;
  alertId?: string;
  deviceName?: string;
  criticalMetrics?: Array<{ label: string; value: string | number; unit?: string }>;
}

interface AppState {
  selectedAreaId: string | null;
  activeTab: string;
  areasData: AreaTelemetry[];
  activeModalAlert: ActiveAlertInfo | null;
  activePredictionAlert: ActiveAlertInfo | null;
  acknowledgedAlerts: string[];
  user: any | null;
  loadingUser: boolean;
  setSelectedAreaId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setAreasData: (data: AreaTelemetry[]) => void;
  setActiveModalAlert: (alert: ActiveAlertInfo | null) => void;
  setActivePredictionAlert: (alert: ActiveAlertInfo | null) => void;
  setAcknowledgedAlerts: (alerts: string[]) => void;
  setUser: (user: any | null) => void;
  setLoadingUser: (loading: boolean) => void;
}

// Helper to load acknowledged alerts from localStorage
const loadAcknowledgedAlerts = (): string[] => {
  try {
    const saved = localStorage.getItem('acknowledgedAlerts');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load acknowledgedAlerts from localStorage:", e);
    return [];
  }
};

export const useStore = create<AppState>((set) => ({
  selectedAreaId: null,
  activeTab: 'dashboard',
  areasData: [],
  activeModalAlert: null,
  activePredictionAlert: null,
  acknowledgedAlerts: loadAcknowledgedAlerts(),
  user: null,
  loadingUser: true,
  setSelectedAreaId: (id) => set({ selectedAreaId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAreasData: (data) => set({ areasData: data }),
  setActiveModalAlert: (alert) => set({ activeModalAlert: alert }),
  setActivePredictionAlert: (alert) => set({ activePredictionAlert: alert }),
  setAcknowledgedAlerts: (alerts) => {
    try {
      localStorage.setItem('acknowledgedAlerts', JSON.stringify(alerts));
    } catch (e) {
      console.error("Failed to save acknowledgedAlerts to localStorage:", e);
    }
    set({ acknowledgedAlerts: alerts });
  },
  setUser: (user) => set({ user }),
  setLoadingUser: (loading) => set({ loadingUser: loading }),
}));
export default useStore;

