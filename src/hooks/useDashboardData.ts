import { useEffect, useMemo } from 'react';
import type { AreaTelemetry } from '../pages/dashboard/components/AreaCard';
import { DashboardApiService } from '../services/dashboardApi';
import { useStore } from './useStore';

const initialAreasData: AreaTelemetry[] = [
  {
    id: 'prod-line-1',
    name: 'Production Line 1',
    status: 'critical',
    machineHealth: {
      vibration: { value: 3.4, unit: 'g', status: 'normal' },
      current: { value: 28.5, unit: 'A', status: 'normal' },
      temperature: { value: 68.0, unit: '°C', status: 'normal' }
    },
    environment: {
      smoke: { value: 650, unit: 'ppm', status: 'critical' },
      flame: { value: 'Detected', status: 'critical' },
      temperature: { value: 45.0, unit: '°C', status: 'critical' }
    }
  },
  {
    id: 'boiler-room',
    name: 'Boiler Room Sector',
    status: 'critical',
    machineHealth: {
      vibration: { value: 5.8, unit: 'g', status: 'critical' },
      current: { value: 45.2, unit: 'A', status: 'normal' },
      temperature: { value: 82.5, unit: '°C', status: 'critical' }
    },
    environment: {
      smoke: { value: 120, unit: 'ppm', status: 'normal' },
      flame: { value: 'None', status: 'normal' },
      temperature: { value: 34.0, unit: '°C', status: 'normal' }
    }
  },
  {
    id: 'storage-a',
    name: 'Storage Area A',
    status: 'normal',
    machineHealth: {
      vibration: { value: 1.1, unit: 'g', status: 'normal' },
      current: { value: 8.4, unit: 'A', status: 'normal' },
      temperature: { value: 35.2, unit: '°C', status: 'normal' }
    },
    environment: {
      smoke: { value: 42, unit: 'ppm', status: 'normal' },
      flame: { value: 'None', status: 'normal' },
      temperature: { value: 22.4, unit: '°C', status: 'normal' }
    }
  },
  {
    id: 'assembly-hall',
    name: 'Main Assembly Hall',
    status: 'normal',
    machineHealth: {
      vibration: { value: 1.8, unit: 'g', status: 'normal' },
      current: { value: 14.2, unit: 'A', status: 'normal' },
      temperature: { value: 42.1, unit: '°C', status: 'normal' }
    },
    environment: {
      smoke: { value: 55, unit: 'ppm', status: 'normal' },
      flame: { value: 'None', status: 'normal' },
      temperature: { value: 24.1, unit: '°C', status: 'normal' }
    }
  }
];

export const useDashboardData = () => {
  const areasData = useStore((state) => state.areasData);
  const setAreasData = useStore((state) => state.setAreasData);

  // Seed database and subscribe to real-time RTDB updates directly
  useEffect(() => {
    DashboardApiService.seedInitialSectors(initialAreasData).then(() => {
      const unsubscribe = DashboardApiService.subscribeToSectors((updatedSectors) => {
        setAreasData(updatedSectors);
      });
      return unsubscribe;
    });
  }, [setAreasData]);

  // Compute live aggregates dynamically
  const kpiStats = useMemo(() => {
    const alertCount = areasData.filter(a => a.status !== 'normal').length;
    const healthyMachines = areasData.filter(a => a.machineHealth.vibration.status === 'normal' && a.machineHealth.temperature.status === 'normal').length;
    const atRiskMachines = areasData.filter(a => a.machineHealth.vibration.status !== 'normal' || a.machineHealth.temperature.status !== 'normal').length;
    const safetySecureCount = areasData.filter(a => a.environment.smoke.status === 'normal' && a.environment.flame.status === 'normal').length;

    return {
      activeAreas: areasData.length,
      healthyMachines,
      atRiskMachines,
      safetySecureCount,
      activeAlerts: alertCount
    };
  }, [areasData]);

  return {
    areasData,
    kpiStats
  };
};



