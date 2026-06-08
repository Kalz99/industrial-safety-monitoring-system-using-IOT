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
}

interface AppState {
  selectedAreaId: string | null;
  activeTab: string;
  areasData: AreaTelemetry[];
  activeModalAlert: ActiveAlertInfo | null;
  acknowledgedAlerts: string[];
  user: any | null;
  loadingUser: boolean;
  setSelectedAreaId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setAreasData: (data: AreaTelemetry[]) => void;
  setActiveModalAlert: (alert: ActiveAlertInfo | null) => void;
  setAcknowledgedAlerts: (alerts: string[]) => void;
  setUser: (user: any | null) => void;
  setLoadingUser: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedAreaId: null,
  activeTab: 'dashboard',
  areasData: [],
  activeModalAlert: null,
  acknowledgedAlerts: [],
  user: null,
  loadingUser: true,
  setSelectedAreaId: (id) => set({ selectedAreaId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAreasData: (data) => set({ areasData: data }),
  setActiveModalAlert: (alert) => set({ activeModalAlert: alert }),
  setAcknowledgedAlerts: (alerts) => set({ acknowledgedAlerts: alerts }),
  setUser: (user) => set({ user }),
  setLoadingUser: (loading) => set({ loadingUser: loading }),
}));
export default useStore;

