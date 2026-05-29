import { create } from 'zustand';
import type { AreaTelemetry } from '../pages/dashboard/components/AreaCard';

interface AppState {
  selectedAreaId: string | null;
  activeTab: string;
  areasData: AreaTelemetry[];
  setSelectedAreaId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setAreasData: (data: AreaTelemetry[]) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedAreaId: null,
  activeTab: 'dashboard',
  areasData: [],
  setSelectedAreaId: (id) => set({ selectedAreaId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAreasData: (data) => set({ areasData: data }),
}));
export default useStore;
