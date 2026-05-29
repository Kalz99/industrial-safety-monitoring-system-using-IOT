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

import { type ActiveAlertInfo } from './useStore';

export const useDashboardData = () => {
  const areasData = useStore((state) => state.areasData);
  const setAreasData = useStore((state) => state.setAreasData);
  const activeModalAlert = useStore((state) => state.activeModalAlert);
  const setActiveModalAlert = useStore((state) => state.setActiveModalAlert);
  const acknowledgedAlerts = useStore((state) => state.acknowledgedAlerts);
  const setAcknowledgedAlerts = useStore((state) => state.setAcknowledgedAlerts);
  const isFirstLoadRef = useRef(true);

  // Seed database and subscribe to real-time RTDB updates directly
  useEffect(() => {
    DashboardApiService.seedInitialSectors(initialAreasData).then(() => {
      const unsubscribe = DashboardApiService.subscribeToSectors((updatedSectors) => {
        // Pre-acknowledge existing critical alerts silently on first boot
        if (isFirstLoadRef.current && updatedSectors.length > 0) {
          const preAcknowledged: string[] = [];
          for (const area of updatedSectors) {
            // Check machines
            if (area.machineHealth.vibration.status === 'critical') preAcknowledged.push(`${area.id}-vibration`);
            if (area.machineHealth.current.status === 'critical') preAcknowledged.push(`${area.id}-current`);
            if (area.machineHealth.temperature.status === 'critical') preAcknowledged.push(`${area.id}-temperature`);
            // Check environment
            if (area.environment.smoke.status === 'critical') preAcknowledged.push(`${area.id}-smoke`);
            if (area.environment.flame.status === 'critical') preAcknowledged.push(`${area.id}-flame`);
            if (area.environment.temperature.status === 'critical') preAcknowledged.push(`${area.id}-temperature`);
          }
          if (preAcknowledged.length > 0) {
            setAcknowledgedAlerts(preAcknowledged);
          }
          isFirstLoadRef.current = false;
        }

        setAreasData(updatedSectors);
      });
      return unsubscribe;
    });
  }, [setAreasData, setAcknowledgedAlerts]);

  // Real-time edge trigger alert scanner
  useEffect(() => {
    if (areasData.length === 0) return;

    let newTriggeredAlert: ActiveAlertInfo | null = null;
    const currentCriticalKeys: string[] = [];

    for (const area of areasData) {
      // 1. Scan Machine Health
      const machines = [
        { type: 'vibration', label: 'Vibration', sensor: area.machineHealth.vibration },
        { type: 'current', label: 'Amperage Draw', sensor: area.machineHealth.current },
        { type: 'temperature', label: 'Motor Temperature', sensor: area.machineHealth.temperature }
      ];

      for (const m of machines) {
        const key = `${area.id}-${m.type}`;
        if (m.sensor.status === 'critical') {
          currentCriticalKeys.push(key);
          if (!acknowledgedAlerts.includes(key) && !newTriggeredAlert && !activeModalAlert) {
            newTriggeredAlert = {
              areaId: area.id,
              areaName: area.name,
              sourceType: 'machine',
              sensorType: m.type,
              sensorLabel: m.label,
              value: m.sensor.value,
              unit: m.sensor.unit || '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
          }
        }
      }

      // 2. Scan Environmental Safety
      const environments = [
        { type: 'smoke', label: 'Smoke Density', sensor: area.environment.smoke },
        { type: 'flame', label: 'Fire Detector', sensor: area.environment.flame },
        { type: 'temperature', label: 'Ambient Temperature', sensor: area.environment.temperature }
      ];

      for (const env of environments) {
        const key = `${area.id}-${env.type}`;
        if (env.sensor.status === 'critical') {
          currentCriticalKeys.push(key);
          if (!acknowledgedAlerts.includes(key) && !newTriggeredAlert && !activeModalAlert) {
            newTriggeredAlert = {
              areaId: area.id,
              areaName: area.name,
              sourceType: 'environment',
              sensorType: env.type,
              sensorLabel: env.label,
              value: env.sensor.value,
              unit: 'unit' in env.sensor ? env.sensor.unit : '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
          }
        }
      }
    }

    // Edge trigger action: show modal, track key, and record alert in Firebase
    if (newTriggeredAlert) {
      setActiveModalAlert(newTriggeredAlert);
      setAcknowledgedAlerts([...acknowledgedAlerts, `${newTriggeredAlert.areaId}-${newTriggeredAlert.sensorType}`]);
      
      // Asynchronously log this critical alert record to Firebase /alerts node
      DashboardApiService.logAlertRecord({
        areaId: newTriggeredAlert.areaId,
        sourceType: newTriggeredAlert.sourceType,
        sensorName: newTriggeredAlert.sensorType,
        value: newTriggeredAlert.value
      }).catch(err => console.error("Failed to register alert log in Firebase:", err));
    }

    // Re-arm recovery nodes
    const stillCritical = acknowledgedAlerts.filter(k => currentCriticalKeys.includes(k));
    if (stillCritical.length !== acknowledgedAlerts.length) {
      setAcknowledgedAlerts(stillCritical);
    }
  }, [areasData, acknowledgedAlerts, activeModalAlert, setActiveModalAlert, setAcknowledgedAlerts]);

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




