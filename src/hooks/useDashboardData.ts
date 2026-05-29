import { useState, useEffect, useMemo } from 'react';
import type { AreaTelemetry } from '../pages/dashboard/components/AreaCard';

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
  const [areasData, setAreasData] = useState<AreaTelemetry[]>(initialAreasData);

  // Live simulation: introduce subtle random noise to sensor variables every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAreasData((prevData) =>
        prevData.map((area) => {
          // Vibration noise (up to 0.3g fluctuation)
          const newVib = parseFloat((area.machineHealth.vibration.value + (Math.random() * 0.4 - 0.2)).toFixed(2));
          const vibrationVal = Math.max(0.1, newVib);
          const vibrationStatus = vibrationVal > 5.0 ? 'critical' : 'normal';

          // Current draw noise (up to 1.5A fluctuation)
          const newCurrent = parseFloat((area.machineHealth.current.value + (Math.random() * 2.0 - 1.0)).toFixed(1));
          const currentVal = Math.max(0.5, newCurrent);
          const currentStatus = currentVal > 40.0 ? 'critical' : 'normal';

          // Motor Temperature noise (up to 0.8C fluctuation)
          const newMotTemp = parseFloat((area.machineHealth.temperature.value + (Math.random() * 1.6 - 0.8)).toFixed(1));
          const temperatureVal = Math.max(20, newMotTemp);
          const temperatureStatus = temperatureVal > 75.0 ? 'critical' : 'normal';

          // Smoke Density noise (up to 12ppm fluctuation)
          const newSmoke = Math.round(area.environment.smoke.value + (Math.random() * 24 - 12));
          const smokeVal = Math.max(10, newSmoke);
          const smokeStatus = smokeVal > 400 ? 'critical' : 'normal';

          // Ambient Temperature noise
          const newAmbTemp = parseFloat((area.environment.temperature.value + (Math.random() * 0.6 - 0.3)).toFixed(1));
          const ambTempVal = Math.max(10, newAmbTemp);
          const ambTempStatus = ambTempVal > 40.0 ? 'critical' : 'normal';

          // Flame sensor status
          const flameStatus = area.environment.flame.status;

          // Determine overall area status
          const hasCritical = 
            vibrationStatus === 'critical' || 
            currentStatus === 'critical' || 
            temperatureStatus === 'critical' || 
            smokeStatus === 'critical' || 
            flameStatus === 'critical' || 
            ambTempStatus === 'critical';
            
          const status = hasCritical ? 'critical' : 'normal';

          return {
            ...area,
            status,
            machineHealth: {
              vibration: { ...area.machineHealth.vibration, value: vibrationVal, status: vibrationStatus },
              current: { ...area.machineHealth.current, value: currentVal, status: currentStatus },
              temperature: { ...area.machineHealth.temperature, value: temperatureVal, status: temperatureStatus }
            },
            environment: {
              smoke: { ...area.environment.smoke, value: smokeVal, status: smokeStatus },
              flame: area.environment.flame,
              temperature: { ...area.environment.temperature, value: ambTempVal, status: ambTempStatus }
            }
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
